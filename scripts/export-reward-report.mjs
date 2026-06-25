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
 *   node scripts/export-reward-report.mjs --signups-from-issues --format csv --out rewards.csv --blockers-out rewards.blockers.json --audit-out rewards.audit.json
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
const signupSource = await loadSignupSource(args, repo);
const { users: signups, duplicates: signupDuplicates } = signupSource;
// L0 completion: an explicit --l0 export wins; otherwise derive it from `l0:cleared`
// labels on sign-up issues (set by the Google Forms bridge + mark-l0-cleared workflow).
const l0Done = args.l0 ? await loadL0(args.l0) : (signupSource.l0Done || new Set());
const rootCauseRegistry = await loadRootCauseRegistry(args['root-causes'] || 'data/root-causes.json');
const report = buildReport(issues, signups, l0Done);
const diagnostics = buildDiagnostics(report, signups, signupDuplicates);
const blockers = buildBlockers(issues, diagnostics, rootCauseRegistry);
const blockerReport = buildBlockerReport(report, blockers);
const auditReport = buildAuditReport(report, blockers);
const output = args.preflight ? renderPreflight(blockerReport) : render(report, format);

if (args.out) {
  await writeFile(args.out, output);
} else {
  process.stdout.write(output);
  if (!output.endsWith('\n')) process.stdout.write('\n');
}

if (args['blockers-out']) await writeJson(args['blockers-out'], blockerReport);
if (args['audit-out']) await writeJson(args['audit-out'], auditReport);

// Diagnostics: surface anything that would silently break or misdirect payout.
// These go to stderr so they never corrupt CSV/JSON piped from stdout.
const problemCount =
  diagnostics.unmatchedAuthors.length
  + diagnostics.signupDuplicates.length
  + diagnostics.missingWallet.length
  + diagnostics.duplicateWallets.length;

