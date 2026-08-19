import { useEffect, useRef, useState } from 'react';
import BubbleMenu from '../components/reactbits/BubbleMenu';
import DotField from '../components/reactbits/DotField';
import OptionWheel from '../components/reactbits/OptionWheel';
import ParticleText from '../components/reactbits/ParticleText';
import './Landing.css';

/**
 * The marketing surface. Deliberately a different world from the application:
 * this page has to earn attention from someone who has never heard of Mesh, while
 * the signed-in product is a calm workspace people use for an hour at a time.
 *
 * The skills on the wheel are the real catalogue the recommendation engine scores
 * against, so the page is showing the actual product rather than sample copy.
 */

const SKILLS = [
  'Figma',
  'Java',
  'UI/UX Design',
  'React',
  'Data Analysis',
  'Spring Boot',
  'Machine Learning',
  'Project Management',
  'Python',
  'Technical Writing'
];

/**
 * What each skill is missing, phrased as the engine would explain it. This is the
 * argument of the whole product in one line, so it changes with the wheel.
 */
const COMPLEMENTS = {
  Figma: { needs: 'Java', line: 'A designer with no one to build it stays a prototype.' },
  Java: { needs: 'Figma', line: 'A backend with no interface is a database with extra steps.' },
  'UI/UX Design': { needs: 'Spring Boot', line: 'Someone has to make the screens actually work.' },
  React: { needs: 'Data Analysis', line: 'A fast interface still needs something true to show.' },
  'Data Analysis': { needs: 'React', line: 'An insight nobody can see is an insight nobody uses.' },
  'Spring Boot': { needs: 'UI/UX Design', line: 'Good endpoints deserve a screen worth using.' },
  'Machine Learning': { needs: 'Technical Writing', line: 'A model nobody can explain never ships.' },
  'Project Management': { needs: 'Python', line: 'A plan needs someone who can build the thing.' },
  Python: { needs: 'Project Management', line: 'A script becomes a project when someone scopes it.' },
  'Technical Writing': { needs: 'Machine Learning', line: 'The clearest writing needs something worth explaining.' }
};

