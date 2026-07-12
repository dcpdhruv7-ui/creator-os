export type RecommendationPriority = "High" | "Medium" | "Low";
export type RecommendationCategory =
  | "Content"
  | "Captions"
  | "Calendar"
  | "Analytics"
  | "Platform"
  | "Consistency";

export type Recommendation = {
  title: string;
  explanation: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  actionLabel?: string;
  actionHref?: string;
};

export type CreatorProfileSummary = {
  niche: string | null;
  sub_niche: string | null;
  selected_creators: unknown;
};

export type RecommendationIdea = {
  id: string;
  title: string;
  niche: string | null;
  sub_niche: string | null;
  format: string | null;
  hook: string | null;
  shot_list: string | null;
  caption_angle: string | null;
  difficulty: string | null;
  goal: string | null;
  status: string | null;
  priority: string | null;
};

export type RecommendationCaption = {
  id: string;
  content_idea_id: string | null;
  caption_type: string | null;
  hook: string | null;
  body: string | null;
  cta: string | null;
  hashtags: string | null;
};

export type RecommendationCalendarEntry = {
  id: string;
  content_idea_id: string | null;
  title: string;
  platform: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

export type RecommendationAnalyticsEntry = {
  id: string;
  content_idea_id: string | null;
  platform: string | null;
  post_title: string | null;
  niche: string | null;
  sub_niche: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  follows_gained: number | null;
  posted_at: string | null;
  created_at: string | null;
};

export type RecommendationScope = "current" | "all";

export type RecommendationInsights = {
  scope: RecommendationScope;
  score: number;
  scoreLabel: string;
  scoreBreakdown: Array<{ label: string; complete: boolean; points: number }>;
  counts: {
    ideas: number;
    captions: number;
    calendarEntries: number;
    scheduledThisWeek: number;
    analyticsEntries: number;
    currentNicheAnalyticsEntries: number;
    unlinkedAnalyticsEntries: number;
    postedEntries: number;
    inspirationCount: number;
  };
  analyticsGroups: Array<{ label: string; count: number; views: number; unlinked: boolean }>;
  weeklyActions: Recommendation[];
  performance: Recommendation[];
  contentGaps: Recommendation[];
  nextIdeas: Recommendation[];
  platforms: Recommendation[];
  consistency: Recommendation[];
  topRecommendations: Recommendation[];
  emptyPath: Recommendation[];
};

type BuildRecommendationInput = {
  profile: CreatorProfileSummary | null;
  ideas: RecommendationIdea[];
  captions: RecommendationCaption[];
  calendarEntries: RecommendationCalendarEntry[];
  analyticsEntries: RecommendationAnalyticsEntry[];
  scope?: RecommendationScope;
};

function dateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function weekBounds() {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: dateValue(start),
    end: dateValue(end),
    today: dateValue(today),
  };
}

function numberValue(value: number | null | undefined) {
  return value ?? 0;
}