if (problemCount) {
  console.error(`\n⚠ reward-export diagnostics (${problemCount} issue${problemCount === 1 ? '' : 's'}):`);
  if (diagnostics.unmatchedAuthors.length) {
    console.error(`  ${diagnostics.unmatchedAuthors.length} issue author(s) with rewardable defects not matched to a signup (cannot pay):`);
    for (const row of diagnostics.unmatchedAuthors) console.error(`    - ${row.githubUsername} → ${row.canonicalIssues}`);
  }
  if (diagnostics.signupDuplicates.length) {
    console.error(`  ${diagnostics.signupDuplicates.length} duplicate signup username(s) (last row wins): ${diagnostics.signupDuplicates.join(', ')}`);
  }
  if (diagnostics.missingWallet.length) {
    console.error(`  ${diagnostics.missingWallet.length} rewardable user(s) missing a wallet: ${diagnostics.missingWallet.map((r) => r.githubUsername).join(', ')}`);
  }
  if (diagnostics.duplicateWallets.length) {
    console.error(`  ${diagnostics.duplicateWallets.length} wallet(s) shared by multiple sign-ups (possible Sybil — verify before paying):`);
    for (const dup of diagnostics.duplicateWallets) console.error(`    - ${dup.wallet} ← ${dup.users.join(', ')}`);
  }
  if (args.strict && blockers.some((blocker) => blocker.severity === 'error')) {
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
  node scripts/export-reward-report.mjs --signups-from-issues --format csv --out rewards.csv --blockers-out rewards.blockers.json --audit-out rewards.audit.json

Inputs:
  --issues   Optional JSON export from gh issue list. If omitted, the script calls gh.
  --signups  Optional CSV or JSON signup export. Must include GitHub username + wallet columns.
  --signups-from-issues  Build the signup map from GitHub signup-labelled issues instead of a
             CSV: the issue author is the GitHub username and the body carries the wallet. No
             external form needed. Use --signup-issues <file> to read a JSON fixture instead of gh.
  --l0       Optional CSV or JSON export listing GitHub usernames that completed the
             required L0 feedback. Any user listed here clears L0 (credit 10) when they
             have no higher issue-driven level. Same username column aliases as --signups.
  --root-causes  Optional root cause registry path. Defaults to data/root-causes.json.
  --blockers-out Write structured payout blockers / warnings to JSON.
  --audit-out Write the generated reward report plus row-level blockers to JSON.
  --preflight Render blocker JSON to stdout instead of the reward report.
  --strict   Exit non-zero if diagnostics find unmatched issue authors, duplicate signup
             usernames, duplicate wallets, or rewardable users missing a wallet. Use as a
             pre-payout CI gate. Lightweight quality warnings do not fail strict mode.

Notes:
  Rewardable issues are core App Suite / 0G Infra issues with status:accepted or status:routed.
  Issues sharing the same rc:<CODE> label collapse to the earliest canonical issue.
  Ecosystem dApp coverage logs are excluded from reward counts.
  Diagnostics (unmatched authors, duplicate signups, duplicate wallets, missing wallets) are
  printed to stderr and can also be written as structured blockers.`);
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
      ['issue', 'list', '--repo', repoName, '--state', 'all', '--limit', String(limit), '--label', 'signup', '--json', 'number,author,body,labels,url'],
      { encoding: 'utf8' },
    );
    signupIssues = JSON.parse(raw);
  }

  const users = new Map();
  const duplicates = new Set();
  const l0Done = new Set();
  for (const issue of signupIssues) {
    const normalized = normalizeUser(authorLogin(issue));
    if (!normalized) continue;
    if (users.has(normalized)) duplicates.add(normalized);
    users.set(normalized, { row: issue, wallet: walletFromBody(issue.body) });
    if (hasLabel(issue, 'l0:cleared')) l0Done.add(normalized);
  }
  return { users, duplicates: [...duplicates], l0Done };
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

async function loadRootCauseRegistry(file) {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { file, labels: new Set(), available: false };
    throw error;
  }
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : (parsed.codes || parsed.rootCauses || []);
  const labels = new Set();

  for (const row of rows) {
    if (typeof row === 'string') {
      labels.add(rootCauseLabel(row));
      continue;
    }
    if (row?.code) labels.add(rootCauseLabel(row.code));
    if (row?.id) labels.add(rootCauseLabel(row.id));
  }

  return { file, labels, available: true };
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

function buildDiagnostics(report, signups, signupDuplicates) {
  return {
    unmatchedAuthors: report.rows.filter((row) => row.acceptedDeduped > 0 && !row.registered),
    missingWallet: report.rows.filter((row) => row.registered && !row.wallet && row.issueCredit > 0),
    duplicateWallets: findDuplicateWallets(signups),
    signupDuplicates,
    signups,
  };
}

function buildBlockers(issues, diagnostics, rootCauseRegistry) {
  return [
    ...diagnosticBlockers(diagnostics),
    ...qualityWarningBlockers(issues, rootCauseRegistry),
  ];
}

function diagnosticBlockers(diagnostics) {
  const blockers = [];

  for (const row of diagnostics.unmatchedAuthors) {
    blockers.push(blocker({
      code: 'missing_signup',
      severity: 'error',
      subjectType: 'tester',
      subjectId: row.githubUsername,
      message: `${row.githubUsername} has rewardable accepted defects but no signup issue.`,
      evidenceUrl: firstIssueUrl(row),
    }));
  }

  for (const row of diagnostics.missingWallet) {
    blockers.push(blocker({
      code: 'missing_wallet',
      severity: 'error',
      subjectType: 'tester',
      subjectId: row.githubUsername,
      message: `${row.githubUsername} is rewardable but has no valid wallet on signup.`,
      evidenceUrl: signupEvidenceUrl(diagnostics.signups, row.githubUsername),
    }));
  }

  for (const username of diagnostics.signupDuplicates) {
    blockers.push(blocker({
      code: 'duplicate_signup',
      severity: 'error',
      subjectType: 'tester',
      subjectId: username,
      message: `${username} has multiple signup issues; the last row currently wins.`,
      evidenceUrl: signupEvidenceUrl(diagnostics.signups, username),
    }));
  }

  for (const duplicate of diagnostics.duplicateWallets) {
    blockers.push(blocker({
      code: 'duplicate_wallet',
      severity: 'error',
      subjectType: 'tester',
      subjectId: duplicate.wallet,
      message: `Wallet is shared by multiple signup usernames: ${duplicate.users.join(', ')}.`,
    }));
  }

  return blockers;
}

function qualityWarningBlockers(issues, rootCauseRegistry) {
  const blockers = [];

  for (const issue of issues.filter(isAcceptedOrRouted)) {
    const labels = labelNames(issue);
    const rcLabels = labels.filter((label) => label.startsWith('rc:'));
    const hasCoreArea = hasLabel(issue, 'area:app-suite') || hasLabel(issue, 'area:0g-infra');

    if (!labels.some((label) => label.startsWith('area:'))) {
      blockers.push(issueBlocker(issue, 'accepted_missing_area', 'warning', 'Accepted/routed defect is missing an area:* label.'));
    }

    if (hasCoreArea && !labels.some((label) => label.startsWith('sev:'))) {
      blockers.push(issueBlocker(issue, 'accepted_missing_severity', 'warning', 'Accepted/routed rewardable defect is missing a sev:* label.'));
    }

    if (hasCoreArea && rcLabels.length === 0) {
      blockers.push(issueBlocker(issue, 'accepted_missing_rc', 'warning', 'Accepted/routed rewardable defect is missing an rc:* root-cause label.'));
    }

    if (rootCauseRegistry.available) {
      for (const rc of rcLabels) {
        if (!rootCauseRegistry.labels.has(rc)) {
          blockers.push(issueBlocker(issue, 'unregistered_rc', 'warning', `${rc} is not registered in ${rootCauseRegistry.file}.`));
        }
      }
    }

    if (hasLabel(issue, 'area:ecosystem')) {
      blockers.push(issueBlocker(issue, 'ecosystem_counted_attempt', 'warning', 'Ecosystem dApp issue is accepted/routed but remains record-only and excluded from rewards.'));
    }

    if (hasLabel(issue, 'status:routed') && Array.isArray(issue.comments) && !hasRoutedEvidence(issue)) {
      blockers.push(issueBlocker(issue, 'routed_missing_evidence', 'warning', 'Routed defect is missing a comment containing both "Routed to:" and "Upstream link:".'));
    }
  }

  return blockers;
}

function issueBlocker(issue, code, severity, message) {
  return blocker({
    code,
    severity,
    subjectType: 'defect',
    subjectId: `#${issue.number}`,
    message,
    evidenceUrl: issue.url || '',
  });
}

