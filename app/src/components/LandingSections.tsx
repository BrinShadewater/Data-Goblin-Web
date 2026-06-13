import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, MONO, P, RADIUS, TOKENS, UI } from "../theme";
import { artAspectRatio, artDimensions, artSrcSet, artUrl } from "../useContent";
import { NavIcon } from "./GoblinMascot";

const HERO_ART = "panels/hero-panel.webp";
const FLAG_ART = "panels/canada-flag-panel.webp";

export { LandingQuickLinks } from "./LandingQuickLinks";
export { LandingWisps, LandingWispStyles } from "./LandingWisps";

export function LandingHero({
  title,
  subtitle,
  asOf,
  begin,
  preloadGuide,
}: {
  title: string;
  subtitle: string;
  asOf: string;
  begin: () => void;
  preloadGuide: () => void;
}) {
  const { c, dark } = useTheme();
  const page = c(...P.pageBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);
  const heroDimensions = artDimensions(HERO_ART);
  const flagDimensions = artDimensions(FLAG_ART);

  return (
    <section
      style={{
        minHeight: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
        alignItems: "center",
        gap: "clamp(22px, 4vw, 54px)",
        padding: "clamp(22px, 4vw, 48px) clamp(24px, 5vw, 64px) clamp(16px, 3vw, 34px)",
        maxWidth: "1480px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "12px" }}>
          Free interactive web book · {asOf}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1.2vw, 14px)", margin: "0 0 12px", flexWrap: "nowrap" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(48px, 7vw, 92px)", fontWeight: 900, color: navy, margin: 0, lineHeight: 0.95, textTransform: "uppercase", minWidth: 0 }}>
            {title}
          </h1>
          <img
            src={artUrl(FLAG_ART)}
            srcSet={artSrcSet(FLAG_ART)}
            sizes="(max-width: 720px) 150px, 210px"
            width={flagDimensions?.width}
            height={flagDimensions?.height}
            alt=""
            aria-hidden
            loading="eager"
            fetchPriority="high"
            decoding="async"
      style={{
        width: "clamp(132px, 14vw, 210px)",
        height: "auto",
        aspectRatio: artAspectRatio(FLAG_ART),
        objectFit: "contain",
        mixBlendMode: dark ? "normal" : "multiply",
              opacity: dark ? 0.92 : 1,
            }}
          />
        </div>
        <p style={{ fontFamily: DISPLAY, fontSize: "clamp(21px, 2.3vw, 34px)", fontStyle: "italic", color: c(...P.ink), margin: "0 0 24px", lineHeight: 1.22 }}>
          {subtitle}
        </p>
        <p style={{ fontFamily: BODY, fontSize: "18px", lineHeight: 1.7, color: body, maxWidth: "760px", margin: "0 0 28px" }}>
          A plain-language guide for reading AI claims in Canada: who counted what, who benefits,
          what is still contested, and where the receipts live.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <button
            onClick={begin}
            onMouseEnter={preloadGuide}
            onFocus={preloadGuide}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: green,
              border: `1px solid ${c(...P.greenDeep)}`,
              borderRadius: RADIUS,
              color: c("#fffaf0", "#0d1018"),
              cursor: "pointer",
              fontFamily: UI,
              fontSize: "15px",
              fontWeight: 800,
              padding: "14px 18px",
            }}
          >
            Begin with Chapter 1
            <ArrowRight size={41} />
          </button>
          <Link
            to="/guide"
            onMouseEnter={preloadGuide}
            onFocus={preloadGuide}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              background: "transparent",
              border: `1px solid ${green}`,
              borderRadius: RADIUS,
              color: green,
              cursor: "pointer",
              fontFamily: UI,
              fontSize: "15px",
              fontWeight: 800,
              padding: "14px 18px",
              textDecoration: "none",
            }}
          >
            <NavIcon name="guidebook-nav" size={TOKENS.icon.landingPrimary} />
            Open the guide
          </Link>
        </div>
      </div>

      <div
        style={{
          background: page,
          border: `1px solid ${border}`,
          borderRadius: "6px",
          boxShadow: c("0 18px 48px rgba(60,50,30,0.24)", "0 18px 48px rgba(0,0,0,0.55)"),
          padding: "clamp(14px, 2.4vw, 28px)",
          minWidth: 0,
        }}
      >
        <img
          src={artUrl(HERO_ART)}
          srcSet={artSrcSet(HERO_ART)}
          sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 650px"
          width={heroDimensions?.width}
          height={heroDimensions?.height}
          alt="Data Goblin inspecting a trail of receipts and glowing evidence crystals"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{
            display: "block",
            width: "100%",
            aspectRatio: artAspectRatio(HERO_ART),
            maxHeight: "50dvh",
            objectFit: "contain",
            mixBlendMode: dark ? "normal" : "multiply",
            opacity: dark ? 0.92 : 1,
          }}
        />
      </div>
    </section>
  );
}
