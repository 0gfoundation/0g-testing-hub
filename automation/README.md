# Automation — L0 feedback bridge

Makes **L0 completion automatic and visible** without owning anything outside GitHub +
the two feedback forms you administer. No more manual cross-referencing of form exports.

## How it flows

```
Tester submits a feedback form
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
2. **Create the labels:** `bash scripts/setup-labels-and-board.sh` (adds `signup`, `needs:fix`,
   `l0:studio-done`, `l0:pc-done`, `l0:cleared`).
3. **Mint a token:** a fine-grained PAT scoped to *Issues: Read and write* on
   `0gfoundation/0g-testing-hub`.
4. **Add the GitHub-username question** to both feedback forms (title containing "GitHub").
5. **Wire each form's Apps Script** (paste, set `FORM_LABEL`, add `GITHUB_TOKEN`, add the
   `onFormSubmit` trigger) — see **One-time setup**.
6. **Smoke test** with your own account:
   - Open a sign-up issue (`[signup]: <your-username>` + wallet).
   - Submit each feedback form, entering that same GitHub username.
   - Watch the sign-up issue gain `l0:studio-done` → `l0:pc-done` → `l0:cleared` + 🎉 comment.
   - `node scripts/export-reward-report.mjs --signups-from-issues --format md` shows you at L0 / 10.

## One-time setup

**Prerequisite — both feedback forms must ask for the GitHub username.** Add a short-answer
question whose title contains the word "GitHub" (e.g. "GitHub username"). The tester enters
the same username they used to open their sign-up issue. The bridge matches on it.

**GitHub side (already in this repo):**
- Labels `l0:studio-done` / `l0:pc-done` / `l0:cleared` — apply with `scripts/setup-labels-and-board.sh`.
- Workflow [`.github/workflows/mark-l0-cleared.yml`](../.github/workflows/mark-l0-cleared.yml) — combines the two into `l0:cleared`.

**Per form** (do this for 0G Studio Feedback AND 0G Private Computer Feedback):
1. Open the form → **Extensions → Apps Script**.
2. Paste [`l0-feedback-bridge.gs`](./l0-feedback-bridge.gs).
3. Set `FORM_LABEL`: `'l0:studio-done'` for Studio Feedback, `'l0:pc-done'` for Private Computer.
4. **Project Settings → Script properties** → add `GITHUB_TOKEN` = a GitHub token with
   issue write access (a fine-grained PAT scoped to *Issues: Read and write* on
   `0gfoundation/0g-testing-hub` is ideal — far less scope than a classic `repo` PAT).
5. **Triggers** → add trigger → function `onFormSubmit`, source *From form*, type *On form submit*.

## Notes

- The bridge writes **only a label** to the sign-up issue — never the feedback content.
- If a tester submits feedback but never opened a GitHub sign-up issue, the script logs a
  warning and skips (nothing to label). They clear L0 once they sign up and the bridge re-runs
  on their next submit, or you can label the issue by hand.
- Token rotation: update the `GITHUB_TOKEN` script property on each form.
