import { Link } from "../i18nNav";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, UI } from "../theme";
import { Kicker, PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";
import { tr } from "../i18n";

interface UpdateEntry {
  date: string;
  tag: string;
  title: string;
  items: string[];
}

const UPDATES: UpdateEntry[] = [
  {
    date: "September 5, 2026",
    tag: "Reader",
    title: "Faster first paint on phones, and a skip link that lands",
    items: [
      "The hero art is requested with the page instead of after the app loads, and it ships in more sizes so a phone downloads the one it can show. Same picture, fewer bytes, sooner.",
      "The keyboard skip link now lands on the content; before, it had nowhere focusable to go.",
      "The goblin in the header no longer announces “Data Goblin” twice to screen readers, and it is served at the size it is drawn.",
    ],
  },
  {
    date: "September 4, 2026",
    tag: "Reader",
    title: "Search speaks French now",
    items: [
      "The French edition builds its own search index, so searching on /fr returns French chapter titles, section headings and glossary definitions instead of English ones, or nothing.",
    ],
  },
  {
    date: "August 1, 2026",
    tag: "Reader",
    title: "Reading position, receipts in French, and a nav that fits",
    items: [
      "Your place in a chapter is anchored to the text itself, not a page number, so it survives a resize or a switch between the spread and the single wide page.",
      "Every receipt marker resolves again. Thirteen had drifted after chapter edits; 49 of 49 now land on the right claim, and the build checks this from now on.",
      "The receipts apparatus works in French: markers, the per-chapter card and the ledger links.",
      "Below 1500px the reader shows one wide page instead of a cramped two-page spread.",
      "The nav shows every item that fits and only collapses into More as a real fallback. Added a skip link and a proper main landmark. The bias-score formula is disclosed inline.",
      "Fonts are self-hosted and the Google Fonts origins are out of the CSP.",
      "Fixed a factual error in the French edition. robots.txt now says where the guide stands on AI crawlers instead of leaving it implied.",
    ],
  },
  {
    date: "July 23, 2026",
    tag: "Reader",
    title: "Browse by topic",
    items: [
      "Topic pages cut across chapters, and the Map has a browse-by-topic section.",
      "The code is MIT and the book is CC BY-NC 4.0, both spelled out in the repo.",
    ],
  },
  {
    date: "June 21, 2026",
    tag: "Corrections",
    title: "Two named-official fixes, and a clarity pass on Chapter 5",
    items: [
      "Chapter 13: corrected the post-election SITE Task Force testimony. It was Nathalie Drouin (National Security and Intelligence Advisor) and David Morrison (Deputy Minister of Foreign Affairs); an earlier draft wrongly added the Information Commissioner to that line. Fixed in the chapter body and the source list.",
      "Chapter 7: the Telus line now notes the CEO succession — Darren Entwistle retires June 30, 2026, with Victor Dodig taking over July 1. Caught in a sweep that re-checked every named official in the book against current sources; the cabinet, the other telecom CEOs, the Privacy Commissioner, and the institute heads all checked out.",
      "Chapter 5: tightened “silent on” to “does not commit to” (the guide's own rule about not overstating what a policy leaves out), and glossed GFANZ as a global net-zero finance coalition.",
    ],
  },
  {
    date: "June 21, 2026",
    tag: "Reader",
    title: "A money table for the AI for All chapter, and a faster site on mobile",
    items: [
      "Chapter 5 now has a “Follow the money” table laying out every AI for All funding commitment in one scannable place — the same figures as the text, easier to take in at a glance.",
      "The site loads noticeably faster on phones now, after a pass on how the fonts and the opening screen load. No reading content changed.",
      "Each chapter now carries its own description for search results and link previews, so a shared chapter link shows what that chapter is about instead of the generic site blurb.",
      "Chapter 14 (The News) has a new newsroom cover illustration.",
    ],
  },
  {
    date: "June 16, 2026",
    tag: "Reader",
    title: "More Goblin Facts, Alignments, and Examples across the guide",
    items: [
      "Twenty-three new margin callouts now fill the chapters that were still missing them: nine Goblin Facts (a hard number with a source: GPT-3's 175-billion-parameter scale, the Gender Shades 34.7%-versus-0.8% accuracy gap, the 60%-by-2034 adoption target against a 19.2% floor), seven Alignment cues (which layer is the sovereignty flag actually on? disclosed, or verified?), and seven plain-language Examples (three reviews of the same restaurant; the cook who read ten thousand cookbooks; the self-checkout).",
      "Two sources were verified and added to the receipts ledger to back the new figures: the GPT-3 scale paper and the Gender Shades study.",
      "The French edition was re-synced so the new callouts carry over. The new ones appear as machine translation for now, consistent with the under-review banner.",
    ],
  },
  {
    date: "June 16, 2026",
    tag: "Reader",
    title: "Two dozen new worked examples, audio volume, and layout fixes",
    items: [
      "A worked Example or an Alignment cue now lands in nearly every chapter: plain-language analogies (the cloud is a building with a hydro bill; the efficient furnace and the bigger house) and quick orientation checks (which rung on the enforceability ladder? whose law runs the server?). Twenty-four in all, in both editions.",
      "Read-aloud now has a volume slider next to the speed control.",
      "Chapter recaps no longer strand their heading and icon at the bottom of the previous page. The recap starts fresh with its body underneath. And the About-page counters tick up a little more slowly.",
    ],
  },
  {
    date: "June 16, 2026",
    tag: "Figures",
    title: "Dark-mode and French versions of every data figure",
    items: [
      "All 42 data figures were redrawn for dark mode and translated into French. The reader now loads the right version automatically for your theme and your language, so the charts read cleanly in dark mode and in the French edition.",
      "While re-checking the French, the edition was regenerated with cleaner machine translation, corrected chapter titles (including the Film & Media chapter), and consistent terminology: biais, hypertrucage, souveraineté. It stays labelled machine-translated and under review.",
    ],
  },
  {
    date: "June 15, 2026",
    tag: "Edition",
    title: "French edition re-synced to the current guide",
    items: [
      "The French edition was re-translated from the current English content, fixing a chapter-numbering offset and adding the Film & Media chapter, which had been missing. It now mirrors the English structure one-to-one.",
      "Still machine-translated and labelled under review: structure, links, numbers, and the Goblin Check and Chapter Recap markers are preserved, but the French wording has not been fully human-edited.",
    ],
  },
  {
    date: "June 15, 2026",
    tag: "Corrections",
    title: "Corrections — Wonder Valley reversal, and a fresh fact-check pass",
    items: [
      "Wonder Valley / Sturgeon Lake Cree Nation, corrected in public: an earlier draft described the Nation as an equity participant in the Wonder Valley data-centre project. The documented record is the opposite: the Nation says it was not consulted, demanded a halt (Chief Sunshine's open letter, January 13, 2025), and is in court over the Crown's duty to consult as of June 2026. Chapters 6 and 9 were rewritten to the record; the correction note stays in the book.",
      "Bill C-16: a May 2026 committee amendment added a 48-hour platform takedown duty (and 'nearly nude' coverage); the bill is advancing through Parliament as of June 2026. The Chapter 13 line that said it created no takedown mechanism was corrected.",
      "The Toronto Star v. OpenAI jurisdiction ruling is dated November 7, 2025 (not the 27th), and OpenAI has appealed. The book now says so.",
      "The 2025 election-deepfake figures in the Source Library were aligned to the published paper (8.66% right / 4.42% left / 0.12% harmful reach), matching the chapter body.",
      "The $100M Venture Scientist Fund is a private Mila–Inovia venture fund, not a federal program. Corrected in Chapters 5 and 7.",
      "The point at which global data-centre electricity overtakes Canada's total power use was moved from 2026 to the late 2020s, matching the IEA trajectory.",
    ],
  },
  {
    date: "June 15, 2026",
    tag: "Edition",
    title: "French edition — readability fixes on the front door",
    items: [
      "Corrected the French edition's three most systematic machine-translation errors, edition-wide: 'lean' (the book's core idea) had been rendered as 'maigre' (skinny) and is now 'biais'; the mascot is now spelled 'gobelin'; and 'AI' is now 'IA' throughout. The 'Data Goblin' name and the Goblin Check / Chapter Recap markers are preserved.",
      "Hand-polished the highest-traffic French UI (the home page, the Toolkit's source-bias categories, and the 'name the lean' explainer), replacing machine phrasing with proper French.",
      "The French edition is still machine-translated and labelled under review. A full resync to the latest English (the de-templated chapter headings and the new Film & Media material) is the next French pass.",
    ],
  },
  {
    date: "June 15, 2026",
    tag: "New sections",
    title: "Film & Media chapter — new Canadian beats",
    items: [
      "A new section on the certification question: Canada's CanCon points system and the CPTC/PSTC labour credits all reward Canadian people, and have no answer yet for AI doing the creative work. So 'made in Canada' and 'made by Canadians' can quietly drift apart inside the same certified production.",
      "The Quebec/Montréal dubbing (doublage) industry as one of the most AI-exposed corners of the screen economy: UDA and ANDP, AI voice synthesis, and the consent fight, with YouTube and Amazon already shipping AI dubs.",
      "Sector scale added (≈$10.2B production volume, ≈181,000 jobs in 2024/25), plus below-the-line crew unions, the Canadian Federation of Musicians, and the deceased-performer consent question. Six new sources added to the receipts ledger.",
    ],
  },
  {
    date: "June 15, 2026",
    tag: "New",
    title: "Forty-two data figures, wired into the guide",
    items: [
      "The guide now has its own data. Forty-two charts and diagrams run through the chapters: the source-bias map, the chip-to-mine supply chain, province-by-province grid carbon, the transparency drop, the deepfake-prevalence breakdown. Each comes with a plain-language explainer underneath.",
      "Every figure draws a number that is already in the text and already in the receipts ledger. Nothing on a chart is a new claim; the figures just make the existing ones visible. They are drawn as vector art, so they stay sharp and change when a figure changes.",
      "New page-turn buttons on the left and right edges of each page, plus tooltip and keyboard fixes, for easier reading on any screen.",
    ],
  },
  {
    date: "June 15, 2026",
    tag: "Edition",
    title: "A voice-and-structure pass, and the guide audits itself",
    items: [
      "A structural editing pass across all twenty chapters: varied chapter openers and closers, and section headings that no longer march One, Two, Three through every chapter. The aim was to make the book read like a person rather than a template. No facts, figures, or sources changed.",
      "A transparent self-audit of what this guide cost to make — an order-of-magnitude estimate of its own energy and water, with the parts that can't honestly be counted named rather than buried. A book with a chapter on AI's footprint should account for its own.",
      "An expanded note on who wrote this and why — the background behind the suspicion.",
    ],
  },
  {
    date: "June 14, 2026",
    tag: "Edition",
    title: "Editorial polish, legal pass, and a living-document commitment",
    items: [
      "This web edition is explicitly a living document: it gets corrected and extended as bills pass, cases settle, and the evidence moves. Every change is logged here, in the open. A print edition, if one ever ships, will be a dated snapshot; the web version is where the guide stays current.",
      "A full readability and voice pass across all twenty chapters: tighter prose, with no facts, figures, or sources changed.",
      "A fresh legal review and fixes: active litigation kept as allegation, and claims about named people and companies tightened to what the reporting actually supports.",
      "The Film & Media chapter's sources pinned to specific trade-press reporting (Variety, The Hollywood Reporter, Deadline), including Variety's reporting on the AI feature Hell Grind shown at Cannes' Marché du Film.",
      "Twenty-five new research sources verified and logged in the receipts ledger, with corporate self-disclosures (Anthropic, OpenAI) flagged as exactly that.",
    ],
  },
  {
    date: "June 13, 2026",
    tag: "Edition",
    title: "French edition added (machine-translated, under review)",
    items: [
      "A full French edition is now live: switch with the FR/EN toggle in the top bar, or in the menu on mobile. A banner marks it as machine-translated and under review.",
      "It is an honest machine translation, not a hand translation: structure, links, numbers, and the Goblin Check and Chapter Recap callouts are preserved, but the French wording has not been human-edited yet.",
      "Extras keyed to the English text (receipt popovers, glossary tooltips, and reference auto-links) are switched off in French for now. The English edition keeps them; re-curating them in French is a later pass.",
    ],
  },
  {
    date: "June 13, 2026",
    tag: "New sections",
    title: "Four new sections added",
    items: [
      "AI agents (Chapter 2): what changes when a model can act on your behalf, and the Canadian accountability gap it opens.",
      "Open-weight models (Chapter 9): a real but partial lever for Canadian AI sovereignty.",
      "Disability & the fairness debate (Chapter 14): AI as assistive benefit and as structural harm.",
      "AI companions (Chapter 10): the intimate data you confide in, and a near-blank Canadian regulatory picture.",
    ],
  },
  {
    date: "June 13, 2026",
    tag: "Corrections",
    title: "Verification & corrections pass",
    items: [
      "Cohere's lead investor corrected to PSP Investments (not CPPIB): July 2024 round, US$5.5B valuation.",
      "Canada signed the Council of Europe AI Convention on February 11, 2025; earlier text wrongly implied it had not. Now stated as signed but not ratified.",
      "The recurring Owen et al. finding re-scoped to 54% of energy-transition-mineral projects on or near Indigenous and peasant lands (projects sited, not material volumes), with the AI extension flagged as the guide's own move.",
      "Stanford Foundation Model Transparency Index figures corrected (mean 58 to 40.7; Mistral 55 to 18).",
      "A mis-cited case replaced with Ewert v. Canada (2018 SCC 30); the DGC witness corrected to Dave Forget; Ontario's gap restated as the absence of a provincial private-sector privacy law.",
      "New section added. AI agents (Chapter 2): what changes when a model is wired to act, and the Canadian accountability gap it opens.",
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
  "A handful of provincial water-use figures cited from secondary sources and not yet independently confirmed against primary documents.",
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
        eyebrow={tr("Data Goblin · Living Edition")}
        title={tr("Updates & Corrections")}
        eyebrowSize="10px"
        eyebrowLetterSpacing="0.26em"
        eyebrowMarginBottom="9px"
        titleSize="clamp(38px, 5vw, 58px)"
        titleLineHeight={1}
        description={tr("Every fact in this guide carries an invisible “as of June 2026” tag. When the world moves past the page (a bill passes, a case settles, a number is corrected), the change is logged here, in the open. Receipts, not quiet edits.")}
        descriptionSize="17px"
        descriptionLineHeight={1.7}
        descriptionMaxWidth="760px"
      />

      <div style={{ display: "grid", gap: "12px" }}>
        {UPDATES.map((entry) => (
          <StaticCard key={entry.date + entry.title} padding="20px 22px">
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
              <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: muted }}>
                {tr(entry.date)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: green }}>
                {tr(entry.tag)}
              </span>
            </div>
            <h2 style={{ fontFamily: UI, fontSize: "18px", fontWeight: 900, color: navy, margin: "0 0 10px" }}>
              {tr(entry.title)}
            </h2>
            <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "7px" }}>
              {entry.items.map((it, i) => (
                <li key={i} style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.6 }}>
                  {tr(it)}
                </li>
              ))}
            </ul>
          </StaticCard>
        ))}
      </div>

      <StaticCard padding="18px 20px" background={c(...P.greenBg)} borderColor={c(...P.greenBorder)} borderLeft={`4px solid ${green}`} style={{ marginTop: "18px" }}>
        <Kicker color={green} letterSpacing="0.18em">{tr("Still being checked")}</Kicker>
        <ul style={{ margin: "4px 0 0", paddingLeft: "20px", display: "grid", gap: "7px" }}>
          {PENDING.map((it, i) => (
            <li key={i} style={{ fontFamily: BODY, fontSize: "14.5px", color: body, lineHeight: 1.6 }}>
              {tr(it)}
            </li>
          ))}
        </ul>
      </StaticCard>

      <StaticCard marginBottom="0" padding="18px 20px" style={{ marginTop: "12px" }}>
        <p style={{ fontFamily: BODY, fontSize: "15px", color: body, lineHeight: 1.7, margin: "0 0 10px" }}>
          {tr("The full claim-by-claim record (what was checked, what was corrected, and what is still open) lives in the Receipts ledger. When something in the guide collides with something newer, trust the newer thing. Then ask the goblin’s questions about it too: who counted that, what got left out, and can I see the receipt?")}
        </p>
        <Link to="/receipts" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>
          {tr("Open receipts")}
        </Link>
        <span style={{ fontFamily: UI, color: muted }}> · </span>
        <Link to="/guide" style={{ fontFamily: UI, fontSize: "14px", fontWeight: 800, color: navy }}>
          {tr("Back to the guide")}
        </Link>
      </StaticCard>
    </StaticPageShell>
  );
}
