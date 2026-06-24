#!/usr/bin/env node
/*
 * Surface likely-duplicate defects for a maintainer to review before triage.
 * Read-only: it never edits issues or labels — it only prints suggested clusters.
 *
 * Two signals:
 *   1. Issues that already share an `rc:<CODE>` label   → confirmed one finding.
 *   2. Issues in the same `area:*` whose titles overlap → candidate duplicates.
 *
 * It also flags `rc:` labels used on issues that are missing from the registry
 * (data/root-causes.json), which catches code drift like CHAIN_ID_MISSING vs
 * ChainIdMissing.
 *
 * Usage:
 *   node scripts/find-duplicate-candidates.mjs --repo 0gfoundation/0g-testing-hub
 *   node scripts/find-duplicate-candidates.mjs --issues issues.json [--threshold 0.5] [--state open|all]
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'on', 'in', 'to', 'of', 'for', 'is', 'are', 'not',
  'when', 'with', 'at', 'by', 'from', 'this', 'that', 'it', 'no', 'never', 'defect',
]);

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

const repo = args.repo || process.env.REPO || '0gfoundation/0g-testing-hub';
const threshold = args.threshold ? Number(args.threshold) : 0.5;
const state = args.state || 'open';
const issues = await loadIssues(args.issues, repo, args.limit || '1000', state);
const registry = await loadRegistry();

reportRegistryDrift(issues, registry);
reportSharedRc(issues);
reportTitleClusters(issues, threshold);

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
  node scripts/find-duplicate-candidates.mjs [--repo owner/name] [--state open|all]
  node scripts/find-duplicate-candidates.mjs --issues issues.json [--threshold 0.5]

Inputs:
  --issues     Optional JSON export from gh issue list. If omitted, the script calls gh.
  --threshold  Title-overlap (Jaccard) cutoff for candidate clusters. Default 0.5.
  --state      open (default) or all.

Read-only. Prints shared-rc clusters, title-overlap candidates, and rc: registry drift.`);
}

async function loadIssues(file, repoName, limit, issueState) {
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
      issueState,
      '--limit',
      String(limit),
      '--label',
      'defect',
      '--json',
      'number,title,url,labels,state',
    ],
    { encoding: 'utf8' },
  );
  return JSON.parse(raw);
}

async function loadRegistry() {
  const here = dirname(fileURLToPath(import.meta.url));
  try {
    const raw = await readFile(join(here, '..', 'data', 'root-causes.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return new Set((parsed.codes || []).map((entry) => entry.code));
  } catch {
    return new Set();
  }
}

function reportRegistryDrift(issues, registry) {
  if (!registry.size) return;
  const unknown = new Map();
  for (const issue of issues) {
    for (const label of labelNames(issue)) {
      if (!label.startsWith('rc:')) continue;
      const code = label.slice(3);
      if (!registry.has(code)) {
        if (!unknown.has(code)) unknown.set(code, []);
        unknown.get(code).push(issue.number);
      }
    }
  }
  if (!unknown.size) return;
  console.log('## rc: labels missing from data/root-causes.json (add them, or fix the drift)');
  for (const [code, numbers] of unknown.entries()) {
    console.log(`- rc:${code} → ${numbers.map((n) => `#${n}`).join(', ')}`);
  }
  console.log('');
}

function reportSharedRc(issues) {
  const groups = new Map();
  for (const issue of issues) {
    for (const label of labelNames(issue)) {
      if (!label.startsWith('rc:')) continue;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(issue);
    }
  }
  const shared = [...groups.entries()].filter(([, list]) => list.length > 1);
  console.log(`## Confirmed clusters — issues already sharing an rc: code (${shared.length})`);
  if (!shared.length) console.log('- none');
  for (const [label, list] of shared) {
    const sorted = [...list].sort((a, b) => a.number - b.number);
    const canonical = sorted[0];
    console.log(`- ${label}: canonical #${canonical.number}, duplicates ${sorted.slice(1).map((i) => `#${i.number}`).join(', ')}`);
  }
  console.log('');
}

function reportTitleClusters(issues, cutoff) {
  // Candidate duplicates: same area, no shared rc: yet, overlapping titles.
  const tokenized = issues.map((issue) => ({
    issue,
    area: labelNames(issue).find((l) => l.startsWith('area:')) || '(no area)',
    tokens: titleTokens(issue.title),
  }));

  const parent = new Map(tokenized.map((t) => [t.issue.number, t.issue.number]));
  const find = (x) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  };
  const union = (a, b) => parent.set(find(a), find(b));

  for (let i = 0; i < tokenized.length; i += 1) {
    for (let j = i + 1; j < tokenized.length; j += 1) {
      const a = tokenized[i];
      const b = tokenized[j];
      if (a.area !== b.area) continue;
      if (sharesRc(a.issue, b.issue)) continue; // already a confirmed cluster
      if (jaccard(a.tokens, b.tokens) >= cutoff) union(a.issue.number, b.issue.number);
    }
  }

  const clusters = new Map();
  for (const t of tokenized) {
    const root = find(t.issue.number);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(t.issue);
  }
  const multi = [...clusters.values()].filter((list) => list.length > 1);

  console.log(`## Candidate duplicates — same area, overlapping titles, no shared rc: yet (${multi.length})`);
  if (!multi.length) console.log('- none');
  for (const list of multi) {
    const sorted = [...list].sort((a, b) => a.number - b.number);
    const area = labelNames(sorted[0]).find((l) => l.startsWith('area:')) || '(no area)';
    console.log(`- [${area}] review for a shared rc: code:`);
    for (const issue of sorted) console.log(`    #${issue.number} ${issue.title || ''}`);
  }
}

function titleTokens(title) {
  return new Set(
    String(title || '')
      .toLowerCase()
      .replace(/\[defect\]:?/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((tok) => tok.length >= 3 && !STOPWORDS.has(tok)),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const tok of a) if (b.has(tok)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function sharesRc(a, b) {
  const rcA = labelNames(a).filter((l) => l.startsWith('rc:'));
  const rcB = new Set(labelNames(b).filter((l) => l.startsWith('rc:')));
  return rcA.some((l) => rcB.has(l));
}

function labelNames(issue) {
  return (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name)).filter(Boolean);
}
