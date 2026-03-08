import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fireOptInWebhook, fireBookBumpWebhook } from '@/lib/webhooks';
import { ValueStack } from './ValueStack';
import { getActiveBookRoute } from '@/config/bookRouting';

interface OptInFormProps {
  path: 'architect' | 'operator';
  onBack: () => void;
}

type FormState = 'form' | 'submitted' | 'bump';

export function OptInForm({ path, onBack }: OptInFormProps) {
  const [state, setState] = useState<FormState>('form');
  const [leadId, setLeadId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  const isArchitect = path === 'architect';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            path,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setLeadId(data.id);
      setState('submitted');

      fireOptInWebhook({
        id: data.id,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        path,
      });

      setTimeout(() => setState('bump'), 2500);
    } catch (err) {
      console.error('Lead submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookBump = async () => {
    await supabase
      .from('leads')
      .update({ book_bump_clicked: true, book_bump_timestamp: new Date().toISOString() })
      .eq('id', leadId);

    fireBookBumpWebhook(leadId, path);

    const activeRoute = getActiveBookRoute();
    if (activeRoute && activeRoute.url && activeRoute.url !== '#') {
      window.open(activeRoute.url, '_blank');
    }
  };

  if (state === 'submitted') {
    return (
      <section id="optin-section" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 border-t border-border">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-primary mb-4">
            <span className="text-2xl">✓</span>
            <p className="text-lg font-display">On its way. Check your inbox in the next few minutes.</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-primary animate-pulse-dot" />
        </div>
      </section>
    );
  }

  if (state === 'bump') {
    return (
      <section id="optin-section" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 border-t border-border">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-primary mb-8">
            <span className="text-2xl">✓</span>
            <p className="text-lg font-display">On its way. Check your inbox in the next few minutes.</p>
          </div>

          <div className="border border-border bg-card rounded-sm p-8">
            <p className="text-foreground leading-relaxed mb-6">
              {getActiveBookRoute().description}
            </p>
            <button
              onClick={handleBookBump}
              className="w-full bg-secondary text-secondary-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:brightness-110 transition-all mb-3 cursor-pointer"
            >
              {getActiveBookRoute().buttonText}
            </button>
            <button
              onClick={onBack}
              className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors cursor-pointer"
            >
              No thanks, the digital version is enough
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="optin-section" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 border-t border-border">
      <div className="max-w-2xl">
        <button
          onClick={onBack}
          className="text-muted-foreground text-sm mb-8 hover:text-foreground transition-colors cursor-pointer font-display tracking-wider"
        >
          ← Back
        </button>

        <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight mb-4 text-foreground">
          {isArchitect ? "Good. You're exactly who we built this for." : "We'll set it up. You run it."}
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-8">
          {isArchitect
            ? "Everything you need to fork the coordination layer and own your nodes. No vendor lock-in. No permission required."
            : "Pre-configured coordination infrastructure. You focus on impact — we handle the plumbing."}
        </p>

        {/* Value Stack */}
        <ValueStack path={path} />

        {/* Form */}
        <div className="mt-10">
          <p className="text-foreground font-display text-sm tracking-wider uppercase mb-6">
            Enter your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1 block">
                Phone <span className="normal-case tracking-normal">(Optional: SMS updates on new toolkit releases)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-sm font-display text-sm tracking-wider transition-all cursor-pointer ${
                isArchitect
                  ? 'border border-primary text-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:brightness-110'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot" />
                  Processing
                </span>
              ) : isArchitect ? (
                'Send Me The Field Guide + Repository Access'
              ) : (
                'Send Me The Field Guide + GHL Snapshot'
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
