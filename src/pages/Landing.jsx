import { useState } from 'react';
import './Landing.css';

/**
 * Academic Peer Collaboration & Competency Matrix Dataset
 * Formal engineering pairings demonstrating complementarity in student project development.
 */
const MATRIX_PAIRS = [
  {
    primary: 'Java & Spring Boot',
    complement: 'UI/UX & Design Systems',
    focus: 'Enterprise Full-Stack Architecture',
    analysis:
      'Robust enterprise backend services require intuitive frontend design systems to deliver usable engineering workflows and production-ready capstone systems.',
    coverage: 94,
    depth: 90,
    roles: ['Backend Systems Architect', 'Design Systems Engineer']
  },
  {
    primary: 'Machine Learning & PyTorch',
    complement: 'Data Engineering & MLOps',
    focus: 'Predictive Modeling & Deployment',
    analysis:
      'High-accuracy neural network models require scalable ingestion pipelines and reproducible containerized serving to transition from notebooks to production.',
    coverage: 96,
    depth: 92,
    roles: ['Applied AI Researcher', 'Data Pipeline Engineer']
  },
  {
    primary: 'React & Frontend Engineering',
    complement: 'Distributed Systems & Cloud',
    focus: 'Scalable Cloud Applications',
    analysis:
      'Responsive interactive clients demand fault-tolerant microservices, structured API gateways, and automated cloud provisioning to handle concurrent campus traffic.',
    coverage: 91,
    depth: 88,
    roles: ['Frontend Web Developer', 'DevOps & Cloud Engineer']
  },
  {
    primary: 'Embedded Systems & IoT',
    complement: 'Mobile Application Development',
    focus: 'Connected Hardware Solutions',
    analysis:
      'Microcontroller sensor arrays and telemetry devices achieve practical utility when paired with real-time mobile interfaces for edge monitoring and configuration.',
    coverage: 93,
    depth: 89,
    roles: ['Hardware Systems Engineer', 'Mobile Systems Developer']
  }
];

