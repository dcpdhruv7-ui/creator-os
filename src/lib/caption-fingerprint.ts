export type CaptionFingerprintInput = {
  content_idea_id?: string | null;
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
  hashtags?: string | null;
};

export function normalizeCaptionMatchText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function captionFingerprint(input: CaptionFingerprintInput) {
  return [
    input.content_idea_id ?? "",
    normalizeCaptionMatchText(input.hook),
    normalizeCaptionMatchText(input.body),
    normalizeCaptionMatchText(input.cta),
    normalizeCaptionMatchText(input.hashtags),
  ].join("|");
}
