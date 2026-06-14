// Lightweight UI string translation for the French edition.
//
// t(s) returns the French string when the app language is French, else the
// English source string unchanged. The dictionary (ui-fr.ts) is machine-
// translated and under review, like the book content. currentLang is set by
// LanguageProvider on every render, so by the time components call t() during
// a render pass the value is already correct. Components re-render on language
// change because they consume ThemeContext, whose colour resolver depends on
// the language (see ThemeContext / the FR "blue mode").
import FR from "./ui-fr";

let currentLang: "en" | "fr" = "en";

export function setUiLang(lang: "en" | "fr") {
  currentLang = lang;
}

export function tr(s: string): string {
  if (currentLang !== "fr") return s;
  return FR[s] ?? s;
}
