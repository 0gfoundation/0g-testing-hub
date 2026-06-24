#!/usr/bin/env node
/*
 * Check that every status:routed issue has structured routing evidence.
 *
 * Evidence lives in an issue comment containing:
 *   Routed to:
 *   Upstream link:
 *
 * Usage:
 *   node scripts/check-routed-evidence.mjs --repo 0gfoundation/0g-testing-hub
 *   node scripts/check-routed-evidence.mjs --issues routed-issues.json
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

const repo = args.repo || process.env.REPO || '0gfoundation/0g-testing-hub';
const issues = await loadIssues(args.issues, repo, args.limit || '1000');
const routed = issues.filter((issue) => hasLabel(issue, 'status:routed'));
const missing = routed.filter((issue) => !hasRoutedEvidence(issue));

if (missing.length) {
  console.error(`✖ ${missing.length} routed issue(s) missing structured routing evidence:`);
  for (const issue of missing) {
    console.error(`  - #${issue.number}: ${issue.title || issue.url || ''}`);
  }
  console.error('\nAdd an issue comment with at least `Routed to:` and `Upstream link:`.');
  process.exit(1);
}

console.log(`✓ routed evidence present for ${routed.length} routed issue(s).`);

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
  node scripts/check-routed-evidence.mjs [--repo owner/name]
  node scripts/check-routed-evidence.mjs --issues issues.json

Inputs:
  --issues  Optional JSON export. If omitted, the script calls gh.

The JSON shape can be the raw gh issue list output or { "issues": [...] }.
Each issue should include number, title, labels, and comments.`);
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
      'status:routed',
      '--json',
      'number,title,url,labels',
    ],
    { encoding: 'utf8' },
  );
  const issues = JSON.parse(raw);
  return issues.map((issue) => ({
    ...issue,
    comments: JSON.parse(
      execFileSync(
        'gh',
        ['issue', 'view', String(issue.number), '--repo', repoName, '--json', 'comments', '--jq', '.comments'],
        { encoding: 'utf8' },
      ),
    ),
  }));
}

function hasRoutedEvidence(issue) {
  return (issue.comments || []).some((comment) => {
    const body = typeof comment === 'string' ? comment : comment.body || '';
    return /^Routed to:\s*\S+/im.test(body) && /^Upstream link:\s*\S+/im.test(body);
  });
}

function labelNames(issue) {
  return (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name)).filter(Boolean);
}

function hasLabel(issue, name) {
  return labelNames(issue).includes(name);
}
