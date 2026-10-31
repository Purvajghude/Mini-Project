import { Component, useEffect, useState, type ReactNode } from 'react';
import { LayoutGrid, LogOut, PencilLine, Users } from 'lucide-react';
import { AuthProvider, useAuth, useMe } from './lib/auth';
import { Link, match, navigate, useLocation } from './lib/router';
import { api } from './lib/api';
import { Avatar, Loading, ToastProvider, Wordmark } from './ui';
import { Landing } from './screens/Landing';
import { Login, Register } from './screens/Auth';
import { Onboarding } from './screens/Onboarding';
import { Studio } from './screens/Studio';
import { NewProject } from './screens/NewProject';
import { ProjectWorkspace } from './screens/Project';
import { People } from './screens/People';
import './screens/screens.css';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ScreenBoundary>
          <Routes />
        </ScreenBoundary>
      </AuthProvider>
    </ToastProvider>
  );
}

/** A render error shows a recoverable message instead of a blank page; navigating resets it. */
class ScreenBoundary extends Component<{ children: ReactNode }, { error: Error | null; path: string }> {
  state = { error: null as Error | null, path: location.pathname };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error(error); }
  componentDidMount() { window.addEventListener('popstate', this.reset); }
  componentWillUnmount() { window.removeEventListener('popstate', this.reset); }
  reset = () => { if (this.state.error) this.setState({ error: null }); };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="wrap empty" style={{ minHeight: '60vh', alignContent: 'center' }}>
        <h1 className="title">Something went wrong on this screen.</h1>
        <p className="muted">Your saved work is safe on the server.</p>
        <div className="row">
          <button className="btn btn-primary" onClick={() => location.reload()}>Reload</button>
          <a className="btn btn-outline" href="/studio">Back to studio</a>
        </div>
      </div>
    );
  }
}

function Routes() {
  const { path } = useLocation();
  const { state } = useAuth();

  if (path === '/') return <Landing />;
  if (path === '/login') return <Login />;
  if (path === '/register') return <Register />;

  if (state.status === 'loading') return <div className="wrap"><Loading label="Opening your studio" /></div>;
  if (state.status === 'anonymous') return <Redirect to={`/login?next=${encodeURIComponent(path)}`} />;
  if (path === '/onboarding') return <Onboarding />;
  if (!state.profile.onboardingComplete) return <Redirect to="/onboarding" />;

  let screen: ReactNode = null;
  let params: Record<string, string> | null;
  if (path === '/studio') screen = <Studio />;
  else if (path === '/new') screen = <NewProject />;
  else if (path === '/people') screen = <People />;
  else if ((params = match('/p/:id/:tab?', path))) screen = <ProjectWorkspace key={params.id} id={params.id} tab={params.tab ?? 'overview'} />;
  else return <Redirect to="/studio" />;

  return <AppShell>{screen}</AppShell>;
}

function Redirect({ to }: { to: string }) {
  useEffect(() => { navigate(to, { replace: true }); }, [to]);
  return null;
}

function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const me = useMe();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    Promise.all([api.incomingInvitations(), api.incomingRequests()])
      .then(([i, r]) => setPending(i.length + r.length))
      .catch(() => setPending(0));
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const current = (prefix: string) => (path === prefix || path.startsWith(prefix + '/') ? 'page' : undefined);
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Wordmark to="/studio" />
          <nav className="topnav" aria-label="Main">
            <Link to="/studio" aria-current={current('/studio') ?? (path.startsWith('/p/') || path === '/new' ? 'page' : undefined)}>Studio</Link>
            <Link to="/people" aria-current={current('/people')}>People{pending > 0 && <span className="badge-count" aria-label={`${pending} pending`}>{pending}</span>}</Link>
          </nav>
          <div className="menu">
            <button className="btn btn-ghost" aria-haspopup="menu" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
              <Avatar id={me.id} name={me.displayName} size={28} />
              <span className="hide-sm">{me.displayName.split(' ')[0]}</span>
            </button>
            {open && (
              <div className="menu-pop" role="menu">
                <div className="menu-head">
                  <div className="heading" style={{ fontSize: 15 }}>{me.displayName}</div>
                  <div className="meta">@{me.username}</div>
                </div>
                <Link to="/onboarding" role="menuitem"><PencilLine />Edit profile & skills</Link>
                <Link to="/people" role="menuitem" className="show-sm"><Users />People</Link>
                <button role="menuitem" onClick={() => { signOut(); navigate('/'); }}><LogOut />Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="page" key={path.split('/').slice(0, 3).join('/')}>
        <div className="page-enter">{children}</div>
      </main>
      <nav className="tabbar show-sm" aria-label="Main">
        <Link to="/studio" aria-current={current('/studio') ?? (path.startsWith('/p/') || path === '/new' ? 'page' : undefined)}><LayoutGrid />Studio</Link>
        <Link to="/people" aria-current={current('/people')}><Users />People{pending > 0 && <span className="badge-count" aria-label={`${pending} pending`}>{pending}</span>}</Link>
      </nav>
    </>
  );
}
