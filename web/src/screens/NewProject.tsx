import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Info, Users } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { navigate } from '../lib/router';
import type { AiBlueprintSuggestion, BlueprintSuggestion, Lifecycle } from '../lib/types';
import { Button, ErrorNote, Loading, useToast } from '../ui';
import { BlueprintEditor, validateDraft, type Draft } from './Blueprint';

const IDEA_KEY = 'mesh.idea';
const EXAMPLES = [
  'An autonomous drone that navigates our campus using computer vision.',
  'An offline Bluetooth messaging app where nearby phones relay encrypted messages without internet.',
  'A web dashboard that predicts canteen rush hours from past sales data.',
];

export const stashIdea = (idea: string) => { try { sessionStorage.setItem(IDEA_KEY, idea); } catch { /* storage unavailable */ } };
const readIdea = () => { try { return sessionStorage.getItem(IDEA_KEY) ?? ''; } catch { return ''; } };

type Generated = { suggestion: AiBlueprintSuggestion; viaAi: boolean };

/** Prefer the Gemini-backed endpoint; fall back to the deterministic one only when it isn't deployed. */
async function generate(idea: string): Promise<Generated> {
  try {
    return { suggestion: await api.suggestAiBlueprint({ idea }), viaAi: true };
  } catch (e) {
    const missing = e instanceof ApiError && (e.status === 404 || e.status === 405 || (e.status === 500 && /static resource/i.test(e.message)));
    if (!missing) throw e;
    const s: BlueprintSuggestion = await api.suggestBlueprint({ idea });
    return {
      viaAi: false,
      suggestion: { ...s, source: 'DETERMINISTIC_TEMPLATE', objectives: [], unmappedSkills: [], fallbackReason: 'AI blueprint endpoint is not deployed on this backend.' },
    };
  }
}

function composeBrief(s: AiBlueprintSuggestion) {
  const parts = [s.summary.trim()];
  if (s.objectives.length) parts.push(`Deliverables:\n${s.objectives.map((o) => `- ${o}`).join('\n')}`);
  if (s.assumptions.length) parts.push(`Scope:\n${s.assumptions.map((a) => `- ${a}`).join('\n')}`);
  return parts.join('\n\n');
}

