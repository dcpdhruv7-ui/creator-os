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

export type GeneratedCaption = {
  key: string;
  caption_type: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
};

export type CaptionSet = {
  hooks: string[];
  captions: GeneratedCaption[];
  ctas: string[];
  hashtags: string;
};

type NicheCaptionAdapter = {
  subject: string;
  action: string;
  audience: string;
  proof: string;
  hashtags: string[];
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

const nicheAdapters: Record<string, NicheCaptionAdapter> = {
  Dance: {
    subject: "movement",
    action: "practice the step",
    audience: "dance creators",
    proof: "cleaner timing and expression",
    hashtags: ["#dancecreator", "#dancepractice", "#choreography", "#reelsindia"],
  },
  Fitness: {
    subject: "training",
    action: "try the cue in your next session",
    audience: "fitness creators",
    proof: "better form and a stronger session",
    hashtags: ["#fitnesscreator", "#gymreels", "#workoutroutine", "#fitnessjourney"],
  },
  Food: {
    subject: "recipe",
    action: "make this meal",
    audience: "food creators",
    proof: "a simple result that still feels worth sharing",
    hashtags: ["#foodcreator", "#healthyrecipes", "#mealprep", "#budgetmeals"],
  },
  Comedy: {
    subject: "sketch",
    action: "test this timing",
    audience: "comedy creators",
    proof: "a stronger setup and cleaner punchline",
    hashtags: ["#comedycreator", "#sketchcomedy", "#reelcomedy", "#contentcreator"],
  },
  Fashion: {
    subject: "look",
    action: "try the styling switch",
    audience: "style creators",
    proof: "a more intentional outfit",
    hashtags: ["#fashioncreator", "#stylingtips", "#outfitideas", "#styleinspo"],
  },
  Education: {
    subject: "lesson",
    action: "use this explanation",
    audience: "educators",
    proof: "a clearer way to teach the idea",
    hashtags: ["#educationcreator", "#learnonline", "#studygram", "#explainer"],
  },
  Gaming: {
    subject: "play",
    action: "try this decision in your next match",
    audience: "gaming creators",
    proof: "a better read on the moment",
    hashtags: ["#gamingcreator", "#gameplay", "#gamingreels", "#rankedgrind"],
  },
  "Self-Improvement": {
    subject: "habit",
    action: "test the smaller version today",
    audience: "self-improvement creators",
    proof: "a routine you can actually repeat",
    hashtags: ["#selfimprovement", "#habitbuilding", "#mindsetcreator", "#growthjourney"],
  },
  Cinematography: {
    subject: "shot",
    action: "try the setup on your next shoot",
    audience: "cinematography creators",
    proof: "a more cinematic frame",
    hashtags: ["#cinematography", "#filmmaking", "#shotbreakdown", "#creatorworkflow"],
  },
  Animation: {
    subject: "animation",
    action: "apply this pass to your next scene",
    audience: "animation creators",
    proof: "motion that reads faster",
    hashtags: ["#animation", "#animationprocess", "#motiondesign", "#digitalcreator"],
  },
  "AI & Technology": {
    subject: "workflow",
    action: "test this workflow",
    audience: "tech creators",
    proof: "a more useful output",
    hashtags: ["#aicreator", "#techcreator", "#workflowtips", "#productivitytools"],
  },
  "Content Creation": {
    subject: "post",
    action: "use this structure in your next post",
    audience: "content creators",
    proof: "a clearer hook and stronger takeaway",
    hashtags: ["#contentcreator", "#creatorstrategy", "#hookwriting", "#contentideas"],
  },
};

const fallbackAdapter = nicheAdapters["Content Creation"];

const captionTypes = ["Simple", "Viral / punchy", "Emotional", "Educational", "Hinglish"];

function clean(value: string | null | undefined, fallback = "") {
  return value?.trim() || fallback;
}

function sentence(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  return trimmed.endsWith(".") || trimmed.endsWith("?") || trimmed.endsWith("!")
    ? trimmed
    : `${trimmed}.`;
}

function lowerFirst(value: string) {
  const trimmed = value.trim();
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function hashtag(value: string) {
  const cleaned = value.replace(/&/g, "and").replace(/[^a-zA-Z0-9 ]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  return `#${cleaned
    .split(/\s+/)
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("")}`;
}

function getPattern(idea: CaptionIdea): PatternId {
  const text = `${idea.title} ${idea.format} ${idea.hook} ${idea.caption_angle} ${idea.goal}`.toLowerCase();

  if (text.includes("bts") || text.includes("behind")) return "behind-the-scenes";
  if (text.includes("mistake") || text.includes("fix") || text.includes("form")) return "mistake-fix";
  if (text.includes("tutorial") || text.includes("how-to") || text.includes("teach")) return "tutorial";
  if (text.includes("before") || text.includes("after") || text.includes("transformation")) return "before-after";
  if (text.includes("breakdown")) return "breakdown";
  if (text.includes("quick tip") || text.includes("tip")) return "quick-tip";
  if (text.includes("challenge")) return "challenge";
  if (text.includes("journey") || text.includes("story")) return "story";
  if (text.includes("comparison") || text.includes("side-by-side") || text.includes(" vs ")) return "comparison";
  if (text.includes("reaction") || text.includes("commentary")) return "reaction";
  if (text.includes("multiplication") || text.includes("repurpose") || text.includes("multiple posts")) return "repurpose";

  return "final-output";
}

function getIdeaLabel(profile: CaptionProfile, idea: CaptionIdea) {
  return clean(idea.sub_niche, profile.subNiche);
}

function buildHooks(profile: CaptionProfile, idea: CaptionIdea, pattern: PatternId) {
  const niche = clean(idea.niche, profile.niche);
  const subNiche = getIdeaLabel(profile, idea);
  const adapter = nicheAdapters[niche] ?? fallbackAdapter;
  const subject = adapter.subject;
  const proof = adapter.proof;

  const patternHooks: Record<PatternId, string[]> = {
    "final-output": [
      `This is the ${subNiche} result I would lead with.`,
      `The final ${subject} looks simple, but one choice made it work.`,
      `If you only watch one part of this, watch the result first.`,
      `Here is the payoff from one focused ${subNiche} session.`,
      `This is what ${proof} can look like in practice.`,
    ],
    "behind-the-scenes": [
      `This is what the final ${subject} does not show.`,
      `Before the clean result, this happened.`,
      `The useful part was hidden in the messy middle.`,
      `One ${subNiche} result, a few imperfect attempts, and one cleaner finish.`,
      `The behind-the-scenes process matters more than the final clip.`,
    ],
    tutorial: [
      `Save this if you are learning ${subNiche}.`,
      `Here is the simplest way to understand this ${subject}.`,
      `Three steps made this ${subNiche} idea easier to repeat.`,
      `Try this before you overcomplicate the next attempt.`,
      `This is the version I wish someone explained first.`,
    ],
    "mistake-fix": [
      `This mistake is weakening your ${subject}.`,
      `Fix this before making the next attempt harder.`,
      `Your ${subject} is not the problem. This small habit is.`,
      `If your result feels off, check this first.`,
      `One correction can change the whole ${subNiche} result.`,
    ],
    "before-after": [
      `The before and after tells the whole lesson.`,
      `One focused change created this difference.`,
      `The result improved when I changed this one part.`,
      `Same idea, better execution.`,
      `This is why the process matters more than the first try.`,
    ],
    breakdown: [
      `The result works because of these parts.`,
      `Let me break down what actually made this work.`,
      `Most people see the result. Here is the structure underneath.`,
      `This ${subNiche} idea has three pieces worth noticing.`,
      `Steal the structure, not the exact post.`,
    ],
    "quick-tip": [
      `Try this one ${subNiche} tip today.`,
      `Small fix, cleaner result.`,
      `This takes a few seconds but changes the outcome.`,
      `Do this before your next attempt.`,
      `One quick cue for ${proof}.`,
    ],
    challenge: [
      `Can this work with one clear constraint?`,
      `I made this harder on purpose to learn faster.`,
      `This ${subNiche} challenge exposed the real problem.`,
      `The constraint made the result more creative.`,
      `Try this challenge if you want a cleaner idea fast.`,
    ],
    story: [
      `This started messy, but the middle taught me something.`,
      `The result is not the full story.`,
      `I almost skipped this lesson.`,
      `This is the honest path behind the ${subNiche} result.`,
      `Progress looked different than I expected.`,
    ],
    comparison: [
      `Which version works better here?`,
      `Same goal, two different approaches.`,
      `This comparison changed how I think about ${subNiche}.`,
      `Version A looks easier. Version B teaches more.`,
      `Here is when each option actually makes sense.`,
    ],
    reaction: [
      `I would change this now, and here is why.`,
      `Reacting to my own ${subNiche} work with one honest lesson.`,
      `This looked fine at first, but I missed one thing.`,
      `Here is what I would keep, cut, and improve.`,
      `Old attempt, new perspective.`,
    ],
    repurpose: [
      `Do not stop at one post from this session.`,
      `One ${subNiche} idea can become multiple posts.`,
      `This is how I would turn one effort into a content batch.`,
      `Shoot once, publish smarter.`,
      `Here are the post angles hiding inside one ${subject}.`,
    ],
  };

  return patternHooks[pattern];
}

function buildCtas(goal: string, adapter: NicheCaptionAdapter) {
  const goalText = goal.toLowerCase();

  if (goalText.includes("save")) {
    return [
      "Save this for your next attempt.",
      `Try this in your next ${adapter.subject} session.`,
      "Send this to someone who is practicing the same thing.",
    ];
  }

  if (goalText.includes("comment")) {
    return [
      "Which version would you choose?",
      "Comment PLAN if you want the full breakdown.",
      "Tell me what you would change first.",
    ];
  }

  if (goalText.includes("trust") || goalText.includes("connection")) {
    return [
      "Share this with someone who only sees the final result.",
      "What part of the process should I show next?",
      "Follow for the real process behind the results.",
    ];
  }

  if (goalText.includes("education") || goalText.includes("authority")) {
    return [
      "Save this if the correction helped.",
      "Comment BREAKDOWN if you want the next layer.",
      "Try the cue once and compare the difference.",
    ];
  }

  return [
    "Save this for later.",
    `Try this in your next ${adapter.subject} session.`,
    "Share this with someone who needs the idea.",
  ];
}

function buildHashtags(profile: CaptionProfile, idea: CaptionIdea, pattern: PatternId) {
  const niche = clean(idea.niche, profile.niche);
  const subNiche = getIdeaLabel(profile, idea);
  const format = clean(idea.format, "content idea");
  const adapter = nicheAdapters[niche] ?? fallbackAdapter;
  const patternTags: Record<PatternId, string[]> = {
    "final-output": ["#reels", "#finalresult"],
    "behind-the-scenes": ["#behindthescenes", "#creatorprocess"],
    tutorial: ["#tutorial", "#howto"],
    "mistake-fix": ["#mistakefix", "#formcheck"],
    "before-after": ["#beforeafter", "#transformation"],
    breakdown: ["#breakdown", "#contentstrategy"],
    "quick-tip": ["#quicktip", "#creatortips"],
    challenge: ["#challenge", "#creatorchallenge"],
    story: ["#creatorjourney", "#progress"],
    comparison: ["#comparison", "#sidebyside"],
    reaction: ["#reaction", "#commentary"],
    repurpose: ["#repurposecontent", "#contentbatching"],
  };
  const candidates = [
    ...adapter.hashtags,
    hashtag(subNiche),
    hashtag(format),
    ...patternTags[pattern],
    "#creatorjourney",
  ].filter(Boolean) as string[];

  return [...new Set(candidates)].slice(0, 8).join(" ");
}

function keyTakeaway(idea: CaptionIdea, adapter: NicheCaptionAdapter) {
  const angle = clean(idea.caption_angle);

  if (angle) {
    return sentence(angle);
  }

  return `The goal is ${adapter.proof}.`;
}

function buildBodies(
  profile: CaptionProfile,
  idea: CaptionIdea,
  hooks: string[],
  ctas: string[],
  hashtags: string,
) {
  const niche = clean(idea.niche, profile.niche);
  const subNiche = getIdeaLabel(profile, idea);
  const adapter = nicheAdapters[niche] ?? fallbackAdapter;
  const format = clean(idea.format, "content idea");
  const shotList = clean(idea.shot_list, `Show the result, explain the process, and close with ${adapter.proof}.`);
  const takeaway = keyTakeaway(idea, adapter);
  const tone = lowerFirst(clean(profile.contentTone, "clear and useful"));
  const style = lowerFirst(clean(profile.captionStyle, "short and practical"));

  const bodies = [
    `${takeaway}\n\nKeep it simple: show the result, show the key moment, and make the next step obvious.`,
    `${hooks[1]}\n\nResult first.\nProcess second.\nLesson last.\n\nThat is the structure I would use for this ${format.toLowerCase()}.`,
    `The polished version is only one part of it.\n\nThe real value is in the attempt, the correction, and the cleaner result after it. That is where ${adapter.audience} build trust.`,
    `Use this as the structure:\n1. Open with the strongest moment.\n2. Show the useful detail from the shot list.\n3. Explain why it matters.\n\nFor this idea: ${shotList}`,
    `Agar aap ${subNiche} content bana rahe ho, start with the real result.\n\nPhir ek simple lesson dikhao: ${lowerFirst(takeaway)}\n\nClean, useful, and easy to save.`,
  ];

  return bodies.map((body, index) => ({
    key: captionTypes[index].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    caption_type: captionTypes[index],
    hook: hooks[index],
    body:
      index === 0
        ? `${body}\n\nTone: ${tone}.`
        : index === 3
          ? `${body}\n\nKeep the caption ${style}.`
          : body,
    cta: ctas[index % ctas.length],
    hashtags,
  }));
}

export function generateCaptionSet(profile: CaptionProfile, idea: CaptionIdea): CaptionSet {
  const pattern = getPattern(idea);
  const niche = clean(idea.niche, profile.niche);
  const adapter = nicheAdapters[niche] ?? fallbackAdapter;
  const hooks = buildHooks(profile, idea, pattern);
  const ctas = buildCtas(clean(idea.goal, "Growth"), adapter);
  const hashtags = buildHashtags(profile, idea, pattern);

  return {
    hooks,
    ctas,
    hashtags,
    captions: buildBodies(profile, idea, hooks, ctas, hashtags),
  };
}
