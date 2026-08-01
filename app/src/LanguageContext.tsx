import { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { setUiLang, onI18nReady } from "./i18n";

export type Lang = "en" | "fr";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const Ctx = createContext<LanguageCtx>({ lang: "en", setLang: () => {}, toggle: () => {} });

/** Strip a leading /fr, returning the language-neutral path ("/", "/map", …). */
function basePath(pathname: string): string {
  if (pathname === "/fr") return "/";
  if (pathname.startsWith("/fr/")) return pathname.slice(3);
  return pathname;
}

/** The URL for a given language from any current path. */
export function langPath(pathname: string, lang: Lang): string {
  const base = basePath(pathname);
  if (lang === "fr") return base === "/" ? "/fr" : "/fr" + base;
  return base;
}

/**
 * App language is derived from the URL: /fr and /fr/* are the French edition,
 * everything else is English. Each language therefore has its own crawlable URL
 * (with hreflang alternates from prerender-meta.cjs). Switching navigates
 * between the two; the choice is also remembered in localStorage.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lang: Lang = pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";

  // Re-render once the lazy-loaded French dictionary arrives.
  const [, forceUpdate] = useReducer((n) => n + 1, 0);
  useEffect(() => onI18nReady(forceUpdate), []);
  // Keep tr() in sync synchronously, before children render.
  setUiLang(lang);
  useEffect(() => {
    try { localStorage.setItem("goblin-lang", lang); } catch { /* private mode */ }
    try { document.documentElement.lang = lang === "fr" ? "fr-CA" : "en-CA"; } catch { /* no dom */ }
  }, [lang]);

  const setLang = (l: Lang) => { if (l !== lang) navigate(langPath(pathname, l)); };
  const toggle = () => setLang(lang === "en" ? "fr" : "en");
  return <Ctx.Provider value={{ lang, setLang, toggle }}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
