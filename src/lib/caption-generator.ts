export type CaptionProfile = {
  niche: string;
  subNiche: string;
  energyStyle: string;
  contentTone: string;
  editingStyle: string;
  captionStyle: string;
  growthAngle: string;
  selectedCreatorNames: string[];
};

export type CaptionIdea = {
  id: string;
  title: string;
  hook: string | null;
  niche: string | null;
  sub_niche: string | null;
  format: string | null;
  shot_list: string | null;
  caption_angle: string | null;
  difficulty: string | null;
  goal: string | null;
  priority: string | null;
  status: string | null;
};

export type CreativeDirection =
  | "balanced"
  | "viral"
  | "emotional"
  | "educational"
  | "hinglish"
  | "premium"
  | "bold";

export type RemixMode =
  | "all"
  | "hooks"
  | "captions"
  | "shorter"
  | "emotional"
  | "direct"
  | "hinglish"
  | "educational";

export type GeneratedHook = {
  key: string;
  category: string;
  text: string;
};

export type GeneratedCta = {
  key: string;
  category: string;
  text: string;
};

export type GeneratedHashtagSet = {
  key: string;
  category: string;
  hashtags: string;
};

export type GeneratedCaption = {
  key: string;
  caption_type: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
  hashtag_category: string;
};

export type CaptionSet = {
  direction: CreativeDirection;
  hooks: GeneratedHook[];
  captions: GeneratedCaption[];
  ctas: GeneratedCta[];
  hashtagSets: GeneratedHashtagSet[];
};

type PatternId =
  | "final-output"
  | "behind-the-scenes"
  | "tutorial"
  | "mistake-fix"
  | "before-after"
  | "breakdown"
  | "quick-tip"
  | "challenge"
  | "story"
  | "comparison"
  | "reaction"
  | "repurpose";

type NicheCaptionAdapter = {
  subject: string;
  session: string;
  result: string;
  process: string;
  mistake: string;
  audience: string;
  proof: string;
  indianTag: string;
  hashtags: string[];
};

type CaptionContext = {
  profile: CaptionProfile;
  idea: CaptionIdea;
  adapter: NicheCaptionAdapter;
  pattern: PatternId;
  direction: CreativeDirection;
  remix: RemixMode;
  variant: number;
  niche: string;
  subNiche: string;
  format: string;
  goal: string;
  originalHook: string;
  shotList: string;
};

const directionLabels: Record<CreativeDirection, string> = {
  balanced: "balanced",
  viral: "more viral",
  emotional: "more emotional",
  educational: "more educational",
  hinglish: "more Hinglish",
  premium: "more premium",
  bold: "more bold and direct",
};

