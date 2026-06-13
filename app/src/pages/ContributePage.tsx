import type { FormEvent } from "react";
import { useState } from "react";
import { PageHeading, StaticPageShell } from "../components/StaticPage";
import {
  ContributionForm,
  ContributionSuccess,
  GuidelinesPanel,
  RevisionFlowCard,
} from "../components/ContributeSections";
import { StaticHeroArt } from "../components/StaticHeroArt";
import { buildContributionMailto } from "../contribute";

export function ContributePage() {
  const [type, setType] = useState("factual");
  const [chapter, setChapter] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);

  const resetForm = () => {
    setSubmitted(false);
    setChapter("");
    setMessage("");
    setType("factual");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.location.href = buildContributionMailto({ type, chapter, message });
    setSubmitted(true);
  };

  return (
    <StaticPageShell maxWidth="820px">
      <PageHeading
        eyebrow="Data Goblin Field Guide"
        title="Contribute"
        titleMargin="0 0 12px"
        description="This guide is a living document. If something is wrong, outdated, or missing, tell us. Every factual correction makes the hoard more useful to everyone."
        descriptionLineHeight={1.7}
      >
        <StaticHeroArt
          art="panels/contribute-hearth-panel.webp"
          alt="A warm hearth scene for contributing to the Data Goblin guide"
          maxWidth="440px"
          maxHeight="320px"
          sizes="(max-width: 760px) 86vw, 440px"
          eager
        />
      </PageHeading>

      {submitted ? (
        <ContributionSuccess onReset={resetForm} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "24px", alignItems: "start", marginBottom: "32px" }}>
          <ContributionForm
            type={type}
            chapter={chapter}
            message={message}
            submitHovered={submitHovered}
            onTypeChange={setType}
            onChapterChange={setChapter}
            onMessageChange={setMessage}
            onSubmitHoveredChange={setSubmitHovered}
            onSubmit={handleSubmit}
          />
          <GuidelinesPanel />
        </div>
      )}

      <RevisionFlowCard />
    </StaticPageShell>
  );
}
