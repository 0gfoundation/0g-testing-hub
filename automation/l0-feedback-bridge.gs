/**
 * 0G Testing Hub — L0 survey → GitHub bridge (Google Apps Script).
 *
 * Attach this to EACH L0 survey Google Form (0G Studio Survey and
 * 0G Private Computer Survey). On submit it finds the submitter's GitHub
 * sign-up issue and adds this form's L0 label. The `mark-l0-cleared.yml`
 * workflow then sets `l0:cleared` once both per-form labels are present.
 *
 * SETUP (do this once PER FORM):
 *   1. The form MUST have a question whose title contains "GitHub" — the tester
 *      types the same GitHub username they used to open their sign-up issue.
 *   2. In the form: ⋮ → Script editor (Extensions → Apps Script) → paste this file.
 *   3. Set FORM_LABEL below:
 *        - 0G Studio Survey           → 'l0:studio-done'
 *        - 0G Private Computer Survey → 'l0:pc-done'
 *   4. Project Settings → Script properties → add a property named GITHUB_TOKEN
 *      whose value is a GitHub token with issue-write access to the repo
 *      (a fine-grained PAT scoped to Issues: Read and write on this repo is ideal).
 *   5. Triggers (clock icon) → Add trigger → function onFormSubmit,
 *      event source "From form", event type "On form submit".
 *
 * It never writes the feedback content to GitHub — only a label on the sign-up
 * issue, plus an aggregate count when a submission matches no sign-up issue.
 *
 * NOTE: the copy in this repo is a source archive. Editing it here does NOT
 * change the running bridge — you must paste the new version into BOTH forms'
 * Apps Script projects for it to take effect.
 */

const REPO = '0gfoundation/0g-testing-hub';
const FORM_LABEL = 'l0:studio-done'; // CHANGE per form: 'l0:studio-done' | 'l0:pc-done'

function onFormSubmit(e) {
  const username = extractGitHubUsername_(e);
  if (!username) {
    console.warn('No GitHub username found in the response — skipping.');
    return;
  }

  const issue = findSignupIssue_(username);
  if (!issue) {
    // The username is logged here (Apps Script's execution log is private) but
    // deliberately NOT written to GitHub — see recordUnmatched_().
    console.warn('No signup issue found for @' + username + ' — they may not have signed up on GitHub yet.');
    try {
      recordUnmatched_();
    } catch (err) {
      // Never let the alerting path break the bridge itself.
      console.error('Could not record the unmatched submission: ' + err);
    }
    return;
  }

  addLabel_(issue.number, FORM_LABEL);
  console.log('Labelled signup #' + issue.number + ' (@' + username + ') with ' + FORM_LABEL);
}

// Read the GitHub username from the answer whose question title mentions "GitHub".
function extractGitHubUsername_(e) {
  const items = e.response.getItemResponses();
  for (let i = 0; i < items.length; i += 1) {
    if (/github/i.test(items[i].getItem().getTitle())) {
      return String(items[i].getResponse() || '').trim().replace(/^@/, '');
    }
  }
  return '';
}

