# Keyboard shortcut for repeated navigation

The shared institution workspace and account/participant layouts now start with a native “Skip to page content” link. It appears on keyboard focus, is at least 44px tall, and moves focus beyond the repeated header/navigation. The next Tab reaches the first content control. The target has a visible focus outline and does not add an extra stop to ordinary tab order. This requires no client JavaScript.

`scripts/verify-skip-navigation.mjs` renders the actual AppShell and AccountFrame components and their styles, then checks them in Chromium at 1280, 390, 360 and 320px with JavaScript disabled. All eight cases passed: shortcut initially off screen, first-Tab visibility, Enter focus transfer, next-Tab content action, one target per page, and no document overflow. The 360px screenshots were visually inspected. Results and images are in ignored `work/` files.

These are shared-layout tests with synthetic children and stubbed server dependencies. They do not prove authenticated authorization, a complete page's responsive layout, real browser zoom, screen-reader announcements or independent first-use success. The 320px test is a narrow viewport check, not a claim of testing browser zoom. Public commercial pages use other layouts and still need their own repeated-navigation treatment.

No request state, permissions, legal text, migrations, receipt history or provider sends changed. Hosted authenticated cancellation replay and UAT preview SSO remain open. The application is not newly released by this change.

Validation: TypeScript, optimized production build and all 172 domain tests passed. The initial verification-script lint naming issue was corrected; final lint and browser results are recorded before commit.

Final verification: full-repository ESLint passed after the script correction; all eight browser checks passed again.