const MENU_ITEMS = [
  { label: 'how it works', href: '#how', ariaLabel: 'How Mesh works', rotation: -8, hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' } },
  { label: 'the engine', href: '#engine', ariaLabel: 'The matching engine', rotation: 8, hoverStyles: { bgColor: '#22d3ee', textColor: '#0b0b12' } },
  { label: 'skills', href: '#skills', ariaLabel: 'Skills', rotation: 8, hoverStyles: { bgColor: '#f59e0b', textColor: '#0b0b12' } },
  { label: 'sign in', href: '#signin', ariaLabel: 'Sign in', rotation: -8, hoverStyles: { bgColor: '#ffffff', textColor: '#0b0b12' } }
];

const STEPS = [
  { n: '01', title: 'Say what you bring', body: 'Pick your skills and how strong you are in each. Two minutes, no essay.' },
  { n: '02', title: 'See who completes you', body: 'Mesh ranks students by what you are missing, and shows you the reason for every suggestion.' },
  { n: '03', title: 'Build the thing', body: 'Interest is mutual. When you both agree, a private project conversation opens.' }
];

/**
 * Renders children only while the wrapper is near the viewport.
 *
 * Both hero visuals are canvas animation loops. Left mounted they keep repainting
 * after the reader has scrolled past, which is most of the page. Unmounting them
 * costs a remount on scroll-back and saves the entire frame budget below the fold.
 */
function WhenVisible({ children, rootMargin = '200px', className }) {
  const holder = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = holder.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      entries => setVisible(entries.some(entry => entry.isIntersecting)),
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div className={className} ref={holder}>{visible ? children : null}</div>;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function Landing({ onStart, onSignIn }) {
  const [activeSkill, setActiveSkill] = useState(SKILLS[2]);
  const reducedMotion = usePrefersReducedMotion();
  const complement = COMPLEMENTS[activeSkill] || COMPLEMENTS.Figma;

  const jump = (event, id) => {
    if (id === 'signin') { event.preventDefault(); onSignIn(); return; }
    const target = document.getElementById(id);
    if (target) { event.preventDefault(); target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }); }
  };

  return (
    <main className="lp">
      <header className="lp-nav">
        <a className="lp-mark" href="#top" onClick={(event) => jump(event, 'top')}>
          <span className="lp-mark-badge">M</span>
          <span>Mesh</span>
        </a>
        <nav className="lp-nav-links" aria-label="Primary">
          <a href="#how" onClick={(event) => jump(event, 'how')}>How it works</a>
          <a href="#engine" onClick={(event) => jump(event, 'engine')}>The engine</a>
          <a href="#skills" onClick={(event) => jump(event, 'skills')}>Skills</a>
        </nav>
        <div className="lp-nav-actions">
          <button className="lp-ghost" onClick={onSignIn}>Sign in</button>
          <button className="lp-cta" onClick={onStart}>Create your profile</button>
        </div>
        <div className="lp-bubble" aria-hidden={false}>
          <BubbleMenu
            logo={<span style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>M</span>}
            items={MENU_ITEMS.map((item) => ({ ...item, onClick: (event) => jump(event, item.href.replace('#', '')) }))}
            menuAriaLabel="Toggle navigation"
            menuBg="#ffffff"
            menuContentColor="#0b0b12"
            useFixedPosition={false}
            animationEase="back.out(1.5)"
            animationDuration={reducedMotion ? 0.01 : 0.5}
            staggerDelay={reducedMotion ? 0 : 0.12}
          />
        </div>
      </header>

      <section className="lp-hero" id="top">
        {/* Decorative, and scoped to the hero rather than the whole page: a fixed
            full-viewport field repaints every pixel behind every section. */}
        <WhenVisible className="lp-field">
          {!reducedMotion ? (
            <DotField
              dotRadius={1.5}
              dotSpacing={30}
              bulgeStrength={67}
              glowRadius={160}
              sparkle={false}
              waveAmplitude={0}
              maxDpr={1}
            />
          ) : null}
        </WhenVisible>
        <p className="lp-eyebrow">Campus collaboration, without the guessing</p>
        <div className="lp-title">
          <ParticleText
            text="MESH"
            particleSize={2}
            density={6}
            color="#ffffff"
            highlightColor="#8b5cf6"
            pointerRepel={40}
            repelRadius={120}
            idleDrift={0}
            gatherOnMount={false}
            trigger="none"
            fontSize="clamp(4rem, 18vw, 13rem)"
            fontWeight={800}
            fontFamily="inherit"
            glow
          />
        </div>
        <h1 className="sr-only">Mesh — find the person who makes your project possible</h1>
        <p className="lp-lede">
          Find the person who makes your project <em>possible</em> — not another person who
          does exactly what you already do.
        </p>
        <div className="lp-hero-actions">
          <button className="lp-cta lp-cta-lg" onClick={onStart}>Start with your skills →</button>
          <button className="lp-ghost lp-ghost-lg" onClick={onSignIn}>I already have an account</button>
        </div>
        <p className="lp-hero-note">Built for project teams, hackathons, and practical campus help.</p>
      </section>


      <section className="lp-skills" id="skills">
        <div className="lp-skills-copy">
          <p className="lp-eyebrow">The catalogue the engine scores against</p>
          <h2>Every skill is missing something.</h2>
          <p className="lp-body">
            Scroll the wheel. Whatever you are strong in, Mesh looks for the student who
            covers what you are not — then tells you exactly why it picked them.
          </p>
          <div className="lp-complement" role="status" aria-live="polite">
            <span className="lp-complement-pair">
              <strong>{activeSkill}</strong>
              <span className="lp-plus">+</span>
              <strong className="lp-needs">{complement.needs}</strong>
            </span>
            <p>{complement.line}</p>
          </div>
        </div>
        <div className="lp-wheel">
          <OptionWheel
            items={SKILLS}
            defaultSelected={2}
            textColor="#8f8fa0"
            activeColor="#ffffff"
            side="left"
            fontSize={3}
            spacing={1.4}
            curve={1}
            tilt={6}
            blur={2}
            fade={0.25}
            smoothing={reducedMotion ? 0 : 200}
            inset={80}
            loop={false}
            draggable
            soundVolume={0.5}
            onChange={(index, item) => setActiveSkill(item)}
          />
        </div>
      </section>

      <section className="lp-how" id="how">
        <p className="lp-eyebrow">Three steps</p>
        <h2>Less searching. More building.</h2>
        <ol className="lp-steps">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="lp-step-n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-engine" id="engine">
        <div className="lp-engine-copy">
          <p className="lp-eyebrow">The part that is actually hard</p>
          <h2>A score you can argue with.</h2>
          <p className="lp-body">
            Most matching returns people like you. That is the least useful person to build
            with. Mesh scores the opposite question — <em>can the two of us build something
            neither of us could alone?</em> — across four components, and shows you every one.
          </p>
        </div>
        <div className="lp-engine-card">
          <div className="lp-engine-head">
            <span>Suggested collaborator</span>
            <strong>64% fit</strong>
          </div>
          <div className="lp-engine-person">
            <span className="lp-engine-avatar">DN</span>
            <div>
              <strong>Divya Kokane</strong>
              <span>Design · Year 2</span>
            </div>
          </div>
          <p className="lp-engine-reason">
            Brings Figma and UI/UX Design — design work that is missing from your current
            skill set.
          </p>
          <dl className="lp-engine-bars">
            {[
              ['Fills your gaps', 90],
              ['Shared ground', 0],
              ['Depth of skill', 93],
              ['Different discipline', 33]
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <span className="lp-bar"><span className="lp-bar-fill" style={{ transform: `scaleX(${value / 100})` }} /></span>
                  <em>{value}</em>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="lp-final">
        <h2>Your next project is one person away.</h2>
        <p className="lp-body">Two minutes to a profile. The rest is building.</p>
        <button className="lp-cta lp-cta-lg" onClick={onStart}>Create your profile →</button>
      </section>

      <footer className="lp-footer">
        <span>Mesh Connect</span>
        <span>Built for students who want to make useful things together.</span>
      </footer>
    </main>
  );
}
