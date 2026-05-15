import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { renderTurnstile, type TurnstileHandle } from '@/lib/turnstile';
import { CAPTCHA_REQUIRED } from '@/lib/auth-config';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetHandleRef = useRef<TurnstileHandle | null>(null);

  // Establish recovery session from URL hash (#access_token=...&refresh_token=...&type=recovery)
  // OR from ?code= (PKCE flow), OR fall back to existing session. In sandbox mode
  // (CAPTCHA_REQUIRED=false) AND already-signed-in, allow simulated recovery so the
  // form can be exercised by manually navigating to /auth/reset-password.
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      // 1) Hash-fragment recovery (implicit flow)
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : '';
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (access_token && refresh_token && (type === 'recovery' || !type)) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (!cancelled) {
          if (setErr) setError(setErr.message);
          else {
            // Clean the hash so a refresh doesn't reuse a one-shot token
            window.history.replaceState(null, '', window.location.pathname);
            setReady(true);
          }
        }
        return;
      }

      // 2) PKCE recovery (?code=...)
      const search = new URLSearchParams(window.location.search);
      const code = search.get('code');
      if (code) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (exchErr) setError(exchErr.message);
          else {
            window.history.replaceState(null, '', window.location.pathname);
            setReady(true);
          }
        }
        return;
      }

      // 3) Fallback to existing session (live PASSWORD_RECOVERY event)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!cancelled) {
          // Sandbox-only: signed-in user without recovery hash → simulated dev path.
          if (!CAPTCHA_REQUIRED) setSimulated(true);
          setReady(true);
        }
        return;
      }

      // 4) Wait briefly for an auth event in case Supabase hasn't fired yet
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          session &&
          (event === 'PASSWORD_RECOVERY' ||
            event === 'SIGNED_IN' ||
            event === 'INITIAL_SESSION')
        ) {
          if (!cancelled) setReady(true);
        }
      });
      setTimeout(() => {
        if (!cancelled) {
          // Give up — show form anyway; updateUser will surface the real error.
          setReady(true);
        }
        sub.subscription.unsubscribe();
      }, 1500);
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mount Turnstile once the form is shown (only when CAPTCHA is required)
  useEffect(() => {
    if (!CAPTCHA_REQUIRED) return;
    let cancelled = false;
    if (ready && turnstileRef.current) {
      renderTurnstile({
        container: turnstileRef.current,
        onToken: (token) => setCaptchaToken(token),
        onExpire: () => setCaptchaToken(null),
        theme: 'dark',
      })
        .then((handle) => {
          if (cancelled) {
            handle.remove();
            return;
          }
          widgetHandleRef.current = handle;
        })
        .catch(() => {
          toast.error('Verification required — please complete the challenge.');
        });
    }
    return () => {
      cancelled = true;
      widgetHandleRef.current?.remove();
      widgetHandleRef.current = null;
    };
  }, [ready]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (CAPTCHA_REQUIRED && !captchaToken) {
      toast.error('Verification required — please complete the challenge.');
      return;
    }
    setLoading(true);

    // SDK note: @supabase/supabase-js ^2.98.0 does not declare `captchaToken`
    // on updateUser options. We pass it via cast when present so server-side
    // captcha enforcement (if enabled) receives a valid token.
    const captchaArg = CAPTCHA_REQUIRED ? (captchaToken ?? undefined) : undefined;
    const { error: updateError } = await supabase.auth.updateUser(
      { password },
      captchaArg
        ? ({ captchaToken: captchaArg } as unknown as { emailRedirectTo?: string })
        : undefined
    );
    setLoading(false);
    widgetHandleRef.current?.reset();
    setCaptchaToken(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success('Password updated, sign in.');
    navigate('/architect-login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 grid-overlay">
      <div className="w-full max-w-sm">
        <a
          href="/"
          className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-display hover:text-foreground transition-colors block mb-12"
        >
          Fellowship of Living Systems
        </a>
        <h1 className="text-2xl font-bold font-display mb-2 text-foreground">
          Set a new password
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Choose a new password to recover access to the Codex.
        </p>

        {simulated && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm px-4 py-3 mb-4 text-xs font-mono text-amber-500/90">
            sandbox — simulated recovery. You are signed in; submitting will
            change your live password. No reset email was used.
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-sm px-4 py-3 mb-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {!ready ? (
          <p className="text-sm text-muted-foreground font-mono">Verifying recovery link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">Confirm password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            {CAPTCHA_REQUIRED ? (
              <div
                id="turnstile-reset-password"
                ref={turnstileRef}
                className="flex justify-center my-2"
              ></div>
            ) : (
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70 text-center my-2">
                sandbox — captcha bypassed
              </p>
            )}
            <button
              type="submit"
              disabled={loading || (CAPTCHA_REQUIRED && !captchaToken)}
              className="w-full border border-primary text-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