function engagement(entry: RecommendationAnalyticsEntry) {
  return (
    numberValue(entry.likes) +
    numberValue(entry.comments) +
    numberValue(entry.shares) +
    numberValue(entry.saves)
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function selectedCreatorCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function isCurrentNicheItem(
  item: { niche: string | null; sub_niche: string | null },
  profile: CreatorProfileSummary | null,
) {
  if (!profile?.niche) {
    return true;
  }

  if (item.niche !== profile.niche) {
    return false;
  }

  if (!profile.sub_niche) {
    return true;
  }

  return item.sub_niche === profile.sub_niche;
}

function ideaPattern(idea: RecommendationIdea) {
  const text = `${idea.title} ${idea.format ?? ""} ${idea.hook ?? ""} ${idea.shot_list ?? ""} ${idea.caption_angle ?? ""} ${idea.goal ?? ""}`.toLowerCase();

  if (text.includes("tutorial") || text.includes("how-to") || text.includes("educat")) {
    return "tutorial";
  }

  if (text.includes("behind") || text.includes("bts") || text.includes("process")) {
    return "bts";
  }

  if (text.includes("mistake") || text.includes("fix")) {
    return "mistake";
  }

  if (text.includes("breakdown")) {
    return "breakdown";
  }

  if (text.includes("final") || text.includes("result") || text.includes("output")) {
    return "final-output";
  }

  if (text.includes("comparison") || text.includes(" vs ")) {
    return "comparison";
  }

  return "other";
}

function scoreLabel(score: number) {
  if (score <= 30) return "Setup stage";
  if (score <= 60) return "Building system";
  if (score <= 85) return "Consistent creator";
  return "Optimization stage";
}

function recommendation(
  title: string,
  explanation: string,
  priority: RecommendationPriority,
  category: RecommendationCategory,
  actionLabel?: string,
  actionHref?: string,
): Recommendation {
  return { title, explanation, priority, category, actionLabel, actionHref };
}

function platformStats(entries: RecommendationAnalyticsEntry[]) {
  const stats = new Map<
    string,
    { platform: string; posts: number; views: number; engagement: number; averageEngagement: number }
  >();

  entries.forEach((entry) => {
    const platform = entry.platform ?? "Unknown";
    const current = stats.get(platform) ?? {
      platform,
      posts: 0,
      views: 0,
      engagement: 0,
      averageEngagement: 0,
    };

    current.posts += 1;
    current.views += numberValue(entry.views);
    current.engagement += engagement(entry);
    current.averageEngagement = current.engagement / current.posts;
    stats.set(platform, current);
  });

  return Array.from(stats.values());
}

export function buildRecommendationInsights({
  profile,
  ideas,
  captions,
  calendarEntries,
  analyticsEntries,
  scope = "current",
}: BuildRecommendationInput): RecommendationInsights {
  const bounds = weekBounds();
  const scopedIdeas =
    scope === "current" ? ideas.filter((idea) => isCurrentNicheItem(idea, profile)) : ideas;
  const scopedIdeaIds = new Set(scopedIdeas.map((idea) => idea.id));
  const scopedCaptions =
    scope === "current"
      ? captions.filter((caption) => caption.content_idea_id && scopedIdeaIds.has(caption.content_idea_id))
      : captions;
  const scopedCalendarEntries =
    scope === "current"
      ? calendarEntries.filter(
          (entry) => entry.content_idea_id && scopedIdeaIds.has(entry.content_idea_id),
        )
      : calendarEntries;
  const scopedAnalytics =
    scope === "current"
      ? analyticsEntries.filter((entry) => isCurrentNicheItem(entry, profile))
      : analyticsEntries;
  const totalAnalyticsEntries = analyticsEntries;
  const unlinkedAnalyticsEntries = analyticsEntries.filter((entry) => !entry.niche);
  const performanceEntries = scope === "current" ? scopedAnalytics : totalAnalyticsEntries;
  const analyticsForScore = scope === "current" ? scopedAnalytics : totalAnalyticsEntries;
  const analyticsGroups = Array.from(
    totalAnalyticsEntries.reduce((groups, entry) => {
      const label = entry.niche
        ? `${entry.niche} / ${entry.sub_niche ?? "General"}`
        : "Unlinked manual analytics";
      const current = groups.get(label) ?? {
        label,
        count: 0,
        views: 0,
        unlinked: !entry.niche,
      };

      current.count += 1;
      current.views += numberValue(entry.views);
      groups.set(label, current);

      return groups;
    }, new Map<string, { label: string; count: number; views: number; unlinked: boolean }>()),
  ).map(([, group]) => group);
  const captionIdeaIds = new Set(scopedCaptions.map((caption) => caption.content_idea_id).filter(Boolean));
  const scheduledIdeaIds = new Set(
    scopedCalendarEntries.map((entry) => entry.content_idea_id).filter(Boolean),
  );
  const captionsWithoutSchedule = scopedCaptions.filter(
    (caption) => caption.content_idea_id && !scheduledIdeaIds.has(caption.content_idea_id),
  );
  const ideasWithoutCaptions = scopedIdeas.filter((idea) => !captionIdeaIds.has(idea.id));
  const scheduledWithoutCaptions = scopedCalendarEntries.filter(
    (entry) => entry.content_idea_id && !captionIdeaIds.has(entry.content_idea_id),
  );
  const scheduledThisWeek = scopedCalendarEntries.filter(
    (entry) =>
      entry.scheduled_date &&
      entry.scheduled_date >= bounds.start &&
      entry.scheduled_date <= bounds.end,
  );
  const postedEntries = scopedCalendarEntries.filter((entry) => entry.status === "Posted");
  const pastUnposted = scopedCalendarEntries.filter(
    (entry) =>
      entry.scheduled_date &&
      entry.scheduled_date < bounds.today &&
      entry.status !== "Posted",
  );
  const upcomingEntries = scopedCalendarEntries.filter(
    (entry) => entry.scheduled_date && entry.scheduled_date >= bounds.today,
  );
  const inspirationCount = selectedCreatorCount(profile?.selected_creators);
  const scoreBreakdown = [
    { label: "Niche selected", complete: Boolean(profile?.niche), points: 15 },
    { label: "Creator inspirations selected", complete: inspirationCount > 0, points: 15 },
    { label: "At least 5 saved ideas", complete: scopedIdeas.length >= 5, points: 20 },
    { label: "At least 3 saved captions", complete: scopedCaptions.length >= 3, points: 15 },
    { label: "At least 3 posts this week", complete: scheduledThisWeek.length >= 3, points: 20 },
    { label: "At least 3 analytics entries", complete: analyticsForScore.length >= 3, points: 15 },
  ];
  const score = scoreBreakdown.reduce(
    (sum, item) => sum + (item.complete ? item.points : 0),
    0,
  );

  const weeklyActions: Recommendation[] = [];

  if (scopedIdeas.length < 5) {
    weeklyActions.push(
      recommendation(
        "Save at least 5 ideas.",
        `You have ${plural(scopedIdeas.length, "saved idea")} in this view. Build a small idea bank before planning too far ahead.`,
        "High",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  if (ideasWithoutCaptions.length > 0) {
    weeklyActions.push(
      recommendation(
        `Create captions for ${Math.min(ideasWithoutCaptions.length, 3)} saved ideas.`,
        `You have ${plural(ideasWithoutCaptions.length, "idea")} without captions. Turn the strongest ones into ready-to-post captions next.`,
        scopedCaptions.length === 0 ? "High" : "Medium",
        "Captions",
        "Go to Captions",
        "/captions",
      ),
    );
  }

  if (scheduledThisWeek.length < 3) {
    weeklyActions.push(
      recommendation(
        `Add ${3 - scheduledThisWeek.length} more post${3 - scheduledThisWeek.length === 1 ? "" : "s"} to this week.`,
        `This week has ${plural(scheduledThisWeek.length, "scheduled post")}. Aim for at least 3 planned posts to build consistency.`,
        "High",
        "Calendar",
        "Go to Calendar",
        "/calendar",
      ),
    );
  }

  if (postedEntries.length > totalAnalyticsEntries.length) {
    weeklyActions.push(
      recommendation(
        "Track analytics for posts already marked as posted.",
        `${plural(postedEntries.length, "calendar post")} are marked Posted, and ${plural(totalAnalyticsEntries.length, "analytics entry")} are tracked.`,
        "Medium",
        "Analytics",
        "Go to Analytics",
        "/analytics",
      ),
    );
  }

  const patternCounts = scopedIdeas.reduce<Record<string, number>>((counts, idea) => {
    const pattern = ideaPattern(idea);
    counts[pattern] = (counts[pattern] ?? 0) + 1;
    return counts;
  }, {});

  if ((patternCounts.tutorial ?? 0) < 2) {
    weeklyActions.push(
      recommendation(
        "Post 2 more tutorial-style ideas this week.",
        "Tutorial and educational posts give your audience a reason to save and return to your content.",
        "Medium",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  if ((patternCounts.bts ?? 0) === 0) {
    weeklyActions.push(
      recommendation(
        "Schedule one BTS/process post this week.",
        "A process post helps people understand the work behind your final result and builds trust.",
        "Medium",
        "Calendar",
        "Go to Calendar",
        "/calendar",
      ),
    );
  }

  const performance: Recommendation[] = [];
  const stats = platformStats(performanceEntries);
  const bestPlatformByViews = [...stats].sort((a, b) => b.views - a.views)[0];
  const bestPlatformByEngagement = [...stats].sort(
    (a, b) => b.averageEngagement - a.averageEngagement,
  )[0];
  const bestPostByViews = [...performanceEntries].sort(
    (a, b) => numberValue(b.views) - numberValue(a.views),
  )[0];
  const bestPostByEngagement = [...performanceEntries].sort((a, b) => engagement(b) - engagement(a))[0];

  if (scope === "current" && scopedAnalytics.length === 0 && totalAnalyticsEntries.length > 0) {
    performance.push(
      recommendation(
        `${profile?.sub_niche ?? profile?.niche ?? "Current niche"} has no assigned analytics yet.`,
        `You have ${plural(totalAnalyticsEntries.length, "tracked post")}, but they are not linked to this niche yet. Assign them to saved ideas or this niche for precise recommendations.`,
        "Medium",
        "Analytics",
        "Go to Analytics",
        "/analytics",
      ),
    );
  } else if (performanceEntries.length < 3) {
    performance.push(
      recommendation(
        "Track at least 3 posts to unlock stronger performance recommendations.",
        `You have ${plural(performanceEntries.length, "tracked post")} in this view. More entries will make platform and format signals more reliable.`,
        "High",
        "Analytics",
        "Go to Analytics",
        "/analytics",
      ),
    );
  } else {
    if (bestPlatformByViews) {
      performance.push(
        recommendation(
          `${bestPlatformByViews.platform} is currently strongest by views.`,
          `Based on ${scope === "current" ? "assigned posts for this niche" : "your manually tracked posts"}, ${bestPlatformByViews.platform} has ${bestPlatformByViews.views.toLocaleString()} tracked views across ${plural(bestPlatformByViews.posts, "post")}.`,
          "Medium",
          "Platform",
          "Go to Analytics",
          "/analytics",
        ),
      );
    }

    if (bestPlatformByEngagement) {
      performance.push(
        recommendation(
          `${bestPlatformByEngagement.platform} has your strongest average engagement.`,
          `Based on ${scope === "current" ? "assigned posts for this niche" : "your manually tracked posts"}, average engagement is ${Math.round(bestPlatformByEngagement.averageEngagement).toLocaleString()} actions per tracked post.`,
          "Medium",
          "Analytics",
          "Go to Analytics",
          "/analytics",
        ),
      );
    }

    if (bestPostByViews) {
      performance.push(
        recommendation(
          "Turn your best-performing idea into a follow-up post.",
          `${bestPostByViews.post_title ?? "Manual analytics entry"} has ${numberValue(bestPostByViews.views).toLocaleString()} views. Create a follow-up while the signal is fresh.`,
          "High",
          "Content",
          "Go to Ideas",
          "/ideas",
        ),
      );
    }

    if (bestPostByEngagement && numberValue(bestPostByEngagement.saves) > 0) {
      performance.push(
        recommendation(
          "Create more save-worthy posts.",
          `${bestPostByEngagement.post_title ?? "Manual analytics entry"} earned ${plural(numberValue(bestPostByEngagement.saves), "save")}. Saves usually signal useful content.`,
          "Medium",
          "Content",
          "Go to Ideas",
          "/ideas",
        ),
      );
    }
  }

  const contentGaps: Recommendation[] = [];

  if (ideasWithoutCaptions.length > 0) {
    contentGaps.push(
      recommendation(
        `${plural(ideasWithoutCaptions.length, "saved idea")} without captions.`,
        "Turn these into captions before saving too many more ideas.",
        "High",
        "Captions",
        "Go to Captions",
        "/captions",
      ),
    );
  }

  if (captionsWithoutSchedule.length > 0) {
    contentGaps.push(
      recommendation(
        `${plural(captionsWithoutSchedule.length, "caption")} ready but not scheduled.`,
        "Move your strongest captioned ideas into the calendar so they become real posts.",
        "Medium",
        "Calendar",
        "Go to Calendar",
        "/calendar",
      ),
    );
  }

  if (scheduledWithoutCaptions.length > 0) {
    contentGaps.push(
      recommendation(
        `${plural(scheduledWithoutCaptions.length, "scheduled post")} without captions.`,
        "Add captions to scheduled posts so posting day is smoother.",
        "Medium",
        "Captions",
        "Go to Captions",
        "/captions",
      ),
    );
  }

  if (scopedIdeas.length > 0 && scopedAnalytics.length === 0 && totalAnalyticsEntries.length === 0) {
    contentGaps.push(
      recommendation(
        "You have saved ideas but no analytics tracked yet.",
        "After posting, add manual results so Creator OS can learn what is working.",
        "Medium",
        "Analytics",
        "Go to Analytics",
        "/analytics",
      ),
    );
  }

  if (scopedIdeas.length > 0 && totalAnalyticsEntries.length > 0 && scopedAnalytics.length === 0) {
    contentGaps.push(
      recommendation(
        "Your analytics are not linked to this niche yet.",
        `You have ${plural(totalAnalyticsEntries.length, "tracked post")}, but none are linked to this niche. Link entries to saved ideas for more precise recommendations.`,
        "Medium",
        "Analytics",
        "Go to Analytics",
        "/analytics",
      ),
    );
  }

  if (scopedIdeas.length === 0 && profile?.niche) {
    contentGaps.push(
      recommendation(
        `No saved ideas for ${profile.sub_niche ?? profile.niche} yet.`,
        "Generate a starter bank for your current content direction.",
        "High",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  const nextIdeas: Recommendation[] = [];

  if (performanceEntries.length === 0) {
    nextIdeas.push(
      recommendation(
        "Start with a balanced mix: 1 tutorial, 1 BTS, 1 final output.",
        "This gives you three different signals before you decide what to double down on.",
        "High",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  if ((patternCounts.tutorial ?? 0) >= 2 || performanceEntries.some((entry) => numberValue(entry.saves) > 0)) {
    nextIdeas.push(
      recommendation(
        "Create one more tutorial-style idea for your current niche.",
        "Your idea bank or analytics already has useful-content signals. Lean into teachable posts.",
        "Medium",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  if ((patternCounts.bts ?? 0) === 0) {
    nextIdeas.push(
      recommendation(
        "Add one BTS/process idea to show your workflow.",
        "Your bank is missing process content. A BTS post can make the final output more relatable.",
        "Medium",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  if ((patternCounts["final-output"] ?? 0) >= 3) {
    nextIdeas.push(
      recommendation(
        "Balance final-output posts with breakdown or mistake-fix ideas.",
        "You have several result-led ideas. Add explanation-based posts so viewers know how the result happened.",
        "Medium",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  if ((patternCounts.mistake ?? 0) === 0) {
    nextIdeas.push(
      recommendation(
        "Create a mistake-fix post.",
        "Mistake-fix content is practical, specific, and easy for viewers to save before their next attempt.",
        "Low",
        "Content",
        "Go to Ideas",
        "/ideas",
      ),
    );
  }

  const platforms: Recommendation[] = [];

  if (stats.length === 0) {
    platforms.push(
      recommendation(
        "No platform data yet.",
        "Track results after posting before deciding which platform is strongest.",
        "High",
        "Analytics",
        "Go to Analytics",
        "/analytics",
      ),
    );
  } else {
    stats
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .forEach((stat) => {
        platforms.push(
          recommendation(
            `${stat.platform}: ${plural(stat.posts, "tracked post")}.`,
            stat.posts >= 3
              ? `${stat.platform} has enough early data to compare. Total tracked views: ${stat.views.toLocaleString()}.`
              : `${stat.platform} has fewer than 3 posts tracked, so the signal is still early.`,
            stat.posts >= 3 ? "Medium" : "Low",
            "Platform",
            "Go to Analytics",
            "/analytics",
          ),
        );
      });
  }

  const consistency: Recommendation[] = [];

  if (scheduledThisWeek.length === 0) {
    consistency.push(
      recommendation(
        "You have no posts planned for this week.",
        "Schedule at least 3 posts so your content system has a clear rhythm.",
        "High",
        "Consistency",
        "Go to Calendar",
        "/calendar",
      ),
    );
  } else {
    consistency.push(
      recommendation(
        `You have ${plural(scheduledThisWeek.length, "post")} planned this week.`,
        scheduledThisWeek.length >= 3
          ? "Good rhythm. Keep the week balanced across formats."
          : `Add ${3 - scheduledThisWeek.length} more to reach a simple weekly baseline.`,
        scheduledThisWeek.length >= 3 ? "Low" : "Medium",
        "Consistency",
        "Go to Calendar",
        "/calendar",
      ),
    );
  }

  if (pastUnposted.length > 0) {
    consistency.push(
      recommendation(
        `${plural(pastUnposted.length, "past post")} still marked Planned.`,
        "Update their status to Posted, move them, or delete them so the calendar stays clean.",
        "Medium",
        "Calendar",
        "Go to Calendar",
        "/calendar",
      ),
    );
  }

  if (upcomingEntries.length > 0) {
    consistency.push(
      recommendation(
        `${plural(upcomingEntries.length, "upcoming post")} on your calendar.`,
        "Keep captions attached before posting day so execution feels lighter.",
        "Low",
        "Consistency",
        "Go to Calendar",
        "/calendar",
      ),
    );
  }

  const emptyPath: Recommendation[] = [
    recommendation("Choose niche", "Set the content world you want to build in.", "High", "Content", "Go to Niche", "/niche"),
    recommendation("Pick creator inspirations", "Choose creator styles to shape your profile.", "High", "Content", "Go to Creators", "/creators"),
    recommendation("Save ideas", "Build a starter idea bank for your niche.", "High", "Content", "Go to Ideas", "/ideas"),
    recommendation("Generate captions", "Turn saved ideas into copy-ready posts.", "Medium", "Captions", "Go to Captions", "/captions"),
    recommendation("Schedule posts", "Move ideas into a weekly calendar.", "Medium", "Calendar", "Go to Calendar", "/calendar"),
    recommendation("Track analytics", "Add manual results after posting.", "Medium", "Analytics", "Go to Analytics", "/analytics"),
  ];

  const allRecommendations = [
    ...weeklyActions,
    ...performance,
    ...contentGaps,
    ...nextIdeas,
    ...platforms,
    ...consistency,
  ];
  const priorityRank: Record<RecommendationPriority, number> = { High: 0, Medium: 1, Low: 2 };
  const topRecommendations = allRecommendations
    .filter(
      (recommendationItem, index, list) =>
        list.findIndex((item) => item.title === recommendationItem.title) === index,
    )
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 5);

  return {
    scope,
    score,
    scoreLabel: scoreLabel(score),
    scoreBreakdown,
    counts: {
      ideas: scopedIdeas.length,
      captions: scopedCaptions.length,
      calendarEntries: scopedCalendarEntries.length,
      scheduledThisWeek: scheduledThisWeek.length,
      analyticsEntries: totalAnalyticsEntries.length,
      currentNicheAnalyticsEntries: scopedAnalytics.length,
      unlinkedAnalyticsEntries: unlinkedAnalyticsEntries.length,
      postedEntries: postedEntries.length,
      inspirationCount,
    },
    analyticsGroups,
    weeklyActions: weeklyActions.slice(0, 5),
    performance,
    contentGaps,
    nextIdeas: nextIdeas.slice(0, 5),
    platforms,
    consistency,
    topRecommendations,
    emptyPath,
  };
}
