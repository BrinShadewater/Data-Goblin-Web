import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { MONO, P, UI } from "../theme";
import { NavIcon } from "./GoblinMascot";
import { savePanel } from "../pagination";
import type { Book } from "../types";
import { displayRegion } from "../regionLabels";

/**
 * One TOC row — used for chapters and for the front-matter/appendix entries.
 * The TOC accent family is the design navy (goblin green stays on goblin-
 * branded elements elsewhere). `touch` renders ≥44px rows for the drawer.
 */
function TocItem({
  num,
  indexLabel,
  title,
  active,
  touch,
  onNavigate,
}: {
  num: number;
  indexLabel: string;
  title: string;
  active: boolean;
  touch: boolean;
  onNavigate?: () => void;
}) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const navy = c(...P.navy);
  const navyDeep = c(...P.navyDeep);
  const activeText = c("#ffffff", "#0d1018");
  const text = c(...P.body);
  const partLabel = c(...P.faint);
  return (
    <button
      onClick={() => {
        savePanel(num, 0); // TOC click opens the document at its first page
        navigate(`/chapter/${num}`);
        onNavigate?.();
      }}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: touch ? "9px" : "7px",
        width: "100%",
        minHeight: touch ? "44px" : undefined,
        padding: touch ? "12px 16px 12px 13px" : "7px 18px 7px 15px",
        background: active ? navy : "transparent",
        borderLeft: active ? `3px solid ${navyDeep}` : "3px solid transparent",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = c("rgba(26,46,74,0.08)", "rgba(122,180,232,0.12)");
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: touch ? "10px" : "10px",
          color: active ? c("rgba(255,255,255,0.68)", "rgba(13,16,24,0.68)") : partLabel,
          minWidth: "22px",
          flexShrink: 0,
          fontWeight: 600,
        }}
      >
        {indexLabel}
      </span>
      <span style={{ fontFamily: UI, fontSize: touch ? "13.5px" : "14px", fontWeight: active ? 700 : 500, color: active ? activeText : text, lineHeight: 1.35 }}>
        {title}
      </span>
    </button>
  );
}

/** Region label line for a TOC group ("◆ The Trailhead"). */
function RegionLabel({ region, part }: { region: string; part?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ padding: "10px 18px 5px" }}>
      {part && (
        <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: c(...P.faint) }}>
          {part}
        </div>
      )}
      <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: c(...P.navy), marginTop: part ? "2px" : 0 }}>
        ◆ {displayRegion(region)}
      </div>
    </div>
  );
}

/**
 * Region-grouped table of contents from book.json. Shared by the desktop
 * sidebar and the mobile drawer (`touch` enlarges rows to ≥44px).
 */
export function TocList({
  book,
  activeChapter,
  touch = false,
  onNavigate,
}: {
  book: Book | null;
  activeChapter: number;
  touch?: boolean;
  onNavigate?: () => void;
}) {
  const { c } = useTheme();
  return (
    <>
      {!book && (
        <div style={{ padding: "16px", fontFamily: UI, fontSize: "11px", color: c(...P.faint) }}>Loading contents…</div>
      )}
      {book?.frontMatter && (
        <div style={{ marginBottom: "6px" }}>
          <RegionLabel region={book.frontMatter.region} />
          <TocItem
            num={book.frontMatter.number}
            indexLabel="i."
            title={book.frontMatter.title}
            active={activeChapter === book.frontMatter.number}
            touch={touch}
            onNavigate={onNavigate}
          />
        </div>
      )}
      {book?.parts.map((part) => (
        <div key={part.part} style={{ marginBottom: "6px" }}>
          <RegionLabel region={part.region} part={part.part} />
          {part.chapters.map((ch) => (
            <TocItem
              key={ch.number}
              num={ch.number}
              indexLabel={`${ch.number}.`}
              title={ch.title.split(" — ")[0]}
              active={ch.number === activeChapter}
              touch={touch}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
      {book?.backMatter && (
        <div style={{ marginBottom: "6px" }}>
          <RegionLabel region={book.backMatter.region} />
          <TocItem
            num={book.backMatter.number}
            indexLabel="A."
            title={book.backMatter.title}
            active={activeChapter === book.backMatter.number}
            touch={touch}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </>
  );
}

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

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        <TocList book={book} activeChapter={activeChapter} />
      </div>

      <div style={{ borderTop: `1px solid ${border}`, padding: "14px 18px", background: footerBg, transition: "background 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <NavIcon name="trailmarker-nav" size={45} />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "9px", color: partLabel, letterSpacing: "0.1em" }}>
            {book ? `as of ${book.asOf}` : ""}
          </span>
          <NavIcon name="canadian-icon" size={131} alt="Data Goblin — a field guide to AI, data and power in Canada" />
        </div>
      </div>
    </aside>
  );
}
