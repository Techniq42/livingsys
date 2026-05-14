/**
 * Cloudflare Turnstile helper — loads the script once and renders independent
 * widget instances. Each call returns a cleanup function that removes the
 * widget from the DOM and releases its widgetId.
 */

export const TURNSTILE_SITE_KEY = '0x4AAAAAACsH-SiikIJB-A7Q';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const check = () => {
        if ((window as any).turnstile) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface RenderTurnstileOptions {
  container: HTMLElement;
  onToken: (token: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export interface TurnstileHandle {
  remove: () => void;
  reset: () => void;
}

export async function renderTurnstile(
  opts: RenderTurnstileOptions
): Promise<TurnstileHandle> {
  await loadScript();
  const ts = (window as any).turnstile;
  if (!ts) throw new Error('Turnstile not available');

  const widgetId: string = ts.render(opts.container, {
    sitekey: TURNSTILE_SITE_KEY,
    callback: opts.onToken,
    'expired-callback': () => opts.onExpire?.(),
    theme: opts.theme ?? 'dark',
  });

  return {
    remove: () => {
      try {
        ts.remove(widgetId);
      } catch {
        /* widget already removed */
      }
    },
    reset: () => {
      try {
        ts.reset(widgetId);
      } catch {
        /* ignore */
      }
    },
  };
}
