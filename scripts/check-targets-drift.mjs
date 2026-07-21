#!/usr/bin/env node
/*
 * Drift sentinel: data/targets.json is the single source of truth for every
 * surface that lists or maps products. This checks five edges against it:
 *
 *   1. README.md -> Test targets generated block
 *   2. .github/ISSUE_TEMPLATE/submit-feedback.yml -> Product dropdown options
 *   3. .github/workflows/add-defects-to-board.yml -> Product -> area / product:* map
 *   4. scripts/setup-labels-and-board.sh          -> the same map (lockstep copy)
 *   5. data/owners.json + .github/labels.yml      -> owner entries / product:* labels
 *
 * Per-item `productLabel` names the product:* label; `legacyAliases` lists
 * retired product names that the body-parsing maps must still route (old issue
 * bodies), but that must NOT appear in the dropdown, owners, or labels.
 *
 * Any source that yields zero parsed entries is a hard failure — a format
 * change must break the check loudly, never silently skip it.
 *
 * Usage:
 *   node scripts/check-targets-drift.mjs
 *   node scripts/render-targets-readme.mjs --write   (to fix edge 1)
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { END, START, renderTargets } from './render-targets-readme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = {
  targets: 'data/targets.json',
  readme: 'README.md',
  form: '.github/ISSUE_TEMPLATE/submit-feedback.yml',
  workflow: '.github/workflows/add-defects-to-board.yml',
  setup: 'scripts/setup-labels-and-board.sh',
  owners: 'data/owners.json',
  labels: '.github/labels.yml',
};

// Case-arm patterns that are flow structure, not products: the Other gates and
// the legacy Ownership-dropdown fallback. Everything else in a map must trace
// back to a product name or a registered legacy alias.
const STRUCTURAL_PATTERNS = new Set([
  'Other',
  'Other Ecosystem dApp',
  'App Suite',
  '0G Infra',
  'Ecosystem dApp',
]);

const AREA_BY_BUCKET = { app: 'area:app-suite', infra: 'area:0g-infra', eco: 'area:ecosystem' };

const failures = [];
const summaries = [];
const fail = (file, subject, msg) => failures.push(`✖ ${file} :: ${subject} :: ${msg}`);

// ---- Source of truth -------------------------------------------------------

const data = JSON.parse(await read(FILES.targets));
const products = [];
for (const bucket of data.buckets || []) {
  const area = AREA_BY_BUCKET[bucket.key];
  if (!area) {
    fail(FILES.targets, bucket.key, 'unknown bucket key — no area mapping');
    continue;
  }
  for (const item of bucket.items || []) {
    if (!item.productLabel) fail(FILES.targets, item.name, 'missing productLabel');
    products.push({
      name: item.name,
      area,
      label: `product:${item.productLabel}`,
      aliases: item.legacyAliases || [],
      core: bucket.key !== 'eco',
    });
  }
}
assertParsed(FILES.targets, products.length, 'products');
const aliasOwner = new Map(); // alias -> product
for (const p of products) for (const a of p.aliases) aliasOwner.set(a, p);

// ---- 1. README generated block --------------------------------------------

{
  const readme = await read(FILES.readme);
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    fail(FILES.readme, 'targets block', `missing ${START} / ${END} markers`);
  } else {
    const current = readme.slice(start, end + END.length).trim();
    const expected = (await renderTargets()).trim();
    if (current !== expected) {
      fail(FILES.readme, 'targets block', 'drifted from data/targets.json — run `node scripts/render-targets-readme.mjs --write`');
    }
  }
  summaries.push(`✓ ${FILES.readme}: generated block compared`);
}

// ---- 2. Form Product dropdown ---------------------------------------------

{
  const form = await read(FILES.form);
  const options = extractDropdownOptions(form, 'product');
  assertParsed(FILES.form, options.length, 'dropdown options');
  const expected = [...products.map((p) => p.name), 'Other'];
  const wanted = new Set(expected);
  for (const name of expected) {
    if (!options.includes(name)) fail(FILES.form, name, 'missing from the Product dropdown');
  }
  for (const opt of options) {
    if (!wanted.has(opt)) {
      const via = aliasOwner.get(opt);
      fail(FILES.form, opt, via
        ? `legacy alias of "${via.name}" must not appear in the dropdown`
        : 'not a product in data/targets.json (stale option?)');
    }
  }
  if (failures.length === 0 && expected.join('\n') !== options.join('\n')) {
    fail(FILES.form, 'Product dropdown', `order drifted — expected: ${expected.join(' | ')}`);
  }
  summaries.push(`✓ ${FILES.form}: ${options.length} dropdown options checked`);
}

// ---- 3+4. Product -> area / product:* maps (workflow + setup script) ------

for (const [file, varNames] of [
  [FILES.workflow, { label: 'PRODUCT_LABEL', area: 'AREA' }],
  [FILES.setup, { label: 'product_label', area: 'area' }],
]) {
  const text = await read(file);
  const labelMap = extractCaseAssignments(text, varNames.label, /^product:[a-z0-9-]+$/);
  const areaMap = extractCaseAssignments(text, varNames.area, /^area:[a-z0-9-]+$/);
  assertParsed(file, labelMap.length, `${varNames.label} case arms`);
  assertParsed(file, areaMap.length, `${varNames.area} case arms`);

  const lookup = (map, name) =>
    map.find((e) => (e.glob ? name.startsWith(e.pattern) : name === e.pattern));

  for (const p of products) {
    for (const name of [p.name, ...p.aliases]) {
      const l = lookup(labelMap, name);
      if (!l) fail(file, name, `no ${varNames.label} mapping`);
      else if (l.value !== p.label) fail(file, name, `maps to ${l.value}, expected ${p.label}`);
      const a = lookup(areaMap, name);
      if (!a) fail(file, name, `no ${varNames.area} mapping`);
      else if (a.value !== p.area) fail(file, name, `maps to ${a.value}, expected ${p.area}`);
    }
  }
  for (const entry of [...labelMap, ...areaMap]) {
    if (STRUCTURAL_PATTERNS.has(entry.pattern)) continue;
    const known = products.some((p) =>
      [p.name, ...p.aliases].some((n) => (entry.glob ? n.startsWith(entry.pattern) : n === entry.pattern)));
    if (!known) fail(file, entry.pattern, 'maps a product unknown to data/targets.json (stale entry?)');
  }
  summaries.push(`✓ ${file}: ${labelMap.length} label + ${areaMap.length} area case arms checked`);
}

// ---- 5a. owners.json (core products only, by design) ----------------------

{
  const owners = JSON.parse(await read(FILES.owners)).owners || [];
  assertParsed(FILES.owners, owners.length, 'owner entries');
  const core = products.filter((p) => p.core);
  for (const p of core) {
    const entry = owners.find((o) => o.product === p.name);
    if (!entry) fail(FILES.owners, p.name, 'core product has no owner entry');
    else if (`area:${entry.area}` !== p.area) fail(FILES.owners, p.name, `area is "${entry.area}", expected "${p.area.replace('area:', '')}"`);
  }
  for (const o of owners) {
    if (!core.some((p) => p.name === o.product)) {
      const via = aliasOwner.get(o.product);
      fail(FILES.owners, o.product, via
        ? `stale entry — product renamed to "${via.name}"`
        : 'entry does not match any core product (orphan)');
    }
  }
  summaries.push(`✓ ${FILES.owners}: ${owners.length} owner entries checked against ${core.length} core products`);
}

// ---- 5b. labels.yml product:* set -----------------------------------------

{
  const labelsYml = await read(FILES.labels);
  const declared = [...labelsYml.matchAll(/^- name: "(product:[a-z0-9-]+)"/gm)].map((m) => m[1]);
  assertParsed(FILES.labels, declared.length, 'product:* labels');
  const wanted = new Set(products.map((p) => p.label));
  for (const label of wanted) {
    if (!declared.includes(label)) fail(FILES.labels, label, 'missing product:* label');
  }
  for (const label of declared) {
    if (!wanted.has(label)) fail(FILES.labels, label, 'label has no product in data/targets.json (stale?)');
  }
  summaries.push(`✓ ${FILES.labels}: ${declared.length} product:* labels checked`);
}

// ---- Verdict ---------------------------------------------------------------

if (failures.length) {
  for (const line of failures) console.error(line);
  console.error(`✖ ${failures.length} inconsistenc${failures.length === 1 ? 'y' : 'ies'} across the target surfaces.`);
  process.exit(1);
}
for (const line of summaries) console.log(line);
console.log(`✓ ${products.length} products consistent across README, form, maps, owners, and labels.`);

// ---- Helpers ---------------------------------------------------------------

async function read(rel) {
  return readFile(join(root, rel), 'utf8');
}

function assertParsed(file, count, what) {
  if (count === 0) {
    console.error(`✖ ${file} :: parser :: extracted 0 ${what} — file format changed? Refusing to pass on an empty read.`);
    process.exit(1);
  }
}

// Issue-form dropdown: anchored on `id: <id>`, then its `options:` list of
// `- "..."` lines, ending at the next non-list key (e.g. `validations:`).
function extractDropdownOptions(yaml, id) {
  const lines = yaml.split('\n');
  const out = [];
  let inField = false;
  let inOptions = false;
  for (const line of lines) {
    if (new RegExp(`^\\s*id:\\s*${id}\\s*$`).test(line)) { inField = true; continue; }
    if (!inField) continue;
    if (/^\s*options:\s*$/.test(line)) { inOptions = true; continue; }
    if (inOptions) {
      const m = line.match(/^\s*-\s*"([^"]+)"\s*$/);
      if (m) { out.push(m[1]); continue; }
      break; // end of the options list
    }
  }
  return out;
}

// Shell case arms assigning VAR="value". Handles single-line arms
// (`"X"|"Y"*) var="value" ;;`) and the two-line shape used in the workflow
// (pattern line ending in `)`, assignment within the next 3 lines, comments
// in between allowed).
function extractCaseAssignments(text, varName, valueShape) {
  const lines = text.split('\n');
  const out = [];
  const patternLine = /^\s*((?:"[^"]+"\*?\|)*"[^"]+"\*?)\)\s*(.*)$/;
  const assignRe = new RegExp(`${varName}="([^"]+)"`);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(patternLine);
    if (!m) continue;
    let assign = m[2].match(assignRe);
    for (let j = i + 1; !assign && j <= i + 3 && j < lines.length; j++) {
      if (/^\s*#/.test(lines[j])) continue; // comment between pattern and assignment
      assign = lines[j].match(assignRe);
      break;
    }
    if (!assign || !valueShape.test(assign[1])) continue;
    for (const seg of m[1].matchAll(/"([^"]+)"(\*)?/g)) {
      out.push({ pattern: seg[1], glob: Boolean(seg[2]), value: assign[1] });
    }
  }
  return out;
}
