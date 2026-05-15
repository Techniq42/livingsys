import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { renderTurnstile, type TurnstileHandle } from '@/lib/turnstile';
import { CAPTCHA_REQUIRED } from '@/lib/auth-config';

const TURNSTILE_SITE_KEY = '0x4AAAAAACsH-SiikIJB-A7Q';

export default function ArchitectLogin() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [forgotCaptchaToken, setForgotCaptchaToken] = useState<string | null>(null);
  const forgotTurnstileRef = useRef<HTMLDivElement>(null);
  const forgotWidgetHandleRef = useRef<TurnstileHandle | null>(null);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/architect-dashboard');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/architect-dashboard');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      setLoading(false);
      return;
    }

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
            emailRedirectTo: 'https://livingsys.lovable.app/architect-dashboard',
            captchaToken,
          },
        });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
          options: { captchaToken },
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
          Architect Access
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {isSignUp
            ? 'Create your account to access the coordination stack.'
            : 'Sign in to your Architect dashboard.'}
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
            <div
              id="turnstile-forgot-architect"
              ref={forgotTurnstileRef}
              className="flex justify-center my-2"
            ></div>
            <button
              type="submit"
              disabled={resetLoading || !forgotCaptchaToken}
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
              <div ref={turnstileRef} className="flex justify-center my-2"></div>
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-primary text-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full text-center"
            >
              {isSignUp ? 'Already have access? Sign in' : "Need access? Create an account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
