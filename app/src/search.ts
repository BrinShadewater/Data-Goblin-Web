import type { Book, Chapter, GlossaryEntry } from "./types";
import { chapterPath, fetchJson } from "./useContent";

export type SearchHit =
  | { type: "chapter"; num: number; title: string; snippet: string }
  | { type: "section"; num: number; chapterTitle: string; heading: string }
  | { type: "glossary"; term: string; def: string; letter: string };

let searchIndex: SearchHit[] | null = null;
let searchIndexPromise: Promise<SearchHit[]> | null = null;

export function hasCachedSearchIndex() {
  return searchIndex !== null;
}

export function getCachedSearchIndex() {
  return searchIndex ?? [];
}

export function buildSearchIndex(): Promise<SearchHit[]> {
  if (searchIndex) return Promise.resolve(searchIndex);
  if (searchIndexPromise) return searchIndexPromise;
  searchIndexPromise = (async () => {
    const hits: SearchHit[] = [];
    const book = await fetchJson<Book>("book.json");
    const chapterRefs = book.parts.flatMap((p) => p.chapters);
    const chapters = await Promise.all(
      chapterRefs.map((ref) => fetchJson<Chapter>(chapterPath(ref.number)).catch(() => null))
    );
    for (const ch of chapters) {
      if (!ch) continue;
      hits.push({
        type: "chapter",
        num: ch.number,
        title: ch.title,
        snippet: ch.startHere.replace(/[*_>#`]/g, "").slice(0, 160),
      });
      for (const s of ch.sections) {
        hits.push({ type: "section", num: ch.number, chapterTitle: ch.title.split(" — ")[0], heading: s.heading });
      }
    }
    const glossary = await fetchJson<GlossaryEntry[]>("glossary.json");
    for (const g of glossary) {
      hits.push({ type: "glossary", term: g.term, def: g.def, letter: g.letter });
    }
    searchIndex = hits;
    return hits;
  })();
  return searchIndexPromise;
}

function scoreSearchHit(hit: SearchHit, q: string): number {
  const lq = q.toLowerCase();
  if (hit.type === "chapter") {
    if (hit.title.toLowerCase().includes(lq)) return 3;
    if (hit.snippet.toLowerCase().includes(lq)) return 1;
    return 0;
  }
  if (hit.type === "section") {
    return hit.heading.toLowerCase().includes(lq) ? 2 : 0;
  }
  if (hit.term.toLowerCase().includes(lq)) return 3;
  if (hit.def.toLowerCase().includes(lq)) return 1;
  return 0;
}

export function querySearchIndex(index: SearchHit[], query: string, limit = 14): SearchHit[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return index
    .map((hit) => ({ hit, s: scoreSearchHit(hit, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.hit);
}
