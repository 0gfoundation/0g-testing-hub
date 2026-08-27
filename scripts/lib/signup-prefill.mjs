// Shared helpers for the sign-up prefill link.
//
// data/signup-prefill.json is the single source of truth. This module builds the
// URL from it and locates existing sign-up URLs in the files that publish it, so
// render-signup-links.mjs and check-signup-drift.mjs cannot disagree about
// either operation.
//
// Why this exists: two different prefill bodies were live at once — README.md +
// config.yml carried one, AGENTS.md (which the Builder Hub landing page mirrors)
// carried another — and the variant real testers actually hit was the one with
// no consistency check on it. See #69.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Files that publish the sign-up link. AGENTS.md carries it twice: once in prose
// and once in the JSON block the Builder Hub landing page syncs from.
export const PUBLISHERS = [
  { file: 'README.md', expected: 1 },
  { file: '.github/ISSUE_TEMPLATE/config.yml', expected: 1 },
  { file: 'AGENTS.md', expected: 2 },
];

// encodeURIComponent leaves !'()* alone. Percent-encode them too, so a generated
// URL contains no bare parentheses — that is what made the old links impossible
// to delimit inside markdown link syntax.
const encodeStrict = (s) =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );

export function loadSpec(root) {
  const spec = JSON.parse(readFileSync(join(root, 'data/signup-prefill.json'), 'utf8'));
  for (const field of ['repo', 'title', 'labels', 'body']) {
    if (!spec[field]) throw new Error(`data/signup-prefill.json is missing "${field}"`);
  }
  if (!Array.isArray(spec.body) || spec.body.length === 0) {
    throw new Error('data/signup-prefill.json: "body" must be a non-empty array of lines');
  }
  return spec;
}

export function buildSignupUrl(spec) {
  const body = spec.body.join('\n');
  const params = [
    `title=${encodeStrict(spec.title)}`,
    `labels=${encodeStrict(spec.labels.join(','))}`,
    `body=${encodeStrict(body)}`,
  ];
  return `https://github.com/${spec.repo}/issues/new?${params.join('&')}`;
}

// Match a sign-up prefill URL and trim the delimiters of whatever syntax it is
// embedded in (markdown `](...)`, a JSON string, a YAML scalar).
const SIGNUP_URL_RE =
  /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/new\?title=%5Bsignup%5D\S*/g;

function trimDelimiters(url) {
  let u = url.replace(/[",]+$/, '');
  // A trailing ')' belongs to the enclosing markdown link, not the URL, whenever
  // it is unbalanced. Legacy URLs contain balanced bare parens of their own.
  while (
    u.endsWith(')') &&
    (u.split('(').length - 1) < (u.split(')').length - 1)
  ) {
    u = u.slice(0, -1);
  }
  return u;
}

export function findSignupUrls(text) {
  return [...text.matchAll(SIGNUP_URL_RE)].map((m) => ({
    raw: m[0],
    url: trimDelimiters(m[0]),
    index: m.index,
  }));
}
