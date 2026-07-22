/*
 * Shared routing-evidence detection.
 *
 * A status:routed defect is only "evidenced" when a single issue comment carries
 * BOTH a `Routed to:` line and an `Upstream link:` line, each with a non-empty
 * value. The lines may be wrapped in common Markdown decoration — a list bullet
 * (`-`/`*`), a blockquote (`>`), bold markers (`**`), or leading whitespace — so
 * `- **Routed to:** owner/repo#1` counts just as well as a bare `Routed to: ...`.
 *
 * Both scripts/export-reward-report.mjs and scripts/check-routed-evidence.mjs
 * import this module so the exporter's blocker and the standalone checker never
 * drift apart on what "has evidence" means.
 */

// Leading class swallows blockquote/list/bold/whitespace decoration, then the
// marker is anchored to the (decorated) line start and must be followed by a
// non-space value.
const ROUTED_TO_RE = /^[\s>*-]*Routed to:\s*\S/im;
const UPSTREAM_LINK_RE = /^[\s>*-]*Upstream link:\s*\S/im;

export function commentHasRoutedEvidence(body) {
  const text = String(body || '');
  return ROUTED_TO_RE.test(text) && UPSTREAM_LINK_RE.test(text);
}

export function hasRoutedEvidence(issue) {
  return (issue.comments || []).some((comment) => {
    const body = typeof comment === 'string' ? comment : comment?.body || '';
    return commentHasRoutedEvidence(body);
  });
}
