export type CreatorInspiration = {
  id: string;
  name: string;
  platform: string | null;
  style: string | null;
  content_strength: string | null;
  hook_style: string | null;
  editing_style: string | null;
  posting_style: string | null;
  audience_type: string | null;
  learnings: string | null;
  sub_niche_name?: string | null;
};

export type GeneratedCreatorProfile = {
  energyStyle: string;
  contentTone: string;
  editingStyle: string;
  captionStyle: string;
  bestFormats: string[];
  postingFrequency: string;
  growthAngle: string;
  personalBrandDirection: string;
};

const toneByNiche: Record<string, string> = {
  Comedy: "Relatable and entertaining",
  Dance: "Expressive and energetic",
  Education: "Clear and practical",
  Fashion: "Visual and confident",
  Fitness: "Motivating and direct",
  Food: "Warm and practical",
  Gaming: "Energetic and community-led",
  "Self-Improvement": "Encouraging and reflective",
  Cinematography: "Cinematic and detail-focused",
  Animation: "Imaginative and visual",
  "AI & Technology": "Clear and forward-looking",
  "Content Creation": "Strategic and encouraging",
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function getEnergyStyle(creators: CreatorInspiration[]) {
  const signals = creators
    .flatMap((creator) => [creator.style, creator.editing_style, creator.posting_style])
    .join(" ")
    .toLowerCase();

  if (/(high-energy|fast|punchy|dynamic|bold|impact)/.test(signals)) {
    return "High-energy and dynamic";
  }

  if (/(calm|minimal|reflective|thoughtful|warm|restrained)/.test(signals)) {
    return "Calm and intentional";
  }

  return "Confident and adaptable";
}

function getCaptionStyle(niche: string) {
  if (["Education", "AI & Technology", "Content Creation"].includes(niche)) {
    return "Clear value-led captions with a practical takeaway";
  }

  if (["Comedy", "Dance", "Fashion", "Gaming"].includes(niche)) {
    return "Short personality-led captions with a conversational CTA";
  }

  if (["Fitness", "Self-Improvement"].includes(niche)) {
    return "Motivational captions with one actionable next step";
  }

  return "Concise captions with useful context and a clear CTA";
}

export function buildCreatorProfile(
  niche: string,
  creators: CreatorInspiration[],
): GeneratedCreatorProfile {
  const styles = unique(creators.map((creator) => creator.style));
  const editingStyles = unique(creators.map((creator) => creator.editing_style));
  const strengths = unique(creators.map((creator) => creator.content_strength));
  const names = creators.map((creator) => creator.name);

  return {
    energyStyle: getEnergyStyle(creators),
    contentTone: toneByNiche[niche] ?? "Clear and authentic",
    editingStyle: editingStyles.slice(0, 2).join(" + ") || "Clean, focused edits",
    captionStyle: getCaptionStyle(niche),
    bestFormats: styles.slice(0, 3),
    postingFrequency: "3-5 focused posts per week",
    growthAngle: strengths.length
      ? `Build recognition through ${strengths.slice(0, 2).join(" and ").toLowerCase()}.`
      : "Build recognition through a consistent, focused content style.",
    personalBrandDirection: names.length
      ? `Blend the strongest elements of ${names.slice(0, 3).join(", ")} into a distinct ${niche} presence.`
      : `Build a distinct and consistent ${niche} presence.`,
  };
}
