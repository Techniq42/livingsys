import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
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
            emailRedirectTo: 'https://livingsys.lovable.app/dashboard',
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
      </div>
    </div>
  );
}
