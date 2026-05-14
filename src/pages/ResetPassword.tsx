import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase populates the session from the URL hash on load.
    // Wait briefly for the session to be parsed before showing the form.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }
      // Fall back to listening for PASSWORD_RECOVERY / SIGNED_IN events
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          setReady(true);
        }
      });
      // Timeout fallback to show form anyway (user may still try)
      setTimeout(() => setReady(true), 1500);
      return () => sub.subscription.unsubscribe();
    };
    check();
  }, []);

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
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
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
            <button
              type="submit"
              disabled={loading}
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
