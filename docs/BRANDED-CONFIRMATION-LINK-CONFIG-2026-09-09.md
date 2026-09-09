# Branded confirmation link — required Supabase config change

**Date:** September 9, 2026
**Status:** Not fixed by code. Requires a manual Supabase Dashboard change on both the UAT and Demo projects. Documented here per QA-REPORT-2026-09-09.md item 4/#9.

## What QA found

The signup confirmation email links to a raw Supabase-hosted URL:

```
https://ywlrxdjibngroycwnujg.supabase.co/auth/v1/verify?...
```

instead of a `thepassageapp.io` domain. For a security-conscious bank/credit-union buyer, a link that points at third-party infrastructure rather than the product's own domain reads as phishing-adjacent.

## What's already correct in this repo (no code change needed)

- `src/app/account-actions.ts` → `requestSignInAction` already builds a branded confirm URL and passes it as `emailRedirectTo`:
  ```ts
  const confirmUrl = new URL("/auth/confirm", authorityAppUrl); // e.g. https://www.thepassageapp.io/auth/confirm
  confirmUrl.searchParams.set("next", next);
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: confirmUrl.toString(), ... },
  });
  ```
- `src/app/auth/confirm/route.ts` already exists at that branded path and already handles both the PKCE `code` flow and the `token_hash` + `type` flow (`supabase.auth.verifyOtp({ token_hash, type })`), then redirects on to `/onboarding/organization` (or `next`) on the branded `authorityAppUrl` origin.

`emailRedirectTo` only controls the `redirect_to` query parameter appended to Supabase's own hosted verify link — it does not change which domain is shown/clicked in the email. That's controlled by the **email template** itself, which by default uses `{{ .ConfirmationURL }}` (a `<project-ref>.supabase.co/auth/v1/verify?...` link). That template lives in the Supabase project, not in this repository — `supabase/config.toml` here has no `[auth.email.template.confirmation]` (or `.magiclink`/`.invite`) entry, and there is no `supabase/templates/*.html` file for it. The local `config.toml` also only defines `site_url`/`additional_redirect_urls` for `127.0.0.1`/`localhost` — it does not represent the hosted UAT or Demo project settings.

## The actual fix (manual, dashboard-side, per project)

For **each** hosted project (Passage Authority UAT — `ywlrxdjibngroycwnujg` — and passage-demo — `bklrclpertdtmhycpqlz`):

1. Confirm **Authentication → URL Configuration → Site URL** is set to that project's branded origin (`https://www.thepassageapp.io` for UAT/production, `https://demo.thepassageapp.io` for Demo), so `{{ .SiteURL }}` resolves correctly in templates.
2. Confirm **Authentication → URL Configuration → Redirect URLs** includes `https://www.thepassageapp.io/auth/confirm` (and `/team/accept`) for UAT, and the `demo.thepassageapp.io` equivalents for Demo.
3. In **Authentication → Email Templates → Confirm signup**, replace the default action link (which renders `{{ .ConfirmationURL }}`) with a link built from `{{ .SiteURL }}` and `{{ .TokenHash }}`, e.g.:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
   ```
4. Repeat the same `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink` substitution for the **Magic Link** template (used by `requestSignInAction` for existing users) and `type=invite` for the **Invite** template if institution team invites ever move off the current `/team/accept` token flow.
5. No app code changes are required for this — `src/app/auth/confirm/route.ts` already accepts exactly this `token_hash`+`type` shape (see `allowedTypes` in that file).

## Why this wasn't done in this pass

This change can only be made in the Supabase Dashboard (or via the Supabase Management API/CLI with an authenticated, linked project) for each hosted project. No MCP tool or credential available in this session can edit hosted Auth email templates, and this fix intentionally stays out of scope for anything touching MFA/RLS/auth internals currently owned by other in-flight work. Whoever has Supabase Dashboard access for both projects should apply the four steps above.
