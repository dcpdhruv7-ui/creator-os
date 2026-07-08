function readEnvValue(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  return value
    .replace(new RegExp(`^${name}\\s*=\\s*`), "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function normalizeSupabaseUrl(value: string) {
  const knownApiPaths = ["/rest/v1", "/auth/v1", "/storage/v1"];
  let normalized = value;

  for (const path of knownApiPaths) {
    const pathIndex = normalized.indexOf(path);

    if (pathIndex !== -1) {
      normalized = normalized.slice(0, pathIndex);
      break;
    }
  }

  normalized = normalized.replace(/\/+$/, "");

  try {
    const url = new URL(normalized);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    if (url.pathname !== "/") {
      throw new Error("Invalid path");
    }

    return url.origin;
  } catch {
    throw new Error(
      "Invalid Supabase URL. Use the project URL only, for example https://your-project.supabase.co.",
    );
  }
}

export function getSupabaseConfig() {
  const supabaseUrl = readEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    supabaseUrl: normalizeSupabaseUrl(supabaseUrl),
    supabaseAnonKey,
  };
}
