import { Link, useParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { BODY, MONO, P, UI } from "../theme";
import { Kicker, PageHeading, StaticCard, StaticPageShell } from "../components/StaticPage";
import { Markdown } from "../components/Markdown";
import { useChapter } from "../useContent";
import { TOPICS, TOPIC_LIST } from "../topics";

export function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const topic = slug ? TOPICS[slug] : undefined;
  const { c } = useTheme();
  const muted = c(...P.muted);
  const navy = c(...P.navy);
  const green = c(...P.green);
  const { data: chapter } = useChapter(topic ? topic.chapter : -1);

  if (!topic) {
    return (
      <StaticPageShell padding="48px clamp(16px, 5vw, 54px) 72px">
        <PageHeading eyebrow="Topic" title="Topic not found" description="That topic isn’t on the map. Try one of the topics below." />
        <StaticCard marginBottom="0">
          {TOPIC_LIST.map((t) => (
            <div key={t.slug}><Link to={`/topic/${t.slug}`} style={{ fontFamily: UI, fontWeight: 800, color: navy }}>{t.title}</Link></div>
          ))}
        </StaticCard>
      </StaticPageShell>
    );
  }

  return (
    <StaticPageShell padding="36px clamp(16px, 5vw, 54px) 72px">
      <PageHeading
        eyebrow="Topic"
        title={topic.title}
        eyebrowSize="10px"
        eyebrowLetterSpacing="0.26em"
        titleSize="clamp(34px, 5vw, 54px)"
        titleLineHeight={1.02}
        description={topic.blurb}
        descriptionSize="17px"
        descriptionLineHeight={1.7}
        descriptionMaxWidth="760px"
      />

      <StaticCard padding="22px 24px">
        <Kicker color={green} letterSpacing="0.18em">Start here</Kicker>
        {chapter ? (
          <Markdown markdown={chapter.startHere} />
        ) : (
          <p style={{ fontFamily: BODY, fontStyle: "italic", color: muted }}>Loading…</p>
        )}
        <Link
          to={`/chapter/${topic.chapter}`}
          style={{ display: "inline-block", marginTop: "14px", fontFamily: UI, fontSize: "15px", fontWeight: 800, color: c("#f4f0e0", "#0d1018"), background: green, padding: "10px 18px", borderRadius: "3px", textDecoration: "none" }}
        >
          Read the full chapter →
        </Link>
      </StaticCard>

      <StaticCard marginBottom="0" padding="18px 20px" style={{ marginTop: "14px" }}>
        <div style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>Browse other topics</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
          {TOPIC_LIST.filter((t) => t.slug !== slug).map((t) => (
            <Link key={t.slug} to={`/topic/${t.slug}`} style={{ fontFamily: UI, fontSize: "14px", fontWeight: 700, color: navy, textDecoration: "none" }}>
              {t.title}
            </Link>
          ))}
        </div>
      </StaticCard>
    </StaticPageShell>
  );
}
