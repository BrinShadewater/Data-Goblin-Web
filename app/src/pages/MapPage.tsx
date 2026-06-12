import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { artUrl, useBook } from "../useContent";
import { displayRegion } from "../regionLabels";
import { LoadingMessage, PageHeading, StaticPageShell } from "../components/StaticPage";

const REGION_NOTES: Record<string, string> = {
  "The Land": "Foundations — what AI actually is, how it learns, and what it is physically made of.",
  "The Creatures": "The Canadian landscape — the strategy, the infrastructure, and the actors who hold the power.",
  "The Weather": "Hard questions — environment, sovereignty, privacy, IP, deepfakes, ethics, and jobs.",
  "The Map": "Governance — how Canadian AI is actually regulated, and what you can and cannot know.",
  "The Tools": "Path forward — the portable analytical toolkit and what Canada could actually do.",
};

/** The five regions of the field guide, each listing its chapters. */
export function MapPage() {
  const { c } = useTheme();
  const { data: book, error } = useBook();

  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);

  return (
    <StaticPageShell maxWidth="1280px">
        <PageHeading
          eyebrow="Data Goblin Field Guide"
          title="The Map"
          description="The guide’s nineteen chapters are organized into five regions. Pick a region, pick a chapter, and the field guide opens to that page."
          centered
          marginBottom="32px"
        >
          <img
            src={artUrl("panels/themap.webp")}
            alt="Fantasy map of Canada for Data Goblin, with the goblin standing in front"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{
              display: "block",
              width: "min(100%, 810px)",
              maxHeight: "min(54vh, 675px)",
              objectFit: "contain",
              margin: "0 auto",
              filter: c("drop-shadow(0 18px 28px rgba(60,50,30,0.22))", "drop-shadow(0 18px 34px rgba(0,0,0,0.58))"),
            }}
          />
        </PageHeading>

        {error && <LoadingMessage>Could not load the map. ({error})</LoadingMessage>}
        {!book && !error && <LoadingMessage>Unrolling the map…</LoadingMessage>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {book?.parts.map((part) => (
            <div key={part.part} style={{ background: c(...P.cardBg), border: `1px solid ${border}`, borderTop: `3px solid ${green}`, borderRadius: RADIUS, padding: "18px 20px", transition: "background 0.3s" }}>
              <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
                {part.part}
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontSize: "21px", fontWeight: 800, color: navy, margin: "0 0 8px" }}>{displayRegion(part.region)}</h2>
              <p style={{ fontFamily: BODY, fontSize: "13.5px", lineHeight: 1.6, color: muted, margin: "0 0 12px" }}>
                {REGION_NOTES[part.region] ?? ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {part.chapters.map((ch) => (
                  <Link
                    key={ch.number}
                    to={`/chapter/${ch.number}`}
                    className="gob-link"
                    style={{ display: "flex", gap: "8px", alignItems: "baseline", padding: "7px 0", textAlign: "left", width: "100%" }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: "9.5px", color: muted, minWidth: "20px", flexShrink: 0 }}>{ch.number}.</span>
                    <span style={{ fontFamily: UI, fontSize: "13.5px", fontWeight: 600, color: green, lineHeight: 1.4 }}>
                      {ch.title.split(" — ")[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
    </StaticPageShell>
  );
}
