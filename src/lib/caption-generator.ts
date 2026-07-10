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
  captionAngle: string;
  tone: string;
  captionStyle: string;
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

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("-"),
    )
    .join(" ");
}

function hashtag(value: string) {
  const cleaned = value.replace(/&/g, "and").replace(/[^a-zA-Z0-9 ]/g, "").trim();

  if (!cleaned) return null;

  return `#${cleaned
    .split(/\s+/)
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("")}`;
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
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
  if (text.includes("journey") || text.includes("story") || text.includes("progress")) return "story";
  if (text.includes("comparison") || text.includes("side-by-side") || text.includes(" vs ")) return "comparison";
  if (text.includes("reaction") || text.includes("commentary")) return "reaction";
  if (text.includes("multiplication") || text.includes("repurpose") || text.includes("multiple posts")) return "repurpose";

  return "final-output";
}

function patternPromise(context: CaptionContext) {
  const { adapter, pattern, subNiche } = context;

  const promises: Record<PatternId, string> = {
    "final-output": `the payoff from this ${subNiche} result`,
    "behind-the-scenes": `the hidden process behind the final ${adapter.subject}`,
    tutorial: `the repeatable steps behind this ${adapter.subject}`,
    "mistake-fix": `the correction that fixes ${adapter.mistake}`,
    "before-after": "the exact change between the before and after",
    breakdown: `the structure underneath this ${subNiche} idea`,
    "quick-tip": `one quick cue for ${adapter.proof}`,
    challenge: `what the constraint reveals about this ${subNiche} idea`,
    story: `the honest turn behind the ${adapter.result}`,
    comparison: "which version works better and why",
    reaction: "what the old attempt teaches now",
    repurpose: `how one ${adapter.session} becomes multiple posts`,
  };

  return promises[pattern];
}

function buildContext(
  profile: CaptionProfile,
  idea: CaptionIdea,
  direction: CreativeDirection,
  remix: RemixMode,
  variant: number,
): CaptionContext {
  const niche = clean(idea.niche, profile.niche);
  const subNiche = clean(idea.sub_niche, profile.subNiche);
  const adapter = nicheAdapters[niche] ?? fallbackAdapter;

  return {
    profile,
    idea,
    adapter,
    pattern: getPattern(idea),
    direction,
    remix,
    variant,
    niche,
    subNiche,
    format: clean(idea.format, "content idea"),
    goal: clean(idea.goal, "Growth"),
    originalHook: clean(idea.hook, `Here is a ${subNiche} idea worth testing.`),
    shotList: clean(idea.shot_list, `Show the result, reveal the process, and end with ${adapter.proof}.`),
    captionAngle: clean(idea.caption_angle, `Explain ${patternPromise({ adapter, pattern: getPattern(idea), subNiche } as CaptionContext)}.`),
    tone: lowerFirst(clean(profile.contentTone, "clear and useful")),
    captionStyle: lowerFirst(clean(profile.captionStyle, "short and practical")),
  };
}

function directionLead(context: CaptionContext) {
  const { direction, remix } = context;
  const effective = remix === "direct" ? "bold" : remix === "emotional" ? "emotional" : remix === "educational" ? "educational" : remix === "hinglish" ? "hinglish" : direction;

  const leads: Record<CreativeDirection, string> = {
    balanced: "",
    viral: "Stop making this harder than it needs to be: ",
    emotional: "The honest part nobody sees: ",
    educational: "Save this framework: ",
    hinglish: "Real talk: ",
    premium: "A cleaner way to present this: ",
    bold: "Do this before anything else: ",
  };

  return leads[effective];
}

