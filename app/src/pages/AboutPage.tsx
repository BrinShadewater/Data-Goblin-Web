import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, HAND, MONO, P, RADIUS, UI } from "../theme";
import { GoblinMascot } from "../components/GoblinMascot";
import { Markdown } from "../components/Markdown";
import { useBook } from "../useContent";

/** Pull the paragraph containing `marker` out of a markdown document. */
function extractParagraph(md: string, marker: string): string | null {
  const i = md.toLowerCase().indexOf(marker.toLowerCase());
  if (i < 0) return null;
  const start = md.lastIndexOf("\n\n", i);
  const end = md.indexOf("\n\n", i);
  return md.slice(start < 0 ? 0 : start + 2, end < 0 ? md.length : end).trim();
}

const PRINCIPLES = [
  { title: "Plain language, always", body: "Every concept is explained in terms anyone can understand. No technical or policy background required — just curiosity." },
  { title: "Show the receipts", body: "Every load-bearing claim is tracked in the Receipts ledger. You should be able to verify anything in this guide." },
  { title: "Name the power", body: "AI is not neutral technology. It is built, owned, and deployed by specific interests. This guide names them." },
  { title: "Canada-specific perspective", body: "The guide reads AI through Canadian law, policy, infrastructure, and history — and engages Indigenous-led data frameworks like OCAP." },
  { title: "Calibrated suspicion is healthy", body: "The Suspicion Meter isn't cynicism — it's calibrated scepticism. The goblin collects receipts, not grudges." },
];

export function AboutPage() {
  const { c } = useTheme();
  const { data: book } = useBook();

  const bg = c(...P.panelBg);
  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);

  const whyGoblin = book ? extractParagraph(book.frontmatterMarkdown, 'Why "Data Goblin"?') : null;
  const noteOnTime = book ? extractParagraph(book.frontmatterMarkdown, "A note on time") : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, padding: "32px clamp(16px, 5vw, 40px) 64px", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", gap: "28px", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0, paddingTop: "4px" }}>
            <GoblinMascot size={150} />
          </div>
          <div style={{ minWidth: "260px", flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
              About This Guide
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: "34px", fontWeight: 900, color: navy, margin: "0 0 6px", lineHeight: 1.05, textTransform: "uppercase" }}>
              {book?.title ?? "Data Goblin"}
            </h1>
            <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: "16.5px", color: body, marginBottom: "14px" }}>
              {book?.subtitle ?? "A Field Guide to AI, Power, and Data in Canada"}
            </div>
            <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.7, margin: 0 }}>
              A working manual on artificial intelligence, data centres, and digital sovereignty, written for
              Canadians who want to participate in the conversation but were never given the manual. It is not a
              textbook. It is not a press release. It is not neutral. It is a working document — meant to be read,
              returned to, argued with, and used.
            </p>
          </div>
        </div>

        {/* Why "Data Goblin"? — straight from the manuscript frontmatter */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "20px 24px", marginBottom: "16px", transition: "background 0.3s" }}>
          <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>
            From the manuscript — Why &ldquo;Data Goblin&rdquo;?
          </div>
          {whyGoblin ? (
            <Markdown markdown={whyGoblin} />
          ) : (
            <p style={{ fontFamily: BODY, fontSize: "13px", fontStyle: "italic", color: muted, margin: 0 }}>Loading…</p>
          )}
          <div style={{ marginTop: "10px", fontFamily: HAND, fontSize: "17px", color: c("#7a6040", "#8a7850"), fontStyle: "italic" }}>
            &ldquo;It collects receipts, not grudges.&rdquo;
          </div>
        </div>

        {/* A note on time — straight from the manuscript frontmatter */}
        <div style={{ background: c(...P.greenBg), border: `1px solid ${c(...P.greenBorder)}`, borderLeft: `4px solid ${green}`, borderRadius: RADIUS, padding: "18px 22px", marginBottom: "26px" }}>
          <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: green, marginBottom: "10px" }}>
            From the manuscript — A note on time{book ? ` (as of ${book.asOf})` : ""}
          </div>
          {noteOnTime ? (
            <Markdown markdown={noteOnTime} />
          ) : (
            <p style={{ fontFamily: BODY, fontSize: "13px", fontStyle: "italic", color: muted, margin: 0 }}>Loading…</p>
          )}
        </div>

        {/* Principles */}
        <div style={{ fontFamily: MONO, fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "12px" }}>
          Guiding Principles
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
          {PRINCIPLES.map((p, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: RADIUS, padding: "14px 16px", transition: "background 0.3s" }}>
              <div style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: navy, marginBottom: "6px" }}>{p.title}</div>
              <p style={{ fontFamily: BODY, fontSize: "13.5px", color: body, lineHeight: 1.6, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