export default function Landing({ onStart, onSignIn }) {
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const activePair = MATRIX_PAIRS[selectedPairIndex];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="lp">
      {/* Ambient Fluid Background Elements */}
      <div className="lp-ambient-bg" aria-hidden="true">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
        <div className="lp-blob lp-blob-4" />
        <div className="lp-grid-pattern" />
      </div>

      {/* Primary Sticky Glass Navigation */}
      <header className="lp-nav">
        <div className="lp-nav-bar">
          <a className="lp-brand" href="#top">
            <span className="lp-brand-badge">M</span>
            <span className="lp-brand-text">Mesh</span>
            <span className="lp-brand-tag">Academic</span>
          </a>

          <nav className="lp-nav-links" aria-label="Main Navigation">
            <a href="#capabilities" onClick={(e) => { e.preventDefault(); scrollToSection('capabilities'); }}>
              Platform Architecture
            </a>
            <a href="#matrix" onClick={(e) => { e.preventDefault(); scrollToSection('matrix'); }}>
              Competency Matrix
            </a>
            <a href="#algorithm" onClick={(e) => { e.preventDefault(); scrollToSection('algorithm'); }}>
              Matching Algorithm
            </a>
          </nav>

          <div className="lp-nav-actions">
            <button type="button" className="lp-btn-ghost" onClick={onSignIn}>
              Sign in
            </button>
            <button type="button" className="lp-btn-primary" onClick={onStart}>
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero" id="top">
        <div className="lp-hero-copy">
          <div className="lp-badge-eyebrow">
            <span className="lp-badge-dot" />
            Academic Collaboration Platform
          </div>

          <h1 className="lp-hero-title">
            Peer Skill Matching &amp; <span>Project Formation System</span>
          </h1>

          <p className="lp-hero-desc">
            Connect with complementary student researchers and engineers based on verified technical competencies,
            shared project goals, and interdisciplinary requirements.
          </p>

          <div className="lp-hero-cta-group">
            <button type="button" className="lp-btn-primary lp-btn-lg" onClick={onStart}>
              Get started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button type="button" className="lp-btn-ghost lp-btn-lg" onClick={onSignIn}>
              Sign in to workspace
            </button>
          </div>

          <div className="lp-hero-meta">
            <div className="lp-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Multi-tier Scoring</span>
            </div>
            <div className="lp-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Automated Team Balancing</span>
            </div>
            <div className="lp-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Direct Mutual Match</span>
            </div>
          </div>
        </div>

        {/* Hero Bespoke Glass Graphics Stage */}
        <div className="lp-hero-graphic-stage">
          {/* Top Satellite Badge */}
          <div className="lp-satellite-badge-1">
            <div className="lp-sat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="lp-sat-text">
              <strong>Multi-factor Scoring</strong>
              <span>Weighted Gap Evaluation</span>
            </div>
          </div>

          {/* Primary Glass Dossier Card */}
          <div className="lp-glass-card-primary">
            <div className="lp-card-header">
              <div className="lp-card-title-group">
                <span className="lp-card-subtitle">Student Compatibility Index</span>
                <span className="lp-card-title">Project Pair Evaluation</span>
              </div>
              <div className="lp-score-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                94% Fit
              </div>
            </div>

            {/* Peer Connection Visual */}
            <div className="lp-peers-row">
              <div className="lp-peer-item">
                <div className="lp-peer-avatar lp-avatar-blue">AS</div>
                <div className="lp-peer-meta">
                  <strong>Aditya Sharma</strong>
                  <span>Backend · Year 3</span>
                </div>
              </div>

              <div className="lp-connector-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17l9.2-9.2M17 17V8H8" />
                </svg>
              </div>

              <div className="lp-peer-item">
                <div className="lp-peer-avatar lp-avatar-indigo">PP</div>
                <div className="lp-peer-meta">
                  <strong>Priya Patel</strong>
                  <span>UI/UX · Year 2</span>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Bars */}
            <div className="lp-metrics-stack">
              <div className="lp-metric-row">
                <span className="lp-metric-name">Complementary Gap Fill</span>
                <div className="lp-metric-bar-track">
                  <div className="lp-metric-bar-fill emerald" style={{ width: '92%' }} />
                </div>
                <span className="lp-metric-val">92</span>
              </div>

              <div className="lp-metric-row">
                <span className="lp-metric-name">Shared Technical Base</span>
                <div className="lp-metric-bar-track">
                  <div className="lp-metric-bar-fill" style={{ width: '85%' }} />
                </div>
                <span className="lp-metric-val">85</span>
              </div>

              <div className="lp-metric-row">
                <span className="lp-metric-name">Proficiency Depth</span>
                <div className="lp-metric-bar-track">
                  <div className="lp-metric-bar-fill indigo" style={{ width: '95%' }} />
                </div>
                <span className="lp-metric-val">95</span>
              </div>

              <div className="lp-metric-row">
                <span className="lp-metric-name">Discipline Coverage</span>
                <div className="lp-metric-bar-track">
                  <div className="lp-metric-bar-fill emerald" style={{ width: '88%' }} />
                </div>
                <span className="lp-metric-val">88</span>
              </div>
            </div>

            {/* Chips */}
            <div className="lp-card-chips">
              <span className="lp-chip"><span className="lp-chip-dot" />Java Spring Boot</span>
              <span className="lp-chip"><span className="lp-chip-dot" />React 19</span>
              <span className="lp-chip"><span className="lp-chip-dot" />Figma Design</span>
              <span className="lp-chip"><span className="lp-chip-dot" />REST Services</span>
            </div>
          </div>

          {/* Bottom Satellite Badge */}
          <div className="lp-satellite-badge-2">
            <div className="lp-sat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="lp-sat-text">
              <strong>Project Ready</strong>
              <span>Verified Role Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="lp-section-capabilities" id="capabilities">
        <div className="lp-section-header">
          <div className="lp-section-eyebrow">Platform Architecture</div>
          <h2 className="lp-section-title">Engineered for Academic Team Formation</h2>
          <p className="lp-section-desc">
            Mesh replaces ad-hoc campus messaging channels with an objective, data-backed collaboration framework.
          </p>
        </div>

        <div className="lp-capabilities-grid">
          <div className="lp-cap-card">
            <div className="lp-cap-number">01</div>
            <h3 className="lp-cap-title">Competency Profiling</h3>
            <p className="lp-cap-text">
              Students declare verified proficiency across programming languages, design systems, and architectural
              disciplines with standardized competency scales.
            </p>
            <div className="lp-cap-footer">
              <span>Standardized Taxonomy</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="lp-cap-card">
            <div className="lp-cap-number">02</div>
            <h3 className="lp-cap-title">Algorithmic Gap Analysis</h3>
            <p className="lp-cap-text">
              The recommendation engine calculates high-priority skill deficits and surfaces candidates whose
              capabilities complement what your project lacks.
            </p>
            <div className="lp-cap-footer">
              <span>Mathematical Scoring</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="lp-cap-card">
            <div className="lp-cap-number">03</div>
            <h3 className="lp-cap-title">Structured Project Initiation</h3>
            <p className="lp-cap-text">
              When mutual interest is confirmed, the platform provisions dedicated project communication channels and
              shared repository links.
            </p>
            <div className="lp-cap-footer">
              <span>Direct Collaboration</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Competency Matrix Showcase */}
      <section className="lp-section-matrix" id="matrix">
        <div className="lp-matrix-layout">
          <div className="lp-matrix-info">
            <div className="lp-section-eyebrow">Competency Matrix</div>
            <h2 className="lp-section-title">Interdisciplinary Synergy Analysis</h2>
            <p className="lp-section-desc">
              Select an engineering specialization below to view how Mesh models team coverage and balances project roles.
            </p>

            <div className="lp-matrix-tags">
              {MATRIX_PAIRS.map((pair, idx) => (
                <button
                  key={pair.primary}
                  type="button"
                  className={`lp-matrix-tag-btn ${idx === selectedPairIndex ? 'active' : ''}`}
                  onClick={() => setSelectedPairIndex(idx)}
                >
                  {pair.primary}
                </button>
              ))}
            </div>

            <button type="button" className="lp-btn-primary" style={{ alignSelf: 'flex-start' }} onClick={onStart}>
              Get started
            </button>
          </div>

          <div className="lp-matrix-display">
            <div className="lp-display-header">
              <div className="lp-display-pair">
                <span>{activePair.primary}</span>
                <span className="lp-pair-plus">+</span>
                <span>{activePair.complement}</span>
              </div>
              <div className="lp-score-badge">{activePair.coverage}% Coverage</div>
            </div>

            <div className="lp-display-analysis">
              <div className="lp-analysis-label">Engineering Synergy Overview</div>
              <p className="lp-analysis-copy">{activePair.analysis}</p>
            </div>

            <div className="lp-metrics-stack">
              <div className="lp-metric-row">
                <span className="lp-metric-name">Gap Resolution</span>
                <div className="lp-metric-bar-track">
                  <div className="lp-metric-bar-fill emerald" style={{ width: `${activePair.coverage}%` }} />
                </div>
                <span className="lp-metric-val">{activePair.coverage}</span>
              </div>

              <div className="lp-metric-row">
                <span className="lp-metric-name">Proficiency Baseline</span>
                <div className="lp-metric-bar-track">
                  <div className="lp-metric-bar-fill indigo" style={{ width: `${activePair.depth}%` }} />
                </div>
                <span className="lp-metric-val">{activePair.depth}</span>
              </div>
            </div>

            <div className="lp-card-chips">
              {activePair.roles.map((role) => (
                <span className="lp-chip" key={role}>
                  <span className="lp-chip-dot" />
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Formal Algorithm Breakdown */}
      <section className="lp-section-algorithm" id="algorithm">
        <div className="lp-section-header">
          <div className="lp-section-eyebrow">Matching Algorithm</div>
          <h2 className="lp-section-title">Multi-Objective Compatibility Function</h2>
          <p className="lp-section-desc">
            Collaborator ranking is computed using a 4-dimensional scoring model to prevent redundant skill clusters.
          </p>
        </div>

        <div className="lp-algo-grid">
          <div className="lp-algo-card">
            <span className="lp-algo-weight">Weight: 40%</span>
            <h3>Complementary Gap Fill</h3>
            <p>
              Measures how effectively a candidate&apos;s verified competencies resolve critical technical deficiencies
              identified in your project scope.
            </p>
          </div>

          <div className="lp-algo-card">
            <span className="lp-algo-weight">Weight: 20%</span>
            <h3>Shared Technical Ground</h3>
            <p>
              Ensures sufficient overlapping vocabulary and fundamentals to enable effective peer code review and
              interface design.
            </p>
          </div>

          <div className="lp-algo-card">
            <span className="lp-algo-weight">Weight: 25%</span>
            <h3>Skill Proficiency Depth</h3>
            <p>
              Evaluates individual skill levels (1-5 scale) to ensure team members have sufficient depth to execute
              deliverables autonomously.
            </p>
          </div>

          <div className="lp-algo-card">
            <span className="lp-algo-weight">Weight: 15%</span>
            <h3>Domain Diversity</h3>
            <p>
              Incentivizes cross-departmental collaboration between engineering, design, and data science disciplines.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="lp-section-cta">
        <div className="lp-cta-card">
          <h2>Ready to form your project team?</h2>
          <p>
            Create your academic profile, specify your engineering proficiencies, and identify collaborators who
            complement your technical stack.
          </p>
          <div className="lp-cta-actions">
            <button type="button" className="lp-btn-primary lp-btn-lg" onClick={onStart}>
              Get started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button type="button" className="lp-btn-ghost lp-btn-lg" onClick={onSignIn}>
              Sign in to account
            </button>
          </div>
        </div>
      </section>

      {/* Formal Academic Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-brand-badge" style={{ width: 26, height: 26, fontSize: 13 }}>M</span>
          <span>Mesh · Academic Peer Collaboration System</span>
        </div>
        <div>
          <span>Full Stack Java &amp; Spring Boot Engineering Project</span>
        </div>
      </footer>
    </main>
  );
}
