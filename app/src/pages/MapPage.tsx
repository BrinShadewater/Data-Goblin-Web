import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, UI } from "../theme";
import { artAspectRatio, artDimensions, artSrcSet, artUrl, useBook } from "../useContent";
import { displayRegion } from "../regionLabels";
import { LoadingMessage, PageHeading, StaticPageShell } from "../components/StaticPage";
import { tr } from "../i18n";
import { useLanguage } from "../LanguageContext";

// Region notes, in part order (Part I…V). Keyed by index so they survive the
// French edition, where part.region itself is translated.
const REGION_NOTES: string[] = [
  "Foundations — what AI actually is, how it learns, and what it is physically made of.",
  "The Canadian landscape — the strategy, the infrastructure, and the actors who hold the power.",
  "Hard questions — environment, sovereignty, privacy, IP, deepfakes, ethics, and jobs.",
  "Governance — how Canadian AI is actually regulated, and what you can and cannot know.",
  "Path forward — the portable analytical toolkit and what Canada could actually do.",
];

/** The five regions of the field guide, each listing its chapters. */
export function MapPage() {
  const { c } = useTheme();
  const { lang } = useLanguage();
  const MAP_ART = lang === "fr" ? "panels/canada-map-panel-fr.webp" : "panels/canada-map-panel.webp";
  const { data: book, error } = useBook();

  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const mapDimensions = artDimensions(MAP_ART);

  return (
    <StaticPageShell maxWidth="1280px">
        <PageHeading
          eyebrow={tr("Data Goblin Field Guide")}
          title={tr("The Map")}
          description={tr("The guide’s nineteen chapters are organized into five regions. Pick a region, pick a chapter, and the field guide opens to that page.")}
          centered
          marginBottom="32px"
        >
          <img
            src={artUrl(MAP_ART)}
            srcSet={artSrcSet(MAP_ART)}
            sizes="(max-width: 760px) 92vw, min(100vw, 810px)"
            width={mapDimensions?.width}
            height={mapDimensions?.height}
            alt={tr("Fantasy map of Canada for Data Goblin, with the goblin standing in front")}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{
              display: "block",
              width: "min(100%, 810px)",
              aspectRatio: artAspectRatio(MAP_ART),
              maxHeight: "min(54vh, 675px)",
              objectFit: "contain",
              margin: "0 auto",
              filter: c("drop-shadow(0 18px 28px rgba(60,50,30,0.22))", "drop-shadow(0 18px 34px rgba(0,0,0,0.58))"),
            }}
          />
        </PageHeading>

        {error && <LoadingMessage>{tr("Could not load the map. (")}{error})</LoadingMessage>}
        {!book && !error && <LoadingMessage>{tr("Unrolling the map…")}</LoadingMessage>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {book?.parts.map((part, idx) => (
            <div key={part.part} style={{ background: c(...P.cardBg), border: `1px solid ${border}`, borderTop: `3px solid ${green}`, borderRadius: RADIUS, padding: "18px 20px", transition: "background 0.3s" }}>
              <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: muted, marginBottom: "4px" }}>
                {part.part}
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontSize: "21px", fontWeight: 800, color: navy, margin: "0 0 8px" }}>{displayRegion(part.region)}</h2>
              <p style={{ fontFamily: BODY, fontSize: "13.5px", lineHeight: 1.6, color: muted, margin: "0 0 12px" }}>
                {tr(REGION_NOTES[idx] ?? "")}
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
