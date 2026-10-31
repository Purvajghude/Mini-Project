import { useMemo, useState } from 'react';
import { Minus, Plus, Sparkles, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useMe } from '../lib/auth';
import { useLoad } from '../lib/hooks';
import { LIFECYCLE, PROFICIENCY, parseBrief } from '../lib/format';
import type { Domain, Importance, Lifecycle, Project, Requirement, Skill } from '../lib/types';
import { Button, ErrorNote, Loading, Meter, MeterInput, useToast } from '../ui';
import { domainLabel } from './Onboarding';

export interface Draft {
  name: string;
  brief: string;
  domain: string | null;
  targetTeamSize: number;
  requirements: Requirement[];
  /** AI-suggested capabilities with no MESH catalogue entry. Not persisted as requirements. */
  unmapped: { name: string; importance: Importance; reason: string | null }[];
}

export const LIMITS = { name: 120, brief: 1000, note: 300, requirements: 30 };

export function validateDraft(d: Draft, opts: { minTeam?: number; lifecycle?: Lifecycle } = {}) {
  const e: Record<string, string> = {};
  if (!d.name.trim()) e.name = 'Give the project a working title.';
  else if (d.name.length > LIMITS.name) e.name = `Keep the title under ${LIMITS.name} characters.`;
  if (d.brief.length > LIMITS.brief) e.brief = `The brief is ${d.brief.length - LIMITS.brief} characters over the ${LIMITS.brief} limit.`;
  if (d.requirements.length > LIMITS.requirements) e.requirements = `Up to ${LIMITS.requirements} requirements.`;
  if ((opts.lifecycle === 'RECRUITING' || opts.lifecycle === 'ACTIVE') && d.requirements.length === 0) e.requirements = 'Add at least one requirement before recruiting.';
  if (d.requirements.some((r) => (r.note ?? '').length > LIMITS.note)) e.requirements = `Requirement notes are limited to ${LIMITS.note} characters.`;
  if (opts.minTeam && d.targetTeamSize < opts.minTeam) e.team = `The team already has ${opts.minTeam} members.`;
  return e;
}

