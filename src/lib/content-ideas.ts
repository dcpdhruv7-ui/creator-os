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

const formatsByNiche: Record<string, string[]> = {
  Dance: [
    "Performance Reel",
    "Trending Reels Adaptation",
    "Tutorial Breakdown",
    "Expression Reel",
    "Behind-the-Scenes Practice",
    "Choreography Cover",
    "Before/After Practice",
    "Hook Step Tutorial",
    "Freestyle Bollywood Fusion",
    "Class/Group Performance Idea",
  ],
  Comedy: [
    "Relatable Skit",
    "POV Comedy",
    "Character Scene",
    "Audio Format Adaptation",
    "Observational Monologue",
    "Situational Sketch",
    "Recurring Character Episode",
    "Expectation vs Reality",
    "Reaction Comedy",
    "Comedy Mini-Series",
  ],
  Fitness: [
    "Workout Routine",
    "Transformation Story",
    "Fitness Explainer",
    "Form Correction",
    "Motivation Reel",
    "Exercise Breakdown",
    "Beginner Workout",
    "Myth Check",
    "Progress Update",
    "Training Challenge",
  ],
  Food: [
    "Quick Recipe",
    "Meal Prep",
    "High-Protein Meal",
    "Budget Meal",
    "Food Review",
    "Ingredient Upgrade",
    "Healthy Snack",
    "Recipe Comparison",
    "Home Cooking Story",
    "Cooking Mini-Series",
  ],
  Gaming: [
    "Highlight Clip",
    "Tips and Tricks",
    "Gameplay Commentary",
    "Funny Moment",
    "Gaming Challenge",
    "Mistake Breakdown",
    "Strategy Guide",
    "Reaction Clip",
    "Before/After Skill",
    "Gameplay Mini-Series",
  ],
  Fashion: [
    "Outfit Reel",
    "Styling Tutorial",
    "Grooming Guide",
    "Wardrobe Essentials",
    "Trend Adaptation",
    "Color Combination",
    "Budget Styling",
    "Occasion Look",
    "One Item Three Ways",
    "Style Mini-Series",
  ],
  Education: [
    "Quick Explainer",
    "Step-by-Step Tutorial",
    "Case Study",
    "Practical Framework",
    "Common Mistake",
    "Myth vs Reality",
    "Visual Lesson",
    "Beginner Guide",
    "Skill Challenge",
    "Educational Mini-Series",
  ],
  "Self-Improvement": [
    "Routine Breakdown",
    "Mindset Reframe",
    "Habit Experiment",
    "Journaling Prompt",
    "Motivation Reel",
    "Progress Reflection",
    "Productivity System",
    "Book Lesson",
    "Goal-Tracking Check-In",
    "Growth Mini-Series",
  ],
  Cinematography: [
    "Shot Breakdown",
    "Lighting Setup",
    "Reel Transition",
    "Behind the Scenes",
    "Before/After Grade",
    "Camera Movement Tutorial",
    "Storytelling Sequence",
    "Product Shot Setup",
    "Mobile Cinematography Test",
    "Edit Breakdown",
  ],
  Animation: [
    "Animated Explainer",
    "Character Performance",
    "Motion Graphic",
    "VFX Breakdown",
    "Before/After Animation",
    "Process Timelapse",
    "Animation Tutorial",
    "Visual Loop",
    "Story Animation",
    "Animation Mini-Series",
  ],
  "AI & Technology": [
    "AI Tool Demo",
    "Workflow Breakdown",
    "Step-by-Step Tutorial",
    "App Idea",
    "Automation Example",
    "Tool Comparison",
    "Build-in-Public Update",
    "Prompt Breakdown",
    "Tech Myth Check",
    "AI Workflow Series",
  ],
  "Content Creation": [
    "Hook Breakdown",
    "Content Planning System",
    "Creator Journey Update",
    "Editing Workflow",
    "Reels Strategy",
    "Content Audit",
    "Storytelling Framework",
    "Behind the Scenes",
    "Trend Adaptation",
    "Creator Strategy Series",
  ],
};

const concepts = [
  {
    title: (direction: string) => `${direction}: Start Here`,
    hook: (direction: string) => `If you want to create better ${direction} content, start here.`,
    goal: "Reach",
  },
  {
    title: (direction: string) => `The ${direction} Mistake to Fix`,
    hook: (direction: string) => `Most people miss this one detail in ${direction}.`,
    goal: "Education",
  },
  {
    title: (direction: string) => `${direction} in 30 Seconds`,
    hook: (direction: string) => `Give me 30 seconds and I will make ${direction} feel simpler.`,
    goal: "Saves",
  },
  {
    title: (direction: string) => `Beginner vs Refined: ${direction}`,
    hook: (direction: string) => `Here is the difference one focused change makes in ${direction}.`,
    goal: "Shares",
  },
  {
    title: (direction: string) => `Behind the Process: ${direction}`,
    hook: (direction: string) => `The final result hides the most useful part of this ${direction} process.`,
    goal: "Trust",
  },
  {
    title: (direction: string) => `3 Ways to Improve ${direction}`,
    hook: (direction: string) => `Try these three changes before your next ${direction} post.`,
    goal: "Saves",
  },
  {
    title: (direction: string) => `The Detail That Changes ${direction}`,
    hook: (direction: string) => `This small detail changes how ${direction} content feels.`,
    goal: "Authority",
  },
  {
    title: (direction: string) => `${direction} Challenge`,
    hook: (direction: string) => `Can this ${direction} idea work with one simple constraint?`,
    goal: "Engagement",
  },
  {
    title: (direction: string) => `Myth vs Reality: ${direction}`,
    hook: (direction: string) => `The usual advice about ${direction} is only half the story.`,
    goal: "Comments",
  },
  {
    title: (direction: string) => `${direction} Mini-Series: Part 1`,
    hook: (direction: string) => `This is part one of building a stronger ${direction} style.`,
    goal: "Consistency",
  },
];

const difficulties: GeneratedIdea["difficulty"][] = [
  "Easy",
  "Easy",
  "Medium",
  "Medium",
  "Easy",
  "Medium",
  "Medium",
  "Hard",
  "Medium",
  "Medium",
];

export function generateContentIdeas(profile: IdeaProfile): GeneratedIdea[] {
  const formats = formatsByNiche[profile.niche] ?? formatsByNiche.Education;

  return concepts.map((concept, index) => {
    const creatorReference =
      profile.selectedCreatorNames[index % profile.selectedCreatorNames.length];
    const referenceDirection = creatorReference
      ? `Borrow the clear structure of ${creatorReference}, while keeping the concept original.`
      : "Keep the structure simple and original.";

    return {
      key: `idea-${index + 1}`,
      title: concept.title(profile.subNiche),
      hook: concept.hook(profile.subNiche),
      niche: profile.niche,
      sub_niche: profile.subNiche,
      format: formats[index],
      shot_list: `Open with the result, show 2-3 clear process beats, then end on one memorable payoff. Use ${profile.editingStyle.toLowerCase()} with a ${profile.energyStyle.toLowerCase()} feel. ${referenceDirection}`,
      caption_angle: `${profile.captionStyle}. Keep the voice ${profile.contentTone.toLowerCase()} and connect the takeaway to this growth direction: ${profile.growthAngle}`,
      difficulty: difficulties[index],
      goal: concept.goal,
      priority: index < 3 ? "High" : index < 7 ? "Medium" : "Low",
      status: "Idea",
    };
  });
}
