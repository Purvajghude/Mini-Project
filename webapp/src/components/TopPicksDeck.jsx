import { useCallback, useMemo } from 'react';
import Stack from './reactbits/Stack';
import './TopPicksDeck.css';

/**
 * The featured deck on the home page: the highest-ranked complementary students,
 * as a physical pile of cards you can flick through.
 *
 * Whichever card is on top is the selected profile, so the detail panel beside the
 * deck always describes the card you are looking at. Ordering matters here: Stack
 * draws the last entry on top, so the list is reversed before it is handed over and
 * the strongest match is the one facing you.
 */
export default function TopPicksDeck({ candidates, topId, onTopChange, onInterest, onReject, busy }) {
  const picks = useMemo(() => candidates.slice(0, 5), [candidates]);

  // Stack keys its internal order by position, so this is the lookup from the id it
  // reports back to the candidate that card represents.
  const byStackId = useMemo(() => {
    const reversed = [...picks].reverse();
    return reversed.map((candidate, index) => ({ stackId: index + 1, candidate }));
  }, [picks]);

  const handleTopChange = useCallback(
    (stackId) => {
      const hit = byStackId.find((entry) => entry.stackId === stackId);
      if (hit) onTopChange(hit.candidate.id);
    },
    [byStackId, onTopChange]
  );

  /**
   * Identity of the *content* of the deck. Stack resets its order when this changes, so
   * it must describe who is in the deck - not transient flags like `busy`, and not the
   * callback identities that change on every parent render.
   */
  const cardsKey = useMemo(
    () => byStackId.map(({ candidate }) => `${candidate.id}:${candidate.interested ? 1 : 0}`).join('|'),
    [byStackId]
  );
  const cards = useMemo(
    () =>
      byStackId.map(({ candidate }) => (
        <article className="pick-card" key={candidate.id}>
          <div className="pick-card-top">
            <span className={`pick-avatar pick-avatar-${candidate.accent || 'ink'}`}>{candidate.initials}</span>
            <strong className="pick-fit">{Math.round(candidate.score)}% <span>fit</span></strong>
          </div>
          <h3>{candidate.displayName}</h3>
          <p className="pick-course">{candidate.course || candidate.availability}</p>
          <p className="pick-reason">{candidate.reason}</p>
          <div className="pick-skills">
            {(candidate.complementarySkills || []).slice(0, 3).map((skill) => (
              <span className="pick-skill" key={skill}>{skill}</span>
            ))}
          </div>
          <div className="pick-actions">
            <button
              type="button"
              className="pick-button pick-button-quiet"
              disabled={busy}
              onClick={(event) => { event.stopPropagation(); onReject(candidate); }}
            >
              Reject
            </button>
            <button
              type="button"
              className="pick-button pick-button-strong"
              disabled={busy || candidate.interested}
              onClick={(event) => { event.stopPropagation(); onInterest(candidate); }}
            >
              {candidate.interested ? 'Request sent' : 'Send request'}
            </button>
          </div>
        </article>
      )),
    [byStackId, busy, onInterest, onReject]
  );

  if (!picks.length) return null;

  return (
    <section className="top-picks" aria-labelledby="top-picks-title">
      <div className="top-picks-copy">
        <p className="section-label">Your strongest matches</p>
        <h2 id="top-picks-title">Top picks</h2>
        <p>
          The {picks.length} students who most complete what you already bring. Drag the top
          card away, or tap it, to bring up the next one.
        </p>
        <ol className="top-picks-legend">
          {picks.map((candidate, index) => (
            <li key={candidate.id} className={candidate.id === topId ? 'top-picks-legend-active' : ''}>
              <span>{index + 1}</span>
              {candidate.displayName}
              <em>{Math.round(candidate.score)}%</em>
            </li>
          ))}
        </ol>
      </div>
      <div className="top-picks-stage">
        <Stack
          randomRotation
          sensitivity={180}
          sendToBackOnClick
          cards={cards}
          cardsKey={cardsKey}
          onTopCardChange={handleTopChange}
        />
      </div>
    </section>
  );
}
