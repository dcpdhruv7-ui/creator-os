import { cn } from "@/lib/utils";

type AuthNoticeProps = {
  error?: string;
  message?: string;
};

export function AuthNotice({ error, message }: AuthNoticeProps) {
  const text = error ?? message;

  if (!text) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        error
          ? "border-red-400/30 bg-red-500/10 text-red-200"
          : "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
      )}
    >
      {text}
    </div>
  );
}
