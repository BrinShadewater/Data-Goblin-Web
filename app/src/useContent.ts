import { useEffect, useState } from "react";
import { RESPONSIVE_ART } from "./imageRegistry";
import type { ArtMap, Book, Chapter, GlossaryEntry, LinkEntry, Receipt, Traps } from "./types";
import { useLanguage, type Lang } from "./LanguageContext";

// Runtime JSON loader with a module-level cache so each file is fetched once
// per session. Content lives in public/content/ and is produced by the
// pipeline (site/pipeline/build_content.py) — never hardcoded in the app.

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

const BASE = `${import.meta.env.BASE_URL}content/`;

const contentUrl = (relPath: string, lang: Lang) =>
  lang === "fr" ? `${BASE}fr/${relPath}` : `${BASE}${relPath}`;

// Language-neutral content (art placement, link registry, claim anchors) has no
// fr/ copy, so French pages would 404 on fr/ then fall back to EN. Pin these to
// EN up front to skip the wasted request.
// art-map is art paths and links are English reference URLs, so both are the
// same in either edition. claim-anchors is NOT neutral: anchors are verbatim
// prose phrases, so the French edition needs French ones (fr/claim-anchors.json,
// built by scripts/build-fr-anchors.cjs). fetchJson falls back to the English
// file if the French one is missing.
const LANG_NEUTRAL = new Set(["art-map.json", "links.json"]);

/**
 * Load a content JSON. In French, fetch the machine-translated copy under
 * /content/fr/ and transparently fall back to the English file if the FR file
 * is missing (so a partial translation degrades gracefully). Cache is keyed by
 * language so EN and FR never collide.
 */
export function fetchJson<T>(relPath: string, lang: Lang = "en"): Promise<T> {
  if (LANG_NEUTRAL.has(relPath)) lang = "en";
  const key = `${lang}:${relPath}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key) as T);
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const fetchEn = () =>
    fetch(BASE + relPath).then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${relPath}: ${res.status}`);
      return res.json();
    });
  const primary =
    lang === "fr"
      ? fetch(contentUrl(relPath, "fr")).then((res) => (res.ok ? res.json() : fetchEn()))
      : fetchEn();
  const p = primary
    .then((data) => {
      cache.set(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, p);
  return p as Promise<T>;
}

export function useJson<T>(relPath: string | null): { data: T | null; error: string | null } {
  const { lang: ctxLang } = useLanguage();
  const lang = relPath && LANG_NEUTRAL.has(relPath) ? "en" : ctxLang;
  const key = relPath ? `${lang}:${relPath}` : null;
  const [data, setData] = useState<T | null>(
    key && cache.has(key) ? (cache.get(key) as T) : null
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!relPath || !key) {
      setData(null);
      setError(null);
      return;
    }
    let live = true;
    if (cache.has(key)) {
      setData(cache.get(key) as T);
      setError(null);
      return;
    }
    setData(null);
    setError(null);
    fetchJson<T>(relPath, lang)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [relPath, lang, key]);
  return { data, error };
}

export const chapterPath = (num: number) => `chapters/ch${String(num).padStart(2, "0")}.json`;

export const useBook = () => useJson<Book>("book.json");
export const useChapter = (num: number | null) =>
  useJson<Chapter>(num == null ? null : chapterPath(num));
export const useTraps = () => useJson<Traps>("traps.json");
export const useReceipts = () => useJson<Receipt[]>("receipts.json");
export const useGlossary = () => useJson<GlossaryEntry[]>("glossary.json");
export const useLinks = () => useJson<LinkEntry[]>("links.json");
export const useArtMap = () => useJson<ArtMap>("art-map.json");
export const useClaimAnchors = () => useJson<Record<string, { anchor: string; id: number; status: string }[]>>("claim-anchors.json");

/** URL of an art asset; `rel` is an art-map path like "small/water.png". */
export const artUrl = (rel: string) => `${import.meta.env.BASE_URL}art/${rel}`;

export function artDimensions(rel: string) {
  const entry = RESPONSIVE_ART[rel];
  return entry ? { width: entry.width, height: entry.height } : undefined;
}

export function artAspectRatio(rel: string) {
  const entry = RESPONSIVE_ART[rel];
  return entry ? `${entry.width} / ${entry.height}` : undefined;
}

export function artSrcSet(rel: string) {
  const widths = RESPONSIVE_ART[rel]?.widths;
  if (!widths) return undefined;
  const ext = rel.slice(rel.lastIndexOf("."));
  const base = rel.slice(0, -ext.length);
  return widths
    .map((width) => `${artUrl(width === 1024 ? rel : `${base}-${width}w.webp`)} ${width}w`)
    .join(", ");
}
