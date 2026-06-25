#!/usr/bin/env bash
# Idempotent setup of the Test Week defect-tracking labels and Project board.
# Re-running is safe: labels use `--force`, the board is created only if absent.
#
# Requirements:
#   gh auth login                      # repo scope  -> labels
#   gh auth refresh -s project -s read:org  # project + read:org -> org board
#
# Usage:
#   scripts/setup-labels-and-board.sh                 # uses the current repo
#   REPO=0gfoundation/0g-testing-hub scripts/setup-labels-and-board.sh
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
OWNER="${REPO%%/*}"
BOARD_TITLE="${BOARD_TITLE:-0G Test Week — Defects}"

echo "==> Repo:  $REPO"
echo "==> Owner: $OWNER"

# ---------------------------------------------------------------------------
# Labels — parsed from .github/labels.yml (name/color/description triples).
# No YAML dependency: we read the three keys with awk.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABELS_FILE="$SCRIPT_DIR/../.github/labels.yml"

echo "==> Creating / updating labels from $LABELS_FILE"
name="" ; color="" ; desc=""
flush() {
  [ -z "$name" ] && return 0
  echo "    - $name"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force >/dev/null
  name="" ; color="" ; desc=""
}
while IFS= read -r line; do
  case "$line" in
    "- name: "*) flush; name=$(sed -E 's/^- name: *"?([^"]*)"?/\1/' <<<"$line") ;;
    *"color: "*) color=$(sed -E 's/^ *color: *"?([^"]*)"?/\1/' <<<"$line") ;;
    *"description: "*) desc=$(sed -E 's/^ *description: *"?([^"]*)"?/\1/' <<<"$line") ;;
  esac
done < "$LABELS_FILE"
flush
echo "==> Labels done."

# ---------------------------------------------------------------------------
# Project board (Projects v2). Needs a token with `project` + `repo` +
# `read:org` scope (classic), or Account > Projects: Read and write
# (fine-grained — note: fine-grained tokens cannot CREATE a board; create it
# once in the org UI, then re-run this).
#
# Done via the GraphQL API directly, NOT `gh project` subcommands: those also
# require `read:org` to classify the owner.
# Re-running is safe: an existing board is reused and the (destructive) column
# reset is skipped, so item assignments survive.
# ---------------------------------------------------------------------------
REPO_NAME="${REPO#*/}"

# Probe project read access; bail with guidance if the scope is missing.
if ! gh api graphql -f query='query($l:String!){organization(login:$l){id}}' -F l="$OWNER" >/dev/null 2>&1; then
  cat <<'EOF'
==> SKIP board: token cannot reach the Projects API.
    Use a classic token with `project` + `repo` + `read:org`, then re-run:
        GH_TOKEN=<token> scripts/setup-labels-and-board.sh
EOF
  exit 0
fi

OWNER_ID=$(gh api graphql -f query='query($l:String!){organization(login:$l){id}}' \
  -F l="$OWNER" --jq '.data.organization.id')

# Find the board by title.
PROJECT_ID=$(gh api graphql -f query='query($l:String!){organization(login:$l){projectsV2(first:100){nodes{id title}}}}' \
  -F l="$OWNER" --jq ".data.organization.projectsV2.nodes[] | select(.title==\"$BOARD_TITLE\") | .id" | head -1)

created=0
if [ -z "$PROJECT_ID" ]; then
  echo "==> Creating board \"$BOARD_TITLE\""
  PROJECT_ID=$(gh api graphql \
    -f query='mutation($o:ID!,$t:String!){createProjectV2(input:{ownerId:$o,title:$t}){projectV2{id}}}' \
    -F o="$OWNER_ID" -F t="$BOARD_TITLE" --jq '.data.createProjectV2.projectV2.id') \
    || { echo "    create failed — fine-grained tokens can't create boards. Make it once in the UI, then re-run."; exit 1; }
  created=1
else
  echo "==> Board \"$BOARD_TITLE\" exists — keeping its columns."
fi

