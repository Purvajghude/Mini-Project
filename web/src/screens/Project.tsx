import { lazy, Suspense, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useMe } from '../lib/auth';
import { useLoad } from '../lib/hooks';
import { dateTime, LIFECYCLE } from '../lib/format';
import { Link, navigate } from '../lib/router';
import type { Lifecycle, Project } from '../lib/types';
import { Avatar, Button, Dialog, ErrorNote, Loading, useToast } from '../ui';
import { Brief, ProjectBlueprint } from './Blueprint';
import { Messages, Schedule, Tasks } from './Collab';
import { CoverageList, TeamTab } from './Team';
import { domainLabel } from './Onboarding';

const Board = lazy(() => import('./Board'));

const TABS = [
  ['overview', 'Overview'], ['blueprint', 'Blueprint'], ['team', 'Team'], ['tasks', 'Tasks'],
  ['schedule', 'Schedule'], ['messages', 'Messages'], ['board', 'Board'],
] as const;

const STAGES: Lifecycle[] = ['DRAFT', 'RECRUITING', 'ACTIVE'];
const ADVANCE: Partial<Record<Lifecycle, { to: Lifecycle; label: string; body: string }>> = {
  DRAFT: { to: 'RECRUITING', label: 'Start recruiting', body: 'Your blueprint becomes the basis for team suggestions. You can keep editing it.' },
  RECRUITING: { to: 'ACTIVE', label: 'Start building', body: 'Marks the team as formed. Team suggestions are only available while drafting or recruiting.' },
};

export function ProjectWorkspace({ id, tab }: { id: string; tab: string }) {
  const project = useLoad(() => api.project(id), [id]);
  if (project.error) {
    const e = project.error;
    return (
      <div className="wrap empty">
        <h1 className="title">{e.status === 403 ? 'This project is private' : e.status === 404 ? 'Project not found' : 'Couldn’t open this project'}</h1>
        <p>{e.status === 403 ? 'Only its members can open it.' : e.message}</p>
        <Link to="/studio" className="btn btn-outline">Back to studio</Link>
      </div>
    );
  }
  if (!project.data) return <div className="wrap"><Loading label="Opening the project" /></div>;
  return <Workspace project={project.data} tab={tab} setProject={project.setData} />;
}

function Workspace({ project, tab, setProject }: { project: Project; tab: string; setProject(p: Project): void }) {
  const me = useMe();
  const isOwner = project.ownerUserId === me.id;
  const advance = isOwner ? ADVANCE[project.lifecycle] : undefined;
  const [confirm, setConfirm] = useState(false);

  return (
    <div className={`workspace ${tab === 'board' ? 'is-board' : ''}`}>
      <header className="wrap ws-head">
        <div className="ws-title">
          <p className="meta">{domainLabel(project.domain) || 'Project'} · {isOwner ? 'You own this' : 'Member'}</p>
          <h1 className="title">{project.name}</h1>
        </div>
        <div className="ws-meta">
          <ol className="stages" aria-label="Project stage">
            {STAGES.map((s) => (
              <li key={s} className={STAGES.indexOf(s) < STAGES.indexOf(project.lifecycle) ? 'past' : s === project.lifecycle ? 'now' : ''} aria-current={s === project.lifecycle ? 'step' : undefined}>{LIFECYCLE[s]}</li>
            ))}
          </ol>
          <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="avatars" aria-label={`${project.members.length} of ${project.targetTeamSize} people`}>
              {project.members.map((m) => <Avatar key={m.userId} id={m.userId} name={m.displayName} size={30} />)}
              {Array.from({ length: Math.max(0, project.targetTeamSize - project.members.length) }, (_, i) => <span key={i} className="avatar open" style={{ '--size': '30px' } as React.CSSProperties}>+</span>)}
            </div>
            {advance && <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>{advance.label} <ArrowRight /></Button>}
          </div>
        </div>
        <nav className="tabs" aria-label="Project sections">
          {TABS.map(([key, label]) => (
            <Link key={key} to={key === 'overview' ? `/p/${project.id}` : `/p/${project.id}/${key}`} aria-current={tab === key ? 'page' : undefined}>{label}</Link>
          ))}
        </nav>
      </header>

      <div className={tab === 'board' ? 'ws-board' : 'wrap ws-body'}>
        {tab === 'overview' && <Overview project={project} />}
        {tab === 'blueprint' && <ProjectBlueprint project={project} onSaved={setProject} />}
        {tab === 'team' && <TeamTab project={project} onProjectChange={setProject} />}
        {tab === 'tasks' && <Tasks project={project} />}
        {tab === 'schedule' && <Schedule project={project} />}
        {tab === 'messages' && <Messages project={project} />}
        {tab === 'board' && <Suspense fallback={<div className="wrap"><Loading label="Loading the board" /></div>}><Board project={project} /></Suspense>}
        {!TABS.some(([k]) => k === tab) && <p className="muted">Unknown section.</p>}
      </div>

      {advance && <AdvanceDialog open={confirm} onClose={() => setConfirm(false)} project={project} step={advance} onDone={setProject} />}
    </div>
  );
}

