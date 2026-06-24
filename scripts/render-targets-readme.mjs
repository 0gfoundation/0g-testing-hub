#!/usr/bin/env node
/*
 * Render README -> Test targets from data/targets.json.
 *
 * Usage:
 *   node scripts/render-targets-readme.mjs
 *   node scripts/render-targets-readme.mjs --write
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const START = '<!-- targets:start -->';
export const END = '<!-- targets:end -->';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = join(root, 'data', 'targets.json');
const README = join(root, 'README.md');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = new Set(process.argv.slice(2));
  const generated = await renderTargets();

  if (args.has('--write')) {
    const readme = await readFile(README, 'utf8');
    const next = replaceGeneratedBlock(readme, generated);
    await writeFile(README, next);
  } else {
    process.stdout.write(generated);
  }
}

export async function renderTargets() {
  const data = JSON.parse(await readFile(TARGETS, 'utf8'));
  const lines = [];

  lines.push(START);
  lines.push('');
  lines.push(data.intro || 'Targets, in unlock order - generated from `data/targets.json`.');

  for (const bucket of data.buckets || []) {
    lines.push('');
    lines.push(`### ${bucket.readmeTitle || bucket.label}`);
    lines.push('');
    if (bucket.focus) {
      lines.push(bucket.focus);
      lines.push('');
    }

    for (const item of bucket.items || []) {
      lines.push(`- [**${item.name}**](${item.url}) - ${item.desc}`);
      if (item.note) lines.push(`  - Note: ${item.note}`);
      if (Array.isArray(item.checklist) && item.checklist.length) {
        lines.push('  - Checklist:');
        for (const check of item.checklist) lines.push(`    - ${check}`);
      }
    }
  }

  lines.push('');
  lines.push(END);
  lines.push('');

  return `${lines.join('\n')}`;
}

export function replaceGeneratedBlock(readme, generated) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);

  if (start === -1 || end === -1 || end < start) {
    return readme.replace(
      /## Test targets\n[\s\S]*?\n## Defect template/,
      `## Test targets\n\n${generated}## Defect template`,
    );
  }

  const before = readme.slice(0, start);
  const after = readme.slice(end + END.length);
  return `${before}${generated.trimEnd()}${after}`;
}
