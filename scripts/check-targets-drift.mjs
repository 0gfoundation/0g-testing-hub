#!/usr/bin/env node
/*
 * Drift sentinel: data/targets.json is the single source of truth for
 * README.md -> Test targets. This compares the generated markdown block against
 * the checked-in README block, not just URLs.
 *
 * Usage:
 *   node scripts/check-targets-drift.mjs
 *   node scripts/render-targets-readme.mjs --write
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { END, START, renderTargets } from './render-targets-readme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const README = join(root, 'README.md');

const readme = await readFile(README, 'utf8');
const current = extractBlock(readme).trim();
const expected = (await renderTargets()).trim();

if (current !== expected) {
  console.error('✖ README.md -> Test targets has drifted from data/targets.json.');
  console.error('Fix: run `node scripts/render-targets-readme.mjs --write` and commit the result.');
  process.exit(1);
}

console.log('✓ README.md -> Test targets matches data/targets.json.');

function extractBlock(readme) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README.md is missing ${START} / ${END} markers.`);
  }
  return readme.slice(start, end + END.length);
}
