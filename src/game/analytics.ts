type PlausibleFn = (event: string, options?: { props?: Record<string, string | number> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  }
}