function blocker({ code, severity, subjectType, subjectId, message, evidenceUrl = '' }) {
  return {
    code,
    severity,
    subjectType,
    subjectId,
    message,
    evidenceUrl,
  };
}

function buildBlockerReport(report, blockers) {
  return {
    schema: '0g.reward_blockers.v1',
    generatedAt: report.generatedAt,
    totals: blockerTotals(blockers),
    blockers,
  };
}

function buildAuditReport(report, blockers) {
  return {
    schema: '0g.reward_audit.v1',
    generatedAt: report.generatedAt,
    totals: {
      ...report.totals,
      blockers: blockerTotals(blockers),
    },
    rows: report.rows.map((row) => ({
      githubUsername: row.githubUsername,
      wallet: row.wallet,
      registered: row.registered,
      l0Done: row.l0Done,
      issueLevel: row.issueLevel,
      issueCredit: row.issueCredit,
      acceptedDeduped: row.acceptedDeduped,
      appSuite: row.appSuite,
      infra: row.infra,
      systemic: row.systemic,
      canonicalIssues: row.canonicalIssues,
      notes: row.notes,
      blockers: blockers.filter((item) => item.subjectType === 'tester' && item.subjectId === row.githubUsername),
    })),
    blockers,
  };
}

function blockerTotals(blockers) {
  return {
    total: blockers.length,
    errors: blockers.filter((item) => item.severity === 'error').length,
    warnings: blockers.filter((item) => item.severity === 'warning').length,
    byCode: countBy(blockers, 'code'),
  };
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || '';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
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

function isAcceptedOrRouted(issue) {
  return hasLabel(issue, 'status:accepted') || hasLabel(issue, 'status:routed');
}

function rootCauseKey(issue) {
  const rc = labelNames(issue)
    .filter((label) => label.startsWith('rc:'))
    .sort()[0];
  return rc || `issue:${issue.number}`;
}

function rootCauseLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.startsWith('rc:') ? text : `rc:${text}`;
}

function issueLevel(user) {
  if (user.appSuite >= 1 && user.infra >= 1 && user.acceptedDeduped >= 5) return { name: 'L3', credit: 100 };
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

function firstIssueUrl(row) {
  return row.issues?.find((issue) => issue.url)?.url || '';
}

function signupEvidenceUrl(signups, username) {
  return issueUrl(signups.get(username)?.row);
}

function issueUrl(issue) {
  return issue?.url || '';
}

function hasRoutedEvidence(issue) {
  return (issue.comments || []).some((comment) => {
    const body = String(comment.body || comment || '');
    return body.includes('Routed to:') && body.includes('Upstream link:');
  });
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

// One wallet attached to several sign-up usernames is a Sybil signal (many GitHub
// accounts farming to one payout address). Surface it so it can't pass silently.
function findDuplicateWallets(signups) {
  const byWallet = new Map();
  for (const [username, signup] of signups.entries()) {
    const wallet = String(signup.wallet || '').trim().toLowerCase();
    if (!wallet) continue;
    if (!byWallet.has(wallet)) byWallet.set(wallet, []);
    byWallet.get(wallet).push(username);
  }
  return [...byWallet.entries()]
    .filter(([, users]) => users.length > 1)
    .map(([wallet, users]) => ({ wallet, users: users.sort() }));
}

function render(report, requestedFormat) {
  if (requestedFormat === 'json') return `${JSON.stringify(report, null, 2)}\n`;
  if (requestedFormat === 'csv') return renderCsv(report.rows);
  if (requestedFormat === 'md') return renderMarkdown(report);
  throw new Error(`Unsupported format: ${requestedFormat}`);
}

function renderPreflight(blockerReport) {
  return `${JSON.stringify(blockerReport, null, 2)}\n`;
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
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
