import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { BODY, P, RADIUS, UI } from "../theme";
import { buildSearchIndex, getCachedSearchIndex, hasCachedSearchIndex, querySearchIndex } from "../search";
import type { SearchHit } from "../search";
import { tr } from "../i18n";

export function SearchOverlay({ query, onClose }: { query: string; onClose: () => void }) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const [index, setIndex] = useState<SearchHit[]>(getCachedSearchIndex());

  useEffect(() => {
    buildSearchIndex().then(setIndex).catch(() => setIndex([]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const overlay = c("rgba(35,33,26,0.35)", "rgba(0,0,0,0.65)");
  const green = c(...P.green);
  const navy = c(...P.navy);
  const muted = c(...P.muted);
  const bodyText = c(...P.body);
  const red = c(...P.red);
  const hoverBg = c("#f3eee2", "#1c2230");

  const q = query.trim();
  if (q.length < 2) return null;

  const results = querySearchIndex(index, q);

  const chapters = results.filter((r): r is Extract<SearchHit, { type: "chapter" }> => r.type === "chapter");
  const sections = results.filter((r): r is Extract<SearchHit, { type: "section" }> => r.type === "section");
  const glossary = results.filter((r): r is Extract<SearchHit, { type: "glossary" }> => r.type === "glossary");

  const rowStyle: CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "9px 16px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "background 0.12s",
  };
  const hover = {
    onMouseEnter: (e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = hoverBg),
    onMouseLeave: (e: MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "transparent"),
  };
  const groupLabel = (color: string, label: string) => (
    <div style={{ padding: "8px 16px 4px", fontFamily: UI, fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color }}>
      {label}
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: overlay, zIndex: 100 }} />
      <div
        style={{
          position: "fixed",
          top: "64px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(600px, 90vw)",
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: RADIUS,
          boxShadow: c("0 8px 32px rgba(0,0,0,0.18)", "0 8px 32px rgba(0,0,0,0.6)"),
          zIndex: 101,
          maxHeight: "62vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${border}`, fontFamily: UI, fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted }}>
          {!hasCachedSearchIndex() && index.length === 0
            ? "Building index…"
            : results.length === 0
              ? `No results for "${q}"`
              : `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`}
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {results.length === 0 && (
            <div style={{ padding: "24px 16px", fontFamily: BODY, fontSize: "13px", fontStyle: "italic", color: muted }}>
              {tr("Try a chapter topic, section heading, or glossary term.")}
            </div>
          )}

          {chapters.length > 0 && groupLabel(red, tr("Chapters"))}
          {chapters.map((r, i) => (
            <button key={`c${i}`} onClick={() => { navigate(`/chapter/${r.num}`); onClose(); }} style={rowStyle} {...hover}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: UI, fontSize: "8px", fontWeight: 800, color: "#fff" }}>{r.num}</span>
                </div>
                <div>
                  <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: navy, marginBottom: "2px" }}>{r.title}</div>
                  <div style={{ fontFamily: BODY, fontSize: "11px", color: muted, lineHeight: 1.45 }}>{r.snippet.slice(0, 110)}…</div>
                </div>
              </div>
            </button>
          ))}

          {sections.length > 0 && groupLabel(navy, tr("Sections"))}
          {sections.map((r, i) => (
            <button key={`s${i}`} onClick={() => { navigate(`/chapter/${r.num}`); onClose(); }} style={rowStyle} {...hover}>
              <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 600, color: bodyText, marginBottom: "2px" }}>{r.heading}</div>
              <div style={{ fontFamily: UI, fontSize: "9.5px", color: muted }}>
                {tr("Ch.")} {r.num} · {r.chapterTitle}
              </div>
            </button>
          ))}

          {glossary.length > 0 && groupLabel(green, tr("Glossary"))}
          {glossary.map((r, i) => (
            <button key={`g${i}`} onClick={() => { navigate("/loot", { state: { term: r.term } }); onClose(); }} style={rowStyle} {...hover}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: RADIUS, background: c(...P.greenBg), border: `1px solid ${green}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: UI, fontSize: "8px", fontWeight: 800, color: green }}>{r.letter}</span>
                </div>
                <div>
                  <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: bodyText, marginBottom: "2px" }}>{r.term}</div>
                  <div style={{ fontFamily: BODY, fontSize: "11px", color: muted, lineHeight: 1.45 }}>{r.def.slice(0, 100)}…</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
