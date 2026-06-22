// ---------------------------------------------------------------------------
// Inline glossary tooltips + source links. Mirrors links.ts/autolinkBlocks but
// for the "Loot" glossary: the first verbatim, whole-word occurrence per page of
// a glossary phrase becomes [phrase](url-or-#loot "goblin-glossary"), which the
// Markdown <a> renderer turns into a hover/tap definition popover — and, when the
// entry carries a source URL, a click-through to that URL.
//
// Matching rules:
//  - Long phrases (>= 5 chars, mixed case) match case-INSENSITIVELY, as before.
//  - Short / acronym phrases (< 5 chars, or ALL-CAPS like OPC / C-16 / CRTC / AIDA)
//    match case-SENSITIVELY so they don't collide with ordinary words.
//  - Entries like "AGI (Artificial General Intelligence)" contribute BOTH the
//    pre-paren label (e.g. AGI, case-sensitive) and the expansion (case-insensitive).
//  - First occurrence per page per phrase; longest phrases claim text first.
//  - Never inside headings, quotes, tables, code, or a line already linked.
// ---------------------------------------------------------------------------
import type { Block } from "./pagination";
import type { GlossaryEntry } from "./types";

export const GLOSSARY_TITLE = "goblin-glossary";

interface Phrase { text: string; cs: boolean; }

/** Short or all-caps phrases match case-sensitively (avoids "OPC"/"Mila"/"C-16"
 *  colliding with ordinary words); longer mixed-case phrases stay insensitive. */
function phraseCS(text: string): boolean {
  return text.length < 5 || (/[A-Z]/.test(text) && text === text.toUpperCase());
}

function phrasesFor(term: string): Phrase[] {
  const out: Phrase[] = [];
  const push = (t: string) => {
    const text = t.trim();
    if (text.length >= 2) out.push({ text, cs: phraseCS(text) });
  };
  const paren = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    push(paren[1]); // label, e.g. "CRTC" / "AGI"
    push(paren[2]); // expansion, e.g. "Canadian Radio-television and Telecommunications Commission"
  } else {
    push(term);
  }
  return out;
}

interface Cand { phrase: string; def: string; url: string; cs: boolean; entry: number; }

const candCache = new WeakMap<GlossaryEntry[], Cand[]>();
export function glossaryCandidates(glossary: GlossaryEntry[]): Cand[] {
  let c = candCache.get(glossary);
  if (!c) {
    const seen = new Set<string>();
    c = [];
    let entry = 0;
    for (const g of glossary) {
      for (const p of phrasesFor(g.term)) {
        const key = p.text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        c.push({ phrase: p.text, def: g.def, url: g.url || "", cs: p.cs, entry });
      }
      entry++;
    }
    c.sort((a, b) => b.phrase.length - a.phrase.length);
    candCache.set(glossary, c);
  }
  return c;
}

const mapCache = new WeakMap<GlossaryEntry[], Map<string, string>>();
export function glossaryPhraseMap(glossary: GlossaryEntry[]): Map<string, string> {
  let m = mapCache.get(glossary);
  if (!m) {
    m = new Map();
    for (const cand of glossaryCandidates(glossary)) m.set(cand.phrase.toLowerCase(), cand.def);
    mapCache.set(glossary, m);
  }
  return m;
}

function lineEligible(line: string): boolean {
  const t = line.trimStart();
  return !(t.startsWith("#") || t.startsWith(">") || t.startsWith("|") || line.includes("](") || line.includes("`"));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function glossaryLinkBlocks(blocks: Block[], glossary: GlossaryEntry[]): Block[] {
  if (!glossary || glossary.length === 0) return blocks;
  const cands = glossaryCandidates(glossary);
  if (cands.length === 0) return blocks;

  const texts = blocks.map((b) => (b.kind === "md" ? b.text : null));
  const joined = texts.filter((t): t is string => t != null).join("\n");
  if (!joined) return blocks;
  const joinedLower = joined.toLowerCase();
  const present = cands.filter((g) =>
    g.cs ? joined.includes(g.phrase) : joinedLower.includes(g.phrase.toLowerCase())
  );
  if (present.length === 0) return blocks;

  // Don't link both an acronym and its expansion (same entry) on one page.
  const usedEntries = new Set<number>();
  for (const g of present) {
    if (usedEntries.has(g.entry)) continue;
    const re = new RegExp(`\\b${escapeRe(g.phrase)}\\b`, g.cs ? "" : "i");
    const href = g.url || "#loot";
    outer: for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (text == null) continue;
      const lines = text.split("\n");
      let offset = 0;
      for (const line of lines) {
        if (lineEligible(line)) {
          const m = re.exec(line);
          if (m) {
            const at = offset + m.index;
            const matched = m[0];
            texts[i] =
              text.slice(0, at) +
              `[${matched}](${href} "${GLOSSARY_TITLE}")` +
              text.slice(at + matched.length);
            usedEntries.add(g.entry);
            break outer; // first occurrence per page per entry
          }
        }
        offset += line.length + 1;
      }
    }
  }
  return blocks.map((b, i) =>
    b.kind === "md" && texts[i] !== null && texts[i] !== b.text ? { ...b, text: texts[i] as string } : b
  );
}
