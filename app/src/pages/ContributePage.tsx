import { useState } from "react";
import { PageHeading, StaticPageShell } from "../components/StaticPage";
import {
  ContributionForm,
  ContributionSuccess,
  GuidelinesPanel,
  RevisionFlowCard,
} from "../components/ContributeSections";
import { StaticHeroArt } from "../components/StaticHeroArt";
import { tr } from "../i18n";

export function ContributePage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <StaticPageShell maxWidth="820px">
      <PageHeading
        eyebrow={tr("Data Goblin Field Guide")}
        title={tr("Contribute")}
        titleMargin="0 0 12px"
        description={tr("This guide is a living document. If something is wrong, outdated, or missing, tell us. Every factual correction makes the hoard more useful to everyone.")}
        descriptionLineHeight={1.7}
      >
        <StaticHeroArt
          art="panels/contribute-hearth-panel.webp"
          alt={tr("A warm hearth scene for contributing to the Data Goblin guide")}
          maxWidth="440px"
          maxHeight="320px"
          sizes="(max-width: 760px) 86vw, 440px"
          eager
        />
      </PageHeading>

      {submitted ? (
        <ContributionSuccess onReset={() => setSubmitted(false)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "24px", alignItems: "start", marginBottom: "32px" }}>
          <ContributionForm onSuccess={() => setSubmitted(true)} />
          <GuidelinesPanel />
        </div>
      )}

      <RevisionFlowCard />
    </StaticPageShell>
  );
}