function AdvanceDialog({ open, onClose, project, step, onDone }: { open: boolean; onClose(): void; project: Project; step: { to: Lifecycle; label: string; body: string }; onDone(p: Project): void }) {
  const toast = useToast();
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  async function go() {
    setPending(true);
    setError(null);
    try {
      // Lifecycle moves through the requirements endpoint; resend the saved requirements unchanged.
      const req = await api.requirements(project.id);
      const saved = await api.saveRequirements(project.id, {
        targetTeamSize: req.targetTeamSize, lifecycle: step.to,
        requirements: req.requirements.map(({ skillId, minimumProficiency, importance, note }) => ({ skillId, minimumProficiency, importance, note })),
      });
      onDone({ ...project, lifecycle: saved.lifecycle });
      toast(`Project is now ${LIFECYCLE[saved.lifecycle].toLowerCase()}`);
      onClose();
      if (saved.lifecycle === 'RECRUITING') navigate(`/p/${project.id}/team`);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog open={open} onClose={onClose} label={step.label}>
      <h2 className="title" style={{ fontSize: 28 }}>{step.label}?</h2>
      <p className="muted">{step.body} Stages only move forward.</p>
      <ErrorNote error={error} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={go} loading={pending}>{step.label}</Button>
      </div>
    </Dialog>
  );
}

function Overview({ project }: { project: Project }) {
  const data = useLoad(async () => {
    const [gap, tasks, events] = await Promise.all([
      api.skillGap(project.id).catch((e: ApiError) => (e.status === 409 ? null : Promise.reject(e))),
      api.tasks(project.id),
      api.events(project.id),
    ]);
    return { gap, tasks, events };
  }, [project.id]);

  const open = data.data?.tasks.filter((t) => t.status !== 'DONE') ?? [];
  const upcoming = data.data?.events.filter((e) => Date.parse(e.endsAt) > Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) ?? [];
  const nameOf = (uid: string | null) => project.members.find((m) => m.userId === uid)?.displayName;

  return (
    <div className="overview">
      <article className="overview-brief sheet panel">
        <p className="meta">Brief</p>
        <Brief text={project.summary ?? ''} />
      </article>

      <div className="overview-side">
        <section className="sheet panel stack">
          <div className="row spread"><h2 className="meta">Team · {project.members.length} of {project.targetTeamSize}</h2><Link to={`/p/${project.id}/team`} className="small">Manage</Link></div>
          <ul className="roster">
            {project.members.map((m) => (
              <li key={m.userId}><Avatar id={m.userId} name={m.displayName} size={32} /><span><b>{m.displayName}</b><br /><span className="small muted">@{m.username}</span></span>{m.role === 'OWNER' && <span className="tag">Owner</span>}</li>
            ))}
          </ul>
        </section>

        <ErrorNote error={data.error} retry={data.reload} />
        {data.loading && !data.data && <Loading />}
        {data.data && (
          <>
            <section className="sheet panel stack">
              <div className="row spread"><h2 className="meta">Skill coverage</h2><Link to={`/p/${project.id}/team`} className="small">Details</Link></div>
              {data.data.gap ? <CoverageList gaps={[...data.data.gap.required, ...data.data.gap.preferred]} project={project} compact /> : <p className="small muted">Add requirements in the blueprint to see coverage.</p>}
            </section>
            <section className="sheet panel stack">
              <div className="row spread"><h2 className="meta">Next up</h2><Link to={`/p/${project.id}/tasks`} className="small">All tasks</Link></div>
              {open.length === 0 && upcoming.length === 0 && <p className="small muted">No open tasks or upcoming meetings.</p>}
              <ul className="nextup">
                {upcoming.slice(0, 2).map((e) => <li key={e.id}><span className="tag">Meet</span><span>{e.title}<br /><span className="small muted">{dateTime(e.startsAt)}</span></span></li>)}
                {open.slice(0, 4).map((t) => <li key={t.id}><span className="tag">{t.status === 'IN_PROGRESS' ? 'Doing' : 'To do'}</span><span>{t.title}{nameOf(t.assigneeUserId) && <><br /><span className="small muted">{nameOf(t.assigneeUserId)}</span></>}</span></li>)}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
