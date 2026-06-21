import { useState } from "react";
import { Link } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, UI } from "../theme";
import { Kicker, PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";
import { NavIcon } from "../components/GoblinMascot";
import { tr } from "../i18n";

// Source categories + leans — verbatim from the guide's bias-mapping method
// (Chapter 1, "How to read this manual"). The `tell` is the everyday signal a
// reader can use to spot the category in the wild.
const SOURCES: { name: string; lean: string; tell: string }[] = [
  { name: "Government framing", lean: "Press releases, ministerial speeches, strategic announcements. Leans toward justifying current policy.", tell: "Tell: launch events, strategy names, “we're proud to announce.”" },
  { name: "Government operational", lean: "Technical guides, registers, statistical reports. Generally lower lean, though watch the scope and the definitions.", tell: "Tell: registers, statistical tables, technical directives." },
  { name: "Government leaked / draft", lean: "Working documents not meant for release. Useful as evidence of internal disagreement; leans according to who leaked it and why.", tell: "Tell: “obtained by,” marked draft or confidential, an internal memo." },
  { name: "Civil society / advocacy", lean: "Unions, Indigenous organizations, public-interest non-profits. Leans toward the constituency the organization represents.", tell: "Tell: a union, an Indigenous organization, or a non-profit speaking for a group." },
  { name: "Academic peer-reviewed", lean: "Journal articles, conference proceedings. Leans toward what the field counts as rigour — which is itself a position.", tell: "Tell: a journal or conference citation, a methods section, named authors." },
  { name: "Industry / corporate self-disclosure", lean: "Sustainability reports, technical blog posts, voluntary transparency. Leans toward the company's interests, even when technically honest.", tell: "Tell: a sustainability report, a company blog, “our commitment to.”" },
  { name: "Industry / commissioned research", lean: "Economic-impact reports, market projections. Leans toward the commissioning client, packaged as third-party analysis.", tell: "Tell: “study commissioned by,” a consultancy logo, a market projection." },
  { name: "Mainstream press critique", lean: "Investigative journalism, opinion analysis. Leans toward the outlet's editorial position.", tell: "Tell: a bylined article, an investigation, an op-ed." },
];

// The guide's recurring scope distinctions.
const SCOPE: { key: string; label: string; hint: string }[] = [
  { key: "ti", label: "Training vs. inference", hint: "Is this about the one-time cost of building the model, or the per-use cost of running it? The two get conflated constantly." },
  { key: "di", label: "Direct vs. indirect effects", hint: "A per-query number can fall while the total footprint rises (Jevons' paradox). Which scale is the claim using?" },
  { key: "sv", label: "Which sovereignty?", hint: "National, personal, or Indigenous data sovereignty? A 'sovereign cloud' answers the first and does nothing for the other two." },
];

// The accountability spectrum — how far a commitment actually travels.
const RECEIPTS: { label: string; gloss: string; ok: boolean }[] = [
  { label: "Not mentioned", gloss: "The claim asserts something the source never actually addresses.", ok: false },
  { label: "Mentioned but not operationalized", gloss: "Named in principle, with no mechanism that makes it happen.", ok: false },
  { label: "Promised but not funded", gloss: "A commitment with no money attached to deliver it.", ok: false },
  { label: "Funded but not regulated", gloss: "Money exists, but nothing binds how it's used.", ok: false },
  { label: "Regulated but not enforceable", gloss: "A rule exists, but nothing happens if it's broken.", ok: false },
  { label: "Claimed but not independently verified", gloss: "Asserted by an interested party; no outside check.", ok: false },
  { label: "Independently verified", gloss: "Confirmed by a source without a stake in the answer. The receipt holds.", ok: true },
];

// Worked examples — tap one to watch the method run on a real Canadian claim.
const EXAMPLES: { short: string; claim: string; source: number; scope: string[]; receipt: number; note: string }[] = [
  {
    short: "“Sovereign AI”",
    claim: "Canada's sovereign AI compute will keep Canadians' data under Canadian control.",
    source: 0,
    scope: ["sv"],
    receipt: 1,
    note: "“Sovereign” is doing branding work here. At best it answers national sovereignty and says nothing about personal or Indigenous data sovereignty — and a launch line isn't a binding rule about where data actually lives or who can compel access to it.",
  },
  {
    short: "“10× a search”",
    claim: "A ChatGPT query uses ten times the energy of a Google search.",
    source: 7,
    scope: ["ti", "di"],
    receipt: 5,
    note: "Watch the scope: is that the one-time training cost or the per-query inference cost? And a per-query number can drop while the total footprint climbs (Jevons'). The famous figure traces to an estimate, not an audited measurement.",
  },
  {
    short: "“Bias-tested AI”",
    claim: "Our AI hiring tool is fair — we tested it for bias.",
    source: 5,
    scope: [],
    receipt: 5,
    note: "“Tested” by whom? This is the company grading its own homework. Bias here is structural, not just a statistic you can benchmark away — and there's no outside check on the test.",
  },
  {
    short: "“Protects creators”",
    claim: "The new AI strategy protects Canadian creators' rights.",
    source: 0,
    scope: [],
    receipt: 1,
    note: "A strategy can name creators' rights without creating any enforceable mechanism. The underlying copyright contest (the OpenAI suit, text-and-data-mining) is still unsettled in court — so “protects” is a promise, not a settled fact.",
  },
];

export function ToolkitPage() {
  const { c } = useTheme();
  const body = c(...P.body);
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const border = c(...P.borderSoft);

  const [claim, setClaim] = useState("");
  const [source, setSource] = useState<number | null>(null);
  const [scope, setScope] = useState<Set<string>>(new Set());
  const [receipt, setReceipt] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const applyExample = (ex: (typeof EXAMPLES)[number]) => {
    setClaim(ex.claim);
    setSource(ex.source);
    setScope(new Set(ex.scope));
    setReceipt(ex.receipt);
    setNote(ex.note);
    setCopied(false);
  };

  const onClaim = (v: string) => { setClaim(v); setNote(null); setCopied(false); };
  const pickSource = (i: number) => { setSource((s) => (s === i ? null : i)); setNote(null); setCopied(false); };
  const pickReceipt = (i: number) => { setReceipt((rr) => (rr === i ? null : i)); setNote(null); setCopied(false); };
  const toggleScope = (k: string) => {
    setScope((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
    setNote(null);
    setCopied(false);
  };

  const ready = source !== null || receipt !== null || scope.size > 0;
  const r = receipt !== null ? RECEIPTS[receipt] : null;

  // Contextual routing: send the reader to the chapter that goes deeper on
  // whatever they just flagged. Most-specific signal first, deduped, capped.
  const deeperLinks = (): { to: string; label: string }[] => {
    const out: { to: string; label: string }[] = [];
    const add = (to: string, label: string) => {
      if (!out.some((l) => l.to === to)) out.push({ to, label });
    };
    if (scope.has("sv")) add("/chapter/9", tr("Chapter 9 · Sovereignty"));
    if (scope.has("ti") || scope.has("di")) add("/chapter/8", tr("Chapter 8 · Environment"));
    if (source === 0 || source === 1 || source === 2) add("/chapter/5", tr("Chapter 5 · Canada's AI story"));
    if (source === 5 || source === 6) add("/chapter/18", tr("Chapter 18 · Transparency"));
    if (source === 7) add("/chapter/14", tr("Chapter 14 · The News"));
    if (source === 3 || source === 4) add("/chapter/1", tr("Chapter 1 · Reading a source"));
    if (receipt !== null && receipt >= 2 && receipt <= 4) add("/chapter/20", tr("Chapter 20 · What Canada could do"));
    if (receipt === 5) add("/chapter/18", tr("Chapter 18 · Transparency"));
    if (out.length === 0) add("/chapter/19", tr("Chapter 19 · The full toolkit"));
    return out.slice(0, 3);
  };

  const copyReading = () => {
    const lines: string[] = [];
    lines.push(tr("Data Goblin — claim test"));
    if (claim.trim()) lines.push(`${tr("Claim:")} "${claim.trim()}"`);
    if (source !== null) lines.push(`${tr("Source:")} ${tr(SOURCES[source].name)}`);
    if (scope.size > 0) lines.push(`${tr("Scope to watch:")} ${[...scope].map((k) => tr(SCOPE.find((s) => s.key === k)!.label)).join("; ")}`);
    if (r) lines.push(`${tr("Receipt:")} ${tr(r.label)}`);
    lines.push("");
    lines.push(tr("The goblin's three: who counted it, what got left out of the scope, and can you see the receipt?"));
    const text = lines.join("\n");
    try {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <StaticPageShell padding="36px clamp(16px, 5vw, 54px) 72px">
      <PageHeading
        eyebrow={tr("Data Goblin · The Portable Toolkit")}
        title={tr("Test Any AI Claim")}
        icon={<NavIcon name="check-nav" size={52} />}
        eyebrowSize="10px"
        eyebrowLetterSpacing="0.26em"
        titleSize="clamp(34px, 5vw, 54px)"
        titleLineHeight={1}
        description={tr("This is the method the whole guide runs on, in one place. Take any claim you've read about AI — a headline, a government line, a corporate stat — and work it through the goblin's three questions: who's making it, what's the scope, and where's the receipt. New to it? Tap a worked example below and watch the method run. Nothing is sent anywhere — this all stays in your browser.")}
        descriptionSize="17px"
        descriptionLineHeight={1.7}
        descriptionMaxWidth="820px"
      />

      {/* Worked examples */}
      <StaticCard padding="16px 20px" marginBottom="14px" background={c(...P.navyBg)} borderColor={c(...P.borderSoft)}>
        <Kicker color={navy} letterSpacing="0.18em">{tr("Start with a worked example")}</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          {tr("Tap one to load a real Canadian claim with the goblin's reading already filled in. Then edit the steps and make it your own.")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.short}
              onClick={() => applyExample(ex)}
              style={{
                cursor: "pointer", borderRadius: RADIUS, border: `1px solid ${border}`,
                background: c(...P.cardBg), padding: "8px 13px",
                fontFamily: UI, fontSize: "13.5px", fontWeight: 800, color: navy,
              }}
            >
              {tr(ex.short)}
            </button>
          ))}
        </div>
      </StaticCard>

      {/* Step 1 — the claim */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">{tr("1 · The claim")}</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 10px" }}>
          {tr("Paste or type the claim you want to test. (Optional: you can also just think one through.)")}
        </p>
        <textarea
          value={claim}
          onChange={(e) => onClaim(e.target.value)}
          placeholder={tr("“Canada's new AI strategy will protect creators’ rights…”")}
          rows={2}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical",
            fontFamily: BODY, fontSize: "15px", lineHeight: 1.55, color: body,
            background: c(...P.inputBg), border: `1px solid ${border}`, borderRadius: RADIUS, padding: "10px 12px",
          }}
        />
      </StaticCard>

      {/* Step 2 — who's making it */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">{tr("2 · Who's making it?")}</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          {tr("Every source has a lean. The lean is not corruption — it's how institutions work. The trap is absorbing a leaning source as if it were neutral. Pick the closest category:")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
          {SOURCES.map((s, i) => {
            const on = source === i;
            return (
              <button
                key={s.name}
                onClick={() => pickSource(i)}
                aria-pressed={on}
                style={{
                  textAlign: "left", cursor: "pointer", borderRadius: RADIUS,
                  border: `1px solid ${on ? green : border}`,
                  background: on ? c(...P.greenBg) : c(...P.cardBg),
                  padding: "10px 12px",
                }}
              >
                <span style={{ display: "block", fontFamily: UI, fontSize: "13.5px", fontWeight: 800, color: on ? green : navy, marginBottom: on ? "5px" : 0 }}>
                  {tr(s.name)}
                </span>
                {on && (
                  <>
                    <span style={{ display: "block", fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.5 }}>
                      {tr(s.lean)}
                    </span>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: "11px", color: muted, lineHeight: 1.5, marginTop: "5px" }}>
                      {tr(s.tell)}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </StaticCard>

      {/* Step 3 — scope */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">{tr("3 · What's the scope?")}</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          {tr("Most AI arguments hide inside a slippery scope. Tap any that this claim might be sliding past:")}
        </p>
        <div style={{ display: "grid", gap: "8px" }}>
          {SCOPE.map((s) => {
            const on = scope.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleScope(s.key)}
                aria-pressed={on}
                style={{
                  textAlign: "left", cursor: "pointer", borderRadius: RADIUS,
                  border: `1px solid ${on ? navy : border}`,
                  background: on ? c(...P.navyBg) : c(...P.cardBg),
                  padding: "10px 12px",
                }}
              >
                <span style={{ display: "block", fontFamily: UI, fontSize: "13.5px", fontWeight: 800, color: navy, marginBottom: "3px" }}>
                  {on ? "☑ " : "☐ "}{tr(s.label)}
                </span>
                <span style={{ display: "block", fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.5 }}>
                  {tr(s.hint)}
                </span>
              </button>
            );
          })}
        </div>
      </StaticCard>

      {/* Step 4 — receipt */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">{tr("4 · Where's the receipt?")}</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          {tr("A claim is only as strong as how far it actually travels. How far does the evidence behind this one go?")}
        </p>
        <div style={{ display: "grid", gap: "6px" }}>
          {RECEIPTS.map((rc, i) => {
            const on = receipt === i;
            const tone = rc.ok ? green : c(...P.red);
            return (
              <button
                key={rc.label}
                onClick={() => pickReceipt(i)}
                aria-pressed={on}
                style={{
                  textAlign: "left", cursor: "pointer", borderRadius: RADIUS,
                  border: `1px solid ${on ? tone : border}`,
                  background: on ? (rc.ok ? c(...P.greenBg) : c(...P.amberBg)) : c(...P.cardBg),
                  padding: "9px 12px", display: "flex", gap: "10px", alignItems: "baseline",
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 800, color: tone, flexShrink: 0 }}>
                  {rc.ok ? "✓" : "○"}
                </span>
                <span>
                  <span style={{ fontFamily: UI, fontSize: "13.5px", fontWeight: 800, color: navy }}>{tr(rc.label)}</span>
                  <span style={{ fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.5, display: "block" }}>{tr(rc.gloss)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </StaticCard>

      {/* The honest reading */}
      {ready && (
        <StaticCard padding="20px 22px" background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`} style={{ marginTop: "18px" }}>
          <Kicker color={green} letterSpacing="0.18em">{tr("Your honest reading")}</Kicker>
          {claim.trim() && (
            <p style={{ fontFamily: BODY, fontStyle: "italic", fontSize: "15px", color: body, lineHeight: 1.6, margin: "2px 0 12px" }}>
              &ldquo;{claim.trim()}&rdquo;
            </p>
          )}
          {note && (
            <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.7, margin: "0 0 12px", paddingLeft: "12px", borderLeft: `3px solid ${navy}` }}>
              <strong style={{ color: navy }}>{tr("The goblin's take:")}</strong> {tr(note)}
            </p>
          )}
          <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.7, margin: 0 }}>
            {source !== null && (
              <>{tr("This reads as")} <strong style={{ color: navy }}>{tr(SOURCES[source].name).toLowerCase()}</strong>{tr(", so the lean to watch is built in. Weigh it, don't dismiss it.")} </>
            )}
            {r && (
              r.ok
                ? <>{tr("On the evidence, you’ve marked it")} <strong style={{ color: green }}>{tr("independently verified")}</strong> {tr("— the receipt holds, and that’s the rare strong case.")} </>
                : <>{tr("On the evidence, it’s only")} <strong style={{ color: c(...P.red) }}>{tr(r.label).toLowerCase()}</strong> {tr("— so treat the strength of the wording with matching caution.")} </>
            )}
            {scope.size > 0 && (
              <>{tr("Watch the scope, too:")} {[...scope].map((k) => tr(SCOPE.find((s) => s.key === k)!.label).toLowerCase()).join(", ")}. </>
            )}
          </p>
          <p style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.7, margin: "12px 0 0" }}>
            {tr("Before you repeat it, ask the goblin’s three:")} <strong style={{ color: navy }}>{tr("who counted it")}</strong>, <strong style={{ color: navy }}>{tr("what got left out of the scope")}</strong>{tr(", and")} <strong style={{ color: navy }}>{tr("can you see the receipt")}</strong>{tr("? Discounting a source for its lean is as wrong as accepting it as neutral. Hold a contested claim as contested.")}
          </p>

          {/* Deeper + copy */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px solid ${c(...P.greenBorder)}` }}>
            <div style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: muted, marginBottom: "8px" }}>
              {tr("Where the guide goes deeper on this")}
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              {deeperLinks().map((l) => (
                <Link key={l.to} to={l.to} style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>{l.label} →</Link>
              ))}
              <button
                onClick={copyReading}
                style={{
                  cursor: "pointer", borderRadius: RADIUS, border: `1px solid ${navy}`,
                  background: "transparent", padding: "6px 13px", marginLeft: "auto",
                  fontFamily: UI, fontSize: "13px", fontWeight: 800, color: navy,
                }}
              >
                {copied ? tr("Copied ✓") : tr("Copy this reading")}
              </button>
            </div>
          </div>
        </StaticCard>
      )}

      <StaticCard marginBottom="0" padding="16px 20px" style={{ marginTop: "12px" }}>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.7, margin: 0 }}>
          {tr("This page is the short version of the method the guide builds across twenty-one chapters. For the long version with worked examples, see")}{" "}
          <Link to="/chapter/19" style={{ fontWeight: 800, color: navy }}>{tr("Chapter 19 · Frameworks for Deciding")}</Link>{tr(", and for where it all comes together,")}{" "}
          <Link to="/chapter/21" style={{ fontWeight: 800, color: navy }}>{tr("Chapter 21 · Navigating the Conversation")}</Link>{tr(".")}
        </p>
      </StaticCard>
    </StaticPageShell>
  );
}
