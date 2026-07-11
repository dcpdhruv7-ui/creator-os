import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkflowNextStepProps = {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  success?: boolean;
};

export function WorkflowNextStep({
  title,
  description,
  buttonLabel,
  href,
  success = false,
}: WorkflowNextStepProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        success
          ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100"
          : "border-white/10 bg-white/[0.025] text-zinc-300",
      )}
      role={success ? "status" : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn("font-medium", success ? "text-emerald-100" : "text-white")}>
            {title}
          </p>
          <p className={cn("mt-1", success ? "text-emerald-100/75" : "text-zinc-500")}>
            {description}
          </p>
        </div>
        <Button asChild size="sm" type="button">
          <Link href={href}>{buttonLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
