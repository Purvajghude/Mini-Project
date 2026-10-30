import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth, useMe } from '../lib/auth';
import { useLoad } from '../lib/hooks';
import { DAYS, PROFICIENCY, PROFICIENCY_HINT } from '../lib/format';
import { navigate } from '../lib/router';
import type { AvailabilityWindow, Domain, Goal, Interest, Profile, Skill } from '../lib/types';
import { Button, ErrorNote, Field, Loading, MeterInput, Wordmark } from '../ui';

/** Backend domain names are code-derived ("Data Ai"); show readable ones. */
export const DOMAIN_LABEL: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web development', BACKEND: 'Backend systems', MOBILE: 'Mobile apps', DATA_AI: 'Data & AI',
  UI_UX: 'UI / UX design', CYBERSECURITY: 'Cybersecurity', GAME_DEVELOPMENT: 'Game development', PRODUCT: 'Product',
};
export const domainLabel = (d: Domain | string | null | undefined) =>
  !d ? '' : typeof d === 'string' ? DOMAIN_LABEL[d] ?? d : DOMAIN_LABEL[d.code] ?? d.name;

const BLOCKS = [
  { key: 'morning', label: 'Morning', start: 8 * 60, end: 12 * 60 },
  { key: 'afternoon', label: 'Afternoon', start: 12 * 60, end: 17 * 60 },
  { key: 'evening', label: 'Evening', start: 17 * 60, end: 21 * 60 },
  { key: 'night', label: 'Late', start: 21 * 60, end: 24 * 60 },
] as const;

const STEPS = ['Studies', 'Skills', 'Confidence', 'Interests', 'Availability'] as const;

interface Catalogue { skills: Skill[]; domains: Domain[]; interests: Interest[]; goals: Goal[] }

export function Onboarding() {
  const me = useMe();
  const cat = useLoad<Catalogue>(async () => {
    const [skills, domains, interests, goals] = await Promise.all([api.skills(), api.domains(), api.interests(), api.goals()]);
    return { skills, domains, interests, goals };
  }, []);
  return (
    <div className="onboard">
      <header className="wrap onboard-top"><Wordmark to={me.onboardingComplete ? '/studio' : '/'} /></header>
      <div className="wrap onboard-body">
        {cat.data ? <Flow me={me} cat={cat.data} /> : cat.error ? <ErrorNote error={cat.error} retry={cat.reload} /> : <Loading label="Preparing a few questions" />}
      </div>
    </div>
  );
}

function windowsToCells(windows: AvailabilityWindow[]) {
  const cells = new Set<string>();
  for (const w of windows) for (const b of BLOCKS) if (w.startMinute < b.end && w.endMinute > b.start) cells.add(`${w.dayOfWeek}:${b.key}`);
  return cells;
}

