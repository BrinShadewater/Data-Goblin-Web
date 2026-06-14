import type { Block } from "./pagination";
import type { Chapter } from "./types";

/** Document chain: 0 = Front Matter, 1-20 = chapters, 21 = Source Library Appendix. */
export const FIRST_DOC = 0;
export const LAST_DOC = 21;

/** Lowercase roman numeral for front-matter folios. */
export function roman(n: number): string {
  const vals: [number, string][] = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
    [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  for (const [v, s] of vals) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Page folio per document: roman numerals for the front matter, A-n for the appendix. */
export const folio = (doc: number, page: number) =>
  doc === FIRST_DOC ? roman(page) : doc === LAST_DOC ? `A-${page}` : String(page);

/** Plain-text snippet of a panel's first prose block, for bookmark labels. */
export function panelSnippet(blocks: Block[], chapter: Chapter): string {
  for (const b of blocks) {
    const text =
      b.kind === "md"
        ? b.text
        : b.kind === "heading"
          ? b.heading
          : b.kind === "trap"
            ? b.trap.trapTitle
            : b.kind === "panel"
              ? (b.caption ?? "Field guide plate")
              : b.text;
    const plain = text.replace(/[*_>#`|[\]]/g, "").replace(/\s+/g, " ").trim();
    if (plain) return plain.length > 60 ? `${plain.slice(0, 57)}…` : plain;
  }
  return chapter.title.split(" — ")[0];
}
