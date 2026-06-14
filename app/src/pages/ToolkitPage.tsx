import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, RADIUS, UI } from "../theme";
import { Kicker, PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";
import { NavIcon } from "../components/GoblinMascot";

// Source categories + leans — verbatim from the guide's bias-mapping method
// (Chapter 1, "How to read this manual").
const SOURCES: { name: string; lean: string }[] = [
  { name: "Government framing", lean: "Press releases, ministerial speeches, strategic announcements. Leans toward justifying current policy." },
  { name: "Government operational", lean: "Technical guides, registers, statistical reports. Generally lower lean — but watch the scope and the definitions." },
  { name: "Government leaked / draft", lean: "Working documents not meant for release. Useful as evidence of internal disagreement; leans according to who leaked it and why." },
  { name: "Civil society / advocacy", lean: "Unions, Indigenous organizations, public-interest non-profits. Leans toward the constituency the organization represents." },
  { name: "Academic peer-reviewed", lean: "Journal articles, conference proceedings. Leans toward what the field counts as rigour — which is itself a position." },
  { name: "Industry / corporate self-disclosure", lean: "Sustainability reports, technical blog posts, voluntary transparency. Leans toward the company's interests, even when technically honest." },
  { name: "Industry / commissioned research", lean: "Economic-impact reports, market projections. Leans toward the commissioning client, packaged as third-party analysis." },
  { name: "Mainstream press critique", lean: "Investigative journalism, opinion analysis. Leans toward the outlet's editorial position." },
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

  const toggleScope = (k: string) =>
    setScope((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const ready = source !== null || receipt !== null;
  const r = receipt !== null ? RECEIPTS[receipt] : null;

  return (
    <StaticPageShell padding="36px clamp(16px, 5vw, 54px) 72px">
      <PageHeading
        eyebrow="Data Goblin · The Portable Toolkit"
        title="Test Any AI Claim"
        icon={<NavIcon name="check-nav" size={52} />}
        eyebrowSize="10px"
        eyebrowLetterSpacing="0.26em"
        titleSize="clamp(34px, 5vw, 54px)"
        titleLineHeight={1}
        description="This is the method the whole guide runs on, in one place. Drop in any claim you've read about AI — a headline, a government line, a corporate stat — and work it through the goblin's four questions. Nothing is sent anywhere; this all stays in your browser."
        descriptionSize="17px"
        descriptionLineHeight={1.7}
        descriptionMaxWidth="780px"
      />

      {/* Step 1 — the claim */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">1 · The claim</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 10px" }}>
          Paste or type the claim you want to test. (Optional — you can also just think one through.)
        </p>
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="&ldquo;Canada's new AI strategy will protect creators&rsquo; rights&hellip;&rdquo;"
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
        <Kicker color={green} letterSpacing="0.18em">2 · Who's making it?</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          Every source has a lean. The lean is not corruption — it's how institutions work. The trap is absorbing a
          leaning source as if it were neutral. Pick the closest category:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
          {SOURCES.map((s, i) => {
            const on = source === i;
            return (
              <button
                key={s.name}
                onClick={() => setSource(on ? null : i)}
                aria-pressed={on}
                style={{
                  textAlign: "left", cursor: "pointer", borderRadius: RADIUS,
                  border: `1px solid ${on ? green : border}`,
                  background: on ? c(...P.greenBg) : c(...P.cardBg),
                  padding: "10px 12px",
                }}
              >
                <span style={{ display: "block", fontFamily: UI, fontSize: "13.5px", fontWeight: 800, color: on ? green : navy, marginBottom: on ? "5px" : 0 }}>
                  {s.name}
                </span>
                {on && (
                  <span style={{ display: "block", fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.5 }}>
                    {s.lean}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </StaticCard>

      {/* Step 3 — scope */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">3 · What's the scope?</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          Most AI arguments hide inside a slippery scope. Tap any that this claim might be sliding past:
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
                  {on ? "☑ " : "☐ "}{s.label}
                </span>
                <span style={{ display: "block", fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.5 }}>
                  {s.hint}
                </span>
              </button>
            );
          })}
        </div>
      </StaticCard>

      {/* Step 4 — receipt */}
      <StaticCard padding="20px 22px" marginBottom="12px">
        <Kicker color={green} letterSpacing="0.18em">4 · Where's the receipt?</Kicker>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          A claim is only as strong as how far it actually travels. How far does the evidence behind this one go?
        </p>
        <div style={{ display: "grid", gap: "6px" }}>
          {RECEIPTS.map((rc, i) => {
            const on = receipt === i;
            const tone = rc.ok ? green : c(...P.red);
            return (
              <button
                key={rc.label}
                onClick={() => setReceipt(on ? null : i)}
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
                  <span style={{ fontFamily: UI, fontSize: "13.5px", fontWeight: 800, color: navy }}>{rc.label}</span>
                  <span style={{ fontFamily: BODY, fontSize: "13px", color: body, lineHeight: 1.5, display: "block" }}>{rc.gloss}</span>
                </span>
              </button>
            );
          })}
        </div>
      </StaticCard>

      {/* The honest reading */}
      {ready && (
        <StaticCard padding="20px 22px" background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`} style={{ marginTop: "18px" }}>
          <Kicker color={green} letterSpacing="0.18em">Your honest reading</Kicker>
          {claim.trim() && (
            <p style={{ fontFamily: BODY, fontStyle: "italic", fontSize: "15px", color: body, lineHeight: 1.6, margin: "2px 0 12px" }}>
              &ldquo;{claim.trim()}&rdquo;
            </p>
          )}
          <p style={{ fontFamily: BODY, fontSize: "15.5px", color: body, lineHeight: 1.7, margin: 0 }}>
            {source !== null && (
              <>This reads as <strong style={{ color: navy }}>{SOURCES[source].name.toLowerCase()}</strong>, so the lean to watch is built in — weigh it, don't dismiss it. </>
            )}
            {r && (
              r.ok
                ? <>On the evidence, you&rsquo;ve marked it <strong style={{ color: green }}>independently verified</strong> — the receipt holds, and that&rsquo;s the rare strong case. </>
                : <>On the evidence, it&rsquo;s only <strong style={{ color: c(...P.red) }}>{r.label.toLowerCase()}</strong> — so treat the strength of the wording with matching caution. </>
            )}
            {scope.size > 0 && (
              <>Watch the scope, too: {[...scope].map((k) => SCOPE.find((s) => s.key === k)!.label.toLowerCase()).join(", ")}. </>
            )}
          </p>
          <p style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.7, margin: "12px 0 0" }}>
            Before you repeat it, ask the goblin&rsquo;s three: <strong style={{ color: navy }}>who counted it</strong>, <strong style={{ color: navy }}>what got left out of the scope</strong>, and <strong style={{ color: navy }}>can you see the receipt</strong>? Discounting a source for its lean is as wrong as accepting it as neutral. Hold a contested claim as contested.
          </p>
          <div style={{ marginTop: "14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link to="/receipts" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>See the guide&rsquo;s receipts →</Link>
            <Link to="/loot" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>Look up a term →</Link>
          </div>
        </StaticCard>
      )}

      <StaticCard marginBottom="0" padding="16px 20px" style={{ marginTop: "12px" }}>
        <p style={{ fontFamily: BODY, fontSize: "14px", color: muted, lineHeight: 1.7, margin: 0 }}>
          This toolkit is the short version of the method the guide builds across nineteen chapters. For the long
          version — and the worked examples — start with{" "}
          <Link to="/chapter/1" style={{ fontWeight: 800, color: navy }}>Chapter 1</Link>{" "}
          or jump to{" "}
          <Link to="/chapter/19" style={{ fontWeight: 800, color: navy }}>Chapter 19</Link>, where it all comes together.
        </p>
      </StaticCard>
    </StaticPageShell>
  );
}