function Flow({ me, cat }: { me: Profile; cat: Catalogue }) {
  const { setProfile } = useAuth();
  const editing = me.onboardingComplete;
  const [step, setStep] = useState(0);
  const [department, setDepartment] = useState(me.department ?? '');
  const [year, setYear] = useState<number | null>(me.yearOfStudy);
  const [domain, setDomain] = useState<string | null>(me.primaryDomain);
  const [levels, setLevels] = useState<Map<number, number>>(() => new Map(me.skills.map((s) => [s.id, s.proficiency])));
  const [interests, setInterests] = useState<Set<number>>(() => new Set(me.interests.map((i) => i.id)));
  const [goals, setGoals] = useState<Set<string>>(() => new Set(me.goals.map((g) => g.code)));
  const [cells, setCells] = useState<Set<string>>(() => windowsToCells(me.availabilityWindows));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const byCategory = useMemo(() => {
    const m = new Map<string, Skill[]>();
    for (const s of cat.skills) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return [...m.entries()];
  }, [cat.skills]);
  const selected = cat.skills.filter((s) => levels.has(s.id));

  const toggle = <T,>(set: Set<T>, v: T, max: number) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v); else if (next.size < max) next.add(v);
    return next;
  };

  function check(): Record<string, string> {
    if (step === 0 && !domain) return { domain: 'Pick the area closest to what you want to work on.' };
    if (step === 1 && levels.size === 0) return { skills: 'Pick at least one skill. Matching works from these.' };
    return {};
  }

  // Each step persists what it asked, so progress survives a refresh and failures stay local to one step.
  async function persist(): Promise<Profile> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    switch (step) {
      case 0: return api.updateProfile({ displayName: me.displayName, department: department.trim() || null, yearOfStudy: year, primaryDomain: domain, bio: me.bio, availability: me.availability, onboardingComplete: me.onboardingComplete });
      case 1:
      case 2: return api.replaceSkills([...levels].map(([skillId, proficiency]) => ({ skillId, proficiency })));
      case 3: await api.replaceInterests([...interests]); return api.replaceGoals([...goals]);
      default: {
        const windows: AvailabilityWindow[] = [];
        for (let d = 1; d <= 7; d++) {
          // Merge adjacent blocks into one window per run.
          let run: AvailabilityWindow | null = null;
          for (const b of BLOCKS) {
            if (cells.has(`${d}:${b.key}`)) {
              if (run && run.endMinute === b.start) run.endMinute = Math.min(b.end, 1440);
              else { run = { dayOfWeek: d, startMinute: b.start, endMinute: Math.min(b.end, 1440) }; windows.push(run); }
            } else run = null;
          }
        }
        await api.replaceAvailability(tz, windows);
        return api.updateProfile({ displayName: me.displayName, department: department.trim() || null, yearOfStudy: year, primaryDomain: domain, bio: me.bio, availability: me.availability, onboardingComplete: true });
      }
    }
  }

  async function next() {
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setFailure(null);
    try {
      const profile = await persist();
      if (step === STEPS.length - 1) {
        setProfile(profile);
        navigate(editing ? '/studio' : '/new', { replace: true });
      } else {
        if (step !== 1) setProfile({ ...profile, onboardingComplete: me.onboardingComplete });
        setStep(step + 1);
      }
    } catch (err) {
      setFailure(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const firstName = me.displayName.split(' ')[0];
  return (
    <div className="onboard-flow">
      <ol className="progress" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
            <span className="progress-bar" /><span className="meta">{s}</span>
          </li>
        ))}
      </ol>

      <section className="onboard-step" key={step} aria-live="polite">
        {step === 0 && (
          <>
            <Question kicker={`Hi ${firstName}.`} q="What are you studying?" />
            <div className="onboard-grid">
              <Field label="Department or branch" hint="For example, Computer Science or Electronics">
                {(id) => <input id={id} className="input" value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={120} autoFocus />}
              </Field>
              <div className="field">
                <span className="label">Year</span>
                <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                  {[1, 2, 3, 4, 5].map((y) => <button key={y} type="button" className="chip" aria-pressed={year === y} onClick={() => setYear(year === y ? null : y)}>Year {y}</button>)}
                </div>
              </div>
            </div>
            <div className="field">
              <span className="label">Which area pulls you most?</span>
              <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                {cat.domains.map((d) => <button key={d.code} type="button" className="chip" aria-pressed={domain === d.code} onClick={() => setDomain(d.code)}>{domainLabel(d)}</button>)}
              </div>
              {errors.domain && <span className="error small" style={{ color: 'var(--signal-ink)' }}>{errors.domain}</span>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Question kicker="The useful part." q="Which technical skills do you have?" sub="Choose what you’ve actually used. You’ll rate each one next." />
            <div className="skill-groups">
              {byCategory.map(([category, skills]) => (
                <div key={category} className="skill-group">
                  <span className="meta">{category}</span>
                  <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                    {skills.map((s) => (
                      <button key={s.id} type="button" className="chip" aria-pressed={levels.has(s.id)} onClick={() => setLevels((m) => { const n = new Map(m); n.has(s.id) ? n.delete(s.id) : n.set(s.id, 3); return n; })}>
                        {levels.has(s.id) && <Check />}{s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {errors.skills && <span className="small" style={{ color: 'var(--signal-ink)' }}>{errors.skills}</span>}
          </>
        )}

        {step === 2 && (
          <>
            <Question kicker="Be honest — it helps your team." q="How confident are you in each?" sub="Teammates see this as your own rating. Nobody expects five everywhere." />
            <ul className="confidence">
              {selected.map((s) => {
                const v = levels.get(s.id)!;
                return (
                  <li key={s.id}>
                    <span className="heading">{s.name}</span>
                    <MeterInput value={v} label={`${s.name} confidence`} onChange={(n) => setLevels((m) => new Map(m).set(s.id, n))} />
                    <span className="confidence-label"><b>{PROFICIENCY[v]}</b> <span className="muted">{PROFICIENCY_HINT[v]}</span></span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <Question kicker="Almost there." q="What kinds of projects interest you?" />
            <div className="field">
              <span className="label">Themes <span className="muted">· up to 12</span></span>
              <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                {cat.interests.map((i) => <button key={i.id} type="button" className="chip" aria-pressed={interests.has(i.id)} onClick={() => setInterests((s) => toggle(s, i.id, 12))}>{i.name}</button>)}
              </div>
            </div>
            <div className="field">
              <span className="label">What you’re building for</span>
              <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                {cat.goals.map((g) => <button key={g.code} type="button" className="chip" aria-pressed={goals.has(g.code)} onClick={() => setGoals((s) => toggle(s, g.code, 7))}>{g.name}</button>)}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <Question kicker="Last one." q="When are you usually free?" sub={`Tap the blocks that work most weeks. Times are in ${Intl.DateTimeFormat().resolvedOptions().timeZone}. You can skip this.`} />
            <div className="avail" role="grid" aria-label="Weekly availability">
              <span />
              {BLOCKS.map((b) => <span key={b.key} className="meta avail-head">{b.label}</span>)}
              {DAYS.slice(1).map((day, i) => (
                <div key={day} role="row" style={{ display: 'contents' }}>
                  <span className="meta avail-day">{day}</span>
                  {BLOCKS.map((b) => {
                    const k = `${i + 1}:${b.key}`;
                    const on = cells.has(k);
                    return <button key={k} type="button" role="gridcell" className={`avail-cell ${on ? 'on' : ''}`} aria-pressed={on} aria-label={`${day} ${b.label}`} onClick={() => setCells((s) => { const n = new Set(s); on ? n.delete(k) : n.add(k); return n; })} />;
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <ErrorNote error={failure} />
      <footer className="row spread onboard-actions">
        <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0 || saving}><ArrowLeft />Back</Button>
        <Button size="lg" onClick={next} loading={saving}>
          {step === STEPS.length - 1 ? (editing ? 'Save profile' : 'Finish and start a project') : 'Continue'} <ArrowRight />
        </Button>
      </footer>
    </div>
  );
}

function Question({ kicker, q, sub }: { kicker: string; q: string; sub?: string }) {
  return (
    <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
      <p className="meta">{kicker}</p>
      <h1 className="title">{q}</h1>
      {sub && <p className="muted">{sub}</p>}
    </div>
  );
}
