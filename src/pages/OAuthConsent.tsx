import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthPage } from "@/components/Auth/AuthPage";

// Local typed shim for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauthApi(): OAuthApi | null {
  const anyAuth = (supabase.auth as any).oauth;
  return anyAuth ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authed !== true) return;
    if (!authorizationId) { setError("Missing authorization_id"); return; }
    const api = oauthApi();
    if (!api) { setError("OAuth API unavailable in this Supabase client build."); return; }
    let active = true;
    (async () => {
      const { data, error } = await api.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) { setError(error.message || String(error)); return; }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authed, authorizationId]);

  async function decide(approve: boolean) {
    const api = oauthApi();
    if (!api) return;
    setBusy(true);
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) { setBusy(false); setError(error.message || String(error)); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse-dot" />
      </div>
    );
  }

  if (!authed) {
    // Sign in inline; onAuthStateChange fires above and re-runs the details fetch
    // so the user lands back on the consent screen with the same authorization_id.
    return <AuthPage />;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
        <div className="max-w-md border border-destructive/30 bg-destructive/10 rounded-sm p-6">
          <h1 className="font-display text-lg mb-2">Could not load this authorization</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse-dot" />
      </div>
    );
  }

  const clientName = details.client?.name ?? "an app";
  const redirectUri = details.client?.redirect_uri ?? details.redirect_uri ?? null;
  const scopes: string[] = Array.isArray(details.scopes)
    ? details.scopes
    : typeof details.scope === "string"
    ? details.scope.split(/\s+/).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background text-foreground">
      <div className="w-full max-w-md border border-border rounded-sm bg-card p-6">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Sovereign OS · Agent integration
        </p>
        <h1 className="text-xl font-display mb-3">
          Connect <span className="text-primary">{clientName}</span> to your account
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          This lets {clientName} use this app as you. It will be able to call Sovereign OS MCP tools
          (canon lookup, Gemma facts) while you are signed in. Your app permissions and backend policies
          still decide what data is accessible.
        </p>

        {redirectUri && (
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Redirect URI</p>
            <p className="text-xs font-mono break-all text-foreground/80">{redirectUri}</p>
          </div>
        )}

        {scopes.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Requested scopes</p>
            <ul className="text-xs font-mono text-foreground/80 space-y-1">
              {scopes.map((s) => <li key={s}>· {s}</li>)}
            </ul>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 border border-primary text-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            {busy ? "Working…" : "Approve"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 border border-border text-muted-foreground py-3 rounded-sm font-display text-sm tracking-wider hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
