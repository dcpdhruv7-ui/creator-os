import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

function getOAuthErrorMessage(message: string | null) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("access_denied") ||
    normalizedMessage.includes("cancel") ||
    normalizedMessage.includes("denied")
  ) {
    return "Google Sign-In was canceled. You can try again anytime.";
  }

  if (
    normalizedMessage.includes("unsupported provider") ||
    normalizedMessage.includes("not enabled") ||
    normalizedMessage.includes("provider") ||
    normalizedMessage.includes("google") ||
    normalizedMessage.includes("oauth")
  ) {
    return "Google Sign-In is not enabled yet. Please enable the Google provider in Supabase Auth.";
  }

  return "Google Sign-In could not be completed. Please try again.";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getRedirectPath(requestUrl.searchParams.get("next"));
  const errorDescription =
    requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(getOAuthErrorMessage(errorDescription))}`, requestUrl),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl));
    }

    console.error("Google Sign-In callback error:", error.message);
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent("Google Sign-In could not be completed. Please try again.")}`,
      requestUrl,
    ),
  );
}
