// ---------------------------------------------------------------------------
// Inline glossary tooltips. Mirrors links.ts/autolinkBlocks but for the
// "Loot" glossary: the first verbatim, whole-word occurrence per page of a
// glossary phrase becomes [phrase](#loot "goblin-glossary"), which the
// Markdown <a> renderer turns into a hover/tap definition popover.
//
// Conservative by design:
//  - Only phrases >= 5 chars; whole-word, case-insensitive.
//  - Entries like "AGI (Artificial General Intelligence)" contribute the
//    EXPANSION (safe, long) and the pre-paren label only if >= 5 chars, so
//    short abbreviations (AGI, AIDA) never auto-match on their own.
//  - First occurrence per page per phrase; longest phrases claim text first.
//  - Never inside headings, quotes, tables, code, or a line already linked.
// ---------------------------------------------------------------------------
import type { Block } from "./pagination";
import type { GlossaryEntry } from "./types";

export const GLOSSARY_TITLE = "goblin-glossary";

function phrasesFor(term: string): string[] {
  const out: string[] = [];
  const paren = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    const label = paren[1].trim();
    const expansion = paren[2].trim();
    if (label.length >= 5) out.push(label);
    if (expansion.length >= 5) out.push(expansion);
  } else if (term.trim().length >= 5) {
    out.push(term.trim());
  }
  return out;
}

interface Cand { phrase: string; def: string; }

const candCache = new WeakMap<GlossaryEntry[], Cand[]>();
export function glossaryCandidates(glossary: GlossaryEntry[]): Cand[] {
  let c = candCache.get(glossary);
  if (!c) {
    const seen = new Set<string>();
    c = [];
    for (const g of glossary) {
      for (const phrase of phrasesFor(g.term)) {
        const key = phrase.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        c.push({ phrase, def: g.def });
      }
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
  const joinedLower = texts.filter((t): t is string => t != null).join("\n").toLowerCase();
  if (!joinedLower) return blocks;
  const present = cands.filter((g) => joinedLower.includes(g.phrase.toLowerCase()));
  if (present.length === 0) return blocks;

  for (const g of present) {
    const re = new RegExp(`\\b${escapeRe(g.phrase)}\\b`, "i");
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
              `[${matched}](#loot "${GLOSSARY_TITLE}")` +
              text.slice(at + matched.length);
            break outer; // first occurrence per page only
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
