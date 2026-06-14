import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P, UI } from "../theme";
import { PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";
import { NavIcon } from "../components/GoblinMascot";
import { tr } from "../i18n";

export function NotFoundPage() {
  const { c } = useTheme();
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);

  const link = { fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy, textDecoration: "none" };
  const dot = <span style={{ fontFamily: UI, color: muted }}> · </span>;

  return (
    <StaticPageShell padding="48px clamp(16px, 5vw, 54px) 72px">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
        <NavIcon name="map-nav" size={92} />
      </div>
      <PageHeading
        eyebrow={tr("Off the trail")}
        title={tr("404 — Page Not Found")}
        eyebrowSize="10px"
        eyebrowLetterSpacing="0.26em"
        eyebrowMarginBottom="9px"
        titleSize="clamp(34px, 5vw, 54px)"
        titleLineHeight={1}
        description={tr("The goblin checked its map, and this path isn’t on it. The page may have moved, the link may be stale, or the URL may have a typo. No receipts were harmed.")}
        descriptionSize="17px"
        descriptionLineHeight={1.7}
        descriptionMaxWidth="680px"
      />
      <StaticCard marginBottom="0" padding="18px 20px" background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`}>
        <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.65, margin: "0 0 12px" }}>
          {tr("Try one of these instead:")}
        </p>
        <Link to="/" style={link}>{tr("Home")}</Link>{dot}
        <Link to="/guide" style={link}>{tr("Field guide")}</Link>{dot}
        <Link to="/map" style={link}>{tr("Map")}</Link>{dot}
        <Link to="/loot" style={link}>{tr("Glossary")}</Link>{dot}
        <Link to="/receipts" style={link}>{tr("Receipts")}</Link>
      </StaticCard>
    </StaticPageShell>
  );
}
