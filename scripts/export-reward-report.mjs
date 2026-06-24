#!/usr/bin/env node
/*
 * Export reward candidates from GitHub issues.
 *
 * Data chain:
 *   signup export (must include GitHub username + wallet)
 *     + GitHub issue author
 *     + status/area/systemic/rc labels
 *     -> accepted + deduped reward report
 *
 * Usage:
 *   node scripts/export-reward-report.mjs --repo 0gfoundation/0g-testing-hub
 *   node scripts/export-reward-report.mjs --issues issues.json --signups signups.csv --format csv
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

const repo = args.repo || process.env.REPO || '0gfoundation/0g-testing-hub';
const format = args.format || 'md';
const issues = await loadIssues(args.issues, repo, args.limit || '1000');
const { users: signups, duplicates: signupDuplicates } = await loadSignupSource(args, repo);
const l0Done = args.l0 ? await loadL0(args.l0) : new Set();
const report = buildReport(issues, signups, l0Done);
const output = render(report, format);

if (args.out) {
  await writeFile(args.out, output);
} else {
  process.stdout.write(output);
  if (!output.endsWith('\n')) process.stdout.write('\n');
}

// Diagnostics: surface anything that would silently break or misdirect payout.
// These go to stderr so they never corrupt CSV/JSON piped from stdout.
const unmatchedAuthors = report.rows.filter((row) => row.acceptedDeduped > 0 && !row.registered);
const missingWallet = report.rows.filter((row) => row.registered && !row.wallet && row.issueCredit > 0);
const problemCount = unmatchedAuthors.length + signupDuplicates.length + missingWallet.length;

if (problemCount) {
  console.error(`\n⚠ reward-export diagnostics (${problemCount} issue${problemCount === 1 ? '' : 's'}):`);
  if (unmatchedAuthors.length) {
    console.error(`  ${unmatchedAuthors.length} issue author(s) with rewardable defects not matched to a signup (cannot pay):`);
    for (const row of unmatchedAuthors) console.error(`    - ${row.githubUsername} → ${row.canonicalIssues}`);
  }
  if (signupDuplicates.length) {
    console.error(`  ${signupDuplicates.length} duplicate signup username(s) (last row wins): ${signupDuplicates.join(', ')}`);
  }
  if (missingWallet.length) {
    console.error(`  ${missingWallet.length} rewardable user(s) missing a wallet: ${missingWallet.map((r) => r.githubUsername).join(', ')}`);
  }
  if (args.strict) {
    console.error('\n--strict: exiting non-zero because of the diagnostics above.');
    process.exit(1);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) parsed[key] = true;
      else {
        parsed[key] = next;
        i += 1;
      }
    }
  }
  return parsed;
}

function printUsage() {
  console.log(`Usage:
  node scripts/export-reward-report.mjs [--repo owner/name]
  node scripts/export-reward-report.mjs --issues issues.json [--signups signups.csv] [--l0 l0.csv] [--format md|csv|json] [--out file] [--strict]

Inputs:
  --issues   Optional JSON export from gh issue list. If omitted, the script calls gh.
  --signups  Optional CSV or JSON signup export. Must include GitHub username + wallet columns.
  --signups-from-issues  Build the signup map from GitHub signup-labelled issues instead of a
             CSV: the issue author is the GitHub username and the body carries the wallet. No
             external form needed. Use --signup-issues <file> to read a JSON fixture instead of gh.
  --l0       Optional CSV or JSON export listing GitHub usernames that completed the
             required L0 feedback. Any user listed here clears L0 (credit 10) when they
             have no higher issue-driven level. Same username column aliases as --signups.
  --strict   Exit non-zero if diagnostics find unmatched issue authors, duplicate signup
             usernames, or rewardable users missing a wallet. Use as a pre-payout CI gate.

Notes:
  Rewardable issues are core App Suite / 0G Infra issues with status:accepted or status:routed.
  Issues sharing the same rc:<CODE> label collapse to the earliest canonical issue.
  Ecosystem dApp coverage logs are excluded from reward counts.
  Diagnostics (unmatched authors, duplicate signups, missing wallets) are printed to stderr.`);
}

async function loadIssues(file, repoName, limit) {
  if (file) {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.issues || [];
  }

  const raw = execFileSync(
    'gh',
    [
      'issue',
      'list',
      '--repo',
      repoName,
      '--state',
      'all',
      '--limit',
      String(limit),
      '--label',
      'defect',
      '--json',
      'number,title,author,createdAt,url,labels,state',
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(raw);
}

async function loadSignupSource(args, repoName) {
  if (typeof args['signup-issues'] === 'string') return loadSignupsFromIssues(args['signup-issues'], repoName, args.limit || '1000');
  if (args['signups-from-issues']) return loadSignupsFromIssues(null, repoName, args.limit || '1000');
  if (args.signups) return loadSignups(args.signups);
  return { users: new Map(), duplicates: [] };
}

// Option A sign-up: each `signup`-labelled issue carries the authenticated GitHub
// username (the issue author — the reward join key) and the 0G mainnet wallet in
// its body. This reads that registry directly, so no external signup form/CSV is
// needed. `file` is an optional JSON fixture (gh issue list shape); otherwise gh is called.
async function loadSignupsFromIssues(file, repoName, limit) {
  let signupIssues;
  if (file) {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    signupIssues = Array.isArray(parsed) ? parsed : parsed.issues || [];
  } else {
    const raw = execFileSync(
      'gh',
      ['issue', 'list', '--repo', repoName, '--state', 'all', '--limit', String(limit), '--label', 'signup', '--json', 'number,author,body'],
      { encoding: 'utf8' },
    );
    signupIssues = JSON.parse(raw);
  }

  const users = new Map();
  const duplicates = new Set();
  for (const issue of signupIssues) {
    const normalized = normalizeUser(authorLogin(issue));
    if (!normalized) continue;
    if (users.has(normalized)) duplicates.add(normalized);
    users.set(normalized, { row: issue, wallet: walletFromBody(issue.body) });
  }
  return { users, duplicates: [...duplicates] };
}

// Pull the wallet out of a sign-up issue body, accepting only a well-formed
// address so a malformed entry surfaces as a missing-wallet diagnostic.
function walletFromBody(body) {
  const value = fieldFromBody(body, '0G mainnet EVM wallet address');
  return /^0x[0-9a-fA-F]{40}$/.test(value) ? value : '';
}

function fieldFromBody(body, name) {
  const lines = String(body || '').split(/\r?\n/);
  let found = false;
  for (const line of lines) {
    if (line.trim() === `### ${name}`) { found = true; continue; }
    if (found && line.startsWith('### ')) break;
    if (found && line.trim()) return line.trim();
  }
  return '';
}

async function loadSignups(file) {
  const raw = await readFile(file, 'utf8');
  const trimmed = raw.trim();
  if (!trimmed) return { users: new Map(), duplicates: [] };

  const rows = file.endsWith('.json') ? jsonRows(JSON.parse(trimmed)) : csvRows(trimmed);
  if (!rows.length) throw new Error(`Signup export is empty: ${file}`);
  if (!hasAnyField(rows[0], githubUsernameAliases())) {
    throw new Error('Signup export must include a GitHub username column. Expected one of: github_username, github username, github, github_handle, github handle, github user, username.');
  }
  if (!hasAnyField(rows[0], walletAliases())) {
    throw new Error('Signup export must include a wallet column. Expected one of: wallet, wallet_address, 0g mainnet evm wallet address, 0g wallet, evm wallet, address.');
  }

  const users = new Map();
  const duplicates = new Set();

  for (const row of rows) {
    const username = findField(row, githubUsernameAliases());
    const wallet = findField(row, walletAliases()).trim();
    const normalized = normalizeUser(username);
    if (!normalized) continue;
    if (users.has(normalized)) duplicates.add(normalized);
    users.set(normalized, { row, wallet });
  }

  return { users, duplicates: [...duplicates] };
}

async function loadL0(file) {
  const raw = await readFile(file, 'utf8');
  const trimmed = raw.trim();
  if (!trimmed) return new Set();

  const rows = file.endsWith('.json') ? jsonRows(JSON.parse(trimmed)) : csvRows(trimmed);
  if (!rows.length) return new Set();
  if (!hasAnyField(rows[0], githubUsernameAliases())) {
    throw new Error('L0 export must include a GitHub username column (same aliases as the signup export).');
  }

  const done = new Set();
  for (const row of rows) {
    const normalized = normalizeUser(findField(row, githubUsernameAliases()));
    if (normalized) done.add(normalized);
  }
  return done;
}

function githubUsernameAliases() {
  return [
    'github_username',
    'github username',
    'github',
    'github_handle',
    'github handle',
    'github user',
    'username',
  ];
}

function walletAliases() {
  return [
    'wallet',
    'wallet_address',
    'wallet address',
    '0g mainnet evm wallet address',
    '0g wallet',
    'evm wallet',
    'address',
  ];
}

function jsonRows(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.rows)) return parsed.rows;
  if (Array.isArray(parsed.signups)) return parsed.signups;
  return [];
}

function csvRows(raw) {
  const records = parseCsv(raw);
  if (records.length < 2) return [];
  const headers = records[0].map((h) => h.trim());
  return records.slice(1).map((record) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = record[index] || '';
    });
    return row;
  });
}

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  return rows.filter((record) => record.some((value) => value.trim() !== ''));
}

function findField(row, aliases) {
  const wanted = new Set(aliases.map(normalizeHeader));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeHeader(key))) return value;
  }
  return '';
}

function hasAnyField(row, aliases) {
  const wanted = new Set(aliases.map(normalizeHeader));
  return Object.keys(row).some((key) => wanted.has(normalizeHeader(key)));
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function buildReport(issues, signups, l0Done = new Set()) {
  const accepted = issues
    .filter(isRewardableAcceptedCore)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  const groups = new Map();
  for (const issue of accepted) {
    const key = rootCauseKey(issue);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(issue);
  }

  const users = new Map();
  for (const [username, signup] of signups.entries()) {
    users.set(username, emptyUser(username, true, signup.wallet, l0Done.has(username)));
  }

  const canonicalIssues = [];
  for (const [key, group] of groups.entries()) {
    const canonical = group[0];
    canonicalIssues.push(canonical);
    const username = normalizeUser(authorLogin(canonical)) || 'unknown';
    if (!users.has(username)) {
      const signup = signups.get(username);
      users.set(username, emptyUser(username, Boolean(signup), signup?.wallet || '', l0Done.has(username)));
    }
    const user = users.get(username);
    user.acceptedDeduped += 1;
    if (hasLabel(canonical, 'area:app-suite')) user.appSuite += 1;
    if (hasLabel(canonical, 'area:0g-infra')) user.infra += 1;
    if (group.some((issue) => hasLabel(issue, 'systemic'))) user.systemic += 1;
    user.issues.push(issueRef(canonical, key, group.length));
  }

  const rows = [...users.values()].map((user) => {
    const level = issueLevel(user);
    return {
      ...user,
      issueLevel: level.name,
      issueCredit: level.credit,
      canonicalIssues: user.issues.map((issue) => issue.ref).join(' '),
      notes: notesFor(user, signups, level),
    };
  });

  rows.sort((a, b) => {
    if (b.issueCredit !== a.issueCredit) return b.issueCredit - a.issueCredit;
    if (b.acceptedDeduped !== a.acceptedDeduped) return b.acceptedDeduped - a.acceptedDeduped;
    return a.githubUsername.localeCompare(b.githubUsername);
  });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      issuesRead: issues.length,
      acceptedCoreIssues: accepted.length,
      acceptedDeduped: canonicalIssues.length,
      signupUsers: signups.size,
      l0Completions: l0Done.size,
    },
    rows,
  };
}

function emptyUser(username, registered, wallet = '', l0Done = false) {
  return {
    githubUsername: username,
    wallet,
    registered,
    l0Done,
    acceptedDeduped: 0,
    appSuite: 0,
    infra: 0,
    systemic: 0,
    issues: [],
  };
}

function isRewardableAcceptedCore(issue) {
  if (hasLabel(issue, 'area:ecosystem')) return false;
  if (!hasLabel(issue, 'area:app-suite') && !hasLabel(issue, 'area:0g-infra')) return false;
  return hasLabel(issue, 'status:accepted') || hasLabel(issue, 'status:routed');
}

function rootCauseKey(issue) {
  const rc = labelNames(issue)
    .filter((label) => label.startsWith('rc:'))
    .sort()[0];
  return rc || `issue:${issue.number}`;
}

function issueLevel(user) {
  if (user.appSuite >= 1 && user.infra >= 1 && user.acceptedDeduped >= 5 && user.systemic >= 1) return { name: 'L3', credit: 100 };
  if (user.appSuite >= 1 && user.infra >= 1 && user.acceptedDeduped >= 2) return { name: 'L2', credit: 40 };
  if (user.appSuite >= 1) return { name: 'L1', credit: 20 };
  if (user.l0Done) return { name: 'L0', credit: 10 };
  return { name: '', credit: 0 };
}

function notesFor(user, signups, level) {
  const notes = [];
  if (signups.size && !user.registered) notes.push('missing signup');
  if (user.registered && !user.wallet) notes.push('missing wallet');
  if (!level.name) notes.push('no reward yet');
  return notes.join('; ');
}

function issueRef(issue, key, groupSize) {
  const suffix = groupSize > 1 ? `(${key},${groupSize}x)` : '';
  return {
    ref: `#${issue.number}${suffix}`,
    url: issue.url || '',
  };
}

function authorLogin(issue) {
  if (typeof issue.author === 'string') return issue.author;
  if (issue.author?.login) return issue.author.login;
  if (issue.user?.login) return issue.user.login;
  return '';
}

function labelNames(issue) {
  return (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name)).filter(Boolean);
}

function hasLabel(issue, name) {
  return labelNames(issue).includes(name);
}

function normalizeUser(value) {
  return String(value || '').trim().replace(/^@/, '').toLowerCase();
}

function render(report, requestedFormat) {
  if (requestedFormat === 'json') return `${JSON.stringify(report, null, 2)}\n`;
  if (requestedFormat === 'csv') return renderCsv(report.rows);
  if (requestedFormat === 'md') return renderMarkdown(report);
  throw new Error(`Unsupported format: ${requestedFormat}`);
}

function renderCsv(rows) {
  const headers = [
    'github_username',
    'wallet',
    'registered',
    'issue_level',
    'issue_credit',
    'accepted_deduped',
    'app_suite',
    'infra',
    'systemic',
    'canonical_issues',
    'notes',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.githubUsername,
        row.wallet,
        row.registered,
        row.issueLevel,
        row.issueCredit,
        row.acceptedDeduped,
        row.appSuite,
        row.infra,
        row.systemic,
        row.canonicalIssues,
        row.notes,
      ].map(csvEscape).join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Reward export`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Issues read: ${report.totals.issuesRead}`);
  lines.push(`Accepted core issues: ${report.totals.acceptedCoreIssues}`);
  lines.push(`Accepted + deduped findings: ${report.totals.acceptedDeduped}`);
  lines.push(`Signup users: ${report.totals.signupUsers}`);
  lines.push(`L0 feedback completions: ${report.totals.l0Completions}`);
  lines.push('');
  lines.push('| GitHub | Wallet | Registered | Issue level | Credit | Accepted deduped | App Suite | Infra | Systemic | Issues | Notes |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|');
  for (const row of report.rows) {
    lines.push(
      `| ${row.githubUsername} | ${row.wallet || '-'} | ${row.registered ? 'yes' : 'no'} | ${row.issueLevel || '-'} | ${row.issueCredit} | ${row.acceptedDeduped} | ${row.appSuite} | ${row.infra} | ${row.systemic} | ${row.canonicalIssues || '-'} | ${row.notes || '-'} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}
