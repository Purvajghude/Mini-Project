import { useMemo, useState } from 'react';
import './TeamBuilder.css';

/**
 * Name what a project needs; get back the smallest team that covers it.
 *
 * The deliberate difference from Discover: Discover ranks people one at a time against
 * you, which is the right question for "who should I talk to?" but the wrong one for
 * "who do we need?" - taking the top three of an individual ranking gives you three
 * people who are strong on the same axis. This asks the server for coverage instead, and
 * shows which requirement each person is there to close.
 */
export default function TeamBuilder({ skills, mySkills, onSuggest, busy }) {
  const [selected, setSelected] = useState([]);
  const [size, setSize] = useState(3);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const myStrongIds = useMemo(
    () => new Set((mySkills || []).filter((s) => (s.proficiency ?? s.level ?? 0) >= 3).map((s) => Number(s.id))),
    [mySkills]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    (skills || []).forEach((skill) => {
      if (!map.has(skill.category)) map.set(skill.category, []);
      map.get(skill.category).push(skill);
    });
    return [...map.entries()];
  }, [skills]);

  const toggle = (id) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const build = async () => {
    setError('');
    try {
      const suggestion = await onSuggest({ skillIds: selected, size });
      setResult(suggestion);
    } catch (problem) {
      setError(problem.message || 'Could not build a team right now.');
      setResult(null);
    }
  };

  const reset = () => { setSelected([]); setResult(null); setError(''); };

  return (
    <div className="team-layout">
      <section className="team-main">
        <div className="page-intro">
          <div>
            <p className="section-label">Coverage, not popularity</p>
            <h2>Build the team this project needs.</h2>
            <p>
              Pick the skills the work actually requires. Mesh finds the fewest people who
              cover them between them — and tells you what each one is there to do.
            </p>
          </div>
        </div>

        <fieldset className="team-picker">
          <legend>What does the project need?</legend>
          {grouped.map(([category, items]) => (
            <div className="team-group" key={category}>
              <h3>{category}</h3>
              <div className="team-chips">
                {items.map((skill) => {
                  const on = selected.includes(skill.id);
                  const mine = myStrongIds.has(Number(skill.id));
                  return (
                    <button
                      type="button"
                      key={skill.id}
                      className={`team-chip ${on ? 'team-chip-on' : ''}`}
                      aria-pressed={on}
                      onClick={() => toggle(skill.id)}
                    >
                      {skill.name}
                      {/* Knowing you already cover something changes whether you need to
                          staff it, so it is worth saying before the search runs. */}
                      {mine ? <span className="team-chip-mine" title="You already cover this">you</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </fieldset>

        <div className="team-controls">
          <label htmlFor="team-size">
            Team size
            <select id="team-size" value={size} onChange={(event) => setSize(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'teammate' : 'teammates'}</option>)}
            </select>
          </label>
          <span className="team-count">{selected.length} selected</span>
          <button type="button" className="team-reset" onClick={reset} disabled={!selected.length && !result}>Clear</button>
          <button
            type="button"
            className="team-build"
            onClick={build}
            disabled={busy || selected.length === 0}
          >
            {busy ? 'Building…' : 'Build the team'}
          </button>
        </div>

        {error ? <p className="team-error" role="alert">{error}</p> : null}
      </section>

      <aside className="team-result" aria-live="polite">
        {!result ? (
          <div className="team-empty">
            <h3>No team yet</h3>
            <p>Choose the skills your project needs and Mesh will assemble the smallest group that covers them.</p>
          </div>
        ) : (
          <>
            <div className="team-coverage">
              <div className="team-coverage-head">
                <span>Requirement covered</span>
                <strong>{Math.round(result.coveragePercent)}%</strong>
              </div>
              <span className="team-coverage-track">
                <span className="team-coverage-fill" style={{ transform: `scaleX(${result.coveragePercent / 100})` }} />
              </span>
              <p className="team-coverage-note">
                {result.requestedSkillCount} skill{result.requestedSkillCount === 1 ? '' : 's'} requested
                {result.youAlreadyCover.length ? ` · you already cover ${result.youAlreadyCover.length}` : ''}
              </p>
            </div>

            {result.members.length ? (
              <ol className="team-members">
                {result.members.map((member, index) => (
                  <li key={member.userId}>
                    <div className="team-member-head">
                      <span className={`team-avatar team-avatar-${member.avatarKey || 'ink'}`}>
                        {(member.displayName || '').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                      </span>
                      <div>
                        <strong>{member.displayName}</strong>
                        <span>{[member.department, member.yearOfStudy ? `Year ${member.yearOfStudy}` : null].filter(Boolean).join(' · ')}</span>
                      </div>
                      <em>#{index + 1}</em>
                    </div>
                    <p className="team-member-role">Brought in for {member.covers.join(', ')}</p>
                    <p className="team-member-meta">Closes {Math.round(member.contribution)}% of what you were missing · {member.availability || 'Availability not set'}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="team-none">Nobody available covers what you selected.</p>
            )}

            {result.youAlreadyCover.length ? (
              <div className="team-aside-block">
                <span>You already cover</span>
                <div className="team-chips team-chips-static">
                  {result.youAlreadyCover.map((name) => <span className="team-chip-static" key={name}>{name}</span>)}
                </div>
              </div>
            ) : null}

            {result.stillMissing.length ? (
              <div className="team-aside-block team-aside-gap">
                <span>Nobody covers</span>
                <div className="team-chips team-chips-static">
                  {result.stillMissing.map((name) => <span className="team-chip-static team-chip-gap" key={name}>{name}</span>)}
                </div>
                <p>You would need to learn these, scope them out, or look outside the cohort.</p>
              </div>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}
