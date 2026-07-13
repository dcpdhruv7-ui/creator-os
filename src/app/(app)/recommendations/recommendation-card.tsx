"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PostInsightDrawer,
  type PostInsightDetail,
} from "@/components/post-insight-drawer";
import { cn } from "@/lib/utils";
import type { Recommendation, RecommendationPriority } from "@/lib/recommendations";

function priorityClass(priority: RecommendationPriority) {
  switch (priority) {
    case "High":
      return "border-red-300/20 bg-red-400/10 text-red-100";
    case "Medium":
      return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    case "Low":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }
}

export function RecommendationCard({
  item,
  postDetails,
}: {
  item: Recommendation;
  postDetails: Record<string, PostInsightDetail>;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              priorityClass(item.priority),
            )}
          >
            {item.priority}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-400">
            {item.category}
          </span>
        </div>
        <CardTitle className="leading-6">{item.title}</CardTitle>
        <CardDescription className="leading-6">{item.explanation}</CardDescription>
      </CardHeader>
      {item.drilldownEntryId || (item.actionHref && item.actionLabel) ? (
        <CardContent>
          <RecommendationActionButton item={item} postDetails={postDetails} />
        </CardContent>
      ) : null}
    </Card>
  );
}

export function RecommendationActionButton({
  item,
  postDetails,
}: {
  item: Recommendation;
  postDetails: Record<string, PostInsightDetail>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const drilldownDetail = item.drilldownEntryId
    ? postDetails[item.drilldownEntryId] ?? null
    : null;

  return (
    <>
      {drilldownDetail ? (
        <Button onClick={() => setIsOpen(true)} size="sm" type="button" variant="secondary">
          {item.drilldownActionLabel ?? "View post details"}
          <ArrowRight />
        </Button>
      ) : item.actionHref && item.actionLabel ? (
        <Button asChild size="sm" variant="secondary">
          <Link href={item.actionHref}>
            {item.actionLabel}
            <ArrowRight />
          </Link>
        </Button>
      ) : null}

      <PostInsightDrawer
        detail={drilldownDetail}
        onClose={() => setIsOpen(false)}
        open={isOpen}
      />
    </>
  );
}
