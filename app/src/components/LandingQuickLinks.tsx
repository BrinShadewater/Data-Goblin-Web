import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P, RADIUS, TOKENS, UI } from "../theme";
import { NavIcon } from "./GoblinMascot";

const QUICK_LINKS = [
  { to: "/guide", icon: "guidebook-nav", label: "Open the field guide", body: "Resume the book or start at the front matter." },
  { to: "/map", icon: "map-nav", label: "Browse the map", body: "Pick a chapter by region and question." },
  { to: "/receipts", icon: "data-nav", label: "Check receipts", body: "Open the public claim ledger." },
  { to: "/loot", icon: "chest-nav", label: "Pocket the glossary", body: "Look up the working vocabulary." },
];

export function LandingQuickLinks({ preloadGuide }: { preloadGuide: () => void }) {
  const { c } = useTheme();
  const border = c(...P.borderSoft);
  const muted = c(...P.muted);
  const navy = c(...P.navy);

  return (
    <section style={{ maxWidth: "1480px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 68px) 56px", position: "relative", zIndex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" }}>
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onMouseEnter={item.to === "/guide" ? preloadGuide : undefined}
            onFocus={item.to === "/guide" ? preloadGuide : undefined}
            style={{
              display: "grid",
              gridTemplateColumns: `${TOKENS.icon.landingFeature}px 1fr`,
              alignItems: "start",
              gap: "18px",
              textAlign: "left",
              background: c(...P.cardBg),
              border: `1px solid ${border}`,
              borderRadius: RADIUS,
              padding: "16px",
              cursor: "pointer",
              minHeight: "112px",
              textDecoration: "none",
            }}
          >
            <NavIcon name={item.icon} size={TOKENS.icon.landingFeature} />
            <span>
              <span style={{ display: "block", fontFamily: UI, fontSize: "15px", fontWeight: 800, color: navy, marginBottom: "5px" }}>
                {item.label}
              </span>
              <span style={{ display: "block", fontFamily: BODY, fontSize: "14px", lineHeight: 1.55, color: muted }}>
                {item.body}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
