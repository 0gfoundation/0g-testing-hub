#!/usr/bin/env node
// Guard the sign-up prefill link against drift.
//
// Every file that publishes the sign-up link must carry byte-for-byte the URL
// generated from data/signup-prefill.json. Read-only — never writes back.
//
//   node scripts/check-signup-drift.mjs
//
// This exists because the repo shipped two different prefill bodies at once:
// README.md + config.yml had one, AGENTS.md (mirrored by the Builder Hub landing
// page) had another, and the variant real testers actually hit — #64, #65 — was
// the unguarded one. check-targets-drift.mjs covers the product tables; this
// covers the registration entry point. See #69.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLISHERS, loadSpec, buildSignupUrl, findSignupUrls } from './lib/signup-prefill.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const spec = loadSpec(ROOT);
const expectedUrl = buildSignupUrl(spec);

let problems = 0;
let checked = 0;

for (const { file, expected } of PUBLISHERS) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  const found = findSignupUrls(text);

  if (found.length !== expected) {
    console.error(
      `✗ ${file}: expected ${expected} sign-up URL(s), found ${found.length}.`,
    );
    problems += 1;
    continue;
  }

  let fileOk = true;
  found.forEach((hit, i) => {
    checked += 1;
    if (hit.url !== expectedUrl) {
      fileOk = false;
      problems += 1;
      const where = expected > 1 ? ` (occurrence ${i + 1} of ${expected})` : '';
      console.error(`✗ ${file}${where}: sign-up link does not match data/signup-prefill.json.`);
      // Point at the first divergence rather than dumping two 1.4KB URLs.
      const j = [...hit.url].findIndex((c, k) => c !== expectedUrl[k]);
      if (j >= 0) {
        console.error(`    first difference at offset ${j}:`);
        console.error(`      expected …${expectedUrl.slice(Math.max(0, j - 20), j + 40)}`);
        console.error(`      found    …${hit.url.slice(Math.max(0, j - 20), j + 40)}`);
      } else {
        console.error(`    lengths differ: expected ${expectedUrl.length}, found ${hit.url.length}`);
      }
    }
  });

  if (fileOk) {
    console.log(`✓ ${file}: ${expected} sign-up link${expected > 1 ? 's' : ''} match`);
  }
}

// Anti-empty-green: if nothing was actually compared, this check proves nothing.
if (checked === 0) {
  console.error('✗ No sign-up links were compared — the publisher list or the URL matcher is broken.');
  process.exit(1);
}

if (problems > 0) {
  console.error(
    `\n${problems} problem(s). Fix data/signup-prefill.json (the source of truth), ` +
      'then run `node scripts/render-signup-links.mjs --write`.',
  );
  process.exit(1);
}

console.log(`\n✓ ${checked} sign-up link(s) consistent with data/signup-prefill.json.`);
