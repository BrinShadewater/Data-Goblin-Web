// ---------------------------------------------------------------------------
// Reference-link matching. links.json (pipeline-extracted from the appendix's
// "Links and URL References" section, merged with receipts-ledger links) is
// matched against (a) chapter source strings — Show Receipts sidebar and the
// Receipts page Sources tab — and (b) page body text, where the first
// verbatim occurrence of a long link name per page becomes a subtle autolink.
//
// MATCHING RULES (documented for the author):
//  Source-string matching (fuzzy, case-insensitive):
//   1. Normalize both sides: lowercase, drop parenthesized chunks, drop
//      punctuation, collapse whitespace.
//   2. Strong match: either normalized string contains the other.
//   3. Fallback: significant-token overlap (tokens ≥ 4 chars, minus stop
//      words). Match when the overlap covers ≥ 70% of the smaller token set
//      and at least 2 tokens. Best (largest-overlap) entry wins; first wins
//      ties.
//  Body autolinking (curated, conservative):
//   - Only link names longer than 12 characters that appear VERBATIM
//     (case-sensitive) in the page text.
//   - Only the first occurrence per page per name; longest names claim text
//     first so a longer name is never broken by a shorter one inside it.
//   - Never inside headings, blockquotes, tables, code spans, or lines that
//     already contain a markdown link.
// ---------------------------------------------------------------------------

import type { Block } from "./pagination";
import type { LinkEntry } from "./types";

const STOP = new Set([
  "with", "from", "this", "that", "what", "year", "report", "page",
  "canada", "canadian", "2023", "2024", "2025", "2026",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9à-ÿ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(" ")
      .filter((w) => w.length >= 4 && !STOP.has(w))
  );
}

/**
 * Fuzzy-match one chapter source string against the link list.
 * Returns the matched entry or null.
 */
export function matchSource(source: string, links: LinkEntry[]): LinkEntry | null {
  const ns = normalize(source);
  if (!ns) return null;

  // Pass 1 — substring both ways on normalized strings.
  for (const link of links) {
    const nl = normalize(link.name);
    if (nl.length >= 8 && (ns.includes(nl) || nl.includes(ns))) return link;
  }

  // Pass 2 — significant-token overlap.
  const ts = tokens(source);
  if (ts.size === 0) return null;
  let best: LinkEntry | null = null;
  let bestOverlap = 0;
  for (const link of links) {
    const tl = tokens(link.name);
    if (tl.size === 0) continue;
    let overlap = 0;
    for (const w of tl) if (ts.has(w)) overlap++;
    const needed = Math.max(2, Math.ceil(0.7 * Math.min(ts.size, tl.size)));
    if (overlap >= needed && overlap > bestOverlap) {
      best = link;
      bestOverlap = overlap;
    }
  }
  return best;
}

/** Title marker that flags a pipeline autolink for subtle (dotted) styling. */
export const AUTOLINK_TITLE = "goblin-autolink";

/** A line is autolink-eligible when it is plain prose with no existing link. */
function lineEligible(line: string): boolean {
  const t = line.trimStart();
  return !(
    t.startsWith("#") ||
    t.startsWith(">") ||
    t.startsWith("|") ||
    line.includes("](") ||
    line.includes("`")
  );
}

/**
 * Precompiled candidate list per links.json array (links is cached per
 * session, so this computes once): names >12 chars, longest first. Keyed by
 * array identity in a WeakMap so the filter+sort never re-runs per panel.
 */
const candidateCache = new WeakMap<LinkEntry[], LinkEntry[]>();
function candidatesFor(links: LinkEntry[]): LinkEntry[] {
  let c = candidateCache.get(links);
  if (!c) {
    c = links.filter((l) => l.name.length > 12).sort((a, b) => b.name.length - a.name.length);
    candidateCache.set(links, c);
  }
  return c;
}

/**
 * Rewrite the panel's markdown blocks so the first verbatim occurrence of
 * each qualifying links.json name becomes [name](url "goblin-autolink").
 * Pure function; pagination cost is unaffected (links add no visual height).
 * Perf: candidates are precompiled per links array, and a single joined-text
 * pass rejects the (typical) majority of names absent from the panel before
 * any per-block scanning.
 */
export function autolinkBlocks(blocks: Block[], links: LinkEntry[]): Block[] {
  if (links.length === 0) return blocks;
  const allCandidates = candidatesFor(links);
  if (allCandidates.length === 0) return blocks;

  const texts = blocks.map((b) => (b.kind === "md" ? b.text : null));
  const joined = texts.filter((t): t is string => t != null).join("\n");
  if (!joined) return blocks;
  const candidates = allCandidates.filter((l) => joined.includes(l.name));
  if (candidates.length === 0) return blocks;

  for (const link of candidates) {
    outer: for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (text == null || !text.includes(link.name)) continue;
      const lines = text.split("\n");
      let offset = 0;
      for (const line of lines) {
        const at = line.indexOf(link.name);
        if (at >= 0 && lineEligible(line)) {
          const pos = offset + at;
          texts[i] =
            text.slice(0, pos) +
            `[${link.name}](${link.url} "${AUTOLINK_TITLE}")` +
            text.slice(pos + link.name.length);
          break outer; // first occurrence per page only
        }
        offset += line.length + 1;
      }
    }
  }
  return blocks.map((b, i) =>
    b.kind === "md" && texts[i] !== null && texts[i] !== b.text ? { ...b, text: texts[i] as string } : b
  );
}