export function NewProject() {
  const [idea, setIdea] = useState(readIdea);
  const [phase, setPhase] = useState<'idea' | 'generating' | 'review'>(() => (readIdea() ? 'generating' : 'idea'));
  const [gen, setGen] = useState<Generated | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const catalogue = useLoad(async () => ({ skills: await api.skills(), domains: await api.domains() }), []);

  useEffect(() => {
    if (phase !== 'generating') return;
    let live = true;
    setFailure(null);
    generate(idea.trim())
      .then((g) => {
        if (!live) return;
        setGen(g);
        catalogue.reload(); // Gemini may have added new skills to the catalogue
        setDraft({
          name: g.suggestion.title.slice(0, 120),
          brief: composeBrief(g.suggestion).slice(0, 1000),
          domain: g.suggestion.domain,
          targetTeamSize: g.suggestion.targetTeamSize,
          requirements: g.suggestion.requirements,
          unmapped: g.suggestion.unmappedSkills,
        });
        setPhase('review');
      })
      .catch((e) => { if (live) { setFailure(e); setPhase('idea'); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'idea') return <IdeaEntry idea={idea} setIdea={setIdea} failure={failure} onSubmit={() => { stashIdea(idea.trim()); setPhase('generating'); }} />;
  if (phase === 'generating') return <Generating idea={idea} />;
  if (!draft || !gen) return null;
  if (catalogue.error) return <div className="wrap"><ErrorNote error={catalogue.error} retry={catalogue.reload} /></div>;
  if (!catalogue.data) return <div className="wrap"><Loading /></div>;
  return (
    <Review
      draft={draft} setDraft={setDraft} gen={gen} idea={idea} catalogue={catalogue.data}
      onRestart={() => { setPhase('idea'); setGen(null); setDraft(null); }}
    />
  );
}

function IdeaEntry({ idea, setIdea, failure, onSubmit }: { idea: string; setIdea(v: string): void; failure: ApiError | null; onSubmit(): void }) {
  const [error, setError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  function submit(e?: FormEvent) {
    e?.preventDefault();
    const t = idea.trim();
    if (t.length < 12) { setError('Say a little more — a sentence about what it does and who it’s for.'); return; }
    if (t.length > 2000) { setError('Keep it under 2000 characters; details go in the blueprint.'); return; }
    onSubmit();
  }
  return (
    <div className="wrap idea">
      <form className="idea-form" onSubmit={submit}>
        <label htmlFor="idea" className="display idea-q">What do you want to <em>build?</em></label>
        <ErrorNote error={failure} />
        <div className="idea-surface">
          <textarea
            id="idea" ref={ref} className="idea-input" rows={4} value={idea} maxLength={2000}
            placeholder="Describe it the way you’d explain it to a friend…"
            aria-invalid={!!error} aria-describedby="idea-help"
            onChange={(e) => { setIdea(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
          />
          <div className="idea-bar">
            <span id="idea-help" className="small" style={error ? { color: 'var(--signal-ink)' } : undefined}>{error || 'MESH drafts a blueprint you can edit. Nothing is saved until you choose to.'}</span>
            <Button type="submit" variant="signal" size="lg">Draft blueprint <ArrowRight /></Button>
          </div>
        </div>
        <div className="idea-examples">
          <span className="meta">Or start from</span>
          {EXAMPLES.map((ex) => <button key={ex} type="button" className="idea-example" onClick={() => { setIdea(ex); setError(''); ref.current?.focus(); }}>{ex}</button>)}
        </div>
      </form>
    </div>
  );
}

function Generating({ idea }: { idea: string }) {
  const lines = ['Reading your idea', 'Identifying the engineering work involved', 'Matching it to the MESH skill catalogue', 'Writing the blueprint'];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 1400); return () => clearInterval(t); }, [lines.length]);
  return (
    <div className="wrap generating" role="status" aria-live="polite">
      <p className="prose generating-idea">“{idea.trim()}”</p>
      <ol className="generating-steps">
        {lines.map((l, n) => <li key={l} className={n < i ? 'done' : n === i ? 'now' : ''}>{n === i && <span className="spinner" />}{l}</li>)}
      </ol>
    </div>
  );
}

function Review({ draft, setDraft, gen, idea, catalogue, onRestart }: {
  draft: Draft; setDraft(d: Draft): void; gen: Generated; idea: string;
  catalogue: { skills: import('../lib/types').Skill[]; domains: import('../lib/types').Domain[] }; onRestart(): void;
}) {
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState<Lifecycle | null>(null);
  // The project survives a failed requirements save; retries must update it, not create another.
  const [projectId, setProjectId] = useState<string | null>(null);
  const s = gen.suggestion;

  async function save(lifecycle: Lifecycle) {
    const e = validateDraft(draft, { lifecycle });
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(lifecycle);
    setFailure(null);
    try {
      const input = { name: draft.name.trim(), summary: draft.brief.trim() || null, domain: draft.domain };
      let id = projectId;
      if (!id) {
        id = (await api.createProject(input)).id;
        setProjectId(id);
      } else {
        await api.updateProject(id, input);
      }
      await api.saveRequirements(id, {
        targetTeamSize: draft.targetTeamSize,
        lifecycle,
        requirements: draft.requirements.map(({ skillId, minimumProficiency, importance, note }) => ({ skillId, minimumProficiency, importance, note: note?.trim() || null })),
      });
      try { sessionStorage.removeItem(IDEA_KEY); } catch { /* storage unavailable */ }
      toast(lifecycle === 'RECRUITING' ? 'Saved. Here’s what your team still needs.' : 'Draft saved');
      navigate(lifecycle === 'RECRUITING' ? `/p/${id}/team` : `/p/${id}/blueprint`, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setFailure(projectId || apiErr.status !== 0
        ? new ApiError(`${apiErr.message}${projectId ? ' The project itself was saved; saving again will update it rather than create a copy.' : ''}`, apiErr.status)
        : apiErr);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="wrap review">
      <div className="review-head">
        <Button variant="ghost" size="sm" onClick={onRestart} disabled={!!projectId}><ArrowLeft />Edit idea</Button>
        <p className="prose review-idea">“{idea.trim()}”</p>
        <p className="small muted row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <Info size={14} />
          {gen.viaAi && s.source === 'GEMINI'
            ? 'Drafted with Gemini and mapped to the MESH skill catalogue. Review every line.'
            : 'Drafted from MESH’s built-in template — a rough starting point. Review every line.'}
        </p>
        {import.meta.env.DEV && s.fallbackReason && <p className="mono small muted">diagnostic: source={s.source} · {s.fallbackReason}</p>}
      </div>
      <ErrorNote error={failure} />
      <BlueprintEditor
        draft={draft} onChange={setDraft} skills={catalogue.skills} domains={catalogue.domains} errors={errors}
        aside={
          <>
            <hr className="rule" />
            <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
              <Button variant="signal" onClick={() => save('RECRUITING')} loading={saving === 'RECRUITING'} disabled={!!saving}><Users />Save and find teammates</Button>
              <Button variant="outline" onClick={() => save('DRAFT')} loading={saving === 'DRAFT'} disabled={!!saving}>Save as draft</Button>
              <p className="small muted">MESH saves the title, brief, area, team size and requirements.</p>
            </div>
          </>
        }
      />
    </div>
  );
}
