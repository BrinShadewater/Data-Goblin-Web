import { useEffect, useRef, useState } from "react";
import { useTheme } from "../ThemeContext";
import { BODY, DISPLAY, HAND, MONO, P, UI } from "../theme";
import { Markdown } from "../components/Markdown";
import { artAspectRatio, artDimensions, artSrcSet, artUrl, useBook } from "../useContent";
import { Kicker, LoadingMessage, StaticCard, StaticPageShell } from "../components/StaticPage";
import { NavIcon } from "../components/GoblinMascot";
import { tr } from "../i18n";
import { CONTACT_EMAIL } from "../contribute";

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

const BOOK_STATS = [
  { n: "20", label: "chapters", icon: "book-nav" },
  { n: "123k", label: "words", icon: "note-nav" },
  { n: "47", label: "charts & figures", icon: "growth-nav" },
  { n: "60", label: "tracked receipts", icon: "journal-nav" },
  { n: "161", label: "linked sources", icon: "portal-nav" },
  { n: "45", label: "glossary terms", icon: "chest-nav" },
];

const DEVICE_STATS = [
  { n: "26", label: "Goblin Checks", icon: "check-nav" },
  { n: "20", label: "Goblin Traps", icon: "trap-nav" },
  { n: "20", label: "Goblin Facts", icon: "data-nav" },
  { n: "20", label: "Alignments", icon: "trailmarker-nav" },
  { n: "20", label: "Examples", icon: "examples-nav" },
];

/** A number that ticks up from 0 to its target the first time it scrolls into view. */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(/^([\d.]+)(.*)$/);
  const target = m ? parseFloat(m[1]) : 0;
  const suffix = m ? m[2] : value;
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(target); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !done.current) {
        done.current = true;
        const dur = 2600;
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          setN(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
          else setN(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return <span ref={ref}>{Math.round(n)}{suffix}</span>;
}

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

        {/* By the numbers */}
        <Kicker color={muted} fontSize="8.5px" letterSpacing="0.2em" marginBottom="12px">{tr("By The Numbers")}</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          {BOOK_STATS.map((s, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "16px 14px", textAlign: "center" }}>
              <div style={{ marginBottom: "8px" }}><NavIcon name={s.icon} size={30} /></div>
              <div style={{ fontFamily: DISPLAY, fontSize: "30px", fontWeight: 900, color: green, lineHeight: 1 }}><CountUp value={s.n} /></div>
              <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginTop: "8px" }}>{tr(s.label)}</div>
            </div>
          ))}
        </div>
        <Kicker color={green} fontSize="8.5px" letterSpacing="0.2em" marginBottom="12px">{tr("Goblin Devices")}</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "26px" }}>
          {DEVICE_STATS.map((s, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "16px 14px", textAlign: "center" }}>
              <div style={{ marginBottom: "8px" }}><NavIcon name={s.icon} size={30} /></div>
              <div style={{ fontFamily: DISPLAY, fontSize: "30px", fontWeight: 900, color: green, lineHeight: 1 }}><CountUp value={s.n} /></div>
              <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginTop: "8px" }}>{tr(s.label)}</div>
            </div>
          ))}
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
              <div style={{ fontFamily: UI, fontSize: "12px", fontWeight: 700, color: navy, marginBottom: "6px" }}>{tr(p.title)}</div>
              <p style={{ fontFamily: BODY, fontSize: "13.5px", color: body, lineHeight: 1.6, margin: 0 }}>{tr(p.body)}</p>
            </StaticCard>
          ))}
        </div>

        {/* Contact */}
        <StaticCard padding="18px 22px" marginBottom="0" style={{ marginTop: "16px" }}>
          <Kicker color={muted} fontSize="8.5px" letterSpacing="0.2em" marginBottom="8px">{tr("Get in touch")}</Kicker>
          <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.6, margin: 0 }}>
            {tr("Questions, corrections, or sources to share? Write to")}{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: navy, fontWeight: 700, textDecoration: "none" }}>{CONTACT_EMAIL}</a>
            {tr(", or use the Contribute page.")}
          </p>
        </StaticCard>

        {/* Licence & reuse */}
        <StaticCard padding="18px 22px" marginBottom="0" style={{ marginTop: "16px" }}>
          <Kicker color={muted} fontSize="8.5px" letterSpacing="0.2em" marginBottom="8px">{tr("Licence & reuse")}</Kicker>
          <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.6, margin: 0 }}>
            {tr("The text of this guide is licensed CC BY-NC 4.0 — you're free to share and adapt it for non-commercial purposes, with attribution to Data Goblin / Brin Shadewater and a link back. The AI-generated illustrations carry no asserted copyright (see the in-book note on the illustrations and marks). Third-party quotations, data, and figures remain the property of their original owners and are used here under fair dealing with attribution. For commercial use, ask first.")}
          </p>
        </StaticCard>
    </StaticPageShell>
  );
}
