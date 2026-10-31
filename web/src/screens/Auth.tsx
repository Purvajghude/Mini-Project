import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Link, navigate, useLocation } from '../lib/router';
import { Button, ErrorNote, Field, PasswordInput, Wordmark } from '../ui';

const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{2,39}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <Wordmark />
        <div className="auth-aside-body">{aside}</div>
        <p className="meta" style={{ color: '#a8a193' }}>Idea → Blueprint → Skill gap → Team → Build</p>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-mark"><Wordmark /></div>
        <div className="auth-form page-enter">{children}</div>
      </main>
    </div>
  );
}

function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/studio';
}

export function Login() {
  const { signIn } = useAuth();
  const { query } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!EMAIL.test(email.trim())) next.email = 'Enter the email you registered with.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    setFailure(null);
    try {
      const auth = await api.login({ email: email.trim(), password });
      signIn(auth);
      navigate(auth.user.onboardingComplete ? safeNext(query.get('next')) : '/onboarding', { replace: true });
    } catch (err) {
      setFailure(err instanceof ApiError && err.status === 401 ? new ApiError('That email and password don’t match an account.', 401) : (err as ApiError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout aside={<h1 className="display auth-quote">Welcome back to the <em>studio.</em></h1>}>
      <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
        <h2 className="title">Sign in</h2>
        <p className="muted">New to MESH? <Link to="/register">Create an account</Link></p>
      </div>
      <form className="stack" onSubmit={submit} noValidate>
        <ErrorNote error={failure} />
        <Field label="Email" error={errors.email}>
          {(id, d) => <input id={id} className="input" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={d} />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(id, d) => <PasswordInput id={id} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={d} />}
        </Field>
        <Button type="submit" size="lg" loading={pending}>Sign in <ArrowRight /></Button>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.displayName.trim()) e.displayName = 'Tell us what to call you.';
    if (!USERNAME.test(form.username)) e.username = '3–40 characters: letters, numbers, dot, dash or underscore. Start with a letter or number.';
    if (!EMAIL.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    else if (form.password.length > 72) e.password = 'Use 72 characters or fewer.';
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setPending(true);
    setFailure(null);
    try {
      const auth = await api.register({ ...form, displayName: form.displayName.trim(), email: form.email.trim() });
      signIn(auth);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (Object.keys(apiErr.fields ?? {}).length) setErrors(apiErr.fields);
      setFailure(apiErr);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout aside={<h1 className="display auth-quote">Every project starts as a <em>sentence.</em></h1>}>
      <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
        <h2 className="title">Create your account</h2>
        <p className="muted">Already have one? <Link to="/login">Sign in</Link></p>
      </div>
      <form className="stack" onSubmit={submit} noValidate>
        <ErrorNote error={failure} />
        <Field label="Your name" error={errors.displayName}>
          {(id, d) => <input id={id} className="input" autoComplete="name" autoFocus value={form.displayName} onChange={set('displayName')} aria-invalid={!!errors.displayName} aria-describedby={d} maxLength={100} />}
        </Field>
        <Field label="Username" hint="Shown to teammates, like @asha.builds" error={errors.username}>
          {(id, d) => <input id={id} className="input" autoComplete="username" spellCheck={false} value={form.username} onChange={set('username')} aria-invalid={!!errors.username} aria-describedby={d} maxLength={40} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(id, d) => <input id={id} className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={d} />}
        </Field>
        <Field label="Password" hint="At least 8 characters" error={errors.password}>
          {(id, d) => <PasswordInput id={id} autoComplete="new-password" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} aria-describedby={d} />}
        </Field>
        <Button type="submit" size="lg" loading={pending}>Create account <ArrowRight /></Button>
      </form>
    </AuthLayout>
  );
}