function buildHooks(context: CaptionContext): GeneratedHook[] {
  const { adapter, subNiche, pattern, direction, variant } = context;
  const promise = patternPromise(context);
  const lead = directionLead(context);

  const patternPhrases: Record<PatternId, string[]> = {
    "final-output": [
      `The final ${adapter.subject} is the hook.`,
      `Show the result first, explain the decision second.`,
      `This is the payoff from one focused ${adapter.session}.`,
    ],
    "behind-the-scenes": [
      `The final clip does not show the messy part.`,
      `Before the clean take, there was setup, correction, and another attempt.`,
      `The process behind this ${adapter.subject} is more useful than the result.`,
    ],
    tutorial: [
      `Learn this in steps, not guesses.`,
      `Save this before your next ${adapter.session}.`,
      `The breakdown is simpler than it looks.`,
    ],
    "mistake-fix": [
      `This mistake is weakening your ${adapter.subject}.`,
      `Fix this before adding more effort.`,
      `The problem is not the goal. It is the correction you skipped.`,
    ],
    "before-after": [
      `One change created the before and after.`,
      `Same idea, cleaner execution.`,
      `The difference is easier to see side by side.`,
    ],
    breakdown: [
      `Most people see the result. Here is the structure.`,
      `This works because of the parts underneath.`,
      `Steal the framework, not the exact post.`,
    ],
    "quick-tip": [
      `One quick cue can change the result.`,
      `Try this before your next attempt.`,
      `Small fix, clearer outcome.`,
    ],
    challenge: [
      `The constraint made the idea sharper.`,
      `This challenge exposed the real problem.`,
      `Can this still work with one clear limit?`,
    ],
    story: [
      `The result is not the full story.`,
      `This started messy, but the middle taught me something.`,
      `Progress looked different than expected.`,
    ],
    comparison: [
      `Same goal, two very different choices.`,
      `Which version actually works better here?`,
      `This comparison makes the decision clearer.`,
    ],
    reaction: [
      `I would change this now, and here is why.`,
      `Old attempt, better judgment now.`,
      `Here is what I would keep, cut, and improve.`,
    ],
    repurpose: [
      `Do not stop at one post from this ${adapter.session}.`,
      `One ${subNiche} idea can become multiple posts.`,
      `Shoot once, publish smarter.`,
    ],
  };

  const baseHooks = [
    `What if the most useful part of this ${subNiche} idea is not the final result?`,
    `Your ${adapter.subject} is not stuck. The missing piece is ${promise}.`,
    `This is what ${adapter.proof} actually looks like in ${subNiche}.`,
    `${adapter.mistake.charAt(0).toUpperCase() + adapter.mistake.slice(1)} is the mistake to fix first.`,
    `Behind this ${adapter.result}: ${adapter.process}.`,
    `${lead}${titleCase(subNiche)} gets better when you make one decision clear.`,
    `I almost skipped the part that made this ${adapter.subject} work.`,
    `Save this if you want to repeat the ${adapter.result} without guessing.`,
    `More effort will not fix a weak process.`,
    `Keep this as your quick ${subNiche} checklist.`,
  ];
  const directionHooks: Record<CreativeDirection, string[]> = {
    balanced: baseHooks,
    viral: [
      `This is why your ${subNiche} content is not landing yet.`,
      `Nobody talks about this part of the ${adapter.session}.`,
      `If this looks easy, you missed the best part.`,
      `One decision changed the whole result.`,
      ...baseHooks.slice(4),
    ],
    emotional: [
      `The final result looks clean, but the middle was not.`,
      `This is the part of ${subNiche} progress I wish people showed more.`,
      `I needed the failed attempt to find the cleaner version.`,
      ...baseHooks.slice(3),
    ],
    educational: [
      `Here is the ${subNiche} checklist I would save.`,
      `Break this into three parts before your next attempt.`,
      `The lesson is not the result. It is the repeatable cue.`,
      ...baseHooks.slice(3),
    ],
    hinglish: [
      `Final result clean hai, but process mein lesson hai.`,
      `${titleCase(subNiche)} improve karna hai? Start with this one cue.`,
      `Yeh mistake fix karo before adding more effort.`,
      ...baseHooks.slice(3),
    ],
    premium: [
      `A refined ${subNiche} result starts with a clearer process.`,
      `Here is the decision that made this ${adapter.subject} feel intentional.`,
      `The polished result comes from a cleaner sequence.`,
      ...baseHooks.slice(3),
    ],
    bold: [
      `Stop hiding the process. That is the content.`,
      `Fix this before you post another ${subNiche} clip.`,
      `The result is not random. The process is visible.`,
      ...baseHooks.slice(3),
    ],
  };
  const selectedHooks = rotate(directionHooks[direction], variant).slice(0, 10);

  return hookCategories.map((category, index) => ({
    key: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category,
    text: sentence(selectedHooks[index] ?? patternPhrases[pattern][index % patternPhrases[pattern].length]),
  }));
}

