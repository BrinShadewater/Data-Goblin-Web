import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "fr";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const Ctx = createContext<LanguageCtx>({ lang: "en", setLang: () => {}, toggle: () => {} });

/**
 * App language. The French edition is a machine translation served from
 * /content/fr/ (see pipeline/translate_fr.py); useContent falls back to the
 * English file when an FR file is missing. Persisted to localStorage; default
 * English.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem("goblin-lang") === "fr" ? "fr" : "en";
    } catch {
      return "en";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("goblin-lang", lang);
    } catch {
      /* private mode - ignore */
    }
    try {
      document.documentElement.lang = lang;
    } catch {
      /* no dom - ignore */
    }
  }, [lang]);
  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((v) => (v === "en" ? "fr" : "en"));
  return <Ctx.Provider value={{ lang, setLang, toggle }}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
