import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { useMe } from '../lib/auth';
import { useLoad } from '../lib/hooks';
import { LIFECYCLE, relative } from '../lib/format';
import { Link, navigate } from '../lib/router';
import type { Project } from '../lib/types';
import { Avatar, Button, ErrorNote, Skeleton } from '../ui';
import { stashIdea } from './NewProject';

export function Studio() {
  const me = useMe();
  const projects = useLoad(() => api.projects(), []);
  const invites = useLoad(() => api.incomingInvitations(), []);
  const [idea, setIdea] = useState('');

  function start(e: FormEvent) {
    e.preventDefault();
    stashIdea(idea.trim());
    navigate('/new');
  }

  const list = projects.data ?? [];
  const mine = list.filter((p) => p.ownerUserId === me.id);
  const drafts = mine.filter((p) => p.lifecycle === 'DRAFT');
  const live = list.filter((p) => !(p.ownerUserId === me.id && p.lifecycle === 'DRAFT') && p.lifecycle !== 'ARCHIVED');

  return (
    <div className="wrap studio">
      <form className="studio-idea" onSubmit={start}>
        <p className="meta">Studio · {me.displayName}</p>
        <label htmlFor="studio-idea" className="display">What are you <em>building?</em></label>
        <div className="idea-surface">
          <textarea id="studio-idea" className="idea-input" rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={2000}
            placeholder="A sentence is enough. MESH will draft the technical blueprint." />
          <div className="idea-bar">
            <span className="small muted">Nothing is saved until you review the blueprint.</span>
            <Button type="submit" variant="signal" disabled={idea.trim().length < 12}>Draft blueprint <ArrowRight /></Button>
          </div>
        </div>
      </form>

      {(invites.data?.length ?? 0) > 0 && (
        <Link to="/people" className="studio-invite">
          <span className="dot" style={{ color: 'var(--signal)' }} />
          <span><b>{invites.data![0].inviterName}</b> invited you to join <b>{invites.data![0].projectName}</b>{invites.data!.length > 1 ? ` and ${invites.data!.length - 1} more` : ''}.</span>
          <span className="plist-next">Review <ArrowUpRight size={15} /></span>
        </Link>
      )}

      <ErrorNote error={projects.error} retry={projects.reload} />

      {projects.loading && !projects.data ? (
        <div className="stack" style={{ marginTop: 48 }}><Skeleton h={22} w={180} /><Skeleton h={72} /><Skeleton h={72} /></div>
      ) : (
        <div className="studio-lists">
          {drafts.length > 0 && <ProjectList title="Drafts to finish" projects={drafts} meId={me.id} />}
          {live.length > 0 && <ProjectList title="Your projects" projects={live} meId={me.id} />}
          {projects.data && list.length === 0 && (
            <p className="muted studio-none">No projects yet. Your first one starts with the sentence above.</p>
          )}
        </div>
      )}
    </div>
  );
}

function nextStep(p: Project, isOwner: boolean): { label: string; to: string } {
  if (p.lifecycle === 'DRAFT') return { label: 'Finish the blueprint', to: `/p/${p.id}/blueprint` };
  if (p.lifecycle === 'RECRUITING' && isOwner && p.members.length < p.targetTeamSize) return { label: 'Find teammates', to: `/p/${p.id}/team` };
  return { label: 'Open workspace', to: `/p/${p.id}` };
}

function ProjectList({ title, projects, meId }: { title: string; projects: Project[]; meId: string }) {
  return (
    <section className="plist" aria-label={title}>
      <h2 className="meta">{title}</h2>
      <ul>
        {projects.map((p) => {
          const step = nextStep(p, p.ownerUserId === meId);
          const open = Math.max(0, p.targetTeamSize - p.members.length);
          return (
            <li key={p.id}>
              <Link to={step.to} className="plist-row">
                <div className="plist-main">
                  <span className="plist-name">{p.name}</span>
                  <span className="small muted">
                    {p.ownerUserId === meId ? 'You own this' : `With ${p.members.find((m) => m.role === 'OWNER')?.displayName ?? 'owner'}`} · started {relative(p.createdAt)}
                  </span>
                </div>
                <span className="tag">{LIFECYCLE[p.lifecycle]}</span>
                <div className="avatars hide-sm" aria-label={`${p.members.length} of ${p.targetTeamSize} people`}>
                  {p.members.slice(0, 4).map((m) => <Avatar key={m.userId} id={m.userId} name={m.displayName} size={28} />)}
                  {Array.from({ length: Math.min(open, 3) }, (_, i) => <span key={i} className="avatar open" style={{ '--size': '28px' } as React.CSSProperties}>+</span>)}
                </div>
                <span className="plist-next">{step.label} <ArrowUpRight size={15} /></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
