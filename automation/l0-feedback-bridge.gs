/**
 * 0G Testing Hub — L0 feedback → GitHub bridge (Google Apps Script).
 *
 * Attach this to EACH L0 feedback Google Form (0G Studio Feedback and
 * 0G Private Computer Feedback). On submit it finds the submitter's GitHub
 * sign-up issue and adds this form's L0 label. The `mark-l0-cleared.yml`
 * workflow then sets `l0:cleared` once both per-form labels are present.
 *
 * SETUP (do this once PER FORM):
 *   1. The form MUST have a question whose title contains "GitHub" — the tester
 *      types the same GitHub username they used to open their sign-up issue.
 *   2. In the form: ⋮ → Script editor (Extensions → Apps Script) → paste this file.
 *   3. Set FORM_LABEL below:
 *        - 0G Studio Feedback        → 'l0:studio-done'
 *        - 0G Private Computer Feedback → 'l0:pc-done'
 *   4. Project Settings → Script properties → add a property named GITHUB_TOKEN
 *      whose value is a GitHub token with issue-write access to the repo
 *      (a fine-grained PAT scoped to Issues: Read and write on this repo is ideal).
 *   5. Triggers (clock icon) → Add trigger → function onFormSubmit,
 *      event source "From form", event type "On form submit".
 *
 * It never writes the feedback content to GitHub — only a label on the sign-up issue.
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
    console.warn('No signup issue found for @' + username + ' — they may not have signed up on GitHub yet.');
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

// The earliest open-or-closed signup issue created by this user.
function findSignupIssue_(username) {
  const url = 'https://api.github.com/repos/' + REPO + '/issues'
    + '?labels=signup&state=all&creator=' + encodeURIComponent(username) + '&per_page=1';
  const arr = JSON.parse(ghFetch_(url, 'get').getContentText());
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function addLabel_(issueNumber, label) {
  const url = 'https://api.github.com/repos/' + REPO + '/issues/' + issueNumber + '/labels';
  ghFetch_(url, 'post', { labels: [label] });
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
