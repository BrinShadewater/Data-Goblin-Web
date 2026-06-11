import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { MONO, P, UI } from "../theme";
import { GoblinIcon } from "./GoblinMascot";
import { saveSpread } from "../pagination";
import type { Book } from "../types";

/** One TOC row — used for chapters and for the front-matter/appendix entries. */
function TocItem({
  num,
  indexLabel,
  title,
  active,
}: {
  num: number;
  indexLabel: string;
  title: string;
  active: boolean;
}) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const green = c(...P.green);
  const text = c(...P.body);
  const partLabel = c(...P.faint);
  return (
    <button
      onClick={() => {
        saveSpread(num, 0); // TOC click opens the document at its first spread
        navigate(`/chapter/${num}`);
      }}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "7px",
        width: "100%",
        padding: "5px 16px 5px 13px",
        background: active ? green : "transparent",
        borderLeft: active ? `3px solid ${c(...P.greenDeep)}` : "3px solid transparent",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = c("rgba(45,90,39,0.08)", "rgba(116,184,94,0.1)");
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: "9px", color: active ? "rgba(255,255,255,0.6)" : partLabel, minWidth: "18px", flexShrink: 0, fontWeight: 600 }}>
        {indexLabel}
      </span>
      <span style={{ fontFamily: UI, fontSize: "11px", fontWeight: active ? 600 : 400, color: active ? "#ffffff" : text, lineHeight: 1.35 }}>
        {title}
      </span>
    </button>
  );
}

/** Region label line for a TOC group ("◆ The Trailhead"). */
function RegionLabel({ region, part }: { region: string; part?: string }) {
  const { c } = useTheme();
  return (
    <div style={{ padding: "8px 16px 4px" }}>
      {part && (
        <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: c(...P.faint) }}>
          {part}
        </div>
      )}
      <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c(...P.green), marginTop: part ? "2px" : 0 }}>
        ◆ {region}
      </div>
    </div>
  );
}

/** Table of contents grouped by region, built from book.json. */
export function LeftSidebar({ book, activeChapter }: { book: Book | null; activeChapter: number }) {
  const { c } = useTheme();
  const navigate = useNavigate();
  const bg = c(...P.panelBgAlt);
  const border = c(...P.borderSoft);
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
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: green }}>
          Table of Contents
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {!book && (
          <div style={{ padding: "16px", fontFamily: UI, fontSize: "11px", color: partLabel }}>Loading contents…</div>
        )}
        {book?.frontMatter && (
          <div style={{ marginBottom: "6px" }}>
            <RegionLabel region={book.frontMatter.region} />
            <TocItem
              num={book.frontMatter.number}
              indexLabel="i."
              title={book.frontMatter.title}
              active={activeChapter === book.frontMatter.number}
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
            />
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${border}`, padding: "12px 16px", background: footerBg, transition: "background 0.3s" }}>
        <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: green, marginBottom: "5px" }}>
          Start Here
        </div>
        <p style={{ fontFamily: UI, fontSize: "10.5px", color: text, lineHeight: 1.45, margin: "0 0 8px" }}>
          New to the guide?{" "}
          <button
            onClick={() => {
              saveSpread(1, 0);
              navigate("/chapter/1");
            }}
            style={{ background: "none", border: "none", color: green, fontFamily: UI, fontSize: "10.5px", fontWeight: 700, cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Begin with Chapter 1.
          </button>
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "8px", color: partLabel, letterSpacing: "0.1em" }}>
            {book ? `as of ${book.asOf}` : ""}
          </span>
          <GoblinIcon size={22} />
        </div>
      </div>
    </aside>
  );
}
