export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function requireSupabasePublicConfig(): SupabasePublicConfig {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("authority_access_unavailable");
  }
  return config;
}

export function getAuthorityAppUrl() {
  const configuredUrl = (process.env.AUTHORITY_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const appUrl = new URL(configuredUrl);
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (process.env.NODE_ENV === "production") {
    if (appUrl.protocol !== "https:") {
      throw new Error("authority_app_url_insecure");
    }

    if (!publicSiteUrl) {
      throw new Error("authority_public_site_url_missing");
    }

    if (appUrl.origin !== new URL(publicSiteUrl).origin) {
      throw new Error("authority_app_url_mismatch");
    }
  }

  return appUrl.origin;
}

export function isGoogleSignInEnabled() {
  return process.env.GOOGLE_AUTH_ENABLED === "true";
}

export function safeAppPath(value: string | null | undefined, fallback = "/app") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
