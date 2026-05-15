import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { renderTurnstile, type TurnstileHandle } from '@/lib/turnstile';
import { CAPTCHA_REQUIRED } from '@/lib/auth-config';

const TURNSTILE_SITE_KEY = '0x4AAAAAACsH-SiikIJB-A7Q';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotCaptchaToken, setForgotCaptchaToken] = useState<string | null>(null);
  const forgotTurnstileRef = useRef<HTMLDivElement>(null);
  const forgotWidgetHandleRef = useRef<TurnstileHandle | null>(null);

  // Mount/unmount the forgot-password Turnstile widget when toggling modes
  useEffect(() => {
    if (!CAPTCHA_REQUIRED) return;
    let cancelled = false;
    if (forgotMode && forgotTurnstileRef.current) {
      renderTurnstile({
        container: forgotTurnstileRef.current,
        onToken: (token) => setForgotCaptchaToken(token),
        onExpire: () => setForgotCaptchaToken(null),
        theme: 'dark',
      })
        .then((handle) => {
          if (cancelled) {
            handle.remove();
            return;
          }
          forgotWidgetHandleRef.current = handle;
        })
        .catch(() => {
          toast.error('Verification required — please complete the challenge.');
        });
    }
    return () => {
      cancelled = true;
      forgotWidgetHandleRef.current?.remove();
      forgotWidgetHandleRef.current = null;
      setForgotCaptchaToken(null);
    };
  }, [forgotMode]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (CAPTCHA_REQUIRED && !forgotCaptchaToken) {
      toast.error('Verification required — please complete the challenge.');
      return;
    }
    setResetLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim().toLowerCase(),
      {
        captchaToken: CAPTCHA_REQUIRED ? (forgotCaptchaToken ?? undefined) : undefined,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );
    setResetLoading(false);
    forgotWidgetHandleRef.current?.reset();
    setForgotCaptchaToken(null);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    toast.success('Reset link sent. Check your email.');
    setForgotMode(false);
    setResetEmail('');
  };

  useEffect(() => {
    if (!CAPTCHA_REQUIRED) return;
    const scriptId = 'cf-turnstile-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
      script.async = true;
      document.head.appendChild(script);
    }

    (window as any).onTurnstileLoad = () => {
      if (turnstileRef.current && (window as any).turnstile) {
        widgetIdRef.current = (window as any).turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
          theme: 'dark',
        });
      }
    };

    if ((window as any).turnstile && turnstileRef.current) {
      widgetIdRef.current = (window as any).turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(null),
        theme: 'dark',
      });
    }

    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  const resetTurnstile = () => {
    if (widgetIdRef.current && (window as any).turnstile) {
      (window as any).turnstile.reset(widgetIdRef.current);
    }
    setCaptchaToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (CAPTCHA_REQUIRED && !captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      setLoading(false);
      return;
    }

    const captchaArg = CAPTCHA_REQUIRED ? (captchaToken ?? undefined) : undefined;

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Check approved_emails allowlist before signup or login
      const { data: approved, error: lookupError } = await (supabase
        .from('approved_emails') as any)
        .select('email')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (lookupError) {
        throw new Error('Unable to verify access. Please try again.');
      }
      if (!approved) {
        throw new Error(
          'Access is by invitation only. If you believe you should have access, contact the Fellowship coordination team.'
        );
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: 'https://livingsys.lovable.app/dashboard',
            captchaToken: captchaArg,
          },
        });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
          options: { captchaToken: captchaArg },
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
      resetTurnstile();
    }
  };

  const fillDemo = () => {
    setEmail('test@edgerunner.local');
    setPassword('testrunner2026');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 grid-overlay">
      <div className="w-full max-w-sm">
        <a
          href="/"
          className="block mb-8 group"
        >
          <h1
            className="text-3xl sm:text-4xl font-bold font-display tracking-[0.08em] uppercase leading-tight"
            style={{
              background: 'linear-gradient(135deg, hsl(142 52% 50%), hsl(12 85% 62%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 18px hsl(142 52% 42% / 0.35))',
            }}
          >
            Fellowship of Living Systems
          </h1>
        </a>
        <p className="text-sm font-mono text-muted-foreground tracking-wider mb-1">
          Sovereign OS v1.0
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          {isSignUp ? 'Create your Codex access.' : 'Sign in to access the Codex.'}
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-sm px-4 py-3 mb-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-primary/10 border border-primary/30 rounded-sm px-4 py-3 mb-6 text-sm text-primary">
            {message}
          </div>
        )}

        {forgotMode ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            {CAPTCHA_REQUIRED && (
              <div
                id="turnstile-forgot-auth"
                ref={forgotTurnstileRef}
                className="flex justify-center my-2"
              ></div>
            )}
            <button
              type="submit"
              disabled={resetLoading || (CAPTCHA_REQUIRED && !forgotCaptchaToken)}
              className="w-full border border-primary text-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer disabled:opacity-50"
            >
              {resetLoading ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => { setForgotMode(false); setError(''); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full text-center"
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); setMessage(''); setResetEmail(email); }}
                    className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              {CAPTCHA_REQUIRED && (
                <div ref={turnstileRef} className="flex justify-center my-2"></div>
              )}
              {!CAPTCHA_REQUIRED && (
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70 text-center my-2">
                  sandbox — captcha bypassed
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-primary text-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have access? Sign in' : "Need access? Create an account"}
              </button>
              <button
                onClick={fillDemo}
                className="text-xs text-muted-foreground/60 hover:text-coral transition-colors cursor-pointer font-mono"
              >
                Demo login ↗
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
