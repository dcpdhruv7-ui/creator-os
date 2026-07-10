import { captionFingerprint, normalizeCaptionMatchText } from "@/lib/caption-fingerprint";

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
  excludeHooks: string[];
  excludeCaptions: Array<{ hook?: string | null; body: string | null }>;
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

const fillerHookWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "before",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "when",
  "with",
  "your",
]);

function normalizeHook(value: string) {
  return cleanCaptionText(value)
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function importantWords(value: string) {
  return normalizeHook(value)
    .split(" ")
    .filter((word) => word.length > 2 && !fillerHookWords.has(word));
}

function areHooksSimilar(a: string, b: string) {
  const normalizedA = normalizeHook(a);
  const normalizedB = normalizeHook(b);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  if (normalizedA === normalizedB) {
    return true;
  }

  const wordsA = new Set(importantWords(normalizedA));
  const wordsB = new Set(importantWords(normalizedB));
  const smallerSize = Math.min(wordsA.size, wordsB.size);

  if (smallerSize === 0) {
    return false;
  }

  const overlap = [...wordsA].filter((word) => wordsB.has(word)).length;
  const overlapRatio = overlap / smallerSize;
  const jaccard = overlap / new Set([...wordsA, ...wordsB]).size;

  return overlap >= 3 && (overlapRatio >= 0.72 || jaccard >= 0.58);
}

function pickUniqueHook(candidates: string[], usedHooks: string[], fallbackCandidates: string[]) {
  const allCandidates = [...candidates, ...fallbackCandidates].map((candidate) =>
    sentence(cleanCaptionText(candidate)),
  );

  return (
    allCandidates.find(
      (candidate) => !usedHooks.some((usedHook) => areHooksSimilar(candidate, usedHook)),
    ) ?? null
  );
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
  excludeHooks: string[],
  excludeCaptions: Array<{ hook?: string | null; body: string | null }>,
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
    excludeHooks,
    excludeCaptions,
  };
}

function patternHookPool(context: CaptionContext) {
  const { adapter, pattern } = context;

  const pools: Record<PatternId, Partial<Record<string, string[]>>> = {
    "final-output": {
      "Curiosity hook": ["The final result makes more sense when you see this."],
      "Result hook": ["One small change made the final version cleaner."],
      "Direct statement hook": ["Start with the strongest moment."],
    },
    "behind-the-scenes": {
      "Curiosity hook": ["The clean version never shows the messy part."],
      "BTS/process hook": ["Before the clean take, there was this."],
      "Emotional hook": ["This took more patience than it looks."],
    },
    tutorial: {
      "Problem hook": ["If you are learning this, start with the simple version."],
      "Tutorial hook": ["Break this into three parts and it becomes easier."],
      "Save-worthy hook": ["Use this as a quick checklist."],
    },
    "mistake-fix": {
      "Problem hook": ["This small mistake changes the whole result."],
      "Mistake hook": ["Fix the key issue before doing more."],
      "Save-worthy hook": ["Save this before your next attempt."],
    },
    "before-after": {
      "Curiosity hook": ["The difference is easier to see side by side."],
      "Result hook": ["One change made the after look cleaner."],
      "Contrarian hook": ["More effort was not the answer."],
    },
    breakdown: {
      "Curiosity hook": ["Most people see the result. Few see the structure."],
      "Direct statement hook": ["The result works because the structure is clear."],
      "Save-worthy hook": ["Save this breakdown for later."],
    },
    "quick-tip": {
      "Result hook": ["One small cue can change the result."],
      "Tutorial hook": ["Try this before your next attempt."],
      "Save-worthy hook": ["Keep this cue for later."],
    },
    challenge: {
      "Curiosity hook": ["A simple constraint made this more interesting."],
      "Direct statement hook": ["The limit made the idea sharper."],
      "Contrarian hook": ["Less freedom can create better content."],
    },
    story: {
      "Curiosity hook": ["The result is not the full story."],
      "Emotional hook": ["I used to skip this part."],
      "Contrarian hook": ["Progress looked different than I expected."],
    },
    comparison: {
      "Curiosity hook": ["Same goal. Two very different versions."],
      "Result hook": ["This comparison makes the better choice obvious."],
      "Contrarian hook": ["The cleaner option is not always the flashier one."],
    },
    reaction: {
      "Curiosity hook": ["I would change this now."],
      "Emotional hook": ["Old attempt. Better lesson."],
      "Contrarian hook": ["Looking back made the lesson clearer."],
    },
    repurpose: {
      "Curiosity hook": [`One ${adapter.session} can become more than one post.`],
      "Direct statement hook": ["Shoot once. Pull out more angles."],
      "Save-worthy hook": ["Save this before your next content batch."],
    },
  };

  return pools[pattern];
}

