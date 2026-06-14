// Lightweight UI string translation for the French edition.
//
// tr(s) returns the French string when the app language is French, else the
// English source unchanged. The dictionary (ui-fr.ts, ~22 KB) is **lazy-loaded**
// on first switch to French, so English readers never download it and it stays
// out of the main bundle. While it loads, tr() falls back to English for a
// frame; LanguageProvider subscribes to onI18nReady and re-renders when it lands.
type Lang = "en" | "fr";

let currentLang: Lang = "en";
let FR: Record<string, string> | null = null;
let loading = false;
const listeners = new Set<() => void>();

export function onI18nReady(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setUiLang(lang: Lang) {
  currentLang = lang;
  if (lang === "fr" && !FR && !loading) {
    loading = true;
    import("./ui-fr")
      .then((m) => { FR = m.default; })
      .catch(() => { FR = {}; })
      .finally(() => { loading = false; listeners.forEach((f) => f()); });
  }
}

export function tr(s: string): string {
  if (currentLang !== "fr" || !FR) return s;
  return FR[s] ?? s;
}
