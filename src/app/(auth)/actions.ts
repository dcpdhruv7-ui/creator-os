"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function authRedirect(path: string, type: "error" | "message", value: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(value)}`);
}

function getSignupErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("email rate limit")) {
    console.error("Supabase signup rate limit reached.");

    return "Signup email limit reached. Please wait for Supabase's email limit to reset, then try again. If you already created an account, try logging in.";
  }

  if (normalizedMessage.includes("email address") && normalizedMessage.includes("invalid")) {
    return "Enter a valid email address and try again.";
  }

  if (normalizedMessage.includes("already registered")) {
    return "An account already exists for this email. Try logging in instead.";
  }

  console.error("Supabase signup error:", message);

  return "We could not create your account right now. Please check your details and try again.";
}

export async function login(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!email || !password) {
    authRedirect("/login", "error", "Enter your email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("/login", "error", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!email || !password) {
    authRedirect("/signup", "error", "Enter your email and password.");
  }

  if (password.length < 6) {
    authRedirect("/signup", "error", "Use a password with at least 6 characters.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    authRedirect("/signup", "error", getSignupErrorMessage(error.message));
  }

  if (data.session && data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName || null,
    });

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  authRedirect("/login", "message", "Check your email to confirm your account.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = field(formData, "email");

  if (!email) {
    authRedirect("/forgot-password", "error", "Enter your email address.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    authRedirect("/forgot-password", "error", error.message);
  }

  authRedirect("/login", "message", "If that email exists, a reset link has been sent.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
