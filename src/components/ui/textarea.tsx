import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full resize-y rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-50 outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