const nicheAdapters: Record<string, NicheCaptionAdapter> = {
  Dance: {
    subject: "movement",
    session: "practice session",
    result: "final performance",
    process: "practice, timing, correction, and performance",
    mistake: "rushing the beat before finishing the movement",
    audience: "dance creators",
    proof: "cleaner timing and stronger expression",
    indianTag: "#reelsindia",
    hashtags: ["#dancecreator", "#dancepractice", "#choreography", "#dancevideo"],
  },
  Fitness: {
    subject: "training",
    session: "workout session",
    result: "clean working set",
    process: "warm-up, setup, imperfect rep, correction, and clean rep",
    mistake: "adding weight before the form is ready",
    audience: "fitness creators",
    proof: "better form and a stronger session",
    indianTag: "#fitnessindia",
    hashtags: ["#fitnesscreator", "#gymreels", "#workoutroutine", "#fitnessjourney"],
  },
  Food: {
    subject: "recipe",
    session: "cooking session",
    result: "finished dish",
    process: "ingredients, prep, cooking, plating, and final texture",
    mistake: "skipping the texture cue that makes the recipe repeatable",
    audience: "food creators",
    proof: "a simple meal that feels worth saving",
    indianTag: "#indianfoodcreator",
    hashtags: ["#foodcreator", "#healthyrecipes", "#mealprep", "#budgetmeals"],
  },
  Comedy: {
    subject: "sketch",
    session: "sketch shoot",
    result: "clean punchline",
    process: "setup, broken take, timing adjustment, and final punchline",
    mistake: "explaining too much before the punchline lands",
    audience: "comedy creators",
    proof: "a tighter setup and stronger reaction",
    indianTag: "#indiancomedy",
    hashtags: ["#comedycreator", "#sketchcomedy", "#reelcomedy", "#funnyreels"],
  },
  Fashion: {
    subject: "look",
    session: "styling session",
    result: "finished outfit",
    process: "base outfit, rejected piece, styling adjustment, and final look",
    mistake: "adding more pieces without choosing a focal point",
    audience: "style creators",
    proof: "a more intentional outfit",
    indianTag: "#fashionindia",
    hashtags: ["#fashioncreator", "#stylingtips", "#outfitideas", "#styleinspo"],
  },
  Education: {
    subject: "lesson",
    session: "teaching session",
    result: "clear takeaway",
    process: "question, rough explanation, clearer example, and final lesson",
    mistake: "teaching details before the main idea is clear",
    audience: "educators",
    proof: "a simpler way to understand the topic",
    indianTag: "#learnindia",
    hashtags: ["#educationcreator", "#learnonline", "#studygram", "#explainer"],
  },
  Gaming: {
    subject: "play",
    session: "gaming session",
    result: "highlight moment",
    process: "match setup, mistake, reaction, adjustment, and highlight",
    mistake: "reacting before reading the situation",
    audience: "gaming creators",
    proof: "a smarter decision in the key moment",
    indianTag: "#gamingindia",
    hashtags: ["#gamingcreator", "#gameplay", "#gamingreels", "#rankedgrind"],
  },
  "Self-Improvement": {
    subject: "habit",
    session: "routine session",
    result: "completed check-in",
    process: "setup, resistance, smaller adjustment, and completed habit",
    mistake: "making the habit too big to repeat",
    audience: "self-improvement creators",
    proof: "a routine you can actually repeat",
    indianTag: "#selfgrowthindia",
    hashtags: ["#selfimprovement", "#habitbuilding", "#mindsetcreator", "#growthjourney"],
  },
  Cinematography: {
    subject: "shot",
    session: "shoot",
    result: "final cinematic frame",
    process: "camera setup, lighting, movement, raw shot, and final grade",
    mistake: "moving the camera without a story reason",
    audience: "cinematography creators",
    proof: "a more cinematic frame",
    indianTag: "#filmmakersindia",
    hashtags: ["#cinematography", "#filmmaking", "#shotbreakdown", "#creatorworkflow"],
  },
  Animation: {
    subject: "animation",
    session: "animation session",
    result: "finished motion",
    process: "rough sketch, blocking, timing issue, polish, and final render",
    mistake: "polishing details before the motion reads",
    audience: "animation creators",
    proof: "motion that reads faster",
    indianTag: "#animationindia",
    hashtags: ["#animation", "#animationprocess", "#motiondesign", "#digitalcreator"],
  },
  "AI & Technology": {
    subject: "workflow",
    session: "tool test",
    result: "working output",
    process: "task, setup, failed output, correction, and final workflow",
    mistake: "showing features without a real use case",
    audience: "tech creators",
    proof: "a workflow people can actually use",
    indianTag: "#techindia",
    hashtags: ["#aicreator", "#techcreator", "#workflowtips", "#productivitytools"],
  },
  "Content Creation": {
    subject: "post",
    session: "content session",
    result: "finished post",
    process: "raw idea, weak opening, rewrite, edit, and final version",
    mistake: "starting with context before viewer relevance",
    audience: "content creators",
    proof: "a clearer hook and stronger takeaway",
    indianTag: "#creatorindia",
    hashtags: ["#contentcreator", "#creatorstrategy", "#hookwriting", "#contentideas"],
  },
};

const fallbackAdapter = nicheAdapters["Content Creation"];

const hookCategories = [
  "Curiosity hook",
  "Problem hook",
  "Result hook",
  "Mistake hook",
  "BTS/process hook",
  "Direct statement hook",
  "Emotional hook",
  "Tutorial hook",
  "Contrarian hook",
  "Save-worthy hook",
];

const captionTypes = [
  "Simple",
  "Viral / punchy",
  "Emotional",
  "Educational",
  "Storytelling",
  "Hinglish",
  "Bold / direct",
  "Community / engagement",
  "BTS / process",
  "Save-worthy",
];

function clean(value: string | null | undefined, fallback = "") {
  return value?.trim() || fallback;
}

