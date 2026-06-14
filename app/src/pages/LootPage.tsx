import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, UI } from "../theme";
import { NavIcon } from "../components/GoblinMascot";
import { useGlossary } from "../useContent";
import { LoadingMessage, PageHeading, StaticPageShell } from "../components/StaticPage";
import { StaticHeroArt } from "../components/StaticHeroArt";
import { tr } from "../i18n";

export function LootPage() {
  const { c } = useTheme();
  const { data: terms, error } = useGlossary();
  const location = useLocation() as { state?: { term?: string } };
  const [activeLetter, setActiveLetter] = useState("A");
  const [query, setQuery] = useState("");
  const initialised = useRef(false);

  // If we arrived from a search-overlay hit, pre-filter to that term.
  useEffect(() => {
    if (!initialised.current && location.state?.term) {
      setQuery(location.state.term);
      initialised.current = true;
    }
  }, [location.state]);

  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);

  const alphabet = terms ? [...new Set(terms.map((t) => t.letter))].sort() : [];
  const filtered = !terms
    ? []
    : query.trim()
      ? terms.filter(
          (t) =>
            t.term.toLowerCase().includes(query.toLowerCase()) ||
            t.def.toLowerCase().includes(query.toLowerCase())
        )
      : terms.filter((t) => t.letter === activeLetter);

  return (
    <StaticPageShell maxWidth="860px">
        <PageHeading
          eyebrow={tr("Data Goblin Field Guide")}
          title={tr("Loot (Glossary)")}
          description={tr("Plain-language definitions for the AI, data, and sovereignty terms the guide uses — vocabulary the goblin has hoarded so you don’t have to. No jargon required, just a healthy dose of suspicion.")}
          descriptionMaxWidth="560px"
          descriptionMargin="0 0 18px"
          marginBottom="26px"
          icon={<NavIcon name="crystal-nav" size={38} />}
        >
          <StaticHeroArt
            art="panels/glossary-chest-panel.webp"
            alt={tr("A glossary treasure chest for the Data Goblin loot page")}
            maxWidth="420px"
            maxHeight="300px"
            sizes="(max-width: 760px) 86vw, 420px"
            eager
          />

          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: c(...P.inputBg), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 14px", maxWidth: "380px", marginTop: "18px" }}>
            <NavIcon name="search-nav" size={30} />
            <input
              type="text"
              placeholder={tr("Search the glossary…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontFamily: UI, fontSize: "13px", color: body, flex: 1 }}
            />
          </div>
        </PageHeading>

        {error && <LoadingMessage>{tr("Could not load the glossary. (")}{error})</LoadingMessage>}
        {!terms && !error && <LoadingMessage>{tr("Unpacking the hoard…")}</LoadingMessage>}

        {!query && terms && (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "20px" }}>
            {alphabet.map((l) => (
              <button
                key={l}
                onClick={() => setActiveLetter(l)}
                style={{
                  fontFamily: MONO,
                  fontSize: "12px",
                  fontWeight: l === activeLetter ? 800 : 500,
                  color: l === activeLetter ? "#ffffff" : green,
                  background: l === activeLetter ? green : "transparent",
                  border: `1px solid ${l === activeLetter ? green : border}`,
                  borderRadius: RADIUS,
                  padding: "7px 12px",
                  minWidth: "36px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {terms && filtered.length === 0 && (
            <div style={{ fontFamily: BODY, fontSize: "14px", fontStyle: "italic", color: muted, padding: "24px 0" }}>
              {tr("No terms found")}{query ? ` for "${query}"` : ""}.
            </div>
          )}
          {filtered.map((t) => (
            <div key={t.term} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "14px 18px", transition: "background 0.3s" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: UI, fontSize: "14.5px", fontWeight: 800, color: navy }}>{t.term}</span>
                {t.chapters && (
                  <span style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: green, borderLeft: `1px solid ${border}`, paddingLeft: "8px" }}>
                    {t.chapters}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: BODY, fontSize: "14px", lineHeight: 1.65, color: body, margin: 0 }}>{t.def}</p>
            </div>
          ))}
        </div>

        {!query && terms && (
          <div style={{ marginTop: "20px", fontFamily: MONO, fontSize: "9px", color: muted }}>
            {filtered.length} {tr("term")}{filtered.length !== 1 ? "s" : ""} {tr("under “")}{activeLetter}&rdquo; · {terms.length} {tr("total in the hoard")}
          </div>
        )}
    </StaticPageShell>
  );
}
