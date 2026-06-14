import { FileCode2, Terminal } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, HAND, MONO, P, RADIUS, UI } from "../theme";
import { tr } from "../i18n";

export { ContributionForm, ContributionSuccess, ContributionTypeSelector } from "./ContributionForm";

const GUIDELINES = [
  { title: "Be specific", body: 'Name the chapter and section. "Chapter 8, the section on Jevons\' paradox" is useful. "Something seemed wrong" is not.' },
  { title: "Link your source", body: "If you're correcting a factual error, provide the source that contradicts the guide. Corrections without evidence don't get receipts." },
  { title: "Assume good faith", body: "This guide is written by humans who make mistakes. Corrections are welcome; hostility is not. We read everything." },
  { title: "You own your words", body: "Contributions may be incorporated into the guide. By submitting, you agree your suggestion can be paraphrased or adapted." },
];

const REVISION_STEPS = [
  { cmd: null, text: "Edit the manuscript markdown (DataGoblin-Complete.md) — the single source of truth for every chapter, trap, and recap." },
  { cmd: "python3 site/pipeline/build_content.py", text: "Run the content pipeline. It re-parses the manuscript, the Receipts Ledger, and the Glossary into site/content/*.json." },
  { cmd: "site/update-content.sh  (or update-content.bat)", text: "Or run the one-step update script: it runs the pipeline, copies site/content into the app's public/content, and prints a summary of what changed." },
  { cmd: null, text: "Reload the site. Chapters, traps, receipts, and glossary all render from the regenerated JSON — nothing in the app is hardcoded." },
];

export function GuidelinesPanel() {
  const { c } = useTheme();
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const noteBg = c(...P.greenBg);
  const noteBorder = c(...P.greenBorder);

  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>
        {tr("Guidelines")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {GUIDELINES.map((g, i) => (
          <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "12px 14px", transition: "background 0.3s" }}>
            <div style={{ fontFamily: UI, fontSize: "11px", fontWeight: 700, color: navy, marginBottom: "4px" }}>{g.title}</div>
            <p style={{ fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.6, margin: 0 }}>{g.body}</p>
          </div>
        ))}
      </div>

      <div style={{ background: noteBg, border: `1px solid ${noteBorder}`, borderLeft: `4px solid ${green}`, borderRadius: RADIUS, padding: "12px 16px" }}>
        <div style={{ fontFamily: MONO, fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: green, marginBottom: "5px" }}>
          {tr("A Note from the Goblin")}
        </div>
        <p style={{ fontFamily: BODY, fontSize: "12px", lineHeight: 1.65, color: body, margin: "0 0 8px" }}>
          {tr("This guide is not affiliated with any institution. It is maintained by one goblin with a laptop and a deep suspicion of AI press releases.")}
        </p>
        <div style={{ fontFamily: HAND, fontSize: "15px", color: c("#7a6040", "#8a7850"), fontStyle: "italic" }}>
          {tr("“Every error caught is a receipt issued.”")}
        </div>
      </div>
    </div>
  );
}

export function RevisionFlowCard() {
  const { c } = useTheme();
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderTop: `3px solid ${green}`, borderRadius: RADIUS, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <FileCode2 size={15} color={green} />
        <h2 style={{ fontFamily: DISPLAY, fontSize: "18px", fontWeight: 800, color: navy, margin: 0 }}>{tr("How revisions work")}</h2>
      </div>
      <p style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.65, margin: "0 0 14px" }}>
        {tr("The website never edits content directly — everything you read here is generated from the manuscript. When a correction is accepted, the revision flow is:")}
      </p>
      <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {REVISION_STEPS.map((s, i) => (
          <li key={i} style={{ fontFamily: BODY, fontSize: "14px", color: body, lineHeight: 1.6 }}>
            {s.text}
            {s.cmd && (
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "5px", background: c("#f0ece0", "#0d1118"), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "6px 10px" }}>
                <Terminal size={11} color={muted} style={{ flexShrink: 0 }} />
                <code style={{ fontFamily: MONO, fontSize: "11px", color: green }}>{s.cmd}</code>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
