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

/**
 * Translate a sentence that contains values, as ONE unit.
 *
 *   trf("{n} of {total} sources are corporate.", { n: 3, total: 12 })
 *
 * Use this instead of calling tr() on the fragments around an interpolated
 * value. Fragment translation looked fine in English and shattered in French:
 * the Suspicion Meter used to render
 *   "…dans ses 12 sources d'énergie (8Pourcentage. Plongez pour la formule."
 * — an unclosed bracket, a word spliced into the middle of a number, and a
 * mistranslation, because each fragment was translated without the others.
 * A whole sentence gives the translator the grammar and lets French put the
 * values wherever French wants them.
 */
export function trf(template: string, params: Record<string, string | number>): string {
  const s = tr(template);
  return s.replace(/\{(\w+)\}/g, (whole, key) =>
    key in params ? String(params[key]) : whole
  );
}
