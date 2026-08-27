#!/usr/bin/env node
// Regenerate the sign-up prefill link in every file that publishes it, from the
// single source of truth in data/signup-prefill.json.
//
//   node scripts/render-signup-links.mjs          # dry run, prints a diff summary
//   node scripts/render-signup-links.mjs --write   # rewrite the files
//
// Verify afterwards with `node scripts/check-signup-drift.mjs`.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLISHERS, loadSpec, buildSignupUrl, findSignupUrls } from './lib/signup-prefill.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

const spec = loadSpec(ROOT);
const url = buildSignupUrl(spec);

let changed = 0;
let failures = 0;

for (const { file, expected } of PUBLISHERS) {
  const path = join(ROOT, file);
  const before = readFileSync(path, 'utf8');
  const found = findSignupUrls(before);

  // Anti-empty-green: a publisher that suddenly holds no sign-up URL means the
  // file was restructured and this script silently stopped covering it.
  if (found.length !== expected) {
    console.error(
      `✗ ${file}: expected ${expected} sign-up URL(s), found ${found.length} — ` +
        `update PUBLISHERS in scripts/lib/signup-prefill.mjs if this is intentional`,
    );
    failures += 1;
    continue;
  }

  // Replace from the end so earlier match indices stay valid.
  let after = before;
  for (const hit of [...found].reverse()) {
    after = after.slice(0, hit.index) + url + after.slice(hit.index + hit.url.length);
  }

  if (after === before) {
    console.log(`= ${file}: already current (${found.length} link${found.length > 1 ? 's' : ''})`);
    continue;
  }

  changed += 1;
  if (write) {
    writeFileSync(path, after);
    console.log(`✓ ${file}: rewrote ${found.length} link${found.length > 1 ? 's' : ''}`);
  } else {
    console.log(`~ ${file}: ${found.length} link(s) would change`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} publisher(s) could not be processed.`);
  process.exit(1);
}

if (!write && changed > 0) {
  console.log(`\n${changed} file(s) out of date. Re-run with --write.`);
  process.exit(1);
}

console.log(
  write
    ? `\nDone — ${changed} file(s) updated from data/signup-prefill.json.`
    : '\nAll sign-up links match data/signup-prefill.json.',
);
