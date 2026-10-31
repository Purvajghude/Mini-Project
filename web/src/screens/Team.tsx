import { useMemo, useState } from 'react';
import { Check, CircleDashed, GitBranch, Info, Plus, Send, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useMe } from '../lib/auth';
import { useLoad } from '../lib/hooks';
import { PROFICIENCY, relative } from '../lib/format';
import { Link } from '../lib/router';
import type { AvailabilityStatus, Connection, Project, ProjectInvitation, SkillGap, SkillGapAnalysis, TeamAlternative, TeamCandidateReason, TeamSuggestionSet } from '../lib/types';
import { Avatar, Button, ErrorNote, Loading, Meter, useToast } from '../ui';

const STATUS = {
  COVERED: { label: 'Covered', cls: 'tag-covered', tone: 'covered' as const },
  PARTIAL: { label: 'Partly covered', cls: 'tag-partial', tone: 'partial' as const },
  UNCOVERED: { label: 'Open', cls: 'tag-signal', tone: undefined },
};

export function CoverageList({ gaps, project, compact }: { gaps: SkillGap[]; project: Project; compact?: boolean }) {
  const name = (id: string) => project.members.find((m) => m.userId === id)?.displayName ?? 'Member';
  return (
    <ul className={`coverage ${compact ? 'compact' : ''}`}>
      {gaps.map((g) => {
        const s = STATUS[g.coverageStatus];
        return (
          <li key={g.skillId} className={`coverage-row is-${g.coverageStatus.toLowerCase()}`}>
            <span className="coverage-name"><b>{g.skillName}</b>{!compact && <span className="small muted">{g.importance === 'REQUIRED' ? 'Must have' : 'Nice to have'} · {PROFICIENCY[g.requiredProficiency]} or above</span>}</span>
            {!compact && <Meter value={g.requiredProficiency} tone={s.tone} />}
            <span className="coverage-who">
              {g.satisfyingMemberIds.length > 0
                ? <span className="avatars">{g.satisfyingMemberIds.map((id) => <Avatar key={id} id={id} name={name(id)} size={24} />)}</span>
                : null}
              <span className={`tag ${s.cls}`}>{s.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function TeamTab({ project, onProjectChange }: { project: Project; onProjectChange(p: Project): void }) {
  const me = useMe();
  const isOwner = project.ownerUserId === me.id;
  const gap = useLoad(() => api.skillGap(project.id), [project.id, project.members.length]);
  const connections = useLoad(() => (isOwner ? api.connections() : Promise.resolve([] as Connection[])), [isOwner]);
  const invitations = useLoad(() => (isOwner ? api.projectInvitations(project.id) : Promise.resolve([] as ProjectInvitation[])), [isOwner, project.id]);

  if (gap.error?.status === 409) {
    return (
      <div className="empty sheet">
        <h2 className="title">No requirements yet</h2>
        <p>Skill coverage is measured against the blueprint’s requirements.</p>
        <Link to={`/p/${project.id}/blueprint`} className="btn btn-primary">Open the blueprint</Link>
      </div>
    );
  }
  if (gap.error) return <ErrorNote error={gap.error} retry={gap.reload} />;
  if (!gap.data) return <Loading label="Measuring skill coverage" />;

  return (
    <div className="team">
      <GapSummary gap={gap.data} project={project} />
      {isOwner && (project.lifecycle === 'DRAFT' || project.lifecycle === 'RECRUITING')
        ? <Suggestions project={project} invitations={invitations.data ?? []} setInvitations={invitations.setData} />
        : isOwner && <p className="callout"><Info />Team suggestions are available while a project is drafting or recruiting.</p>}
      {isOwner && <PendingInvites project={project} invitations={invitations.data ?? []} setInvitations={invitations.setData} />}
      {isOwner && <FromConnections project={project} connections={connections.data} error={connections.error} onProjectChange={onProjectChange} />}
    </div>
  );
}

function GapSummary({ gap, project }: { gap: SkillGapAnalysis; project: Project }) {
  const count = (list: SkillGap[], s: SkillGap['coverageStatus']) => list.filter((g) => g.coverageStatus === s).length;
  return (
    <section className="gap">
      <div className="gap-head">
        <div>
          <h2 className="title">
            {count(gap.required, 'COVERED')} of {gap.required.length} must-haves <em>covered.</em>
          </h2>
          <p className="small muted" style={{ marginTop: 8 }}>From the declared skills of all {gap.currentMemberCount} member{gap.currentMemberCount === 1 ? '' : 's'}.</p>
        </div>
        <dl className="gap-stats">
          <div><dt className="meta">Open</dt><dd>{count(gap.required, 'UNCOVERED') + count(gap.preferred, 'UNCOVERED')}</dd></div>
          <div><dt className="meta">Partial</dt><dd>{count(gap.required, 'PARTIAL') + count(gap.preferred, 'PARTIAL')}</dd></div>
          <div><dt className="meta">Seats left</dt><dd>{gap.remainingCapacity}</dd></div>
        </dl>
      </div>
      <div className="gap-cols">
        <div className="sheet panel"><h3 className="heading">Must have</h3><CoverageList gaps={gap.required} project={project} /></div>
        <div className="sheet panel"><h3 className="heading">Nice to have</h3>{gap.preferred.length ? <CoverageList gaps={gap.preferred} project={project} /> : <p className="small muted">None listed.</p>}</div>
      </div>
      <p className="small muted">Covered means one member’s self-declared level meets the requirement. Several lower levels never add up to cover it.</p>
    </section>
  );
}

type InviteState = 'member' | 'invited' | 'none';
type SetInvitations = (next: ProjectInvitation[] | ((prev: ProjectInvitation[] | undefined) => ProjectInvitation[])) => void;

/** Project invitations: no personal connection needed; accepting joins the project atomically (backend). */
function useInvite(project: Project, invitations: ProjectInvitation[], setInvitations: SetInvitations) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const pending = new Map(invitations.filter((i) => i.status === 'PENDING').map((i) => [i.inviteeUserId, i]));
  const state = (uid: string): InviteState =>
    project.members.some((m) => m.userId === uid) ? 'member' : pending.has(uid) ? 'invited' : 'none';

  async function act(uid: string, name: string) {
    setBusy(uid);
    try {
      const inv = await api.invite(project.id, uid);
      setInvitations((prev) => [...(prev ?? []), inv]);
      toast(`Invitation sent to ${name}`);
    } catch (e) {
      toast((e as ApiError).message, 'error');
    } finally {
      setBusy(null);
    }
  }
  return { state, act, busy, canInvite: project.lifecycle === 'RECRUITING' };
}

function Suggestions({ project, invitations, setInvitations }: { project: Project; invitations: ProjectInvitation[]; setInvitations: SetInvitations }) {
  const [policy, setPolicy] = useState<'ALLOW_UNKNOWN' | 'REQUIRE_OVERLAP'>('ALLOW_UNKNOWN');
  const [result, setResult] = useState<TeamSuggestionSet | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const invite = useInvite(project, invitations, setInvitations);

  async function run() {
    setLoading(true);
    setError(null);
    try { setResult(await api.teamSuggestions(project.id, { availabilityPolicy: policy })); } catch (e) { setError(e as ApiError); } finally { setLoading(false); }
  }

  const skillName = useMemo(() => {
    const m = new Map<number, string>();
    for (const g of [...(result?.gapAnalysis.required ?? []), ...(result?.gapAnalysis.preferred ?? [])]) m.set(g.skillId, g.skillName);
    return (id: number) => m.get(id) ?? `Skill ${id}`;
  }, [result]);

  return (
    <section className="suggest">
      <div className="suggest-head">
        <div>
          <h2 className="title">Who could fill the <em>gaps?</em></h2>
          <p className="muted" style={{ maxWidth: 560 }}>MESH searches onboarded students and returns up to three combinations. Each is explained requirement by requirement — there are no match scores.</p>
        </div>
        <div className="stack" style={{ '--gap': '10px', alignItems: 'flex-end' } as React.CSSProperties}>
          <div className="segmented" role="radiogroup" aria-label="Availability">
            <button role="radio" aria-checked={policy === 'ALLOW_UNKNOWN'} onClick={() => setPolicy('ALLOW_UNKNOWN')}>Any availability</button>
            <button role="radio" aria-checked={policy === 'REQUIRE_OVERLAP'} onClick={() => setPolicy('REQUIRE_OVERLAP')}>Must overlap with team</button>
          </div>
          <Button variant="signal" onClick={run} loading={loading}>{result ? 'Search again' : 'Suggest teams'}</Button>
        </div>
      </div>
      <ErrorNote error={error} retry={run} />
      {result && (
        result.alternatives.length === 0 ? (
          <div className="sheet empty">
            <h3 className="title" style={{ fontSize: 24 }}>No combinations yet</h3>
            <p style={{ maxWidth: 520 }}>{result.explanation} As more students finish onboarding with the skills this project needs, suggestions will appear here. Meanwhile you can add people you’re already connected with below.</p>
          </div>
        ) : (
          <div className="alts">
            {result.alternatives.map((alt, i) => <Alternative key={i} index={i} alt={alt} skillName={skillName} invite={invite} />)}
          </div>
        )
      )}
    </section>
  );
}

const AVAIL: Record<AvailabilityStatus, { label: string; cls: string }> = {
  COMPATIBLE: { label: 'Free when the team is', cls: 'tag-covered' },
  UNKNOWN: { label: 'Availability unknown', cls: '' },
  INCOMPATIBLE: { label: 'No overlap', cls: 'tag-signal' },
};

function Alternative({ alt, index, skillName, invite }: { alt: TeamAlternative; index: number; skillName(id: number): string; invite: ReturnType<typeof useInvite> }) {
  return (
    <article className="alt sheet">
      <header className="alt-head">
        <span className="meta">Option {String.fromCharCode(65 + index)}</span>
        <p className="small">{alt.explanation}</p>
        <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          {alt.coveredRequiredSkillIds.map((id) => <span key={id} className="tag tag-covered"><Check size={11} />{skillName(id)}</span>)}
          {alt.uncoveredRequiredSkillIds.map((id) => <span key={id} className="tag tag-signal"><CircleDashed size={11} />{skillName(id)}</span>)}
        </div>
        {alt.seatsUnfilled > 0 && <p className="small muted">{alt.seatsUnfilled} seat{alt.seatsUnfilled === 1 ? '' : 's'} left unfilled.</p>}
      </header>
      <ul className="alt-people">
        {alt.candidates.map((c) => <Candidate key={c.userId} c={c} skillName={skillName} invite={invite} />)}
      </ul>
    </article>
  );
}

function Candidate({ c, skillName, invite }: { c: TeamCandidateReason; skillName(id: number): string; invite: ReturnType<typeof useInvite> }) {
  const st = invite.state(c.userId);
  return (
    <li className="cand">
      <div className="row" style={{ '--gap': '10px', alignItems: 'flex-start' } as React.CSSProperties}>
        <Avatar id={c.userId} name={c.displayName} size={36} />
        <div className="stack" style={{ '--gap': '6px', flex: 1, minWidth: 0 } as React.CSSProperties}>
          <b>{c.displayName}</b>
          <div className="row" style={{ '--gap': '4px' } as React.CSSProperties}>
            {c.covers.map((id) => <span key={id} className="tag tag-covered">Covers {skillName(id)}</span>)}
            {c.partialCovers.map((id) => <span key={id} className="tag tag-partial">Some {skillName(id)}</span>)}
            {c.learningFit.map((id) => <span key={id} className="tag">Wants to learn {skillName(id)}</span>)}
          </div>
          <span className="small muted">{c.explanation}</span>
          <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
            <span className={`tag ${AVAIL[c.availabilityStatus].cls}`}>{AVAIL[c.availabilityStatus].label}</span>
            {c.evidenceSupport && <span className="tag" title="Public GitHub repositories use a language matching a declared skill. A supporting hint, not proof of skill."><GitBranch size={11} />GitHub hint</span>}
          </div>
        </div>
      </div>
      <InviteButton state={st} busy={invite.busy === c.userId} disabled={!invite.canInvite} onClick={() => invite.act(c.userId, c.displayName)} />
    </li>
  );
}

function InviteButton({ state, busy, disabled, onClick }: { state: InviteState; busy: boolean; disabled: boolean; onClick(): void }) {
  if (state === 'member') return <span className="tag tag-covered"><Check size={11} />On the team</span>;
  if (state === 'invited') return <span className="tag" title="They’ll see it in their studio and under People.">Invitation sent</span>;
  return <Button size="sm" onClick={onClick} loading={busy} disabled={disabled} title={disabled ? 'Start recruiting to send invitations' : undefined}><Send />Invite to project</Button>;
}

function PendingInvites({ project, invitations, setInvitations }: { project: Project; invitations: ProjectInvitation[]; setInvitations: SetInvitations }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const pending = invitations.filter((i) => i.status === 'PENDING');
  if (!pending.length) return null;
  return (
    <section className="sheet panel stack">
      <h2 className="heading">Waiting for a reply · {pending.length}</h2>
      <p className="small muted">Each pending invitation holds one seat until it’s accepted, declined or cancelled.</p>
      <ul className="roster">
        {pending.map((i) => (
          <li key={i.id}>
            <CircleDashed size={20} color="var(--signal)" />
            <span>Invited {relative(i.createdAt)}<br /><span className="small muted mono">{i.inviteeUserId.slice(0, 8)}</span></span>
            <Button size="sm" variant="ghost" loading={busy === i.id} onClick={async () => {
              setBusy(i.id);
              try {
                const updated = await api.cancelInvitation(project.id, i.id);
                setInvitations((prev) => (prev ?? []).map((x) => (x.id === i.id ? updated : x)));
                toast('Invitation cancelled');
              } catch (e) { toast((e as ApiError).message, 'error'); } finally { setBusy(null); }
            }}><X />Cancel</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FromConnections({ project, connections, error, onProjectChange }: { project: Project; connections?: Connection[]; error: ApiError | null; onProjectChange(p: Project): void }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const candidates = (connections ?? []).filter((c) => !project.members.some((m) => m.userId === c.collaborator.id));
  const full = project.members.length >= project.targetTeamSize;
  return (
    <section className="sheet panel stack">
      <div>
        <h2 className="heading">Add from your connections</h2>
        <p className="small muted">People who already accepted a connection request from you can be added directly, without an invitation.</p>
      </div>
      <ErrorNote error={error} />
      {full && <p className="callout"><Info />The team is at its target size. Raise it in the blueprint to add more people.</p>}
      {connections && candidates.length === 0 && <p className="small muted">No connections outside this project yet.</p>}
      <ul className="roster">
        {candidates.map((c) => (
          <li key={c.id}>
            <Avatar id={c.collaborator.id} name={c.collaborator.displayName} size={32} />
            <span><b>{c.collaborator.displayName}</b><br /><span className="small muted">@{c.collaborator.username}{c.collaborator.department ? ` · ${c.collaborator.department}` : ''}</span></span>
            <Button size="sm" variant="outline" disabled={full} loading={busy === c.collaborator.id} onClick={async () => {
              setBusy(c.collaborator.id);
              try { onProjectChange(await api.addMember(project.id, c.collaborator.id)); toast(`${c.collaborator.displayName} joined the project`); }
              catch (e) { toast((e as ApiError).message, 'error'); }
              finally { setBusy(null); }
            }}><Plus />Add</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
