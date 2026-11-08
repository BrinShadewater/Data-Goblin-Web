import { useEffect, useRef, useState } from "react";
import { Link } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";
import { BODY, P, RADIUS, UI } from "../theme";
import { loadSearchIndex, querySearchIndex, type SearchHit } from "../search";
import { tr } from "../i18n";
import { sectionHref } from "../sectionLinks";

const COPY = {
  en: {
    topics: "Topics",
    close: "Close",
    prompt: "Enter at least two characters.",
    loading: "Loading search…",
    unavailable: "Search couldn’t load.",
    retry: "Retry search",
    noResultsHint: "Try a shorter phrase or different words.",
    resultCount: (count: number, query: string) =>
      count === 0 ? `No results for “${query}”` : `${count} ${count === 1 ? "result" : "results"} for “${query}”`,
  },
  fr: {
    topics: "Sujets",
    close: "Fermer",
    prompt: "Saisissez au moins deux caractères.",
    loading: "Chargement de la recherche…",
    unavailable: "Impossible de charger la recherche.",
    retry: "Réessayer la recherche",
    noResultsHint: "Essayez une recherche plus courte ou d’autres mots.",
    resultCount: (count: number, query: string) =>
      count === 0 ? `Aucun résultat pour « ${query} »` : `${count} ${count === 1 ? "résultat" : "résultats"} pour « ${query} »`,
  },
};

function describeHit(hit: SearchHit, topicsLabel: string) {
  switch (hit.type) {
    case "topic":
      return { to: `/topic/${hit.slug}`, title: hit.title, detail: hit.snippet, label: topicsLabel };
    case "chapter":
      return { to: `/chapter/${hit.num}`, title: hit.title, detail: hit.snippet, label: `${tr("Ch.")} ${hit.num}` };
    case "section":
      return {
        to: sectionHref(hit.num, hit.sectionId || hit.heading),
        state: { focusSection: true },
        title: hit.heading, detail: hit.snippet, label: `${tr("Ch.")} ${hit.num} · ${hit.chapterTitle}`,
      };
    case "glossary":
      return { to: "/loot", state: { term: hit.term }, title: hit.term, detail: hit.def, label: tr("Glossary") };
  }
}

export function SearchOverlay({ query, onClose, onSearch, mobile }: {
  query: string;
  onClose: () => void;
  onSearch: (query: string) => void;
  mobile: boolean;
}) {
  const { c } = useTheme();
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const [index, setIndex] = useState<{ lang: typeof lang; hits: SearchHit[] | null }>();
  const [attempt, setAttempt] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const q = query.trim();
  const searching = q.length >= 2;

  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    loadSearchIndex(lang).then(
      (hits) => { if (!cancelled) setIndex({ lang, hits }); },
      () => { if (!cancelled) setIndex({ lang, hits: null }); }
    );
    return () => { cancelled = true; };
  }, [lang, searching, attempt]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mobile || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [mobile]);

  useEffect(() => {
    if (mobile) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        document.querySelector<HTMLElement>('header input[type="search"]')?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobile, onClose]);

  const close = () => {
    dialogRef.current?.close();
    onClose();
  };
  const hits = index?.lang === lang ? index.hits : undefined;
  const results = querySearchIndex(hits ?? [], q, lang);
  const failed = searching && hits === null;
  const noResults = searching && Array.isArray(hits) && results.length === 0;
  const retry = () => {
    const input = mobile ? dialogRef.current?.querySelector("input") : document.querySelector('header input[type="search"]');
    if (input instanceof HTMLElement) input.focus();
    setIndex(undefined);
    setAttempt((count) => count + 1);
  };
  let status = copy.prompt;
  if (searching) {
    if (hits === undefined) status = copy.loading;
    else if (hits === null) status = copy.unavailable;
    else status = copy.resultCount(results.length, q);
  }

  const bg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const ink = c(...P.body);
  const muted = c(...P.muted);
  const controlStyle = { color: ink, background: c(...P.inputBg), border: `1px solid ${border}`, borderRadius: RADIUS };

  const content = (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: mobile ? "min(70dvh, 32rem)" : "62vh" }}>
      {mobile && (
        <div style={{ display: "flex", gap: 8, padding: 12 }}>
          <input
            type="search"
            aria-label={tr("Search the guide")}
            placeholder={tr("Search the guide…")}
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            style={{ ...controlStyle, minWidth: 0, flex: 1, fontFamily: UI, fontSize: 16, padding: 8 }}
          />
          <button type="button" onClick={close} style={{ ...controlStyle, minHeight: 44, padding: "0 10px" }}>
            {copy.close}
          </button>
        </div>
      )}
      <div role="status" style={{ padding: "10px 16px", borderBottom: `1px solid ${border}`, fontFamily: UI, fontSize: 12, color: muted }}>
        {status}
        {noResults && <p style={{ margin: "4px 0 0" }}>{copy.noResultsHint}</p>}
      </div>
      {failed && (
        <button type="button" onClick={retry}
          style={{ ...controlStyle, alignSelf: "flex-start", minHeight: 44, margin: 12, padding: "0 10px" }}>
          {copy.retry}
        </button>
      )}
      {results.length > 0 && (
        <ul className="dg-search-results" style={{ margin: 0, padding: 0, listStyle: "none", overflowY: "auto" }}>
          {results.map((hit, position) => {
            const { to, state, title, detail, label } = describeHit(hit, copy.topics);
            return (
              <li key={`${to}:${title}:${position}`}>
                <Link to={to} state={state} onClick={close}
                  style={{ display: "block", padding: "9px 16px", textDecoration: "none", color: ink, borderBottom: `1px solid ${border}` }}>
                  <div style={{ fontFamily: UI, fontSize: 11, color: muted }}>{label}</div>
                  <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 700 }}>{title}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, lineHeight: 1.45, color: muted }}>
                    {detail.length > 145 ? detail.slice(0, 145) + "…" : detail}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <style>{`.dg-search-results a:hover, .dg-search-results a:focus-visible { background: ${c("#f3eee2", "#1c2230")}; }`}</style>
    </div>
  );

  const surfaceStyle = {
    width: "min(600px, 90vw)",
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: RADIUS,
    boxShadow: c("0 8px 32px rgba(35,33,26,0.18)", "0 8px 32px rgba(0,0,0,0.6)"),
    padding: 0,
    overflow: "hidden",
  };
  if (mobile) {
    return (
      <dialog ref={dialogRef} aria-label={tr("Search the guide")}
        onCancel={(event) => { event.preventDefault(); close(); }}
        style={{ ...surfaceStyle, position: "fixed", inset: "12px 0 auto", margin: "0 auto" }}>
        {content}
      </dialog>
    );
  }
  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, background: c("rgba(35,33,26,0.35)", "rgba(0,0,0,0.65)"), zIndex: 100 }} />
      <div style={{ ...surfaceStyle, position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 101 }}>
        {content}
      </div>
    </>
  );
}
