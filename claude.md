# Security Rules for LivingSys (claude.md)

> Drop this file in your project root. AI coding assistants that support claude.md or .cursorrules will read these constraints before generating code.

## Project Context
- **App**: LivingSys (Fellowship of Living Systems platform)
- **Stack**: React 18 + TypeScript + Vite + Supabase + Cloudflare Turnstile
- **Auth**: Supabase Auth with RLS policies
- **Hosting**: Lovable (auto-deploy from GitHub)

---

## MANDATORY SECURITY RULES

### 1. Secrets & Environment Variables
- NEVER hardcode API keys, tokens, passwords, or connection strings in source code
- ALL secrets go in environment variables via `.env` files (local) or platform secrets (production)
- `.env` files MUST be listed in `.gitignore` — verify before every commit
- Use `import.meta.env.VITE_*` for client-side env vars only; server secrets go in Supabase Edge Functions env
- NEVER log, console.log, or expose secrets in error messages or responses

### 2. Input Validation & Injection Prevention
- Validate and sanitize ALL user inputs on BOTH client and server (Supabase Edge Functions / RLS)
- Use parameterized queries — NEVER concatenate user input into SQL strings
- Apply Zod schemas for form validation; reject unexpected fields
- Sanitize any user-generated content rendered as HTML to prevent XSS
- Set Content-Security-Policy meta tags to restrict script sources

### 3. Authentication & Authorization
- Enforce minimum 8-character passwords via both UI validation AND Supabase Auth config
- Require Cloudflare Turnstile CAPTCHA verification on all auth forms (login, signup, password reset)
- Server-side verify Turnstile tokens via Edge Function before processing auth requests
- NEVER trust client-side auth state alone; always verify JWT server-side
- Apply Row Level Security (RLS) policies on EVERY Supabase table — no exceptions
- Use `auth.uid()` in RLS policies; never expose data without auth checks
- Block email enumeration: use identical error messages for "user not found" and "wrong password"

### 4. Database & RLS
- Enable RLS on every new table immediately upon creation
- Default-deny: tables with RLS enabled but no policies reject all access
- Restrict INSERT/UPDATE to only the columns users should modify
- Admin-only tables (like architect_access) must use role-based policies
- Audit trail: log sensitive operations with timestamps and user IDs

### 5. API & Network Security
- CORS: restrict `Access-Control-Allow-Origin` to exact production domains only
- Set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- Enforce HTTPS everywhere; redirect HTTP to HTTPS
- Apply rate limiting on auth endpoints and API routes (Supabase Auth rate limits + Edge Function checks)
- Never expose stack traces or debug info in production error responses

### 6. Dependencies & Supply Chain
- Pin dependency versions; use `^` ranges only for trusted packages
- Run `npm audit` before every deploy; zero production vulnerabilities required
- Keep Dependabot alerts enabled; merge security PRs within 48 hours
- Verify unfamiliar package names on npmjs.com before adding to project
- Never install packages suggested by AI without verifying they exist and are maintained

### 7. Production Configuration
- `NODE_ENV=production` in all production environments
- Disable Vite/React debug mode and source maps in production builds
- Remove all `console.log` statements before deploying (use lint rules)
- Set secure cookie flags: `Secure`, `HttpOnly`, `SameSite=Strict`
- Enable Supabase attack protection: CAPTCHA, rate limiting, email confirmation

### 8. Code Generation Rules for AI Assistants
- When generating auth code: ALWAYS include Turnstile verification
- When generating database queries: ALWAYS use parameterized queries
- When generating API endpoints: ALWAYS include auth middleware and input validation
- When generating forms: ALWAYS include client-side validation with Zod AND server-side validation
- When creating new Supabase tables: ALWAYS enable RLS and create at least a SELECT policy
- When handling errors: NEVER expose internal error details to users
- NEVER generate code that disables security features "for testing"
- NEVER import or suggest packages that don't exist on npmjs.com

---

## Pre-commit Checklist
Before every commit, verify:
- [ ] No secrets in code or git history
- [ ] `.env` in `.gitignore`
- [ ] All user inputs validated (client + server)
- [ ] RLS enabled on any new tables
- [ ] Auth forms include CAPTCHA
- [ ] `npm audit` shows 0 production vulnerabilities
- [ ] No `console.log` in production code paths
- [ ] CSP headers configured
