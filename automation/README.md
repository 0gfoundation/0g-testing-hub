# Automation — L0 survey bridge

Makes **L0 completion automatic and visible** without owning anything outside GitHub +
the two surveys you administer. No more manual cross-referencing of survey exports.

## How it flows

```
Tester submits an L0 survey
  └─ Apps Script (l0-feedback-bridge.gs) on the form
       └─ finds the tester's GitHub sign-up issue (by GitHub username)
            └─ adds l0:studio-done  OR  l0:pc-done
                 └─ mark-l0-cleared.yml: both present? → adds l0:cleared + comments
                      └─ export-reward-report.mjs --signups-from-issues reads l0:cleared → credits L0
```

The tester sees `l0:cleared` (and a 🎉 comment) on their own sign-up issue the moment
both forms are in. The reward export needs no `--l0` CSV anymore.

## Go-live checklist

Run these in order once the bridge code is on `main` (the `mark-l0-cleared` workflow
only fires from the default branch). Details for each form step are in **One-time setup** below.

1. **Merge to `main`.** The workflow, labels, and the export's `l0:cleared` reader must be on
   the default branch.
2. **Create the labels:** `bash scripts/setup-labels-and-board.sh` (adds `signup`, `signup:needs-fix`,
   `l0:studio-done`, `l0:pc-done`, `l0:cleared`).
3. **Mint a token:** a fine-grained PAT scoped to *Issues: Read and write* on
   `0gfoundation/0g-testing-hub`.
4. **Add the GitHub-username question** to both L0 surveys (title containing "GitHub").
5. **Wire each form's Apps Script** (paste, set `FORM_LABEL`, add `GITHUB_TOKEN`, add the
   `onFormSubmit` trigger) — see **One-time setup**.
6. **Smoke test** with your own account:
   - Open a sign-up issue (`[signup]: <your-username>` + wallet).
   - Submit each L0 survey, entering that same GitHub username.
   - Watch the sign-up issue gain `l0:studio-done` → `l0:pc-done` → `l0:cleared` + 🎉 comment.
   - `node scripts/export-reward-report.mjs --signups-from-issues --format md` shows you at L0 / 10.

## One-time setup

**Prerequisite — both L0 surveys must ask for the GitHub username.** Add a short-answer
question whose title contains the word "GitHub" (e.g. "GitHub username"). The tester enters
the same username they used to open their sign-up issue. The bridge matches on it.

**GitHub side (already in this repo):**
- Labels `l0:studio-done` / `l0:pc-done` / `l0:cleared` — apply with `scripts/setup-labels-and-board.sh`.
- Workflow [`.github/workflows/mark-l0-cleared.yml`](../.github/workflows/mark-l0-cleared.yml) — combines the two into `l0:cleared`.

**Per survey** (do this for 0G Studio Survey AND 0G Private Computer Survey):
1. Open the survey form → **Extensions → Apps Script**.
2. Paste [`l0-feedback-bridge.gs`](./l0-feedback-bridge.gs).
3. Set `FORM_LABEL`: `'l0:studio-done'` for Studio Survey, `'l0:pc-done'` for Private Computer Survey.
4. **Project Settings → Script properties** → add `GITHUB_TOKEN` = a GitHub token with
   issue write access (a fine-grained PAT scoped to *Issues: Read and write* on
   `0gfoundation/0g-testing-hub` is ideal — far less scope than a classic `repo` PAT).
5. **Triggers** → add trigger → function `onFormSubmit`, source *From form*, type *On form submit*.

## Deploying a change to the bridge

> **`l0-feedback-bridge.gs` in this repo is a source archive, not the running code.**
> Merging a change to it does **nothing** on its own. To make it take effect you must paste
> the new version into **both** forms' Apps Script projects (Extensions → Apps Script →
> replace the file → Save), keeping each form's own `FORM_LABEL` value. There is no
> deploy automation, and nothing in CI can detect that the two copies have drifted from
> this file.

After pasting, confirm with one real submission per form and watch the sign-up issue gain
the expected `l0:*` label.

## Notes

- The bridge writes **only a label** to the sign-up issue — never the feedback content.
- **Unmatched submissions.** If a tester submits an L0 survey with a GitHub username that
  matches no `signup` issue, the bridge logs the username to the (private) Apps Script
  execution log and increments an **aggregate count** on a repo issue marked
  `<!-- og-l0-bridge-unmatched -->`. The username is deliberately **not** published: a typo
  is the most common cause of this path and can land on a real, unrelated person's handle.
  To investigate, open Apps Script → *Executions* and read the `console.warn` lines.
- **Nothing retroactively fixes an unmatched submission.** The bridge only runs on form
  submit, so a tester who submitted before opening their sign-up issue is not picked up
  later on their own — they must either submit the survey again or have the `l0:*` label
  applied by hand. The daily triage sweep nudges open sign-ups that are missing their L0
  labels, which is how these cases surface.
- **Canonical sign-up issue.** `findSignupIssue_` pins `sort=created&direction=asc` so it
  resolves the *earliest* sign-up issue for a user — the same one `confirm-signup.yml`
  treats as canonical and the reward export reads. Do not drop those parameters; the REST
  default is `created`/`desc`, which returns the newest instead.
- Token rotation: update the `GITHUB_TOKEN` script property on each form.
