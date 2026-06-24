#!/usr/bin/env node
/* Drift sentinel: data/targets.json is the single source of truth for the
 * test-target wall on the site. README.md → Test targets must stay in sync.
 *
 * This checks the one direction that matters for trust: every target URL the
 * SITE shows must also appear in the README. If the site lists a target the
 * README doesn't, they've drifted — fail so CI catches it before merge.
 *
 * No deps; Node 18+. Usage: node scripts/check-targets-drift.mjs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = join(root, 'data', 'targets.json');
const README = join(root, 'README.md');

const data = JSON.parse(await readFile(TARGETS, 'utf8'));
const readme = await readFile(README, 'utf8');

const urls = (data.buckets || []).flatMap((b) => (b.items || []).map((t) => ({ name: t.name, url: t.url })));
const missing = urls.filter(({ url }) => !readme.includes(url));

if (missing.length) {
  console.error(`✖ ${missing.length} target URL(s) in targets.json are absent from README.md:`);
  for (const { name, url } of missing) console.error(`  - ${name}: ${url}`);
  console.error('\nFix: add the target to README → Test targets, or correct the URL in data/targets.json.');
  process.exit(1);
}

console.log(`✓ targets.json ↔ README in sync — all ${urls.length} target URLs present in README.md.`);
