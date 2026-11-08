import type { Lang } from "./LanguageContext";

export type SearchHit =
  | { type: "topic"; slug: string; title: string; snippet: string }
  | { type: "chapter"; num: number; title: string; snippet: string }
  | { type: "section"; num: number; chapterTitle: string; heading: string; snippet: string; sectionId?: string; terms?: string; keywords?: string }
  | { type: "glossary"; term: string; def: string; letter: string };

const indexes: Partial<Record<Lang, Promise<SearchHit[]>>> = {};

function isSearchHit(value: unknown): value is SearchHit {
  if (typeof value !== "object" || value === null) return false;
  const hit = value as Record<string, unknown>;
  if (hit.type === "glossary") {
    return typeof hit.term === "string" && typeof hit.def === "string" && typeof hit.letter === "string";
  }
  if (typeof hit.snippet !== "string") return false;
  switch (hit.type) {
    case "topic":
      return typeof hit.slug === "string" && typeof hit.title === "string";
    case "chapter":
      return Number.isInteger(hit.num) && typeof hit.title === "string";
    case "section":
      return Number.isInteger(hit.num) && typeof hit.heading === "string" && typeof hit.chapterTitle === "string" &&
        (hit.sectionId === undefined || typeof hit.sectionId === "string") &&
        (hit.terms === undefined || typeof hit.terms === "string") &&
        (hit.keywords === undefined || typeof hit.keywords === "string");
    default:
      return false;
  }
}

export function loadSearchIndex(lang: Lang): Promise<SearchHit[]> {
  return indexes[lang] ??= fetch(`${import.meta.env.BASE_URL}search/${lang}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Search index unavailable: ${response.status}`);
      return response.json();
    })
    .then((data: unknown) => {
      if (!Array.isArray(data) || !data.every(isSearchHit)) throw new Error("Invalid search index");
      return data;
    })
    .catch((error) => {
      delete indexes[lang];
      throw error;
    });
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const stopWords: Record<Lang, Set<string>> = {
  en: new Set("a an and are as at be by can could did do does for from had has have how i in is it many much of on or should the their they to was were what when where which who why will with would".split(" ")),
  fr: new Set("a au aux avec ce ces cet cette combien comme dans de des du elle elles en est et il ils je l la le les leur ne ou par pas peut peuvent pour quand que quel quelle qui s se sont sur un une y".split(" ")),
};

function searchWords(text: string, lang: Lang) {
  return normalize(text).split(" ").filter((word) => word.length > 1 && !stopWords[lang].has(word))
    .map((word) => {
      if (lang === "fr" && /ien(?:ne|nes|s)$/.test(word)) return word.replace(/ien(?:ne|nes|s)$/, "ien");
      return word.length > 3 ? word.replace(lang === "fr" ? /[sx]$/ : /s$/, "") : word;
    });
}

export function sectionSearchTerms(text: string, lang: Lang) {
  return [...new Set(searchWords(text, lang))].sort().join(" ");
}

export function sectionBodyTerms(text: string, lang: Lang) {
  const counts = new Map<string, number>();
  for (const word of searchWords(text, lang)) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 75)
    .map(([word]) => word)
    .sort()
    .join(" ");
}

function scoreSearchHit(hit: SearchHit, query: string, words: string[], lang: Lang): number {
  const title = hit.type === "section" ? hit.heading : hit.type === "glossary" ? hit.term : hit.title;
  const titleWords = searchWords(title, lang);
  const snippetWords = new Set(searchWords(hit.type === "glossary" ? hit.def : hit.snippet, lang));
  const contextWords = new Set(hit.type === "section" ? searchWords(hit.chapterTitle, lang) : []);
  const bodyWords = new Set(hit.type === "section" ? hit.terms?.split(" ") : []);
  const keywords = new Set(hit.type === "section" ? hit.keywords?.split(" ") : []);
  let matches = 0;
  let score = 0;
  for (const word of words) {
    const inTitle = titleWords.some((term) => term.startsWith(word));
    const inKeywords = keywords.has(word);
    const inSnippet = snippetWords.has(word);
    const inBody = bodyWords.has(word);
    const inContext = contextWords.has(word);
    if (inTitle || inKeywords || inSnippet || inBody || inContext) {
      matches++;
      score += inTitle || inKeywords ? 5 : inSnippet ? 3 : inBody ? 2 : 1;
    }
  }
  if (matches < Math.ceil(words.length * 0.6)) return 0;
  const exact = normalize(title) === query;
  return score + matches * 5 + (exact ? 30 : 0);
}

export function querySearchIndex(index: SearchHit[], query: string, lang: Lang, limit = 14): SearchHit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = [...new Set(searchWords(q, lang))];
  if (!words.length) return [];
  return index
    .map((hit) => ({ hit, score: scoreSearchHit(hit, q, words, lang) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ hit }) => hit);
}