function directionHookPools(
  context: CaptionContext,
): Record<CreativeDirection, Record<string, string[]>> {
  const { adapter } = context;

  return {
    balanced: {
      "Curiosity hook": ["The final result is only half the story.", "There is a useful detail hiding in this."],
      "Problem hook": ["This is the part most people skip.", "The process gets messy right before it gets clear."],
      "Result hook": ["One small change made the result cleaner.", `This is what ${adapter.proof} looks like.`],
      "Mistake hook": ["Fix the small mistake before doing more.", `Watch for ${adapter.mistake}.`],
      "BTS/process hook": ["Before the clean take, there was this.", `The process matters more than the ${adapter.result}.`],
      "Direct statement hook": ["Show the useful part clearly.", "Start with the strongest moment."],
      "Emotional hook": ["The clean result had a messy middle.", "The process taught me more than the result."],
      "Tutorial hook": ["Break it into three parts.", "Try this cue on your next attempt."],
      "Contrarian hook": ["More effort is not always the answer.", "Cleaner process beats louder editing."],
      "Save-worthy hook": ["Keep this for your next attempt.", "Save this as a quick reminder."],
    },
    viral: {
      "Curiosity hook": ["Most people miss this part.", "The final result makes more sense after this."],
      "Problem hook": ["This is why the result feels off.", "Do not skip this if you want a cleaner result."],
      "Result hook": ["This one detail changes everything.", "One decision made the whole post stronger."],
      "Mistake hook": ["This mistake is easier to fix than you think.", "Fix this before you add more effort."],
      "BTS/process hook": ["The clean version started with a messy moment.", "The best part happened before the final take."],
      "Direct statement hook": ["Watch the decision, not just the result.", "This is the part worth showing."],
      "Emotional hook": ["The result looks easy because the messy part is hidden.", "The real lesson happened before it looked clean."],
      "Tutorial hook": ["Steal this simple structure.", "Use this if you want the result to make sense."],
      "Contrarian hook": ["The final clip is not the most useful part.", "Perfect results can make boring content."],
      "Save-worthy hook": ["Save this before you try again.", "Keep this as your quick reset."],
    },
    emotional: {
      "Curiosity hook": ["The clean version never shows the messy part.", "This took more patience than it looks."],
      "Problem hook": ["I kept missing the same small detail.", "The hard part was staying with the process."],
      "Result hook": ["The result finally made sense after the correction.", "The clean take came from the messy attempts."],
      "Mistake hook": ["The mistake taught me more than the final version.", "Before it improved, it felt confusing."],
      "BTS/process hook": ["The process taught me more than the result.", "This is the part I usually forget to show."],
      "Direct statement hook": ["The middle matters.", "Show the attempt, not just the win."],
      "Emotional hook": ["I used to hide this part.", "This felt messy before it felt clean."],
      "Tutorial hook": ["Here is the lesson I would keep.", "This is what I would remember next time."],
      "Contrarian hook": ["The failed attempt was not wasted.", "The slow part made the result better."],
      "Save-worthy hook": ["Save this for the days it feels messy.", "Keep this reminder for your next session."],
    },
    educational: {
      "Curiosity hook": ["Here is the simple structure behind this.", "The result gets easier when you see the system."],
      "Problem hook": ["This is the detail most beginners miss.", "The mistake usually starts before the final take."],
      "Result hook": ["One cue made the result easier to repeat.", "A cleaner structure creates a cleaner result."],
      "Mistake hook": ["Fix the setup before fixing the outcome.", "Do not add more until this part is clear."],
      "BTS/process hook": ["The process breaks down into three parts.", "Setup, correction, result. That is the sequence."],
      "Direct statement hook": ["Use this as the framework.", "Teach the detail, then show the result."],
      "Emotional hook": ["The lesson is in the correction.", "Progress feels easier when the process is clear."],
      "Tutorial hook": ["Break this into three parts and it becomes easier.", "Use this as a quick checklist."],
      "Contrarian hook": ["The result is not the lesson. The repeatable cue is.", "More examples will not fix an unclear structure."],
      "Save-worthy hook": ["Save this checklist for later.", "Keep this framework for your next attempt."],
    },
    hinglish: {
      "Curiosity hook": ["Final result se zyada process matter karta hai.", "Clean take ke pehle messy attempts hote hain."],
      "Problem hook": ["Yeh part skip karoge toh result weak lagega.", "Galti chhoti hai, but impact bada hai."],
      "Result hook": ["Ek small change se result clean dikhta hai.", "Process clear hota hai toh result better dikhta hai."],
      "Mistake hook": ["More effort se pehle yeh mistake fix karo.", "Yeh cue miss mat karna."],
      "BTS/process hook": ["Clean take ke pehle practice hoti hai.", "Behind the result, actual lesson yahan hai."],
      "Direct statement hook": ["Pehle process dikhao.", "Result ke saath reason bhi dikhao."],
      "Emotional hook": ["Messy part bhi journey ka part hai.", "Clean result ke peeche patience hota hai."],
      "Tutorial hook": ["Ye step save kar lena, kaam aayega.", "Isko teen parts mein break karo."],
      "Contrarian hook": ["Perfect take se zyada process useful hai.", "Sirf result dikhana enough nahi hai."],
      "Save-worthy hook": ["Isko next session ke liye save kar lo.", "Ye checklist kaam aayegi."],
    },
    premium: {
      "Curiosity hook": ["A stronger result starts with a clearer decision.", "There is a quieter detail behind the polish."],
      "Problem hook": ["The result improves when the process is less noisy.", "A polished output still needs a clear foundation."],
      "Result hook": ["One refined choice made the result feel intentional.", "The final version works because the sequence is clean."],
      "Mistake hook": ["The mistake was subtle, but the correction changed everything.", "Refinement starts with removing the weak point."],
      "BTS/process hook": ["The process is what gives the result weight.", "The polished version came from a cleaner sequence."],
      "Direct statement hook": ["Make the decision visible.", "Let the structure carry the result."],
      "Emotional hook": ["The quiet work is what makes the result believable.", "The process is where the trust is built."],
      "Tutorial hook": ["Here is the refined structure.", "Use this as a cleaner way to frame the lesson."],
      "Contrarian hook": ["Polish without process feels empty.", "A premium result does not need a louder edit."],
      "Save-worthy hook": ["Save this as a cleaner posting framework.", "Keep this structure for your next piece."],
    },
    bold: {
      "Curiosity hook": ["Stop making this harder than it needs to be.", "This is the part worth repeating."],
      "Problem hook": ["Your result improves when your process gets cleaner.", "The issue is not effort. It is the process."],
      "Result hook": ["Clean process. Cleaner result.", "One clear decision made this work."],
      "Mistake hook": ["Fix this before doing more.", "Stop repeating the same weak setup."],
      "BTS/process hook": ["Show the process or the result feels empty.", "The behind-the-scenes part is the proof."],
      "Direct statement hook": ["Show the proof.", "Make the correction obvious."],
      "Emotional hook": ["The messy part is not embarrassing. It is useful.", "Do not hide the part that teaches."],
      "Tutorial hook": ["Use the cue. Repeat the result.", "Break it down or lose the lesson."],
      "Contrarian hook": ["More effort will not fix a messy process.", "Perfect results can teach nothing."],
      "Save-worthy hook": ["Save this and try it once.", "Keep this before you make the next version."],
    },
  };
}

