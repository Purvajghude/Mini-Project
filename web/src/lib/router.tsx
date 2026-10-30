import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

// ponytail: tiny history router; swap for react-router if nested layouts or loaders are ever needed.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
window.addEventListener('popstate', notify);

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === location.pathname + location.search) return;
  history[opts.replace ? 'replaceState' : 'pushState'](null, '', to);
  window.scrollTo({ top: 0 });
  notify();
}

export function useLocation() {
  const href = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => location.pathname + location.search);
  const url = new URL(href, location.origin);
  return { path: url.pathname, query: url.searchParams };
}

/** match('/p/:id/:tab?', '/p/42/team') → { id: '42', tab: 'team' } */
export function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (b.length > a.length || b.length < a.filter((s) => !s.endsWith('?')).length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const seg = a[i];
    if (seg.startsWith(':')) {
      if (b[i] !== undefined) params[seg.replace(/[:?]/g, '')] = decodeURIComponent(b[i]);
    } else if (seg !== b[i]) return null;
  }
  return params;
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...rest} />;
}
