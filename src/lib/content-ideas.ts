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

export type GenerateAdaptiveIdeasOptions = {
  count?: number;
  excludeTitles?: string[];
  offset?: number;
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
  supportingClips: string;
  btsSequence: string;
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
  creatorReference: string | null;
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
  captionAngle: (context: PatternContext) => string;
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

function sentenceContinuation(value: string) {
  const trimmed = value.trim().replace(/\.$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export const nicheAdapters: Record<string, NicheAdapter> = {
  Dance: {
    finalOutput: "final performance reel",
    finalFormat: "Performance Reel",
    effort: "practice session",
    supportingClips: "a wide performance, an expression close-up, and a footwork detail",
    btsSequence: "a practice clip, missed timing, the correction drill, and the final performance",
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
    supportingClips: "the setup, the reaction beat, and the punchline close-up",
    btsSequence: "the character setup, a broken take, the timing adjustment, and the clean punchline",
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
    supportingClips: "an ingredient close-up, the key cooking moment, and the final texture",
    btsSequence: "the ingredients, prep, cooking process, plating, and the final dish",
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
    supportingClips: "the setup, one strong working set, and a form detail",
    btsSequence: "the warm-up, equipment setup, an imperfect rep, the correction, and a final clean rep",
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
    supportingClips: "the match setup, the key decision, and the reaction",
    btsSequence: "the match setup, the mistake moment, the live reaction, the adjustment, and the winning highlight",
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
    supportingClips: "the base outfit, one styling detail, and the accessories close-up",
    btsSequence: "the occasion brief, first outfit attempt, rejected piece, styling adjustment, and final look",
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
    supportingClips: "the core concept, one visual example, and the practical takeaway",
    btsSequence: "the topic question, rough explanation, confusing point, clearer example, and final lesson",
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
    supportingClips: "the routine trigger, the hardest step, and the completed check-in",
    btsSequence: "the routine setup, resistance moment, missed attempt, smaller adjustment, and completed habit",
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
    supportingClips: "the hero frame, a camera-movement detail, and the graded close-up",
    btsSequence: "the camera setup, lighting, movement rehearsal, raw shot, adjustment, and final grade",
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
    supportingClips: "the strongest key pose, a motion detail, and the final loop",
    btsSequence: "the rough sketch, blocking pass, timing issue, polish adjustment, and final render",
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
    supportingClips: "the input, one key workflow step, and the useful output",
    btsSequence: "the original task, first setup, failed output, prompt or workflow correction, and final result",
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
    supportingClips: "the opening hook, one editing decision, and the final CTA",
    btsSequence: "the raw idea, rough draft, weak opening, rewrite or edit, and final published version",
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
    shotList: ({ profile, adapter }) =>
      `Show the ${adapter.finalOutput} in the first two seconds. Support it with ${adapter.supportingClips}. End on the strongest result with a clean payoff or loop. Use ${profile.editingStyle.toLowerCase()} to keep the presentation ${profile.energyStyle.toLowerCase()}.`,
    captionAngle: ({ profile, adapter }) =>
      `Lead with the result, then explain the one decision that made the ${adapter.finalOutput} work. Keep the voice ${profile.contentTone.toLowerCase()} and connect that decision to how you ${sentenceContinuation(profile.growthAngle)}.`,
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
    shotList: ({ profile, adapter }) =>
      `Capture the process in order: ${adapter.btsSequence}. Keep the imperfect moment visible, label the correction, and finish with the clean result. Use ${profile.editingStyle.toLowerCase()} only to remove dead time, not the useful process.`,
    captionAngle: ({ profile }) =>
      `Show the hidden work behind the result to build trust. Name what went wrong, what changed, and what the viewer can learn from the correction. Write it in a ${profile.contentTone.toLowerCase()} voice.`,
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
    shotList: ({ profile, adapter, creatorReference }) =>
      `Preview the finished result. Teach the ${adapter.teachUnit} in three numbered steps with a clear visual for each step. Repeat the complete result at normal speed and end with one practice action.${creatorReference ? ` Use the clarity you liked in ${creatorReference} as a pacing reference while recording an original lesson.` : ""} Add labels using ${profile.editingStyle.toLowerCase()}.`,
    captionAngle: ({ profile, adapter }) =>
      `Teach the ${adapter.teachUnit} in the same three-step order as the video. Use ${profile.captionStyle.toLowerCase()} and explicitly invite viewers to save it for their next attempt.`,
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
    shotList: ({ profile, adapter }) =>
      `Show the wrong version first: ${adapter.mistake}. Freeze on the exact moment, explain why it hurts the result, demonstrate one correction, and end with the corrected version in matching framing. Keep the delivery ${profile.energyStyle.toLowerCase()}.`,
    captionAngle: ({ profile }) =>
      `Point out the common mistake without shaming the viewer, explain the correction in one sentence, and finish with the cue they should remember. Match the ${profile.contentTone.toLowerCase()} profile tone.`,
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
    shotList: ({ profile, adapter }) =>
      `Record ${adapter.beforeAfter} with the same framing. Show the before, the single change or process beat, then the after at full speed. Replay one detail side by side so the transformation is undeniable. Use ${profile.editingStyle.toLowerCase()} for the comparison.`,
    captionAngle: ({ profile }) =>
      `Frame the post as a transformation: what the before lacked, what changed, and why the after works. End with a simple lesson that helps you ${sentenceContinuation(profile.growthAngle)}.`,
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
    shotList: ({ adapter, creatorReference }) =>
      `Play the full result once. Break ${adapter.breakdownTarget} into three labeled parts, giving each part its own clip or freeze frame. Explain one decision per part, then replay the result so viewers can notice all three.${creatorReference ? ` Use ${creatorReference} only as a structural reference for the breakdown.` : ""}`,
    captionAngle: ({ profile, adapter }) =>
      `Build authority by explaining why each part of ${adapter.breakdownTarget} exists. Use ${profile.captionStyle.toLowerCase()} to summarize the three decisions and invite a specific follow-up question.`,
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
    shotList: ({ profile, adapter }) =>
      `Open on the exact problem for two seconds. Demonstrate this single fix: ${adapter.tip}. Add one close-up or screen detail, then show the improved result once. Keep it fast and ${profile.energyStyle.toLowerCase()}.`,
    captionAngle: ({ profile, adapter }) =>
      `Give viewers one immediately usable action: ${adapter.tip}. Keep the caption short in the ${profile.captionStyle.toLowerCase()} style and make the save-worthy takeaway the final line.`,
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
    shotList: ({ profile, adapter }) =>
      `State the challenge clearly: ${adapter.constraint}. Record the first attempt, one visible setback, the decision that changes the attempt, and the final result. Delay the outcome until the last beat and keep the pacing ${profile.energyStyle.toLowerCase()}.`,
    captionAngle: ({ profile, adapter }) =>
      `Invite participation by explaining the ${adapter.constraint} constraint, sharing the hardest moment, and asking viewers what constraint you should try next. Keep the tone ${profile.contentTone.toLowerCase()}.`,
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
    shotList: ({ profile, adapter }) =>
      `Build four story beats around ${adapter.storyArc}: the starting point, the difficult middle, the decision that changed the process, and the current result. Record a short voiceover and let each visual prove the line before moving on. Use restrained ${profile.editingStyle.toLowerCase()}.`,
    captionAngle: ({ profile, adapter }) =>
      `Tell the honest story behind ${adapter.storyArc}. Focus on the turning point and lesson rather than only the win, using a ${profile.contentTone.toLowerCase()} voice that builds connection.`,
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
    shotList: ({ profile, adapter }) =>
      `Record both sides of ${adapter.comparison} using the same setup. Label A and B, show one advantage and limitation for each, then finish with the situation where each choice works best. Use matched ${profile.editingStyle.toLowerCase()} so the comparison feels fair.`,
    captionAngle: ({ adapter }) =>
      `Compare ${adapter.comparison} without declaring a vague winner. List the best use case for each option and ask viewers which situation matches their needs.`,
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
    shotList: ({ profile, adapter }) =>
      `Use your own example for ${adapter.reactionTarget}. Play the key moment, pause for one precise observation, record your commentary, show the choice you would make now, and close on the lesson. Keep the reaction ${profile.contentTone.toLowerCase()}, not exaggerated.`,
    captionAngle: ({ adapter }) =>
      `Use commentary to explain what ${adapter.reactionTarget} taught you. Separate your immediate reaction from the practical lesson, then invite viewers to share how they would handle it.`,
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
    shotList: ({ profile, adapter }) =>
      `Before the ${adapter.effort}, plan one shared capture list. Record enough material for ${adapter.repurpose.length} separate posts: ${adapter.repurpose.join("; ")}. Give each post its own hook and takeaway, then reuse the strongest result shot to connect the series. Batch the edits using ${profile.editingStyle.toLowerCase()}.`,
    captionAngle: ({ profile, adapter }) =>
      `Teach the content multiplication plan directly: one ${adapter.effort}, ${adapter.repurpose.length} posts, and one distinct promise per post. Explain how this workflow helps you ${sentenceContinuation(profile.growthAngle)}.`,
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

const ideaVariantLabels = [
  "Fresh Angle",
  "Process Angle",
  "Save-Worthy Angle",
  "Trust Builder",
  "Fast Reel Angle",
  "Community Angle",
  "Authority Angle",
  "Story Angle",
];

const ideaVariantHooks = [
  "Use this as a fresh version with a different opening moment.",
  "Frame this around the process instead of only the result.",
  "Make this version more save-worthy by focusing on the repeatable detail.",
  "Turn this into a trust-building post by showing what changed.",
  "Keep this version tighter and lead with the strongest visual.",
  "Invite people into the idea by asking what they would try next.",
  "Use this version to explain the decision behind the result.",
  "Make the journey or turning point the main reason to watch.",
];

function ideaTitleKey(value: string) {
  return value.trim().toLowerCase();
}

function rotateIdeas<T>(values: T[], amount: number) {
  if (values.length === 0) return values;
  const offset = amount % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function applyIdeaVariant(idea: GeneratedIdea, round: number): GeneratedIdea {
  if (round === 0) {
    return idea;
  }

  const label = ideaVariantLabels[(round - 1) % ideaVariantLabels.length];
  const hookDetail = ideaVariantHooks[(round - 1) % ideaVariantHooks.length];

  return {
    ...idea,
    key: `${idea.key}-${round}`,
    title: `${idea.title}: ${label}`,
    hook: `${idea.hook} ${hookDetail}`,
  };
}

export function generateAdaptiveIdeas(
  profile: IdeaProfile,
  options: GenerateAdaptiveIdeasOptions = {},
): GeneratedIdea[] {
  const adapter = nicheAdapters[profile.niche] ?? fallbackAdapter;
  const count = options.count ?? 10;
  const excludedTitles = new Set((options.excludeTitles ?? []).map(ideaTitleKey));
  const selectedPatternIds = [...corePatternIds, ...adapter.preferredPatterns];
  const patternMap = new Map(universalIdeaPatterns.map((pattern) => [pattern.id, pattern]));
  const candidates: GeneratedIdea[] = [];
  const seenTitles = new Set<string>();

  for (let round = 0; round <= ideaVariantLabels.length; round += 1) {
    selectedPatternIds.forEach((patternId, index) => {
      const pattern = patternMap.get(patternId)!;
      const creatorReference = profile.selectedCreatorNames.length
        ? profile.selectedCreatorNames[index % profile.selectedCreatorNames.length]
        : null;
      const context = { profile, adapter, creatorReference };
      const idea = applyIdeaVariant(
        {
          key: pattern.id,
          title: pattern.title(context),
          hook: pattern.hook(context),
          niche: profile.niche,
          sub_niche: profile.subNiche,
          format: formatTemplates[pattern.id](context),
          shot_list: pattern.shotList(context),
          caption_angle: pattern.captionAngle(context),
          difficulty: pattern.difficulty,
          goal: pattern.goal,
          priority: pattern.priority,
          status: "Idea",
        },
        round,
      );
      const titleKey = ideaTitleKey(idea.title);

      if (excludedTitles.has(titleKey) || seenTitles.has(titleKey)) {
        return;
      }

      seenTitles.add(titleKey);
      candidates.push(idea);
    });
  }

  return rotateIdeas(candidates, options.offset ?? 0).slice(0, count);
}
