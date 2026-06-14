import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, P, UI } from "../theme";
import { Kicker, PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";
import { tr } from "../i18n";

const SECTIONS = [
  {
    title: "Short Version",
    body: "Data Goblin is designed as a public reading tool, not a surveillance funnel. The site stores reading preferences, notes, bookmarks, and cookie choices on your own device. It does not currently run advertising trackers, sell personal information, or send your private notes to a server.",
  },
  {
    title: "What This Site Stores",
    body: "The reader uses local storage for theme, dyslexia-friendly type, last-read position, bookmarks, Goblin Notes, expanded/collapsed tool cards, and cookie preferences. That data stays in your browser unless you clear it, switch devices, or copy it somewhere yourself.",
  },
  {
    title: "Cookies And Preferences",
    body: "The cookie notice records your consent choice. Essential storage is required for the consent record and basic reading features. Optional preferences cover comfort settings. Analytics is reserved for future privacy-preserving aggregate metrics and is not active in the current build.",
  },
  {
    title: "Receipts And External Links",
    body: "The Receipts ledger links out to governments, journals, newsrooms, companies, advocacy organizations, and other source holders. Once you leave Data Goblin, those sites have their own privacy practices, paywalls, logs, and cookies. Follow the receipt, but read the room.",
  },
  {
    title: "Contact And Contributions",
    body: "If you contact the author or submit feedback outside this static site, the information you choose to send may be handled in the tool or platform you used to send it. Do not include sensitive personal information in public issue reports or source suggestions.",
  },
  {
    title: "Future Changes",
    body: "If Data Goblin later adds accounts, comments, analytics, newsletters, payments, or hosted note sync, the privacy policy should change before those features go live. The rule is simple: no quiet expansion of collection.",
  },
];

export function PrivacyPage() {
  const { c } = useTheme();
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);

  return (
    <StaticPageShell padding="36px clamp(16px, 5vw, 54px) 72px">
        <PageHeading
          eyebrow={tr("Data Goblin Site Policy")}
          title={tr("Privacy Policy")}
          eyebrowSize="10px"
          eyebrowLetterSpacing="0.26em"
          eyebrowMarginBottom="9px"
          titleSize="clamp(38px, 5vw, 58px)"
          titleLineHeight={1}
          description={tr("A privacy policy should be readable by the same humans it governs. This one says what the site stores, what it does not do, and what should trigger a future update.")}
          descriptionSize="17px"
          descriptionLineHeight={1.7}
          descriptionMaxWidth="760px"
        />

        <div style={{ display: "grid", gap: "12px" }}>
          {SECTIONS.map((section) => (
            <StaticCard key={section.title} padding="20px 22px">
              <h2 style={{ fontFamily: UI, fontSize: "17px", fontWeight: 900, color: green, margin: "0 0 8px" }}>
                {section.title}
              </h2>
              <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.7, margin: 0 }}>
                {section.body}
              </p>
            </StaticCard>
          ))}
        </div>

        <StaticCard marginBottom="0" padding="18px 20px" background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`} style={{ marginTop: "18px" }}>
          <Kicker color={green} letterSpacing="0.18em">{tr("Practical Control")}</Kicker>
          <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.65, margin: "0 0 10px" }}>
            {tr("To reset local data, clear this site’s browser storage. That removes saved notes, bookmarks, reading position, theme, and consent choices from this device.")}
          </p>
          <Link to="/" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>
            {tr("Return home")}
          </Link>
          <span style={{ fontFamily: UI, color: muted }}> · </span>
          <Link to="/receipts" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>
            {tr("Open receipts")}
          </Link>
        </StaticCard>
    </StaticPageShell>
  );
}
