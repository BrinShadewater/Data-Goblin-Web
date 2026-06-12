export const CONTRIBUTION_EMAIL = "Brinshadewater@gmail.com";

export type ContributionTypeId = "factual" | "source" | "chapter" | "other";

export const CONTRIBUTION_TYPES: {
  id: ContributionTypeId;
  label: string;
  desc: string;
}[] = [
  { id: "factual", label: "Factual Error", desc: "Something in the guide is incorrect or outdated." },
  { id: "source", label: "Missing Source", desc: "A claim is made without a receipt that should have one." },
  { id: "chapter", label: "Chapter Suggestion", desc: "A topic you think the guide should cover but doesn't." },
  { id: "other", label: "General Feedback", desc: "Anything else — tone, clarity, framing, accessibility." },
];

export function contributionTypeLabel(type: string): string {
  return CONTRIBUTION_TYPES.find((ct) => ct.id === type)?.label ?? "General Feedback";
}

export function buildContributionMailto({
  type,
  chapter,
  message,
}: {
  type: string;
  chapter: string;
  message: string;
}): string {
  const label = contributionTypeLabel(type);
  const subject = `Data Goblin contribution: ${label}`;
  const body = [
    `Type: ${label}`,
    `Chapter / Section: ${chapter.trim() || "(not specified)"}`,
    "",
    "Report:",
    message.trim(),
  ].join("\n");
  return `mailto:${CONTRIBUTION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
