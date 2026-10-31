import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { hueFor, initials, PROFICIENCY, PROFICIENCY_HINT } from './lib/format';
import type { ApiError } from './lib/api';
import { Link } from './lib/router';

export function Mark() {
  // Three nodes, two joined; the open node (signal) is the capability still being sought.
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18 12 5l7 13" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2.4" />
      <circle cx="12" cy="5" r="3" fill="currentColor" />
      <circle cx="5" cy="18" r="3" fill="currentColor" />
      <circle cx="19" cy="18" r="2.6" fill="var(--paper)" stroke="var(--signal)" strokeWidth="1.6" />
    </svg>
  );
}

export function Wordmark({ to = '/' }: { to?: string }) {
  return <Link to={to} className="wordmark" aria-label="MESH home"><Mark />MESH</Link>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'signal' | 'outline' | 'ghost'; size?: 'sm' | 'lg'; loading?: boolean; icon?: boolean };
export function Button({ variant = 'primary', size, loading, icon, className = '', children, disabled, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${icon ? 'btn-icon' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, id }: { label: string; hint?: ReactNode; error?: string; children: (id: string, describedBy?: string) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      {children(fid, describedBy)}
      {error ? <span className="error" id={`${fid}-err`}><AlertCircle size={13} />{error}</span> : hint ? <span className="hint" id={`${fid}-hint`}>{hint}</span> : null}
    </div>
  );
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="input-wrap">
      <input {...props} type={shown ? 'text' : 'password'} className="input" />
      <button type="button" className="btn btn-ghost btn-sm btn-icon reveal" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
        {shown ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

export function Meter({ value, tone }: { value: number; tone?: 'covered' | 'partial' }) {
  return (
    <span className={`meter ${tone ?? ''}`} role="img" aria-label={`Level ${value} of 5, ${PROFICIENCY[value] ?? ''}`}>
      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= value ? 'on' : ''} />)}
    </span>
  );
}

export function MeterInput({ value, onChange, label }: { value: number; onChange(v: number): void; label: string }) {
  return (
    <span className="meter-input" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} className={n <= value ? 'on' : ''} title={`${PROFICIENCY[n]} — ${PROFICIENCY_HINT[n]}`} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </span>
  );
}

export function Avatar({ id, name, size = 32 }: { id: string; name: string; size?: number }) {
  return <span className="avatar" style={{ '--hue': hueFor(id), '--size': `${size}px` } as React.CSSProperties} title={name} aria-hidden="true">{initials(name)}</span>;
}

export function ErrorNote({ error, retry }: { error: ApiError | null | undefined; retry?: () => void }) {
  if (!error) return null;
  return (
    <div className="callout error" role="alert">
      <AlertCircle />
      <div className="row" style={{ flex: 1, justifyContent: 'space-between' }}>
        <span>{error.message}</span>
        {retry && <button type="button" className="btn btn-outline btn-sm" onClick={retry}>Try again</button>}
      </div>
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: number | string }) {
  return <div className="skeleton" style={{ height: h, width: w }} aria-hidden="true" />;
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <div className="loading-lines" aria-hidden="true"><span /><span /><span /><span /></div>
      <span className="meta">{label}…</span>
    </div>
  );
}

export function Dialog({ open, onClose, children, label }: { open: boolean; onClose(): void; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-label={label} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {open && <div className="dialog-body">{children}</div>}
    </dialog>
  );
}

// ---------- Toasts ----------
type Toast = { id: number; text: string; tone: 'ok' | 'error' };
const ToastContext = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-host" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>{t.tone === 'ok' ? <Check /> : <AlertCircle />}{t.text}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
