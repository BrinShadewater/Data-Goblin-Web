import type { Block } from "./pagination";
import type { Book, Chapter } from "./types";

/** Document chain: 0 = Front Matter, 1..N = chapters, N+1 = Source Library Appendix.
 *  N grows when chapters are inserted, so prefer the book-driven helpers below
 *  (frontMatterNumber / backMatterNumber / isBackMatter) over these constants —
 *  they read the real numbers from book.json. The constants are the fallback used
 *  where the loaded Book isn't in scope (e.g. module-level helpers, folio). */
export const FIRST_DOC = 0;
/** Fallback appendix doc number when the Book metadata isn't available. Keep this
 *  in sync with the highest chapter + 1 (21 chapters -> appendix is doc 22). */
export const LAST_DOC = 22;

/** Front-matter doc number (always 0) from the book, with a safe fallback. */
export const frontMatterNumber = (book?: Book | null): number =>
  book?.frontMatter?.number ?? FIRST_DOC;

/** Back-matter (Source Library Appendix) doc number from the book, with a fallback. */
export const backMatterNumber = (book?: Book | null): number =>
  book?.backMatter?.number ?? LAST_DOC;

/** True when doc `n` is the back-matter appendix (not a numbered chapter). Pass the
 *  loaded Book where you have it so the check follows the real appendix number; the
 *  fallback keeps the old behaviour where the Book isn't in scope. Accepts a nullable
 *  doc number (a null/undefined doc is never the appendix). */
export const isBackMatter = (n: number | null | undefined, book?: Book | null): boolean =>
  n === backMatterNumber(book);

/** True when doc `n` is the front matter (doc 0). */
export const isFrontMatter = (n: number | null | undefined, book?: Book | null): boolean =>
  n === frontMatterNumber(book);

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
              : b.kind === "figure"
                ? (b.caption ?? "Figure")
                : b.text;
    const plain = text.replace(/[*_>#`|[\]]/g, "").replace(/\s+/g, " ").trim();
    if (plain) return plain.length > 60 ? `${plain.slice(0, 57)}…` : plain;
  }
  return chapter.title.split(" — ")[0];
}
