import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ArchitectLogin() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/architect-dashboard');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/architect-dashboard');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + '/architect-dashboard' },
        });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
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
          {isSignUp ? 'Create your account to access the coordination stack.' : 'Sign in to your Architect dashboard.'}
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

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
      </div>
    </div>
  );
}
