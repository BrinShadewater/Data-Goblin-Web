import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { MONO, P, TOKENS, UI } from "../theme";
import { NavIcon } from "./GoblinMascot";
import { savePanel } from "../pagination";
import type { Book } from "../types";
import { TocList } from "./TableOfContents";

/** Desktop table-of-contents sidebar, grouped by region. */
export function LeftSidebar({ book, activeChapter }: { book: Book | null; activeChapter: number }) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const bg = c(...P.panelBgAlt);
  const border = c(...P.borderSoft);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const text = c(...P.body);
  const partLabel = c(...P.faint);
  const footerBg = c(...P.panelBg);

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: bg,
        borderRight: `1px solid ${border}`,
        transition: "background 0.3s",
      }}
    >
      <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: navy }}>
          Table of Contents
        </div>
      </div>

      <style>{`
        .goblin-toc-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${c("rgba(18,35,58,0.32)", "rgba(122,180,232,0.28)")} transparent;
        }
        .goblin-toc-scroll::-webkit-scrollbar { width: 6px; }
        .goblin-toc-scroll::-webkit-scrollbar-track { background: transparent; }
        .goblin-toc-scroll::-webkit-scrollbar-thumb {
          background: ${c("rgba(18,35,58,0.24)", "rgba(122,180,232,0.24)")};
          border-radius: 999px;
        }
        .goblin-toc-scroll::-webkit-scrollbar-thumb:hover {
          background: ${c("rgba(18,35,58,0.42)", "rgba(122,180,232,0.42)")};
        }
      `}</style>
      <div className="goblin-toc-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        <TocList book={book} activeChapter={activeChapter} />
      </div>

      <div style={{ borderTop: `1px solid ${border}`, padding: "14px 18px", background: footerBg, transition: "background 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <NavIcon name="trailmarker-nav" size={TOKENS.icon.tocStart} />
          <div style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: green }}>
            Start Here
          </div>
        </div>
        <p style={{ fontFamily: UI, fontSize: "13px", color: text, lineHeight: 1.45, margin: "0 0 8px" }}>
          New to the guide?{" "}
          <button
            onClick={() => {
              savePanel(1, 0);
              navigate("/chapter/1");
            }}
            style={{ background: "none", border: "none", color: green, fontFamily: UI, fontSize: "13px", fontWeight: 800, cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Begin with Chapter 1.
          </button>
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", marginTop: "10px" }}>
          <NavIcon name="canadian-icon" size={TOKENS.icon.tocCanadian} alt="Data Goblin — a field guide to AI, data and power in Canada" />
          <span style={{ fontFamily: MONO, fontSize: "9px", color: partLabel, letterSpacing: "0.1em" }}>
            Updated June 13, 2026
          </span>
        </div>
      </div>
    </aside>
  );
}
