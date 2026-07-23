// Topic landing pages: shareable per-theme entry points built from the book's
// existing chapters. `chapter` is the primary chapter (its "Start here" summary
// is featured); `related` lists other chapters that go deeper on the same theme,
// so each hub is a real curated cluster, not a single-chapter signpost. All prose
// is reused from the book — no new claims are introduced here.
export interface Topic {
  chapter: number;
  related: number[];
  title: string;
  blurb: string;
}

export const TOPICS: Record<string, Topic> = {
  "sovereignty": { chapter: 9, related: [6, 4, 7, 20], title: "AI Sovereignty in Canada", blurb: "National, personal, and Indigenous data sovereignty — three senses of one word, and how to test a “sovereign AI” claim." },
  "data-centres": { chapter: 6, related: [4, 8, 9], title: "Canada’s AI Data Centres", blurb: "What’s actually in the ground: the megawatts, the water, the sites, and the “sovereign infrastructure” framing tested against reality." },
  "environment": { chapter: 8, related: [4, 6], title: "AI’s Environmental Footprint", blurb: "The numbers, the frames, Jevons’ paradox, and what both sides of the AI-and-climate argument are actually right about." },
  "copyright": { chapter: 11, related: [12, 3, 14], title: "AI, Copyright & Creators in Canada", blurb: "The Canadian newspapers’ case against OpenAI, the Geist/Craig vs TWUC/ACTRA contest, and how creator rights flow into film and media." },
  "film-media": { chapter: 12, related: [11, 13, 16], title: "AI, Film & Media in Canada", blurb: "Canadian film as culture and service infrastructure: tax credits, CanCon, strained production economics, AI workflows, likeness, labour, and trust." },
  "deepfakes": { chapter: 13, related: [14, 17, 18], title: "Deepfakes & Misinformation", blurb: "What the 2025 Canadian election data actually showed, the Bill C-16 gap, and the international comparison." },
  "privacy": { chapter: 10, related: [3, 18, 17], title: "AI, Privacy & Surveillance", blurb: "What AI systems collect and infer, workplace monitoring, facial recognition, AI companions, and Quebec’s Law 25." },
  "labour": { chapter: 16, related: [7, 15, 20], title: "AI, Jobs & the Canadian Economy", blurb: "What the evidence shows, what Acemoglu and Autor disagree about, and the Canadian empirical baseline." },
  "governance": { chapter: 17, related: [18, 9, 19, 20], title: "How AI Is Governed in Canada", blurb: "The post-AIDA institutional reality: who regulates what across federal, provincial, and sectoral layers." },
};

export const TOPIC_LIST = Object.entries(TOPICS).map(([slug, t]) => ({ slug, ...t }));