function buildCtas(context: CaptionContext): GeneratedCta[] {
  const { adapter, goal, direction, remix } = context;
  const goalText = `${goal} ${direction} ${remix}`.toLowerCase();
  const ctaGroups: Record<string, string[]> = {
    Reach: [
      "Share this with someone building the same skill.",
      "Send this to a creator who needs a cleaner idea.",
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
      "Comment PROCESS if you want the next layer.",
    ],
    Education: [
      "Try this cue once and compare the difference.",
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
    `Try this in your next ${adapter.subject} session.`,
  ]);

  return mixed.slice(0, 6).map((text, index) => ({
    key: `${selected.toLowerCase()}-${index}`,
    category: index < 3 ? selected : "Extra option",
    text,
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

  const sets = [
    {
      key: "niche",
      category: "Niche hashtags",
      tags: [...adapter.hashtags, specific],
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
    hashtags: unique(set.tags).slice(0, 8).join(" "),
  }));
}

function captionBody(context: CaptionContext, type: string, hook: string) {
  const { adapter, captionAngle, captionStyle, direction, remix, format, shotList, subNiche } = context;
  const takeaway = sentence(captionAngle);
  const promise = patternPromise(context);
  const shorter = remix === "shorter";
  const emotional = direction === "emotional" || remix === "emotional";
  const direct = direction === "bold" || remix === "direct";

  if (shorter) {
    return `${hook}\n\n${sentence(promise)}\n\nKeep it clear. Show the moment. Make the next step obvious.`;
  }

  const bodies: Record<string, string> = {
    Simple: `${takeaway}\n\nShow the strongest moment first, then explain the one detail that makes it repeatable.\n\nKeep the caption ${captionStyle}.`,
    "Viral / punchy": `${hook}\n\nResult first.\nProcess second.\nLesson last.\n\nThat is the easiest way to make this ${format.toLowerCase()} feel worth watching.`,
    Emotional: `${emotional ? "The honest part is this:" : "The polished version is only one part of it."}\n\nThe useful lesson is in the attempt, the correction, and the moment the result finally starts to feel cleaner.\n\nThat is where ${adapter.audience} build trust.`,
    Educational: `Use this as the structure:\n1. Open with the strongest result.\n2. Show the useful process detail.\n3. Explain the correction or cue.\n4. End with the repeatable takeaway.\n\nFor this idea: ${shotList}`,
    Storytelling: `This started with a simple ${subNiche} idea.\n\nThen the process exposed the real lesson: ${lowerFirst(promise)}.\n\nThe final result matters, but the turning point is what people will remember.`,
    Hinglish: `${hook}\n\nAgar aap ${subNiche} content bana rahe ho, final result se start karo.\n\nPhir real process dikhao: setup, mistake, correction, and clean finish.\n\nSimple rakho, useful rakho, save-worthy banao.`,
    "Bold / direct": `${direct ? "Be direct:" : "Straight answer:"} ${sentence(promise)}\n\nDo not hide the process. Do not over-explain the setup. Show the proof, name the correction, and give the viewer one action.`,
    "Community / engagement": `${hook}\n\nI want to know how other creators would handle this.\n\nWould you lead with the final result, the mistake, or the process? This is the kind of choice that changes the whole post.`,
    "BTS / process": `The final ${adapter.subject} is only the last frame.\n\nThe content is really in the process: ${adapter.process}.\n\nShow that clearly and the post becomes more useful than a simple result clip.`,
    "Save-worthy": `Save this as a mini checklist:\n- Lead with the result.\n- Show the process detail.\n- Name the mistake or decision.\n- End with the next action.\n\nThat is enough to turn this idea into a cleaner post.`,
  };

  return bodies[type] ?? bodies.Simple;
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

  return captionTypes.map((captionType, index) => {
    const hook = rotatedHooks[index % rotatedHooks.length];
    const cta = rotatedCtas[index % rotatedCtas.length];
    const hashtagSet = rotatedHashtags[index % rotatedHashtags.length];

    return {
      key: captionType.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      caption_type: captionType,
      hook: hook.text,
      body: captionBody(context, captionType, hook.text),
      cta: cta.text,
      hashtags: hashtagSet.hashtags,
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
