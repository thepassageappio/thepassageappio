import assert from "node:assert/strict";
import test from "node:test";
import { getAuthorityAppUrl } from "../supabase/config.ts";

function withEnvironment(values: Record<string, string | undefined>, run: () => void) {
  const original = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("production invitation links use the same public origin as the current site", () => {
  withEnvironment({
    NODE_ENV: "production",
    AUTHORITY_APP_URL: "https://demo.example.com",
    NEXT_PUBLIC_SITE_URL: "https://demo.example.com",
  }, () => assert.equal(getAuthorityAppUrl(), "https://demo.example.com"));
});

test("production refuses to email a link for a different deployment", () => {
  withEnvironment({
    NODE_ENV: "production",
    AUTHORITY_APP_URL: "https://demo.example.com",
    NEXT_PUBLIC_SITE_URL: "https://live.example.com",
  }, () => assert.throws(() => getAuthorityAppUrl(), /authority_app_url_mismatch/));
});

test("production invitation links require HTTPS", () => {
  withEnvironment({
    NODE_ENV: "production",
    AUTHORITY_APP_URL: "http://demo.example.com",
    NEXT_PUBLIC_SITE_URL: "http://demo.example.com",
  }, () => assert.throws(() => getAuthorityAppUrl(), /authority_app_url_insecure/));
});

test("production refuses to send links without an explicit public site URL", () => {
  withEnvironment({
    NODE_ENV: "production",
    AUTHORITY_APP_URL: "https://demo.example.com",
    NEXT_PUBLIC_SITE_URL: undefined,
  }, () => assert.throws(() => getAuthorityAppUrl(), /authority_public_site_url_missing/));
});