// The EARLIEST open-or-closed signup issue created by this user.
//
// `sort=created&direction=asc` is load-bearing, not decoration. The REST default
// is created/desc, so `per_page=1` used to return the tester's NEWEST signup
// issue while confirm-signup.yml treats the EARLIEST one as canonical
// (`sort -n | head -1`). The two disagreed. Duplicate signups normally have
// their `signup` label stripped, which hid the conflict — but if that dedup ever
// misses, the L0 labels would land on an issue the reward export does not read.
function findSignupIssue_(username) {
  const url = 'https://api.github.com/repos/' + REPO + '/issues'
    + '?labels=signup&state=all&creator=' + encodeURIComponent(username)
    + '&sort=created&direction=asc&per_page=1';
  const arr = JSON.parse(ghFetch_(url, 'get').getContentText());
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function addLabel_(issueNumber, label) {
  const url = 'https://api.github.com/repos/' + REPO + '/issues/' + issueNumber + '/labels';
  ghFetch_(url, 'post', { labels: [label] });
}

// ---------------------------------------------------------------------------
// Unmatched-submission alerting.
//
// A tester who fills in a survey but types a GitHub username that matches no
// signup issue used to vanish silently: a console.warn in a log nobody reads.
// That is exactly the state #64/#65 were in — impossible to tell "never
// submitted" from "submitted, username did not match".
//
// This records an AGGREGATE COUNT only. The submitted username is deliberately
// left out of GitHub: a typo is the main cause of this path, and the typo can
// land on a real, unrelated person's handle. Publishing that to a public issue
// would be a privacy problem the count does not have. The actual value stays in
// the Apps Script execution log, which is private to the form owner.
//
// Like the PROJECT_PAT health alert, this issue carries NO labels — `feedback` /
// `defect` / `signup` / `status:*` would each pull a CI alert into the tester
// pipeline or the reward export.
const UNMATCHED_MARKER = '<!-- og-l0-bridge-unmatched -->';
const UNMATCHED_TITLE = 'chore(l0-bridge): survey submissions not matched to a sign-up issue';

function recordUnmatched_() {
  const now = new Date().toISOString();
  const existing = findUnmatchedIssue_();

  if (existing) {
    const body = existing.body || '';
    const seen = /Unmatched submissions:\s*\*\*(\d+)\*\*/.exec(body);
    const first = /First seen:\s*`([^`]+)`/.exec(body);
    const count = (seen ? parseInt(seen[1], 10) : 0) + 1;
    ghFetch_(issuesUrl_('/' + existing.number), 'patch', {
      body: unmatchedBody_(count, first ? first[1] : now, now),
    });
    console.log('Updated unmatched-submission alert #' + existing.number + ' (count ' + count + ').');
    return;
  }

  const created = JSON.parse(
    ghFetch_(issuesUrl_(''), 'post', {
      title: UNMATCHED_TITLE,
      body: unmatchedBody_(1, now, now),
    }).getContentText()
  );
  console.log('Opened unmatched-submission alert #' + created.number + '.');
}

function findUnmatchedIssue_() {
  // The issues endpoint also returns pull requests; filter them out.
  const arr = JSON.parse(ghFetch_(issuesUrl_('?state=open&per_page=100'), 'get').getContentText());
  if (!Array.isArray(arr)) return null;
  for (let i = 0; i < arr.length; i += 1) {
    if (!arr[i].pull_request && String(arr[i].body || '').indexOf(UNMATCHED_MARKER) !== -1) {
      return arr[i];
    }
  }
  return null;
}

function unmatchedBody_(count, firstSeen, lastSeen) {
  return [
    UNMATCHED_MARKER,
    '',
    '⚠️ **Some L0 survey submissions could not be matched to a sign-up issue.**',
    '',
    '- Unmatched submissions: **' + count + '**',
    '- First seen: `' + firstSeen + '`',
    '- Last seen: `' + lastSeen + '`',
    '',
    '### What this means',
    '',
    'Someone submitted an L0 survey with a GitHub username that has no `signup`',
    'issue in this repo. Their L0 label was never applied, so they are stuck at 0',
    'credit without knowing it.',
    '',
    'Usual causes, most likely first:',
    '',
    '1. A typo in the GitHub username field of the survey.',
    '2. They filled in the survey before opening their sign-up issue.',
    '3. They used a different GitHub account than the one that opened the issue.',
    '',
    '### How to investigate',
    '',
    'The submitted usernames are **not** recorded here on purpose — a typo can be a',
    'real, unrelated person\'s handle, and this is a public repo. Open the form in',
    'Google Forms → Extensions → Apps Script → Executions to see the actual values',
    'in the `console.warn` lines.',
    '',
    'Cross-check against open `signup` issues with no `l0:*` labels; the daily',
    'triage sweep nudges those testers directly.',
    '',
    '### Closing this',
    '',
    'Close it once the backlog is reconciled. The bridge reopens a fresh one (count',
    'restarting at 1) the next time a submission fails to match.',
  ].join('\n');
}

function issuesUrl_(suffix) {
  return 'https://api.github.com/repos/' + REPO + '/issues' + suffix;
}

function ghFetch_(url, method, payload) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Set GITHUB_TOKEN in Script properties (Project Settings).');
  const opts = {
    method: method,
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    muteHttpExceptions: true,
  };
  if (payload) {
    opts.contentType = 'application/json';
    opts.payload = JSON.stringify(payload);
  }
  const res = UrlFetchApp.fetch(url, opts);
  if (res.getResponseCode() >= 300) {
    throw new Error('GitHub API ' + res.getResponseCode() + ': ' + res.getContentText());
  }
  return res;
}
