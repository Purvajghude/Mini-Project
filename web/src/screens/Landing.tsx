import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Link } from '../lib/router';
import { Wordmark } from '../ui';
import './landing.css';

const JOURNEY = [
  { number: '01', title: 'Start with an idea.', detail: 'Describe what you want to make in your own words.' },
  { number: '02', title: 'Shape the blueprint.', detail: 'Turn the idea into editable skills, levels, and a team size.' },
  { number: '03', title: 'See what is missing.', detail: 'Find out which skills your team covers and where the gaps remain.' },
  { number: '04', title: 'Find your people.', detail: 'Explore explained team suggestions and invite students to join.' },
  { number: '05', title: 'Build together.', detail: 'Share tasks, events, polls, messages, and a live whiteboard.' },
] as const;

export function Landing() {
  const { state } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const pointerArmed = useRef(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const signedIn = state.status === 'signed-in';
  const startPath = signedIn ? '/new' : '/register';

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const settle = () => {
      currentX += (targetX - currentX) * 0.085;
      currentY += (targetY - currentY) * 0.085;
      hero.style.setProperty('--parallax-x', `${currentX}px`);
      hero.style.setProperty('--parallax-y', `${currentY}px`);
      hero.style.setProperty('--cloud-parallax-x', `${currentX * -0.85}px`);
      hero.style.setProperty('--cloud-parallax-y', `${currentY * -0.7}px`);
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.15) {
        frame = requestAnimationFrame(settle);
      } else {
        frame = 0;
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointerArmed.current = true;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      targetX = (0.5 - x) * 18;
      targetY = (0.5 - y) * 12;
      hero.style.setProperty('--pointer-x', `${x * 100}%`);
      hero.style.setProperty('--pointer-y', `${y * 100}%`);
      hero.classList.add('has-pointer');
      if (!frame) frame = requestAnimationFrame(settle);
    };
    const leave = () => {
      hero.classList.remove('has-pointer');
      targetX = 0;
      targetY = 0;
      if (!frame) frame = requestAnimationFrame(settle);
    };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div className="landing mesh-landing">
      <section ref={heroRef} className={`mesh-hero${logoHovered ? ' is-logo-hovered' : ''}`} aria-labelledby="mesh-hero-title">
        <div className="mesh-hero-image" aria-hidden="true" />
        <div className="mesh-cloud-field" aria-hidden="true">
          <div className="mesh-cloud-layer mesh-cloud-layer-one" />
          <div className="mesh-cloud-layer mesh-cloud-layer-two" />
        </div>
        <div className="mesh-cursor-wake" aria-hidden="true" />
        <header className="mesh-hero-nav">
          <Wordmark />
          <nav aria-label="Landing navigation">
            <a href="#the-journey" className="mesh-nav-link">Explore</a>
            {signedIn ? <Link to="/studio" className="mesh-nav-action">Open studio <ArrowUpRight aria-hidden="true" /></Link> : <>
              <Link to="/login" className="mesh-nav-link">Sign in</Link>
              <Link to="/register" className="mesh-nav-action">Get started <ArrowUpRight aria-hidden="true" /></Link>
            </>}
          </nav>
        </header>
        <div className="mesh-hero-center">
          <p className="mesh-hero-kicker">A place for ideas to find their people</p>
          <h1
            id="mesh-hero-title"
            onPointerEnter={(event) => { if (event.pointerType !== 'touch' && pointerArmed.current) setLogoHovered(true); }}
            onPointerMove={(event) => {
              if (event.pointerType === 'touch') return;
              setLogoHovered(true);
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty('--logo-x', `${event.clientX - bounds.left}px`);
              event.currentTarget.style.setProperty('--logo-y', `${event.clientY - bounds.top}px`);
            }}
            onPointerLeave={() => setLogoHovered(false)}
          >MESH</h1>
          <p className="mesh-hero-line">Imagine more. Build together.</p>
          <div className="mesh-logo-cloud" aria-hidden="true" />
        </div>
        <div className="mesh-hero-bottom">
          <p>From the first spark of an idea<br />to the team that brings it to life.</p>
          <a href="#the-journey" className="mesh-scroll-cue">Scroll to explore <ArrowDown aria-hidden="true" /></a>
          <span className="mesh-hero-index">01 / 04</span>
        </div>
      </section>

      <main>
        <section className="mesh-intro mesh-section" aria-labelledby="mesh-intro-title">
          <div className="mesh-section-label"><span>01</span> The idea</div>
          <div className="mesh-intro-content">
            <h2 id="mesh-intro-title">Great ideas deserve<br /><em>the right people.</em></h2>
            <div className="mesh-intro-detail">
              <p>You know what you want to build. MESH helps you turn that idea into a clear plan, see which skills are missing, and find students who can help make it real.</p>
              <Link to={startPath} className="mesh-text-link">Describe your idea <ArrowUpRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section id="the-journey" className="mesh-journey mesh-section" aria-labelledby="mesh-journey-title">
          <div className="mesh-section-label"><span>02</span> The journey</div>
          <div className="mesh-journey-heading">
            <h2 id="mesh-journey-title">One idea.<br /><em>Five moves.</em></h2>
            <p>A path from the thing you want to create to the people you can create it with.</p>
          </div>
          <ol className="mesh-journey-list">
            {JOURNEY.map((step) => <li key={step.number}>
              <span className="mesh-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
              <ArrowUpRight aria-hidden="true" />
            </li>)}
          </ol>
        </section>

        <section className="mesh-principle mesh-section" aria-labelledby="mesh-principle-title">
          <div className="mesh-section-label"><span>03</span> How MESH thinks</div>
          <div className="mesh-principle-grid">
            <h2 id="mesh-principle-title">A better team starts<br />with <em>clarity.</em></h2>
            <div className="mesh-principle-copy">
              <p>Skills are self-declared. A requirement is covered when one member meets its level. Team suggestions explain who covers what and what is still open.</p>
              <p>No opaque match score. Just useful information to help you decide who to build with.</p>
            </div>
          </div>
          <div className="mesh-principle-words" aria-hidden="true"><span>IDEA</span><span>SKILLS</span><span>PEOPLE</span><span>BUILD</span></div>
        </section>

        <section className="mesh-finale" aria-labelledby="mesh-finale-title">
          <div className="mesh-finale-image" aria-hidden="true" />
          <div className="mesh-finale-inner">
            <div className="mesh-section-label"><span>04</span> Your move</div>
            <h2 id="mesh-finale-title">What will you<br /><em>build next?</em></h2>
            <Link to={startPath} className="mesh-finale-action">Start with an idea <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <footer className="mesh-landing-footer">
        <Wordmark />
        <span>Ideas become real together.</span>
        <span>© {new Date().getFullYear()} MESH</span>
      </footer>
    </div>
  );
}
