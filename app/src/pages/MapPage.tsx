import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { artUrl, useBook } from "../useContent";
import { displayRegion } from "../regionLabels";

const REGION_NOTES: Record<string, string> = {
  "The Land": "Foundations — what AI actually is, how it learns, and what it is physically made of.",
  "The Creatures": "The Canadian landscape — the strategy, the infrastructure, and the actors who hold the power.",
  "The Weather": "Hard questions — environment, sovereignty, privacy, IP, deepfakes, ethics, and jobs.",
  "The Map": "Governance — how Canadian AI is actually regulated, and what you can and cannot know.",
  "The Tools": "Path forward — the portable analytical toolkit and what Canada could actually do.",
};

/** The five regions of the field guide, each listing its chapters. */
export function MapPage() {
  const { c, dark } = useTheme();
  const navigate = useNavigate();
  const { data: book, error } = useBook();

  const bg = c(...P.panelBg);
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, padding: "32px clamp(16px, 5vw, 40px) 64px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "30px", alignItems: "center", marginBottom: "30px" }}>
          <div>
          <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
            Data Goblin Field Guide
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "36px", fontWeight: 900, color: navy, margin: "0 0 10px", lineHeight: 1.05, textTransform: "uppercase" }}>
            The Map
          </h1>
          <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.65, margin: 0, maxWidth: "620px" }}>
            The guide&rsquo;s nineteen chapters are organized into five regions. Pick a region, pick a chapter,
            and the field guide opens to that page.
          </p>
          </div>
          <div style={{ background: c(...P.pageBg), border: `1px solid ${border}`, borderRadius: "6px", padding: "18px", boxShadow: c("0 12px 34px rgba(60,50,30,0.18)", "0 12px 34px rgba(0,0,0,0.48)") }}>
            <img
              src={artUrl("panels/themap.webp")}
              alt="Fantasy map of Canada for Data Goblin, with the goblin standing in front"
              decoding="async"
              style={{
                display: "block",
                width: "100%",
                maxHeight: "470px",
                objectFit: "contain",
                mixBlendMode: dark ? "normal" : "multiply",
                opacity: dark ? 0.92 : 1,
              }}
            />
          </div>
        </div>

        {error && <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Could not load the map. ({error})</p>}
        {!book && !error && <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Unrolling the map…</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {book?.parts.map((part) => (
            <div key={part.part} style={{ background: cardBg, border: `1px solid ${border}`, borderTop: `3px solid ${green}`, borderRadius: RADIUS, padding: "18px 20px", transition: "background 0.3s" }}>
              <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
                {part.part}
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontSize: "21px", fontWeight: 800, color: navy, margin: "0 0 8px" }}>{displayRegion(part.region)}</h2>
              <p style={{ fontFamily: BODY, fontSize: "13.5px", lineHeight: 1.6, color: muted, margin: "0 0 12px" }}>
                {REGION_NOTES[part.region] ?? ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {part.chapters.map((ch) => (
                  <button
                    key={ch.number}
                    onClick={() => navigate(`/chapter/${ch.number}`)}
                    style={{ display: "flex", gap: "8px", alignItems: "baseline", background: "none", border: "none", padding: "7px 0", cursor: "pointer", textAlign: "left", width: "100%" }}
                    onMouseEnter={(e) => ((e.currentTarget.children[1] as HTMLElement).style.textDecoration = "underline")}
                    onMouseLeave={(e) => ((e.currentTarget.children[1] as HTMLElement).style.textDecoration = "none")}
                  >
                    <span style={{ fontFamily: MONO, fontSize: "9.5px", color: muted, minWidth: "20px", flexShrink: 0 }}>{ch.number}.</span>
                    <span style={{ fontFamily: UI, fontSize: "13.5px", fontWeight: 600, color: green, lineHeight: 1.4 }}>
                      {ch.title.split(" — ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