/** The blueprint as an editable technical document. */
export function BlueprintEditor({ draft, onChange, skills, domains, errors = {}, readOnly, minTeam = 1, aside }: {
  draft: Draft;
  onChange(d: Draft): void;
  skills: Skill[];
  domains: Domain[];
  errors?: Record<string, string>;
  readOnly?: boolean;
  minTeam?: number;
  aside?: React.ReactNode;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  const used = new Set(draft.requirements.map((r) => r.skillId));
  const available = skills.filter((s) => !used.has(s.id));
  const updateReq = (skillId: number, patch: Partial<Requirement>) =>
    set('requirements', draft.requirements.map((r) => (r.skillId === skillId ? { ...r, ...patch } : r)));
  const groups: [Importance, string, string][] = [
    ['REQUIRED', 'Must have', 'Someone on the team needs this at the level shown.'],
    ['PREFERRED', 'Nice to have', 'Helpful, but the project can start without it.'],
  ];

  return (
    <div className="bp">
      <article className="bp-doc sheet">
        <div className="bp-doc-inner">
          {readOnly ? <h1 className="bp-title">{draft.name}</h1> : (
            <textarea className="bp-title bp-edit" rows={1} aria-label="Project title" value={draft.name} maxLength={LIMITS.name}
              onChange={(e) => set('name', e.target.value.replace(/\n/g, ''))} aria-invalid={!!errors.name} placeholder="Working title" />
          )}
          {errors.name && <p className="small" style={{ color: 'var(--signal-ink)' }}>{errors.name}</p>}

          <section className="bp-section">
            <h2 className="meta">Brief</h2>
            {readOnly ? <Brief text={draft.brief} /> : (
              <>
                <textarea className="bp-brief bp-edit" aria-label="Project brief" value={draft.brief} rows={8}
                  onChange={(e) => set('brief', e.target.value)} aria-invalid={!!errors.brief}
                  placeholder={'What are you building, and why?\n\nObjectives:\n- First milestone'} />
                <p className={`small ${draft.brief.length > LIMITS.brief ? '' : 'muted'}`} style={draft.brief.length > LIMITS.brief ? { color: 'var(--signal-ink)' } : undefined}>
                  {errors.brief ?? `${draft.brief.length} / ${LIMITS.brief} · Lines ending in “:” become headings; lines starting with “- ” become bullets.`}
                </p>
              </>
            )}
          </section>

          <section className="bp-section">
            <div className="row spread">
              <h2 className="meta">Technical requirements · {draft.requirements.length}</h2>
              {errors.requirements && <span className="small" style={{ color: 'var(--signal-ink)' }}>{errors.requirements}</span>}
            </div>
            {groups.map(([importance, title, hint]) => {
              const rows = draft.requirements.filter((r) => r.importance === importance);
              return (
                <div key={importance} className="req-group">
                  <div className="req-group-head">
                    <h3 className="heading">{title}</h3>
                    <span className="small muted">{hint}</span>
                  </div>
                  {rows.length === 0 && <p className="small muted req-empty">None yet.</p>}
                  <ul className="req-list">
                    {rows.map((r) => (
                      <li key={r.skillId} className="req-row">
                        <div className="req-name">
                          <span className="heading">{r.skillName}</span>
                          {readOnly ? (r.note && <span className="small muted">{r.note}</span>) : (
                            <input className="req-note" aria-label={`Why ${r.skillName} is needed`} placeholder="Why it’s needed (optional)" value={r.note ?? ''} maxLength={LIMITS.note}
                              onChange={(e) => updateReq(r.skillId, { note: e.target.value || null })} />
                          )}
                        </div>
                        <div className="req-level">
                          {readOnly ? <Meter value={r.minimumProficiency} /> : <MeterInput value={r.minimumProficiency} label={`Minimum level for ${r.skillName}`} onChange={(n) => updateReq(r.skillId, { minimumProficiency: n })} />}
                          <span className="meta">{PROFICIENCY[r.minimumProficiency]}+</span>
                        </div>
                        {!readOnly && (
                          <div className="req-actions">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateReq(r.skillId, { importance: importance === 'REQUIRED' ? 'PREFERRED' : 'REQUIRED' })}>
                              {importance === 'REQUIRED' ? 'Make optional' : 'Make required'}
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm btn-icon" aria-label={`Remove ${r.skillName}`} onClick={() => set('requirements', draft.requirements.filter((x) => x.skillId !== r.skillId))}><X /></button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {!readOnly && available.length > 0 && draft.requirements.length < LIMITS.requirements && (
              <label className="req-add">
                <Plus size={16} />
                <select className="input" value="" aria-label="Add a requirement from the skill catalogue" onChange={(e) => {
                  const s = skills.find((x) => x.id === Number(e.target.value));
                  if (s) set('requirements', [...draft.requirements, { skillId: s.id, skillName: s.name, minimumProficiency: 3, importance: 'REQUIRED', note: null }]);
                }}>
                  <option value="" disabled>Add a requirement…</option>
                  {[...new Set(available.map((s) => s.category))].map((c) => (
                    <optgroup key={c} label={c}>{available.filter((s) => s.category === c).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
                  ))}
                </select>
              </label>
            )}
          </section>

          {draft.unmapped.length > 0 && (
            <section className="bp-section unmapped">
              <h2 className="meta">Outside the MESH skill catalogue</h2>
              <p className="small muted">These came from your idea but MESH has no matching skill yet, so they can’t be used for matching. Add them to the brief to keep them.</p>
              <ul className="unmapped-list">
                {draft.unmapped.map((u) => (
                  <li key={u.name}>
                    <span className="tag">{u.importance === 'REQUIRED' ? 'Must' : 'Nice'}</span>
                    <span><b>{u.name}</b>{u.reason && <span className="muted"> — {u.reason}</span>}</span>
                    {!readOnly && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({
                        ...draft,
                        brief: `${draft.brief.trimEnd()}${/Also needs:/.test(draft.brief) ? '' : '\n\nAlso needs:'}\n- ${u.name}`,
                        unmapped: draft.unmapped.filter((x) => x.name !== u.name),
                      })}>Add to brief</button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>

      <aside className="bp-spec">
        <div className="sheet panel stack">
          <div className="field">
            <span className="label">Team size, including you</span>
            {readOnly ? <span className="title" style={{ fontSize: 32 }}>{draft.targetTeamSize}</span> : (
              <div className="stepper">
                <Button variant="outline" icon size="sm" aria-label="Fewer people" disabled={draft.targetTeamSize <= Math.max(1, minTeam)} onClick={() => set('targetTeamSize', draft.targetTeamSize - 1)}><Minus /></Button>
                <output className="title" style={{ fontSize: 32, minWidth: 32, textAlign: 'center' }} aria-live="polite">{draft.targetTeamSize}</output>
                <Button variant="outline" icon size="sm" aria-label="More people" disabled={draft.targetTeamSize >= 8} onClick={() => set('targetTeamSize', draft.targetTeamSize + 1)}><Plus /></Button>
              </div>
            )}
            <div className="seats" aria-hidden="true">{Array.from({ length: draft.targetTeamSize }, (_, i) => <span key={i} className={i < minTeam ? 'filled' : ''} />)}</div>
            {errors.team && <span className="small" style={{ color: 'var(--signal-ink)' }}>{errors.team}</span>}
          </div>
          <hr className="rule" />
          <div className="field">
            <label className="label" htmlFor="bp-domain">Area</label>
            {readOnly ? <span>{domainLabel(draft.domain) || '—'}</span> : (
              <select id="bp-domain" className="input" value={draft.domain ?? ''} onChange={(e) => set('domain', e.target.value || null)}>
                <option value="">Not set</option>
                {domains.map((d) => <option key={d.code} value={d.code}>{domainLabel(d)}</option>)}
              </select>
            )}
          </div>
          {aside}
        </div>
      </aside>
    </div>
  );
}

export function Brief({ text }: { text: string }) {
  const blocks = parseBrief(text);
  if (!blocks.length) return <p className="muted">No brief yet.</p>;
  return (
    <div className="brief prose">
      {blocks.map((b, i) => b.kind === 'h' ? <h3 key={i} className="meta" style={{ marginTop: 12 }}>{b.text}</h3>
        : b.kind === 'ul' ? <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
        : <p key={i}>{b.text}</p>)}
    </div>
  );
}

/** Workspace tab: edit a saved blueprint. Owner edits; members read. */
export function ProjectBlueprint({ project, onSaved }: { project: Project; onSaved(p: Project): void }) {
  const me = useMe();
  const toast = useToast();
  const isOwner = project.ownerUserId === me.id;
  const data = useLoad(async () => {
    const [req, skills, domains] = await Promise.all([api.requirements(project.id), api.skills(), api.domains()]);
    return { req, skills, domains };
  }, [project.id]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const saved: Draft | null = useMemo(() => data.data ? {
    name: project.name, brief: project.summary ?? '', domain: project.domain, targetTeamSize: data.data.req.targetTeamSize,
    requirements: data.data.req.requirements, unmapped: [],
  } : null, [data.data, project]);
  const current = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  if (data.error) return <ErrorNote error={data.error} retry={data.reload} />;
  if (!current || !data.data) return <Loading label="Opening the blueprint" />;
  const lifecycle = data.data.req.lifecycle;

  async function save() {
    const d = current!;
    const e = validateDraft(d, { minTeam: project.members.length, lifecycle });
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setFailure(null);
    try {
      const p = await api.updateProject(project.id, { name: d.name.trim(), summary: d.brief.trim() || null, domain: d.domain });
      const req = await api.saveRequirements(project.id, {
        targetTeamSize: d.targetTeamSize, lifecycle,
        requirements: d.requirements.map(({ skillId, minimumProficiency, importance, note }) => ({ skillId, minimumProficiency, importance, note: note?.trim() || null })),
      });
      onSaved({ ...p, targetTeamSize: req.targetTeamSize, lifecycle: req.lifecycle });
      data.setData((prev) => ({ ...prev!, req }));
      setDraft(null);
      toast('Blueprint saved');
    } catch (err) {
      setFailure(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <ErrorNote error={failure} />
      <BlueprintEditor
        draft={current} onChange={setDraft} skills={data.data.skills} domains={data.data.domains}
        errors={errors} readOnly={!isOwner} minTeam={project.members.length}
        aside={
          <>
            <hr className="rule" />
            <div className="field"><span className="label">Stage</span><span className="tag">{LIFECYCLE[lifecycle]}</span></div>
            {isOwner && (
              <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
                <Button onClick={save} loading={saving} disabled={!dirty}>{dirty ? 'Save changes' : 'All changes saved'}</Button>
                {dirty && <Button variant="ghost" size="sm" onClick={() => { setDraft(null); setErrors({}); }}>Discard changes</Button>}
              </div>
            )}
            {!isOwner && <p className="small muted"><Sparkles size={12} style={{ display: 'inline' }} /> Only the project owner can edit the blueprint.</p>}
          </>
        }
      />
    </div>
  );
}
