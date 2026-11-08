import type { Lang } from "./LanguageContext";

export type SearchHit =
  | { type: "topic"; slug: string; title: string; snippet: string }
  | { type: "chapter"; num: number; title: string; snippet: string }
  | { type: "section"; num: number; chapterTitle: string; heading: string; snippet: string; sectionId: string }
  | { type: "glossary"; term: string; def: string; letter: string };

const indexes: Partial<Record<Lang, Promise<SearchHit[]>>> = {};

export function loadSearchIndex(lang: Lang): Promise<SearchHit[]> {
  return indexes[lang] ??= fetch(`${import.meta.env.BASE_URL}search/${lang}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Search index unavailable: ${response.status}`);
      return response.json() as Promise<SearchHit[]>;
    })
    .catch((error) => {
      delete indexes[lang];
      throw error;
    });
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function scoreSearchHit(hit: SearchHit, query: string, words: string[]): number {
  const title = normalize(hit.type === "section" ? hit.heading : hit.type === "glossary" ? hit.term : hit.title);
  const snippet = normalize(hit.type === "glossary" ? hit.def : hit.snippet);
  const context = hit.type === "section" ? normalize(hit.chapterTitle) : "";
  if (!words.every((word) => `${title} ${snippet} ${context}`.includes(word))) return 0;
  if (title === query) return 6;
  if (title.includes(query)) return 5;
  if (words.every((word) => title.includes(word))) return 4;
  if (words.some((word) => title.includes(word))) return 3;
  if (words.every((word) => snippet.includes(word))) return 2;
  return 1;
}

export function querySearchIndex(index: SearchHit[], query: string, limit = 14): SearchHit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  return index
    .map((hit) => ({ hit, score: scoreSearchHit(hit, q, words) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ hit }) => hit);
}
