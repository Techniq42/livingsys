/**
 * Auth configuration flags.
 *
 * CAPTCHA_REQUIRED:
 *   When true (default / production), all auth forms render Cloudflare
 *   Turnstile widgets and require a token before submitting. The token is
 *   passed to Supabase Auth, which is expected to have server-side CAPTCHA
 *   protection enabled.
 *
 *   When false (sandbox), Turnstile widgets are NOT mounted, the client-side
 *   guards are skipped, and `captchaToken: undefined` is passed to all auth
 *   calls. This relies on Supabase server-side CAPTCHA being OFF — otherwise
 *   the call will fail with `captcha_token_missing`.
 *
 * Reads `import.meta.env.VITE_CAPTCHA_REQUIRED`. Treats anything other than
 * the literal string "false" as true (fail-safe for production).
 *
 * BEFORE GO-LIVE: ensure VITE_CAPTCHA_REQUIRED is unset (or "true") AND
 * re-enable CAPTCHA in the Supabase Auth dashboard.
 */
const raw = (import.meta.env.VITE_CAPTCHA_REQUIRED ?? 'true').toString().toLowerCase();
const fromEnv = raw !== 'false';

// SANDBOX OVERRIDE — flip this to `fromEnv` (or delete the override) before go-live.
// Supabase server-side CAPTCHA is currently OFF in this sandbox. Setting this to
// false skips client-side Turnstile entirely so we can exercise sign-in /
// forgot-password / reset-password without the widget. To re-enable CAPTCHA:
//   1) export const CAPTCHA_REQUIRED = fromEnv;
//   2) Re-enable CAPTCHA in Supabase Auth dashboard
//   3) Whitelist hostnames in Cloudflare Turnstile site config
export const CAPTCHA_REQUIRED = false;
void fromEnv;
