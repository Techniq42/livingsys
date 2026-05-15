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
export const CAPTCHA_REQUIRED = raw !== 'false';
