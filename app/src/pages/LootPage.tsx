import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { NavIcon } from "../components/GoblinMascot";
import { useGlossary } from "../useContent";

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

  const bg = c(...P.panelBg);
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);

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
    <div style={{ flex: 1, overflowY: "auto", background: bg, padding: "32px clamp(16px, 5vw, 40px) 64px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ marginBottom: "26px" }}>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
            Data Goblin Field Guide
          </div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: DISPLAY, fontSize: "36px", fontWeight: 900, color: navy, margin: "0 0 10px", lineHeight: 1.05, textTransform: "uppercase" }}>
            <NavIcon name="crystal-nav" size={38} />
            Loot (Glossary)
          </h1>
          <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.65, margin: "0 0 18px", maxWidth: "560px" }}>
            Plain-language definitions for the AI, data, and sovereignty terms the guide uses — vocabulary the
            goblin has hoarded so you don&rsquo;t have to. No jargon required, just a healthy dose of suspicion.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: c(...P.inputBg), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "8px 14px", maxWidth: "380px" }}>
            <NavIcon name="search-nav" size={17} />
            <input
              type="text"
              placeholder="Search the glossary…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontFamily: UI, fontSize: "13px", color: body, flex: 1 }}
            />
          </div>
        </div>

        {error && <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Could not load the glossary. ({error})</p>}
        {!terms && !error && <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Unpacking the hoard…</p>}

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
              No terms found{query ? ` for "${query}"` : ""}.
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
            {filtered.length} term{filtered.length !== 1 ? "s" : ""} under &ldquo;{activeLetter}&rdquo; · {terms.length} total in the hoard
          </div>
        )}
      </div>
    </div>
  );
}
