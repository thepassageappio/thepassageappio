# 2026-08-16 — Google sign-in enabled in production

Supabase's Google OAuth provider was already configured and working (2 real Google identities existed in `auth.identities` prior to this change). The only gap was the app-level `PASSAGE_GOOGLE_AUTH_ENABLED` flag, which gates the "Continue with Google" button in `app/login/LoginClient.tsx`. It was set for several preview branches but never for Production.

Added `PASSAGE_GOOGLE_AUTH_ENABLED=true` to the Production environment in Vercel. This commit exists only to retrigger a production build so the new env var takes effect (no code changes).
