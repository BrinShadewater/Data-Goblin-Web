import type { Book, Chapter, GlossaryEntry } from "./types";
import type { Lang } from "./LanguageContext";
import { chapterPath, fetchJson } from "./useContent";

export type SearchHit =
  | { type: "chapter"; num: number; title: string; snippet: string }
  | { type: "section"; num: number; chapterTitle: string; heading: string }
  | { type: "glossary"; term: string; def: string; letter: string };

// One index per edition. The FR reader must search FR titles, headings and glossary
// definitions; a shared cache would hand French readers English hits (or none).
const searchIndex: Partial<Record<Lang, SearchHit[]>> = {};
const searchIndexPromise: Partial<Record<Lang, Promise<SearchHit[]>>> = {};

export function hasCachedSearchIndex(lang: Lang = "en") {
  return searchIndex[lang] !== undefined;
}

export function getCachedSearchIndex(lang: Lang = "en") {
  return searchIndex[lang] ?? [];
}

export function buildSearchIndex(lang: Lang = "en"): Promise<SearchHit[]> {
  const cached = searchIndex[lang];
  if (cached) return Promise.resolve(cached);
  const pending = searchIndexPromise[lang];
  if (pending) return pending;
  const promise = (async () => {
    const hits: SearchHit[] = [];
    const book = await fetchJson<Book>("book.json", lang);
    const chapterRefs = book.parts.flatMap((p) => p.chapters);
    const chapters = await Promise.all(
      chapterRefs.map((ref) => fetchJson<Chapter>(chapterPath(ref.number), lang).catch(() => null))
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
    const glossary = await fetchJson<GlossaryEntry[]>("glossary.json", lang);
    for (const g of glossary) {
      hits.push({ type: "glossary", term: g.term, def: g.def, letter: g.letter });
    }
    searchIndex[lang] = hits;
    return hits;
  })();
  searchIndexPromise[lang] = promise;
  return promise;
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
