import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Link } from '../lib/router';
import { Meter, Wordmark } from '../ui';

const STEPS = [
  ['Idea', 'Write what you want to build in plain words. No forms, no jargon.'],
  ['Blueprint', 'MESH turns it into a technical document: requirements, levels, team size. Every line is editable.'],
  ['Skill gap', 'See which requirements your team already covers, which are only partly covered, and which are open.'],
  ['Team', 'Get up to three complementary team combinations, each explained skill by skill.'],
  ['Build', 'Work together in one project space: tasks, meetings, messages and a shared board.'],
] as const;

export function Landing() {
  const { state } = useAuth();
  const signedIn = state.status === 'signed-in';
  return (
    <div className="landing">
      <header className="wrap landing-nav">
        <Wordmark />
        <nav className="row">
          {signedIn ? (
            <Link to="/studio" className="btn btn-primary">Open your studio <ArrowRight /></Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary">Start a project</Link>
            </>
          )}
        </nav>
      </header>

      <section className="wrap hero">
        <div className="hero-copy">
          <p className="meta">For engineering students · Idea → Team</p>
          <h1 className="display">Great ideas deserve <em>the right people.</em></h1>
          <p className="lede">
            You know what you want to build, but not who on campus can build it with you. MESH turns your idea into a technical blueprint,
            shows exactly which skills are missing, and finds students whose declared skills fill the gap.
          </p>
          <div className="row" style={{ '--gap': '10px', marginTop: 8 } as React.CSSProperties}>
            <Link to={signedIn ? '/new' : '/register'} className="btn btn-signal btn-lg">Describe your idea <ArrowRight /></Link>
            <a href="#how" className="btn btn-outline btn-lg">How it works</a>
          </div>
        </div>
        <ExampleBlueprint />
      </section>

      <section id="how" className="wrap journey" aria-labelledby="how-title">
        <div className="journey-head">
          <p className="meta">The journey</p>
          <h2 id="how-title" className="title">One idea, five <em>moves.</em></h2>
        </div>
        <ol className="journey-steps">
          {STEPS.map(([name, text], i) => (
            <li key={name}>
              <span className="journey-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="heading">{name}</h3>
              <p className="muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap honest" aria-labelledby="honest-title">
        <div>
          <p className="meta">Honest by design</p>
          <h2 id="honest-title" className="title">No magic <em>match scores.</em></h2>
        </div>
        <dl className="honest-list">
          <div><dt>Skills are self-declared.</dt><dd>Students rate themselves from 1 to 5 against plain-language descriptions. MESH shows the rating; it never pretends to have verified it.</dd></div>
          <div><dt>Coverage is strict.</dt><dd>Two beginners don’t add up to one expert. A requirement is covered only when one person meets the level.</dd></div>
          <div><dt>Every suggestion is explained.</dt><dd>Team combinations list the exact requirements each person covers and what stays open — no opaque percentages.</dd></div>
        </dl>
      </section>

      <section className="closing">
        <div className="wrap closing-inner">
          <h2 className="display">What are you <em>building?</em></h2>
          <Link to={signedIn ? '/new' : '/register'} className="btn btn-signal btn-lg">Start with an idea <ArrowUpRight /></Link>
        </div>
      </section>

      <footer className="wrap landing-foot meta">
        <span>MESH — from ideas to teams</span>
        <span>B.Tech mini-project</span>
      </footer>
    </div>
  );
}

/** Illustrative example only; it is labelled as such and contains no live data. */
function ExampleBlueprint() {
  return (
    <figure className="example sheet graph-paper" aria-label="Example: how an idea becomes a blueprint">
      <figcaption className="row spread">
        <span className="meta">Example blueprint</span>
        <span className="tag">Draft</span>
      </figcaption>
      <p className="example-idea">
        “An autonomous drone that <mark style={{ '--d': 0 } as React.CSSProperties}>navigates campus</mark> using{' '}
        <mark style={{ '--d': 1 } as React.CSSProperties}>computer vision</mark>, with <mark style={{ '--d': 2 } as React.CSSProperties}>custom flight electronics</mark>.”
      </p>
      <ul className="example-reqs">
        <ExampleReq d={0} name="Python" level={3} status="covered" note="You · Strong" />
        <ExampleReq d={1} name="Machine Learning" level={3} status="partial" note="Team has level 2" />
        <ExampleReq d={2} name="Embedded systems" level={3} status="open" note="Open — nobody yet" />
      </ul>
      <div className="example-team">
        <span className="meta">Team · 2 of 4</span>
        <div className="avatars">
          <span className="avatar" style={{ '--hue': 24 } as React.CSSProperties}>YO</span>
          <span className="avatar" style={{ '--hue': 160 } as React.CSSProperties}>RK</span>
          <span className="avatar open">+</span>
          <span className="avatar open">+</span>
        </div>
      </div>
    </figure>
  );
}

function ExampleReq({ name, level, status, note, d }: { name: string; level: number; status: 'covered' | 'partial' | 'open'; note: string; d: number }) {
  return (
    <li className={`example-req is-${status}`} style={{ '--d': d } as React.CSSProperties}>
      <span className="heading" style={{ fontSize: 15 }}>{name}</span>
      <Meter value={level} tone={status === 'open' ? undefined : status} />
      <span className={`tag ${status === 'covered' ? 'tag-covered' : status === 'partial' ? 'tag-partial' : 'tag-signal'}`}>{note}</span>
    </li>
  );
}
