export type IdeaProfile = {
  niche: string;
  subNiche: string;
  energyStyle: string;
  contentTone: string;
  editingStyle: string;
  captionStyle: string;
  growthAngle: string;
  selectedCreatorNames: string[];
};

export type GeneratedIdea = {
  key: string;
  title: string;
  hook: string;
  niche: string;
  sub_niche: string;
  format: string;
  shot_list: string;
  caption_angle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  goal: string;
  priority: "Low" | "Medium" | "High";
  status: "Idea";
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

type NicheAdapter = {
  finalOutput: string;
  finalFormat: string;
  effort: string;
  teachUnit: string;
  mistake: string;
  beforeAfter: string;
  breakdownTarget: string;
  tip: string;
  constraint: string;
  storyArc: string;
  comparison: string;
  reactionTarget: string;
  repurpose: string[];
  preferredPatterns: PatternId[];
};

type PatternContext = {
  profile: IdeaProfile;
  adapter: NicheAdapter;
};

type UniversalIdeaPattern = {
  id: PatternId;
  label: string;
  difficulty: GeneratedIdea["difficulty"];
  goal: string;
  priority: GeneratedIdea["priority"];
  title: (context: PatternContext) => string;
  hook: (context: PatternContext) => string;
  shotList: (context: PatternContext) => string;
};

function titleCase(value: string) {
  const minorWords = new Set(["and", "or", "to", "vs"]);

  return value
    .split(" ")
    .map((word, index) => {
      if (index > 0 && minorWords.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      return word
        .split("-")
        .map((part, partIndex) =>
          partIndex > 0 && minorWords.has(part.toLowerCase())
            ? part.toLowerCase()
            : part.charAt(0).toUpperCase() + part.slice(1),
        )
        .join("-");
    })
    .join(" ");
}

export const nicheAdapters: Record<string, NicheAdapter> = {
  Dance: {
    finalOutput: "final performance reel",
    finalFormat: "Performance Reel",
    effort: "practice session",
    teachUnit: "step or eight-count",
    mistake: "rushing the beat instead of finishing the movement",
    beforeAfter: "first take vs polished final take",
    breakdownTarget: "choreography, expressions, and musical accents",
    tip: "clean one transition before adding speed",
    constraint: "perform it in one location with one camera move",
    storyArc: "rough practice to confident performance",
    comparison: "simple execution vs performance-level expression",
    reactionTarget: "self-recorded first take and explain what you changed",
    repurpose: ["final performance", "practice BTS", "step tutorial", "mistake fix"],
    preferredPatterns: ["challenge", "story"],
  },
  Comedy: {
    finalOutput: "finished sketch with the strongest punchline",
    finalFormat: "Comedy Sketch",
    effort: "sketch shoot",
    teachUnit: "setup, escalation, and punchline",
    mistake: "explaining the setup for too long",
    beforeAfter: "flat delivery vs timed comedic delivery",
    breakdownTarget: "setup, pause, reaction, and punchline",
    tip: "cut one line before the punchline",
    constraint: "use one location and one recurring character",
    storyArc: "real observation to finished sketch",
    comparison: "subtle delivery vs exaggerated delivery",
    reactionTarget: "alternate punchline from your own sketch",
    repurpose: ["final sketch", "character BTS", "timing breakdown", "alternate ending"],
    preferredPatterns: ["reaction", "comparison"],
  },
  Food: {
    finalOutput: "finished dish reveal",
    finalFormat: "Finished Dish Reel",
    effort: "recipe session",
    teachUnit: "ingredient-to-plate step",
    mistake: "skipping the texture or timing cue",
    beforeAfter: "raw ingredients vs plated result",
    breakdownTarget: "ingredients, method, cost, and nutrition",
    tip: "show the texture cue that tells viewers it is ready",
    constraint: "make it with five ingredients or one pan",
    storyArc: "ingredient choice to first bite",
    comparison: "regular version vs budget or high-protein version",
    reactionTarget: "first taste and an honest texture review",
    repurpose: ["finished dish", "prep BTS", "recipe tutorial", "cost or nutrition breakdown"],
    preferredPatterns: ["comparison", "story"],
  },
  Fitness: {
    finalOutput: "completed workout or progress result",
    finalFormat: "Workout Result Reel",
    effort: "workout session",
    teachUnit: "exercise or form cue",
    mistake: "losing form to chase speed or weight",
    beforeAfter: "uncorrected form vs corrected form",
    breakdownTarget: "warm-up, working set, form cue, and finish",
    tip: "use one cue the viewer can test on the next set",
    constraint: "complete the session with minimal equipment",
    storyArc: "starting point to measurable progress",
    comparison: "common form vs safer effective form",
    reactionTarget: "your own old training clip and the lesson it taught",
    repurpose: ["workout reel", "form correction", "motivation clip", "progress update"],
    preferredPatterns: ["story", "challenge"],
  },
  Gaming: {
    finalOutput: "best gameplay highlight",
    finalFormat: "Gameplay Highlight",
    effort: "gaming session",
    teachUnit: "decision, mechanic, or tactical move",
    mistake: "reacting without reading the situation",
    beforeAfter: "old decision-making vs improved play",
    breakdownTarget: "setup, decision, execution, and outcome",
    tip: "pause before the key decision and explain the cue",
    constraint: "win using one unusual rule or loadout",
    storyArc: "failed attempt to clutch result",
    comparison: "safe play vs aggressive play",
    reactionTarget: "your own clutch, fail, or rank-changing moment",
    repurpose: ["highlight", "funny fail", "tactical tip", "reaction or rank update"],
    preferredPatterns: ["reaction", "challenge"],
  },
  Fashion: {
    finalOutput: "finished outfit or look reveal",
    finalFormat: "Final Look Reel",
    effort: "styling session",
    teachUnit: "styling decision or outfit formula",
    mistake: "adding pieces without a clear focal point",
    beforeAfter: "base outfit vs fully styled look",
    breakdownTarget: "silhouette, color, layers, and accessories",
    tip: "change one proportion before buying another item",
    constraint: "build the look around one existing wardrobe piece",
    storyArc: "occasion brief to final look",
    comparison: "premium option vs budget alternative",
    reactionTarget: "your first outfit option and why you changed it",
    repurpose: ["final look", "styling breakdown", "budget alternative", "accessory detail"],
    preferredPatterns: ["comparison", "story"],
  },
  Education: {
    finalOutput: "clear lesson with one useful takeaway",
    finalFormat: "Clear Explainer",
    effort: "topic lesson",
    teachUnit: "concept, example, and takeaway",
    mistake: "introducing detail before giving the main idea",
    beforeAfter: "confusing explanation vs clear framework",
    breakdownTarget: "definition, example, application, and recap",
    tip: "use one concrete example before adding theory",
    constraint: "teach the concept in under 60 seconds",
    storyArc: "confusion to understanding",
    comparison: "common method vs clearer framework",
    reactionTarget: "a common answer and explain what it misses",
    repurpose: ["explainer", "common mistake", "framework", "example or quiz"],
    preferredPatterns: ["comparison", "challenge"],
  },
  "Self-Improvement": {
    finalOutput: "completed routine or visible progress check",
    finalFormat: "Routine or Progress Reel",
    effort: "habit session",
    teachUnit: "routine step or mindset reframe",
    mistake: "making the habit too large to repeat",
    beforeAfter: "old routine vs sustainable routine",
    breakdownTarget: "trigger, action, friction, and review",
    tip: "reduce the habit to the smallest repeatable version",
    constraint: "follow the routine for seven honest days",
    storyArc: "setback to a more sustainable system",
    comparison: "motivation-only approach vs system-led approach",
    reactionTarget: "an old goal and what you would change now",
    repurpose: ["routine reel", "habit lesson", "mistake fix", "progress check"],
    preferredPatterns: ["story", "challenge"],
  },
  Cinematography: {
    finalOutput: "final cinematic shot or edited sequence",
    finalFormat: "Final Cinematic",
    effort: "cinematic shoot",
    teachUnit: "shot, lighting choice, or camera move",
    mistake: "moving the camera without a storytelling reason",
    beforeAfter: "ungraded shot vs final color grade",
    breakdownTarget: "framing, light, movement, sound, and grade",
    tip: "lock the story purpose before choosing camera movement",
    constraint: "create the sequence with one light or one phone",
    storyArc: "blank location to cinematic sequence",
    comparison: "available light vs shaped light",
    reactionTarget: "your first edit and explain the cut you changed",
    repurpose: ["final cinematic", "shoot BTS", "shot breakdown", "color-grade before and after"],
    preferredPatterns: ["comparison", "story"],
  },
  Animation: {
    finalOutput: "finished animation loop or scene",
    finalFormat: "Final Animation",
    effort: "animation session",
    teachUnit: "pose, motion principle, or effects step",
    mistake: "adding detail before the motion reads clearly",
    beforeAfter: "blocking pass vs polished animation",
    breakdownTarget: "idea, key poses, timing, polish, and render",
    tip: "make the key pose readable before adding in-betweens",
    constraint: "tell the story in one short seamless loop",
    storyArc: "rough sketch to final motion",
    comparison: "linear movement vs eased expressive movement",
    reactionTarget: "an early animation pass and the fix it needed",
    repurpose: ["final animation", "process timelapse", "principle tutorial", "before-and-after polish"],
    preferredPatterns: ["story", "challenge"],
  },
  "AI & Technology": {
    finalOutput: "finished tool demo or working workflow",
    finalFormat: "Tool or Workflow Demo",
    effort: "tool test",
    teachUnit: "workflow step, prompt, or feature",
    mistake: "showing features without a real task or outcome",
    beforeAfter: "manual process vs assisted workflow",
    breakdownTarget: "input, setup, process, output, and limitation",
    tip: "start with the task before naming the tool",
    constraint: "solve one useful task with the simplest workflow",
    storyArc: "repetitive problem to working system",
    comparison: "tool A vs tool B for one specific task",
    reactionTarget: "a generated result and explain what still needs judgment",
    repurpose: ["tool demo", "workflow tutorial", "use case", "mistake or comparison"],
    preferredPatterns: ["comparison", "reaction"],
  },
  "Content Creation": {
    finalOutput: "finished post, reel, or hook test",
    finalFormat: "Final Content Example",
    effort: "content session",
    teachUnit: "hook, structure, or editing decision",
    mistake: "starting with context instead of viewer relevance",
    beforeAfter: "weak opening vs stronger opening",
    breakdownTarget: "hook, structure, edit, caption, and CTA",
    tip: "make the first line useful before making it clever",
    constraint: "create the post from one idea in under 30 minutes",
    storyArc: "rough idea to published content",
    comparison: "generic hook vs niche-specific hook",
    reactionTarget: "your own older post and the change you would make",
    repurpose: ["final post", "creation BTS", "hook lesson", "editing or caption breakdown"],
    preferredPatterns: ["comparison", "story"],
  },
};

const fallbackAdapter = nicheAdapters.Education;

export const formatTemplates: Record<
  PatternId,
  (context: PatternContext) => string
> = {
  "final-output": ({ adapter }) => adapter.finalFormat,
  "behind-the-scenes": ({ adapter }) => `${titleCase(adapter.effort)} BTS`,
  tutorial: ({ adapter }) => `${titleCase(adapter.teachUnit)} Tutorial`,
  "mistake-fix": ({ adapter }) => `${titleCase(adapter.teachUnit)} Mistake Fix`,
  "before-after": () => "Before vs After",
  breakdown: ({ adapter }) => `${titleCase(adapter.breakdownTarget)} Breakdown`,
  "quick-tip": () => "Quick Tip",
  challenge: ({ profile }) => `${profile.subNiche} Challenge`,
  story: () => "Story / Journey",
  comparison: () => "Side-by-Side Comparison",
  reaction: () => "Reaction / Commentary",
  repurpose: () => "Content Multiplication Plan",
};

export const universalIdeaPatterns: UniversalIdeaPattern[] = [
  {
    id: "final-output",
    label: "Final Output",
    difficulty: "Medium",
    goal: "Reach",
    priority: "High",
    title: ({ profile, adapter }) =>
      `${profile.subNiche}: ${titleCase(adapter.finalOutput)}`,
    hook: ({ adapter }) =>
      `Here is the ${adapter.finalOutput} from one focused ${adapter.effort}.`,
    shotList: ({ adapter }) =>
      `Record the ${adapter.finalOutput} first. Capture one opening payoff, one wide context shot, two useful details, and a clean ending that can loop.`,
  },
  {
    id: "behind-the-scenes",
    label: "Behind the Scenes",
    difficulty: "Easy",
    goal: "Trust",
    priority: "High",
    title: ({ profile, adapter }) =>
      `Show the ${titleCase(adapter.effort)} Behind Your ${profile.subNiche} Result`,
    hook: ({ adapter }) =>
      `The finished result hides the most useful part of this ${adapter.effort}.`,
    shotList: ({ adapter }) =>
      `During the ${adapter.effort}, record the setup, one imperfect attempt, the adjustment you made, and a two-second preview of the final result.`,
  },
  {
    id: "tutorial",
    label: "Tutorial / How-to",
    difficulty: "Medium",
    goal: "Saves",
    priority: "High",
    title: ({ profile, adapter }) =>
      `Teach One ${profile.subNiche} ${titleCase(adapter.teachUnit)}`,
    hook: ({ adapter }) =>
      `Save this: here is the simplest way to understand this ${adapter.teachUnit}.`,
    shotList: ({ adapter }) =>
      `Open with the finished outcome. Teach the ${adapter.teachUnit} in three numbered beats, repeat the full process once, and end with the viewer's next action.`,
  },
  {
    id: "mistake-fix",
    label: "Mistake Fix",
    difficulty: "Easy",
    goal: "Education",
    priority: "High",
    title: ({ profile, adapter }) =>
      `Fix This ${profile.subNiche} Mistake: ${titleCase(adapter.mistake)}`,
    hook: ({ adapter }) => `If your result feels off, you may be ${adapter.mistake}.`,
    shotList: () =>
      `Record the mistake clearly, freeze on the exact problem, demonstrate one correction, then repeat the corrected result in the same framing.`,
  },
  {
    id: "before-after",
    label: "Before vs After",
    difficulty: "Easy",
    goal: "Shares",
    priority: "Medium",
    title: ({ profile, adapter }) =>
      `${profile.subNiche}: ${titleCase(adapter.beforeAfter)}`,
    hook: ({ adapter }) => `One focused change created this difference: ${adapter.beforeAfter}.`,
    shotList: () =>
      `Capture both versions with matching framing. Show the before, one process beat that explains the change, then the after twice: once at full speed and once with a detail highlighted.`,
  },
  {
    id: "breakdown",
    label: "Breakdown",
    difficulty: "Medium",
    goal: "Authority",
    priority: "Medium",
    title: ({ profile, adapter }) =>
      `Break Down This ${profile.subNiche} Result: ${titleCase(adapter.breakdownTarget)}`,
    hook: ({ adapter }) =>
      `The result works because of these parts: ${adapter.breakdownTarget}.`,
    shotList: ({ adapter }) =>
      `Play the final output, then pause at three decisions. Label each part of ${adapter.breakdownTarget}, explain why it matters, and replay the full result.`,
  },
  {
    id: "quick-tip",
    label: "Quick Tip",
    difficulty: "Easy",
    goal: "Saves",
    priority: "Medium",
    title: ({ profile, adapter }) =>
      `One ${profile.subNiche} Tip: ${titleCase(adapter.tip)}`,
    hook: ({ adapter }) => `Try this on your next attempt: ${adapter.tip}.`,
    shotList: () =>
      `Show the problem in two seconds, demonstrate the tip once, add one close detail that makes it clear, and finish with the improved result.`,
  },
  {
    id: "challenge",
    label: "Challenge",
    difficulty: "Hard",
    goal: "Engagement",
    priority: "Medium",
    title: ({ profile, adapter }) =>
      `${profile.subNiche} Challenge: ${titleCase(adapter.constraint)}`,
    hook: ({ adapter }) => `Can I make this work if I ${adapter.constraint}?`,
    shotList: () =>
      `State the constraint, record the first attempt, one setback, the adjustment, and the final result. Keep the outcome uncertain until the last beat.`,
  },
  {
    id: "story",
    label: "Story / Journey",
    difficulty: "Medium",
    goal: "Connection",
    priority: "Medium",
    title: ({ profile, adapter }) =>
      `${profile.subNiche} Journey: ${titleCase(adapter.storyArc)}`,
    hook: ({ adapter }) => `This started as ${adapter.storyArc}, but the middle mattered most.`,
    shotList: () =>
      `Record a clear starting point, the hardest middle moment, one decision that changed the process, and the current result. Use a short voiceover to connect the beats.`,
  },
  {
    id: "comparison",
    label: "Comparison",
    difficulty: "Medium",
    goal: "Comments",
    priority: "Medium",
    title: ({ profile, adapter }) =>
      `${profile.subNiche} Comparison: ${titleCase(adapter.comparison)}`,
    hook: ({ adapter }) => `Which approach works better here: ${adapter.comparison}?`,
    shotList: () =>
      `Record both approaches with the same setup. Label the difference, show one advantage and limitation for each, then give a clear use case instead of a universal winner.`,
  },
  {
    id: "reaction",
    label: "Reaction / Commentary",
    difficulty: "Easy",
    goal: "Comments",
    priority: "Low",
    title: ({ profile, adapter }) =>
      `React to Your Own ${profile.subNiche} Work: ${titleCase(adapter.reactionTarget)}`,
    hook: ({ adapter }) => `I would change this now, and here is why: ${adapter.reactionTarget}.`,
    shotList: () =>
      `Use your own recorded example. Play the key moment, pause for one specific observation, show the better choice, and end with the lesson rather than a vague reaction.`,
  },
  {
    id: "repurpose",
    label: "Repurpose / Content Multiplication",
    difficulty: "Medium",
    goal: "Consistency",
    priority: "High",
    title: ({ adapter }) =>
      `Turn One ${titleCase(adapter.effort)} into ${adapter.repurpose.length} Posts`,
    hook: ({ adapter }) =>
      `Do not stop at one post. This ${adapter.effort} can become ${adapter.repurpose.join(", ")}.`,
    shotList: ({ adapter }) =>
      `Plan one capture list before the ${adapter.effort}. Record enough for: ${adapter.repurpose.join("; ")}. Keep each post focused on one promise and reuse the strongest result shot as the connecting visual.`,
  },
];

const corePatternIds: PatternId[] = [
  "final-output",
  "behind-the-scenes",
  "tutorial",
  "mistake-fix",
  "before-after",
  "breakdown",
  "quick-tip",
  "repurpose",
];

export function generateAdaptiveIdeas(profile: IdeaProfile): GeneratedIdea[] {
  const adapter = nicheAdapters[profile.niche] ?? fallbackAdapter;
  const selectedPatternIds = [...corePatternIds, ...adapter.preferredPatterns];
  const patternMap = new Map(universalIdeaPatterns.map((pattern) => [pattern.id, pattern]));

  return selectedPatternIds.map((patternId, index) => {
    const pattern = patternMap.get(patternId)!;
    const context = { profile, adapter };
    const creatorReference = profile.selectedCreatorNames.length
      ? profile.selectedCreatorNames[index % profile.selectedCreatorNames.length]
      : null;
    const inspirationNote = creatorReference
      ? `Use the pacing principle you liked in ${creatorReference}, but record an original example.`
      : "Keep the example original and specific to your experience.";

    return {
      key: pattern.id,
      title: pattern.title(context),
      hook: pattern.hook(context),
      niche: profile.niche,
      sub_niche: profile.subNiche,
      format: formatTemplates[pattern.id](context),
      shot_list: `${pattern.shotList(context)} Use ${profile.editingStyle.toLowerCase()} and keep the delivery ${profile.energyStyle.toLowerCase()}. ${inspirationNote}`,
      caption_angle: `${profile.captionStyle}. Write in a ${profile.contentTone.toLowerCase()} voice, explain the ${pattern.label.toLowerCase()} takeaway, and connect it to this growth direction: ${profile.growthAngle}`,
      difficulty: pattern.difficulty,
      goal: pattern.goal,
      priority: pattern.priority,
      status: "Idea",
    };
  });
}