function universalHookFallbacks(context: CaptionContext) {
  const { adapter } = context;

  return [
    "The useful part is easier to miss than the result.",
    "A cleaner process makes the result easier to trust.",
    "Small corrections create better posts.",
    "Show the attempt people can learn from.",
    "The result works because the middle changed.",
    `This is where ${adapter.proof} starts.`,
    "Make the lesson visible.",
    "Turn the messy part into the useful part.",
    "One clear cue is enough to make this better.",
    "The process gives the result a reason.",
  ];
}

function buildHooks(context: CaptionContext): GeneratedHook[] {
  const pools = directionHookPools(context);
  const patternPools = patternHookPool(context);
  const usedHooks = [...context.excludeHooks];

  return hookCategories.flatMap((category, index) => {
    const candidates = rotate(
      [
        ...pools[context.direction][category],
        ...(patternPools[category] ?? []),
      ],
      context.variant + index,
    );
    const fallbackCandidates = rotate(
      [
        ...Object.values(pools[context.direction]).flat(),
        ...universalHookFallbacks(context),
      ],
      context.variant + index,
    );
    const text = pickUniqueHook(candidates, usedHooks, fallbackCandidates);

    if (!text) {
      return [];
    }

    usedHooks.push(text);

    return {
      key: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category,
      text,
    };
  });
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
  const effectiveDirection =
    remix === "emotional"
      ? "emotional"
      : remix === "educational"
        ? "educational"
        : remix === "hinglish"
          ? "hinglish"
          : remix === "direct"
            ? "bold"
            : direction;

  if (shorter) {
    return cleanCaptionText(
      `${hook}\n\n${sentence(promise)}\n\nShow the moment. Name the lesson. Keep it easy to repeat.`,
    );
  }

  const directionBodies: Partial<Record<CreativeDirection, Partial<Record<string, string>>>> = {
    viral: {
      Simple: `Most people scroll past the final result.\n\nThey stop when they understand the decision behind it.\n\nThat is the angle I would use.`,
      "Viral / punchy": `Result first.\nThen the mistake.\nThen the fix.\n\nThat is the whole reel.`,
      "BTS / process": `The final clip is not enough.\n\nShow the moment before it worked. That is the part people remember.`,
    },
    emotional: {
      Simple: `I used to hide the messy part.\n\nNow I think that is the part people actually connect with.`,
      Emotional: `The clean version looks simple from the outside.\n\nBut the real story is the patience before it finally clicked.`,
      "BTS / process": `The process was not smooth.\n\nThat is why it feels real.`,
    },
    educational: {
      Simple: `Here is the simple structure:\nResult. Detail. Repeatable action.\n\nThat is enough to make the post useful.`,
      Educational: `Use this as a checklist:\n1. Show the outcome.\n2. Point out the key detail.\n3. Give one cue people can try.\n\nThat is what makes it save-worthy.`,
      "Save-worthy": `Save this framework:\n- Result first.\n- One useful detail.\n- One action to repeat.\n\nKeep it simple.`,
    },
    hinglish: {
      Simple: `Final result dikhana easy hai.\nProcess dikhana trust build karta hai.`,
      Hinglish: `Clean take ke pehle messy attempts hote hain.\n\nSetup dikhao. Mistake dikhao. Correction dikhao.\nResult automatically better lagega.`,
      "Save-worthy": `Ye step save kar lena.\nNext session mein kaam aayega.`,
    },
    premium: {
      Simple: `The result feels stronger when the process is clear.\n\nShow the decision that made it intentional.`,
      "BTS / process": `The polished version came from a cleaner sequence.\n\nThat process is the real value.`,
      Educational: `A useful post needs three things:\nA clear result, a precise detail, and one repeatable takeaway.`,
    },
    bold: {
      Simple: `Do not hide the useful part.\n\nShow the proof. Name the fix. Give one action.`,
      "Bold / direct": `Stop making the result do all the work.\n\nThe process is the proof.`,
      "Contrarian hook": `More effort will not fix an unclear process.`,
    },
  };
  const directionBody = directionBodies[effectiveDirection]?.[type];

  if (directionBody) {
    return cleanCaptionText(directionBody);
  }

  const bodies: Record<string, string> = {
    Simple: `Result first. Process second. Lesson last.\n\nThat is what makes this worth watching.\n\n${takeaway}`,
    "Viral / punchy": `Most people show the result.\nVery few show the decision that made it work.\n\nThat is where the post gets interesting.`,
    Emotional: `I used to think the final result was the content.\n\nNow I am realizing the process is what people connect with.\n\nThe miss, the correction, the cleaner attempt - that is the story.`,
    Educational: `Here is the structure:\n1. Show the result.\n2. Explain the key detail.\n3. Give one action viewers can repeat.\n\nSimple, useful, and easy to save.`,
    Storytelling: `This started as a simple ${subNiche} idea.\n\nThe useful part came from the middle: the setup, the correction, and the moment it finally clicked.\n\nThat is the part I would show more often.`,
    Hinglish: `Final result dikhana easy hai.\nProcess dikhana trust build karta hai.\n\nSetup, mistake, correction, clean finish.\nBas itna clear rakho.`,
    "Bold / direct": `Simple truth: ${sentence(promise)}\n\nDo not hide the useful part.\nShow the proof.\nName the correction.\nGive people one thing to try.`,
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

  const excludedCaptionKeys = new Set(
    context.excludeCaptions.map((caption) =>
      captionFingerprint({
        content_idea_id: context.idea.id,
        hook: caption.hook,
        body: caption.body,
      }),
    ),
  );
  const seenGeneratedCaptionKeys = new Set<string>();

  return dedupeGeneratedItems(captionTypes, (captionType) =>
    captionBody(context, captionType, ""),
  ).flatMap((captionType, index) => {
    if (rotatedHooks.length === 0 || rotatedCtas.length === 0 || rotatedHashtags.length === 0) {
      return [];
    }

    const hook = rotatedHooks[index % rotatedHooks.length];
    const cta = rotatedCtas[index % rotatedCtas.length];
    const hashtagSet = rotatedHashtags[index % rotatedHashtags.length];
    const body = captionBody(context, captionType, hook.text);
    const captionKey = captionFingerprint({
      content_idea_id: context.idea.id,
      hook: hook.text,
      body,
    });

    if (excludedCaptionKeys.has(captionKey) || seenGeneratedCaptionKeys.has(captionKey)) {
      return [];
    }

    seenGeneratedCaptionKeys.add(captionKey);

    return {
      key: captionType.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      caption_type: captionType,
      hook: cleanCaptionText(hook.text),
      body,
      cta: cleanCaptionText(cta.text),
      hashtags: normalizeHashtags(hashtagSet.hashtags),
      hashtag_category: hashtagSet.category,
    };
  });
}

function qualityCheckCaptionSet(captionSet: CaptionSet, context: CaptionContext): CaptionSet {
  const pools = directionHookPools(context);
  const usedHooks = [...context.excludeHooks];
  const hooks = captionSet.hooks.flatMap((hook, index) => {
    const fallbackCandidates = rotate(
      [
        ...pools[context.direction][hook.category],
        ...Object.values(pools[context.direction]).flat(),
        ...universalHookFallbacks(context),
      ],
      context.variant + index + 3,
    );
    const text = usedHooks.some((usedHook) => areHooksSimilar(hook.text, usedHook))
      ? pickUniqueHook([], usedHooks, fallbackCandidates)
      : sentence(cleanCaptionText(hook.text));

    if (!text) {
      return [];
    }

    usedHooks.push(text);

    return { ...hook, text };
  });
  const excludedCaptionKeys = new Set(
    context.excludeCaptions.map((caption) =>
      captionFingerprint({
        content_idea_id: context.idea.id,
        hook: caption.hook,
        body: caption.body,
      }),
    ),
  );
  const seenCaptionBodies = new Set<string>();
  const captions = captionSet.captions.flatMap((caption) => {
    const body = cleanCaptionText(caption.body);
    const bodyKey = normalizeHook(body);
    const captionKey = captionFingerprint({
      content_idea_id: context.idea.id,
      hook: caption.hook,
      body,
    });

    if (excludedCaptionKeys.has(captionKey)) {
      return [];
    }

    const uniqueBody = seenCaptionBodies.has(bodyKey)
      ? cleanCaptionText(`${body}\n\nTry a different opening angle: ${caption.hook}`)
      : body;

    seenCaptionBodies.add(normalizeHook(uniqueBody));

    return {
      ...caption,
      hook:
        hooks.find((hook) => hook.text === caption.hook)?.text ??
        cleanCaptionText(caption.hook),
      body: uniqueBody,
      cta: cleanCaptionText(caption.cta),
      hashtags: normalizeHashtags(caption.hashtags),
    };
  });

  return {
    ...captionSet,
    hooks,
    ctas: captionSet.ctas.map((cta) => ({
      ...cta,
      text: cleanCaptionText(cta.text),
    })),
    hashtagSets: captionSet.hashtagSets.map((set) => ({
      ...set,
      hashtags: normalizeHashtags(set.hashtags),
    })),
    captions,
  };
}

export function generateCaptionSet(
  profile: CaptionProfile,
  idea: CaptionIdea,
  options: {
    direction?: CreativeDirection;
    remix?: RemixMode;
    variant?: number;
    excludeHooks?: string[];
    excludeCaptions?: Array<{ hook?: string | null; body: string | null }>;
  } = {},
): CaptionSet {
  const direction = options.direction ?? "balanced";
  const remix = options.remix ?? "all";
  const variant = options.variant ?? 0;
  const context = buildContext(
    profile,
    idea,
    direction,
    remix,
    variant,
    options.excludeHooks?.map((hook) => normalizeCaptionMatchText(hook)) ?? [],
    options.excludeCaptions ?? [],
  );
  const hooks = buildHooks(context);
  const ctas = buildCtas(context);
  const hashtagSets = buildHashtagSets(context);

  return qualityCheckCaptionSet({
    direction,
    hooks,
    ctas,
    hashtagSets,
    captions: buildCaptions(context, hooks, ctas, hashtagSets),
  }, context);
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
