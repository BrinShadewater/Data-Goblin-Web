import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, UI } from "../theme";
import { Kicker, PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";

interface UpdateEntry {
  date: string;
  tag: string;
  title: string;
  items: string[];
}

const UPDATES: UpdateEntry[] = [
  {
    date: "June 13, 2026",
    tag: "New sections",
    title: "Four new sections added",
    items: [
      "AI agents (Chapter 2) — what changes when a model can act on your behalf, and the Canadian accountability gap it opens.",
      "Open-weight models (Chapter 9) — a real but partial lever for Canadian AI sovereignty.",
      "Disability & the fairness debate (Chapter 13) — AI as assistive benefit and as structural harm.",
      "AI companions (Chapter 10) — the intimate data you confide in, and a near-blank Canadian regulatory picture.",
    ],
  },
  {
    date: "June 13, 2026",
    tag: "Corrections",
    title: "Verification & corrections pass",
    items: [
      "Cohere's lead investor corrected to PSP Investments (not CPPIB) — July 2024 round, US$5.5B valuation.",
      "Canada signed the Council of Europe AI Convention on February 11, 2025; earlier text wrongly implied it had not. Now stated as signed but not ratified.",
      "The recurring Owen et al. finding re-scoped to 54% of energy-transition-mineral projects on or near Indigenous and peasant lands — projects sited, not material volumes, with the AI extension flagged as the guide's own move.",
      "Stanford Foundation Model Transparency Index figures corrected (mean 58 to 40.7; Mistral 55 to 18).",
      "A mis-cited case replaced with Ewert v. Canada (2018 SCC 30); the DGC witness corrected to Dave Forget; Ontario's gap restated as the absence of a provincial private-sector privacy law.",
      "New section added — AI agents (Chapter 2): what changes when a model is wired to act, and the Canadian accountability gap it opens.",
    ],
  },
  {
    date: "June 4, 2026",
    tag: "Edition",
    title: "First edition",
    items: [
      "The field guide went live alongside the federal AI for All launch. Every fact in it is current as of June 2026.",
    ],
  },
];

const PENDING: string[] = [
  "The exact spelling of a cited Hawaiian elder's name in an epigraph attribution — being confirmed against the source before it is treated as settled.",
  "One citation year (the global PUE-reporting benchmark) and a handful of provincial energy and water figures, pending their primary documents.",
];

export function UpdatesPage() {
  const { c } = useTheme();
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);

  return (
    <StaticPageShell padding="36px clamp(16px, 5vw, 54px) 72px">
      <PageHeading
        eyebrow="Data Goblin · Living Edition"
        title="Updates & Corrections"
        eyebrowSize="10px"
        eyebrowLetterSpacing="0.26em"
        eyebrowMarginBottom="9px"
        titleSize="clamp(38px, 5vw, 58px)"
        titleLineHeight={1}
        description="Every fact in this guide carries an invisible &ldquo;as of June 2026&rdquo; tag. When the world moves past the page — a bill passes, a case settles, a number is corrected — the change is logged here, in the open. Receipts, not quiet edits."
        descriptionSize="17px"
        descriptionLineHeight={1.7}
        descriptionMaxWidth="760px"
      />

      <div style={{ display: "grid", gap: "12px" }}>
        {UPDATES.map((entry) => (
          <StaticCard key={entry.date + entry.title} padding="20px 22px">
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
              <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: muted }}>
                {entry.date}
              </span>
              <span style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: green }}>
                {entry.tag}
              </span>
            </div>
            <h2 style={{ fontFamily: UI, fontSize: "18px", fontWeight: 900, color: navy, margin: "0 0 10px" }}>
              {entry.title}
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "7px" }}>
              {entry.items.map((it, i) => (
                <li key={i} style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.6 }}>
                  {it}
                </li>
              ))}
            </ul>
          </StaticCard>
        ))}
      </div>

      <StaticCard padding="18px 20px" background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`} style={{ marginTop: "18px" }}>
        <Kicker color={green} letterSpacing="0.18em">Still being checked</Kicker>
        <ul style={{ margin: "4px 0 0", paddingLeft: "20px", display: "grid", gap: "7px" }}>
          {PENDING.map((it, i) => (
            <li key={i} style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.6 }}>
              {it}
            </li>
          ))}
        </ul>
      </StaticCard>

      <StaticCard marginBottom="0" padding="18px 20px" style={{ marginTop: "12px" }}>
        <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.7, margin: "0 0 10px" }}>
          The full claim-by-claim record — what was checked, what was corrected, and what is still open — lives in
          the Receipts ledger. When something in the guide collides with something newer, trust the newer thing.
          Then ask the goblin&rsquo;s questions about it too: who counted that, what got left out, and can I see the receipt?
        </p>
        <Link to="/receipts" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>
          Open receipts
        </Link>
        <span style={{ fontFamily: UI, color: muted }}> · </span>
        <Link to="/guide" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>
          Back to the guide
        </Link>
      </StaticCard>
    </StaticPageShell>
  );
}
