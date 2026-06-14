import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, HAND, MONO, P, UI } from "../theme";
import { Markdown } from "../components/Markdown";
import { artAspectRatio, artDimensions, artSrcSet, artUrl, useBook } from "../useContent";
import { Kicker, LoadingMessage, StaticCard, StaticPageShell } from "../components/StaticPage";
import { tr } from "../i18n";

const ABOUT_ART = "panels/hero-panel.webp";

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
  const { c, dark } = useTheme();
  const { data: book } = useBook();

  const cardBg = c(...P.cardBg);
  const border = c(...P.borderSoft);
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const red = c(...P.red);
  const aboutDimensions = artDimensions(ABOUT_ART);

  const whyGoblin = book ? extractParagraph(book.frontmatterMarkdown, 'Why "Data Goblin"?') : null;
  const noteOnTime = book ? extractParagraph(book.frontmatterMarkdown, "A note on time") : null;

  return (
    <StaticPageShell maxWidth="1120px">
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "32px", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ background: c(...P.pageBg), border: `1px solid ${border}`, borderRadius: "6px", padding: "18px", boxShadow: c("0 12px 32px rgba(60,50,30,0.16)", "0 12px 32px rgba(0,0,0,0.4)") }}>
            <img
              src={artUrl(ABOUT_ART)}
              srcSet={artSrcSet(ABOUT_ART)}
              sizes="(max-width: 760px) 92vw, 520px"
              width={aboutDimensions?.width}
              height={aboutDimensions?.height}
              alt={tr("Data Goblin hero art for the field guide")}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{
                display: "block",
                width: "100%",
                aspectRatio: artAspectRatio(ABOUT_ART),
                maxHeight: "440px",
                objectFit: "contain",
                mixBlendMode: dark ? "normal" : "multiply",
                opacity: dark ? 0.92 : 1,
              }}
            />
          </div>
          <div style={{ minWidth: "260px", flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: "9px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: red, marginBottom: "8px" }}>
              {tr("About This Guide")}
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: "34px", fontWeight: 900, color: navy, margin: "0 0 6px", lineHeight: 1.05, textTransform: "uppercase" }}>
              {book?.title ?? "Data Goblin"}
            </h1>
            <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: "16.5px", color: body, marginBottom: "14px" }}>
              {book?.subtitle ?? "A Field Guide to AI, Power, and Data in Canada"}
            </div>
            <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.7, margin: 0 }}>
              {tr("A working manual on artificial intelligence, data centres, and digital sovereignty, written for Canadians who want to participate in the conversation but were never given the manual. It is not a textbook. It is not a press release. It is not neutral. It is a working document — meant to be read, returned to, argued with, and used.")}
            </p>
          </div>
        </div>

        {/* Why "Data Goblin"? — straight from the manuscript frontmatter */}
        <StaticCard background={cardBg} borderColor={border} padding="20px 24px" marginBottom="16px">
          <Kicker color={muted} fontSize="8.5px" letterSpacing="0.2em" marginBottom="10px">
            {tr("From the manuscript — Why “Data Goblin”?")}
          </Kicker>
          {whyGoblin ? (
            <Markdown markdown={whyGoblin} />
          ) : (
            <LoadingMessage fontSize="13px" margin={0}>{tr("Loading…")}</LoadingMessage>
          )}
          <div style={{ marginTop: "10px", fontFamily: HAND, fontSize: "17px", color: c("#7a6040", "#8a7850"), fontStyle: "italic" }}>
            {tr("“It collects receipts, not grudges.”")}
          </div>
        </StaticCard>

        {/* A note on time — straight from the manuscript frontmatter */}
        <StaticCard background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`} padding="18px 22px" marginBottom="26px">
          <Kicker color={green} fontSize="8.5px" letterSpacing="0.2em" marginBottom="10px">
            {tr("From the manuscript — A note on time")}{book ? ` (as of ${book.asOf})` : ""}
          </Kicker>
          {noteOnTime ? (
            <Markdown markdown={noteOnTime} />
          ) : (
            <LoadingMessage fontSize="13px" margin={0}>{tr("Loading…")}</LoadingMessage>
          )}
        </StaticCard>

        {/* Principles */}
        <Kicker color={muted} fontSize="8.5px" letterSpacing="0.2em" marginBottom="12px">{tr("Guiding Principles")}</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
          {PRINCIPLES.map((p, i) => (
            <StaticCard key={i} background={cardBg} borderColor={border} padding="14px 16px">
              <div style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: navy, marginBottom: "6px" }}>{p.title}</div>
              <p style={{ fontFamily: BODY, fontSize: "13.5px", color: body, lineHeight: 1.6, margin: 0 }}>{p.body}</p>
            </StaticCard>
          ))}
        </div>
    </StaticPageShell>
  );
}