function lowerFirst(value: string) {
  const trimmed = value.trim();
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function sentence(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return trimmed;

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

const subNicheLabels: Record<string, string> = {
  "Workout Routines": "workout routine",
  Bollywood: "Bollywood dance",
  "Gym Motivation": "gym motivation",
  Bodybuilding: "bodybuilding",
  "Fat Loss": "fat loss",
  Calisthenics: "calisthenics",
  "Transformation Journey": "transformation journey",
  "Fitness Education": "fitness education",
  "Hip-hop": "hip-hop dance",
  Krump: "krump dance",
  Freestyle: "freestyle dance",
  Contemporary: "contemporary dance",
  Tutorials: "tutorial",
  "Dance Fitness": "dance fitness",
};

const hashtagAliases: Record<string, string> = {
  "workout routines": "#workoutroutine",
  "workout routine": "#workoutroutine",
  bollywood: "#bollywooddance",
  "bollywood dance": "#bollywooddance",
  "gym motivation": "#gymmotivation",
  bodybuilding: "#bodybuilding",
  "fat loss": "#fatloss",
  calisthenics: "#calisthenics",
  "transformation journey": "#transformation",
  "fitness education": "#fitnesseducation",
  "hip-hop": "#hiphopdance",
  "hip-hop dance": "#hiphopdance",
  freestyle: "#freestyledance",
  "freestyle dance": "#freestyledance",
  contemporary: "#contemporarydance",
  "contemporary dance": "#contemporarydance",
  tutorials: "#tutorial",
  tutorial: "#tutorial",
  "dance fitness": "#dancefitness",
  "workout result reel": "#gymreels",
  "performance reel": "#dancevideo",
  "practice session bts": "#behindthescenes",
};

function humanizeSubNiche(value: string) {
  const trimmed = value.trim();
  return subNicheLabels[trimmed] ?? lowerFirst(trimmed.replace(/\s+/g, " "));
}

function hashtag(value: string) {
  const cleaned = value.replace(/&/g, "and").replace(/[^a-zA-Z0-9 ]/g, "").trim();

  if (!cleaned) return null;

  const key = cleaned.toLowerCase();
  return hashtagAliases[key] ?? `#${key.split(/\s+/).join("")}`;
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function normalizeHashtags(value: string) {
  const tags = value
    .split(/\s+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => /^#[a-z0-9]+$/.test(tag));

  return unique(tags).join(" ");
}

function cleanCaptionText(value: string) {
  const withoutInternalLanguage = value
    .replace(/\bcaption angle\b/gi, "idea")
    .replace(/\bgrowth direction\b/gi, "direction")
    .replace(/\bformat template\b/gi, "format")
    .replace(/\bcreator profile\b/gi, "creator style")
    .replace(/\bKeep the caption\s+([^.\n]+?)\s+captions?\b/gi, "Keep it $1")
    .replace(/\bcaption\s+captions?\b/gi, "caption")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
  const blocks = withoutInternalLanguage.split(/\n{2,}/);
  const seenSentences = new Set<string>();

  return blocks
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          const key = line.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

          if (!key || /^[0-9]+\. /.test(line) || line.startsWith("- ")) {
            return true;
          }

          if (seenSentences.has(key)) {
            return false;
          }

          seenSentences.add(key);
          return true;
        })
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function dedupeGeneratedItems<T>(items: T[], getValue: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = cleanCaptionText(getValue(item)).toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function rotate<T>(values: T[], amount: number) {
  if (values.length === 0) return values;
  const offset = amount % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function getPattern(idea: CaptionIdea): PatternId {
  const text = [
    idea.title,
    idea.format,
    idea.hook,
    idea.shot_list,
    idea.caption_angle,
    idea.goal,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("bts") || text.includes("behind") || text.includes("process")) return "behind-the-scenes";
  if (text.includes("mistake") || text.includes("fix") || text.includes("form")) return "mistake-fix";
  if (text.includes("tutorial") || text.includes("how-to") || text.includes("teach") || text.includes("steps")) return "tutorial";
  if (text.includes("before") || text.includes("after") || text.includes("transformation")) return "before-after";
  if (text.includes("breakdown") || text.includes("framework")) return "breakdown";
  if (text.includes("quick tip") || text.includes("tip")) return "quick-tip";
  if (text.includes("challenge")) return "challenge";
  if (text.includes("comparison") || text.includes("side-by-side") || text.includes(" vs ")) return "comparison";
  if (text.includes("reaction") || text.includes("commentary")) return "reaction";
  if (text.includes("multiplication") || text.includes("repurpose") || text.includes("multiple posts")) return "repurpose";
  if (text.includes("journey") || text.includes("story")) return "story";
  if (text.includes("result") || text.includes("final") || text.includes("completed")) return "final-output";

  return "final-output";
}

function patternPromise(context: CaptionContext) {
  const { adapter, pattern } = context;

  const promises: Record<PatternId, string> = {
    "final-output": "the result feels finished because one detail is clear",
    "behind-the-scenes": "the process is what makes the final result believable",
    tutorial: "one repeatable step is easier to remember than a long explanation",
    "mistake-fix": `a small correction can fix ${adapter.mistake}`,
    "before-after": "the change is easier to understand when people see both versions",
    breakdown: "the structure underneath the result is what people can reuse",
    "quick-tip": `one simple cue can create ${adapter.proof}`,
    challenge: "a clear constraint can make the idea sharper",
    story: "the turning point is what makes the result feel real",
    comparison: "two versions can teach more than one perfect take",
    reaction: "looking back makes the lesson easier to explain",
    repurpose: `one ${adapter.session} can become more than one post`,
  };

  return promises[pattern];
}

function fallbackCaptionAngle(context: Pick<CaptionContext, "adapter" | "pattern">) {
  const fallbacks: Record<PatternId, string> = {
    "final-output": "Start with the result, then show what made it work.",
    "behind-the-scenes": "Show the process that happened before the final version.",
    tutorial: "Break the idea into steps people can repeat.",
    "mistake-fix": `Show the mistake, then show the correction.`,
    "before-after": "Let the before and after carry the lesson.",
    breakdown: "Explain the parts that make the result work.",
    "quick-tip": "Give one cue people can try right away.",
    challenge: "Show the constraint, the struggle, and the final result.",
    story: "Tell the turning point behind the result.",
    comparison: "Show both versions and explain when each one works.",
    reaction: "Share what you would change now.",
    repurpose: `Show how one ${context.adapter.session} can become multiple posts.`,
  };

  return fallbacks[context.pattern];
}

function buildContext(
  profile: CaptionProfile,
  idea: CaptionIdea,
  direction: CreativeDirection,
  remix: RemixMode,
  variant: number,
): CaptionContext {
  const niche = clean(idea.niche, profile.niche);
  const subNiche = humanizeSubNiche(clean(idea.sub_niche, profile.subNiche));
  const adapter = nicheAdapters[niche] ?? fallbackAdapter;
  const pattern = getPattern(idea);

  return {
    profile,
    idea,
    adapter,
    pattern,
    direction,
    remix,
    variant,
    niche,
    subNiche,
    format: clean(idea.format, "content idea"),
    goal: clean(idea.goal, "Growth"),
    originalHook: clean(idea.hook, `Here is a ${subNiche} idea worth testing.`),
    shotList: clean(idea.shot_list, `Show the result, reveal the process, and end with ${adapter.proof}.`),
  };
}

function buildHooks(context: CaptionContext): GeneratedHook[] {
  const { adapter, subNiche, pattern, direction, variant } = context;
  const patternHooks: Record<PatternId, Partial<Record<number, string>>> = {
    "final-output": {
      0: "The final result is only half the story.",
      2: "One small change made the result feel cleaner.",
      5: "Start with the strongest moment.",
    },
    "behind-the-scenes": {
      0: "The final result is only half the story.",
      4: "Before the clean take, there was this.",
      6: "This is the part the final clip does not show.",
    },
    tutorial: {
      1: "If you are learning this, start here.",
      7: "Save this before your next session.",
      9: "Keep this as your quick checklist.",
    },
    "mistake-fix": {
      1: "This small mistake changes the whole result.",
      3: "Fix this before adding more effort.",
      9: "Save this before your next session.",
    },
    "before-after": {
      0: "The difference is easier to see side by side.",
      2: "One change made the after look cleaner.",
      8: "More effort was not the answer.",
    },
    breakdown: {
      0: "Most people see the result. Few see the structure.",
      5: "The result works because the structure is clear.",
      7: "Save this breakdown for later.",
    },
    "quick-tip": {
      2: "One small cue can change the result.",
      7: "Try this before your next attempt.",
      9: "Save this for your next session.",
    },
    challenge: {
      0: "A simple constraint made this more interesting.",
      5: "The limit made the idea sharper.",
      8: "Less freedom can create better content.",
    },
    story: {
      0: "The result is not the full story.",
      6: "I used to skip this part.",
      8: "Progress looked different than I expected.",
    },
    comparison: {
      0: "Same goal. Two very different versions.",
      2: "This comparison makes the better choice obvious.",
      8: "The cleaner option is not always the flashier one.",
    },
    reaction: {
      0: "I would change this now.",
      6: "Old attempt. Better lesson.",
      8: "Looking back made the lesson clearer.",
    },
    repurpose: {
      0: `One ${adapter.session} can become more than one post.`,
      5: "Shoot once. Pull out more angles.",
      9: "Save this before your next content batch.",
    },
  };
  const baseHooks = [
    "The final result is only half the story.",
    "This is the part most people skip.",
    "One small change made this look cleaner.",
    "Fix this before adding more effort.",
    "Before the clean take, there was this.",
    "Show the process. That is where the trust builds.",
    "I used to think the final result was the content.",
    "Save this before your next session.",
    "More effort is not always the answer.",
    "Keep this for your next attempt.",
  ].map((hook, index) => patternHooks[pattern][index] ?? hook);
  const directionHooks: Record<CreativeDirection, string[]> = {
    balanced: baseHooks,
    viral: [
      "Most people only show the result.",
      "This is why the post feels more watchable.",
      "The clean version started with one messy moment.",
      "One decision changed the whole clip.",
      ...baseHooks.slice(4),
    ],
    emotional: [
      "The clean result had a messy middle.",
      `This is the part of ${subNiche} I wish people showed more.`,
      "The failed attempt made the final version better.",
      ...baseHooks.slice(3),
    ],
    educational: [
      "Here is the checklist I would save.",
      `Break this into three parts before your next attempt.`,
      "The lesson is not the result. It is the cue you can repeat.",
      ...baseHooks.slice(3),
    ],
    hinglish: [
      "Final result clean hai, but process mein lesson hai.",
      "Improve karna hai? Start with one clear cue.",
      "More effort se pehle yeh mistake fix karo.",
      ...baseHooks.slice(3),
    ],
    premium: [
      "A polished result starts with a clearer process.",
      `One decision made this ${adapter.subject} feel more intentional.`,
      "The clean version came from a cleaner sequence.",
      ...baseHooks.slice(3),
    ],
    bold: [
      "Stop hiding the process. That is the content.",
      "Fix this before you post the next version.",
      "The result is not random. The process is visible.",
      ...baseHooks.slice(3),
    ],
  };
  const selectedHooks = dedupeGeneratedItems(
    rotate(directionHooks[direction], variant).slice(0, 10),
    (hook) => hook,
  );
  const hooks = hookCategories.map((category, index) => ({
    key: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category,
    text: cleanCaptionText(sentence(selectedHooks[index] ?? baseHooks[index % baseHooks.length])),
  }));

  return hooks;
}

function buildCtas(context: CaptionContext): GeneratedCta[] {
  const { adapter, goal, direction, remix } = context;
  const goalText = `${goal} ${direction} ${remix}`.toLowerCase();
  const ctaGroups: Record<string, string[]> = {
    Reach: [
      "Send this to someone building the same skill.",
      "Share this with someone who needs the reminder.",
      "Follow for more practical breakdowns like this.",
    ],
    Saves: [
      "Save this before your next session.",
      "Keep this as your quick checklist.",
      "Save this breakdown for later.",
    ],
    Shares: [
      "Send this to someone who needs this.",
      "Share this with your practice partner.",
      "Pass this to someone who only sees the final result.",
    ],
    Trust: [
      "What part of the process should I show next?",
      "Follow for the real process behind the results.",
      "Comment PROCESS if you want the next part.",
    ],
    Education: [
      "Try this and tell me how it feels.",
      "Comment BREAKDOWN if you want the full version.",
      "Save this if the correction helped.",
    ],
    Comments: [
      "Comment PLAN if you want the full breakdown.",
      "Which version should I post next?",
      "What should I try next?",
    ],
    Community: [
      "Who else is working on this right now?",
      "Tag a friend who would try this with you.",
      "Tell me what stage you are stuck at.",
    ],
    Conversion: [
      "DM me if you want this turned into a content plan.",
      "Follow if you want more creator strategy breakdowns.",
      "Save this and use it as your next post structure.",
    ],
  };
  const selected =
    goalText.includes("save") || goalText.includes("educational")
      ? "Saves"
      : goalText.includes("share") || goalText.includes("viral")
        ? "Shares"
        : goalText.includes("comment") || goalText.includes("bold")
          ? "Comments"
          : goalText.includes("trust") || goalText.includes("emotional")
            ? "Trust"
            : goalText.includes("education") || goalText.includes("authority")
              ? "Education"
              : goalText.includes("community")
                ? "Community"
                : goalText.includes("conversion")
                  ? "Conversion"
                  : "Reach";
  const mixed = unique([
    ...ctaGroups[selected],
    ...ctaGroups.Saves,
    `Try this in your next ${adapter.session}.`,
  ]);

  return dedupeGeneratedItems(mixed, (text) => text)
    .slice(0, 6)
    .map((text, index) => ({
      key: `${selected.toLowerCase()}-${index}`,
      category: index < 3 ? selected : "Extra option",
      text: cleanCaptionText(text),
    }));
}

function buildHashtagSets(context: CaptionContext): GeneratedHashtagSet[] {
  const { adapter, subNiche, format, pattern, direction } = context;
  const patternTags: Record<PatternId, string[]> = {
    "final-output": ["#reels", "#finalresult", "#showyourwork"],
    "behind-the-scenes": ["#behindthescenes", "#creatorprocess", "#practiceclip"],
    tutorial: ["#tutorial", "#howto", "#learntoday"],
    "mistake-fix": ["#mistakefix", "#formcheck", "#quickcorrection"],
    "before-after": ["#beforeafter", "#transformation", "#progress"],
    breakdown: ["#breakdown", "#contentstrategy", "#framework"],
    "quick-tip": ["#quicktip", "#creatortips", "#savetip"],
    challenge: ["#challenge", "#creatorchallenge", "#trythis"],
    story: ["#creatorjourney", "#progress", "#storytime"],
    comparison: ["#comparison", "#sidebyside", "#whichisbetter"],
    reaction: ["#reaction", "#commentary", "#creatornotes"],
    repurpose: ["#repurposecontent", "#contentbatching", "#contentworkflow"],
  };
  const directionTags: Record<CreativeDirection, string[]> = {
    balanced: ["#creatorjourney", "#contentideas"],
    viral: ["#reelideas", "#viralreels"],
    emotional: ["#realprocess", "#journeypost"],
    educational: ["#learnwithme", "#saveforlater"],
    hinglish: ["#reelsindia", "#indiancreator"],
    premium: ["#personalbrand", "#premiumcontent"],
    bold: ["#directadvice", "#creatortruth"],
  };
  const specific = hashtag(subNiche);
  const formatTag = hashtag(format);
  const nicheSpecificTags: Record<string, string[]> = {
    Dance: ["#bollywooddance", "#dancecreator", "#choreography", "#reelsindia", "#dancepractice"],
    Fitness: ["#fitnesscreator", "#gymreels", "#workoutroutine", "#fitnessjourney", "#formcheck"],
  };

  const sets = [
    {
      key: "niche",
      category: "Niche hashtags",
      tags: [...(nicheSpecificTags[context.niche] ?? adapter.hashtags), specific],
    },
    {
      key: "format",
      category: "Format hashtags",
      tags: [formatTag, ...patternTags[pattern]],
    },
    {
      key: "growth",
      category: "Growth hashtags",
      tags: ["#creatorjourney", "#contentcreator", "#growthcontent", "#consistency"],
    },
    {
      key: "indian",
      category: "Indian creator hashtags",
      tags: [adapter.indianTag, "#reelsindia", "#indiancreator", "#creatorindia"],
    },
    {
      key: "specific",
      category: "Specific direction hashtags",
      tags: [specific, ...directionTags[direction], "#contentplanning"],
    },
  ];

  return sets.map((set) => ({
    key: set.key,
    category: set.category,
    hashtags: normalizeHashtags(unique(set.tags).slice(0, 8).join(" ")),
  }));
}

function captionBody(context: CaptionContext, type: string, hook: string) {
  const { adapter, direction, remix, subNiche } = context;
  const takeaway = sentence(fallbackCaptionAngle(context));
  const promise = patternPromise(context);
  const shorter = remix === "shorter";
  const emotional = direction === "emotional" || remix === "emotional";
  const direct = direction === "bold" || remix === "direct";

  if (shorter) {
    return cleanCaptionText(
      `${hook}\n\n${sentence(promise)}\n\nShow the moment. Name the lesson. Keep it easy to repeat.`,
    );
  }

  const bodies: Record<string, string> = {
    Simple: `Result first. Process second. Lesson last.\n\nThat is what makes this worth watching.\n\n${takeaway}`,
    "Viral / punchy": `Most people show the result.\nVery few show the decision that made it work.\n\nThat is where the post gets interesting.`,
    Emotional: `${emotional ? "The honest part:" : "I used to think the final result was the content."}\n\nNow I am realizing the process is what people connect with.\n\nThe miss, the correction, the cleaner attempt - that is the story.`,
    Educational: `Here is the structure:\n1. Show the result.\n2. Explain the key detail.\n3. Give one action viewers can repeat.\n\nSimple, useful, and easy to save.`,
    Storytelling: `This started as a simple ${subNiche} idea.\n\nThe useful part came from the middle: the setup, the correction, and the moment it finally clicked.\n\nThat is the part I would show more often.`,
    Hinglish: `Final result dikhana easy hai.\nProcess dikhana trust build karta hai.\n\nSetup, mistake, correction, clean finish.\nBas itna clear rakho.`,
    "Bold / direct": `${direct ? "Straight answer:" : "Simple truth:"} ${sentence(promise)}\n\nDo not hide the useful part.\nShow the proof.\nName the correction.\nGive people one thing to try.`,
    "Community / engagement": `${hook}\n\nI am curious how other creators would frame this.\n\nWould you lead with the result, the mistake, or the process?`,
    "BTS / process": `The final ${adapter.result} is only the last frame.\n\nThe better story is the process: ${adapter.process}.\n\nThat is what makes the result feel real.`,
    "Save-worthy": `Save this as a quick checklist:\n- Start with the strongest moment.\n- Show the process.\n- Name the key detail.\n- End with one clear action.\n\nThat is enough to make the post useful.`,
  };

  return cleanCaptionText(bodies[type] ?? bodies.Simple);
}

function buildCaptions(
  context: CaptionContext,
  hooks: GeneratedHook[],
  ctas: GeneratedCta[],
  hashtagSets: GeneratedHashtagSet[],
) {
  const rotatedHooks = rotate(hooks, context.variant);
  const rotatedCtas = rotate(ctas, context.variant);
  const rotatedHashtags = rotate(hashtagSets, context.variant);

  return dedupeGeneratedItems(captionTypes, (captionType) =>
    captionBody(context, captionType, ""),
  ).map((captionType, index) => {
    const hook = rotatedHooks[index % rotatedHooks.length];
    const cta = rotatedCtas[index % rotatedCtas.length];
    const hashtagSet = rotatedHashtags[index % rotatedHashtags.length];

    return {
      key: captionType.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      caption_type: captionType,
      hook: cleanCaptionText(hook.text),
      body: captionBody(context, captionType, hook.text),
      cta: cleanCaptionText(cta.text),
      hashtags: normalizeHashtags(hashtagSet.hashtags),
      hashtag_category: hashtagSet.category,
    };
  });
}

export function generateCaptionSet(
  profile: CaptionProfile,
  idea: CaptionIdea,
  options: {
    direction?: CreativeDirection;
    remix?: RemixMode;
    variant?: number;
  } = {},
): CaptionSet {
  const direction = options.direction ?? "balanced";
  const remix = options.remix ?? "all";
  const variant = options.variant ?? 0;
  const context = buildContext(profile, idea, direction, remix, variant);
  const hooks = buildHooks(context);
  const ctas = buildCtas(context);
  const hashtagSets = buildHashtagSets(context);

  return {
    direction,
    hooks,
    ctas,
    hashtagSets,
    captions: buildCaptions(context, hooks, ctas, hashtagSets),
  };
}

export const creativeDirectionOptions: Array<{
  value: CreativeDirection;
  label: string;
}> = [
  { value: "balanced", label: "Balanced" },
  { value: "viral", label: "More viral" },
  { value: "emotional", label: "More emotional" },
  { value: "educational", label: "More educational" },
  { value: "hinglish", label: "More Hinglish" },
  { value: "premium", label: "More premium/professional" },
  { value: "bold", label: "More bold/direct" },
];

export function describeCreativeDirection(direction: CreativeDirection) {
  return directionLabels[direction];
}