# Set the Status columns only on a fresh board (resetting options wipes assignments).
if [ "$created" = "1" ]; then
  STATUS_FIELD_ID=$(gh api graphql \
    -f query='query($p:ID!){node(id:$p){... on ProjectV2{field(name:"Status"){... on ProjectV2SingleSelectField{id}}}}}' \
    -F p="$PROJECT_ID" --jq '.data.node.field.id')
  echo "==> Setting columns: Triage / Accepted / Routed / Closed"
  gh api graphql -f query="
    mutation {
      updateProjectV2Field(input:{
        fieldId:\"$STATUS_FIELD_ID\"
        singleSelectOptions:[
          {name:\"Triage\",   color:GRAY,   description:\"New, unvalidated (status:filed)\"}
          {name:\"Accepted\", color:GREEN,  description:\"Real + reproducible\"}
          {name:\"Routed\",   color:BLUE,   description:\"Tagged with ownership, sent upstream\"}
          {name:\"Closed\",   color:PURPLE, description:\"Resolved / rejected / duplicate\"}
        ]
      }){ projectV2Field { ... on ProjectV2SingleSelectField { id } } }
    }" >/dev/null
fi

# Link the repo (idempotent) so the board appears under the repo's Projects tab.
REPO_ID=$(gh api graphql -f query='query($o:String!,$n:String!){repository(owner:$o,name:$n){id}}' \
  -F o="$OWNER" -F n="$REPO_NAME" --jq '.data.repository.id')
gh api graphql -f query='mutation($p:ID!,$r:ID!){linkProjectV2ToRepository(input:{projectId:$p,repositoryId:$r}){repository{nameWithOwner}}}' \
  -F p="$PROJECT_ID" -F r="$REPO_ID" >/dev/null 2>&1 || true

# Add `status:filed` and first-pass form-derived labels to every open `defect`
# issue that may have bypassed the issue form, then add every open `defect` issue to the board
# (addProjectV2ItemById is a no-op if already present).
get_issue_field() {
  local body="$1"
  local name="$2"
  awk -v name="$name" '
    $0 == "### " name { found=1; next }
    found && /^### / { exit }
    found && NF { print; exit }
  ' <<<"$body"
}

trim() {
  sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' <<<"$1"
}

echo "==> Ensuring open 'defect' issues have status:filed and form-derived labels"
while IFS= read -r number; do
  [ -z "$number" ] && continue
  gh issue edit "$number" --repo "$REPO" --add-label "status:filed" >/dev/null 2>&1 || true
  body=$(gh issue view "$number" --repo "$REPO" --json body --jq .body 2>/dev/null || true)
  ownership=$(get_issue_field "$body" "Ownership")
  severity=$(get_issue_field "$body" "Severity")
  repro=$(get_issue_field "$body" "Repro steps")
  actual=$(get_issue_field "$body" "Actual result")
  reported_to=$(get_issue_field "$body" "Reported to dApp URL (Ecosystem coverage logs only)")
  case "$ownership" in
    "App Suite"*) gh issue edit "$number" --repo "$REPO" --add-label "area:app-suite" >/dev/null 2>&1 || true ;;
    "0G Infra"*) gh issue edit "$number" --repo "$REPO" --add-label "area:0g-infra" >/dev/null 2>&1 || true ;;
    "Ecosystem dApp"*)
      gh issue edit "$number" --repo "$REPO" --add-label "area:ecosystem" --add-label "coverage-log" >/dev/null 2>&1 || true
      if [ -n "$(trim "$repro")" ] && [ -n "$(trim "$actual")" ] && [ -z "$(trim "$reported_to")" ]; then
        gh issue edit "$number" --repo "$REPO" --add-label "needs:dapp-report-url" >/dev/null 2>&1 || true
      fi
      ;;
  esac
  case "$severity" in
    "P1"*) gh issue edit "$number" --repo "$REPO" --add-label "sev:P1" >/dev/null 2>&1 || true ;;
    "P2"*) gh issue edit "$number" --repo "$REPO" --add-label "sev:P2" >/dev/null 2>&1 || true ;;
    "P3"*) gh issue edit "$number" --repo "$REPO" --add-label "sev:P3" >/dev/null 2>&1 || true ;;
    "P4"*) gh issue edit "$number" --repo "$REPO" --add-label "sev:P4" >/dev/null 2>&1 || true ;;
  esac
done < <(gh issue list --repo "$REPO" --label "defect" --state open --json number --jq '.[].number')

echo "==> Adding open 'defect' issues to the board"
count=0
while IFS= read -r iid; do
  [ -z "$iid" ] && continue
  gh api graphql -f query='mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}' \
    -F p="$PROJECT_ID" -F c="$iid" >/dev/null 2>&1 || true
  count=$((count + 1))
done < <(gh api graphql \
  -f query='query($o:String!,$n:String!){repository(owner:$o,name:$n){issues(first:100,states:OPEN,labels:["defect"]){nodes{id}}}}' \
  -F o="$OWNER" -F n="$REPO_NAME" --jq '.data.repository.issues.nodes[].id')
echo "    added/synced $count issue(s)"

cat <<EOF
==> Board ready: https://github.com/orgs/$OWNER/projects
    Optional (UI, one-time, no stable CLI): Project -> Workflows ->
    enable "Auto-add to project" for issues labelled 'defect', and
    "Item added to project" -> set Status = Triage, so new reports land in column 1.
EOF
