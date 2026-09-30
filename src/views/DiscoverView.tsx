import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, ChevronRight, Search, ShieldCheck, Sparkles, UserRoundPlus, X } from 'lucide-react';
import { Avatar, Button, Card, Chip, Github, TextField } from '../components/m3';
import { CandidateRecommendation, Profile } from '../types/api';
import './DiscoverView.css';

interface DiscoverViewProps {
  currentUser: Profile;
  recommendations: CandidateRecommendation[];
  onConnect: (candidate: CandidateRecommendation) => Promise<void>;
  onPass: (candidateId: string) => Promise<void>;
  onSave: (candidateId: string) => Promise<void>;
  onEditProfile: () => void;
  onToast: (msg: string) => void;
  busy?: boolean;
}

const scoreParts = (candidate: CandidateRecommendation) => [
  { label: 'Project direction', value: candidate.breakdown.categoryReach },
  { label: 'Skills you need', value: candidate.breakdown.gapFill },
  { label: 'Evidence support', value: candidate.breakdown.depth },
  { label: 'Shared interests', value: candidate.breakdown.sharedGround },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({ currentUser, recommendations, onConnect, onPass, onSave, onEditProfile, onToast, busy = false }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => recommendations[0]?.userId ?? null);
  const [filter, setFilter] = useState<'for-you' | 'saved'>('for-you');
  const [query, setQuery] = useState('');

  const candidates = useMemo(() => recommendations.filter((candidate) => {
    if (candidate.status === 'passed') return false;
    if (filter === 'saved' && !candidate.savedForLater) return false;
    const text = `${candidate.displayName} ${candidate.primaryDomain ?? ''} ${candidate.skills.map((skill) => skill.name).join(' ')}`.toLowerCase();
    return !query.trim() || text.includes(query.trim().toLowerCase());
  }), [filter, query, recommendations]);

  useEffect(() => {
    if (!candidates.some((candidate) => candidate.userId === selectedId)) setSelectedId(candidates[0]?.userId ?? null);
  }, [candidates, selectedId]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo('.discover-enter', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.07, ease: 'power2.out', clearProps: 'transform' });
    }, rootRef);
    return () => context.revert();
  }, [filter]);

  const selectedIndex = Math.max(0, candidates.findIndex((candidate) => candidate.userId === selectedId));
  const selected = candidates[selectedIndex] ?? null;
  const next = (offset: number) => {
    if (!candidates.length) return;
    setSelectedId(candidates[(selectedIndex + offset + candidates.length) % candidates.length].userId);
  };
  const skillsToShow = selected?.complementarySkills.length ? selected.complementarySkills : selected?.skills.map((skill) => skill.name) ?? [];
  const connect = async () => { if (selected) await onConnect(selected); };
  const pass = async () => { if (!selected) return; await onPass(selected.userId); onToast(`${selected.displayName} has been skipped for now.`); };
  const save = async () => { if (selected) await onSave(selected.userId); };

  return <div ref={rootRef} className="discover-page">
    <header className="discover-enter discover-heading">
      <div><p className="discover-eyebrow">DISCOVER</p><h1>Your next collaborator is already in the room.</h1></div>
      <div className="discover-profile-signal"><ShieldCheck size={18} /><span><strong>{currentUser.skills.length} skills mapped</strong> to your profile</span><Button variant="text" size="sm" onClick={onEditProfile}>Edit profile</Button></div>
    </header>

    <div className="discover-enter discover-controls">
      <div className="discover-filter-group" role="tablist" aria-label="Recommendation views"><Chip selected={filter === 'for-you'} onClick={() => setFilter('for-you')}>For you</Chip><Chip selected={filter === 'saved'} onClick={() => setFilter('saved')} icon={<Bookmark size={14} />}>Shortlist</Chip></div>
      <TextField label="Find a collaborator" placeholder="Search by name or skill" value={query} onChange={(event) => setQuery(event.target.value)} leadingIcon={<Search size={17} />} />
    </div>

    {!selected ? <Card variant="outlined" className="discover-empty discover-enter"><Sparkles size={28} /><h2>{filter === 'saved' ? 'Your shortlist is open.' : 'Your discovery queue is clear.'}</h2><p>{filter === 'saved' ? 'Save people from your recommendations to come back to them here.' : 'Add a few skills and project goals to improve your next set of suggestions.'}</p><Button variant="filled" onClick={filter === 'saved' ? () => setFilter('for-you') : onEditProfile}>{filter === 'saved' ? 'Browse suggestions' : 'Build my profile'}</Button></Card> : <section className="discover-stage discover-enter" aria-label="Recommended collaborator">
      <div className="discover-deck-column">
        <div className="discover-deck" aria-live="polite">
          {[2, 1].map((offset) => { const card = candidates[(selectedIndex + offset) % candidates.length]; return !card || candidates.length <= offset ? null : <div key={card.userId} className={`discover-deck-shadow deck-shadow-${offset}`} />; })}
          <article className="discover-active-card">
            <div className="discover-card-banner"><span>Recommended for you</span><strong>{Math.round(selected.score)}% fit</strong></div>
            <div className="discover-person-row"><Avatar name={selected.displayName} tone={selected.avatarKey} size="xl" online /><div><h2>{selected.displayName}</h2><p>@{selected.username} · {selected.department || 'Student collaborator'}</p><span>{selected.yearOfStudy ? `Year ${selected.yearOfStudy}` : 'Campus network'} · {selected.primaryDomain || 'Open to collaborate'}</span></div></div>
            <p className="discover-reason">{selected.reason}</p>
            <div className="discover-skill-list">{skillsToShow.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div>
            <div className="discover-card-actions"><Button variant="text" size="sm" icon={<X size={16} />} disabled={busy} onClick={pass}>Pass</Button><Button variant="tonal" size="sm" icon={selected.savedForLater ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} disabled={busy} onClick={save}>{selected.savedForLater ? 'Saved' : 'Save'}</Button><Button variant={selected.status === 'interested' ? 'tonal' : 'filled'} size="sm" icon={selected.status === 'interested' ? <Check size={16} /> : <UserRoundPlus size={16} />} disabled={busy || selected.status === 'interested'} onClick={connect}>{selected.status === 'interested' ? 'Request sent' : 'Connect'}</Button></div>
          </article>
        </div>
        <div className="discover-deck-navigation"><Button variant="text" size="sm" icon={<ArrowLeft size={17} />} onClick={() => next(-1)}>Previous</Button><div className="discover-progress" aria-label={`Recommendation ${selectedIndex + 1} of ${candidates.length}`}>{candidates.slice(0, 6).map((candidate) => <button key={candidate.userId} type="button" className={candidate.userId === selected.userId ? 'active' : ''} aria-label={`View ${candidate.displayName}`} onClick={() => setSelectedId(candidate.userId)} />)}</div><Button variant="text" size="sm" trailingIcon={<ArrowRight size={17} />} onClick={() => next(1)}>Next</Button></div>
      </div>

      <aside className="discover-dossier"><div className="discover-dossier-label"><Sparkles size={16} /> Why this is a fit</div><h3>{selected.displayName} fills a useful gap in your team.</h3><p>{selected.bio || 'This student has made a collaboration profile and is open to working with compatible peers.'}</p><div className="discover-score-list">{scoreParts(selected).map((part) => <div key={part.label}><div><span>{part.label}</span><strong>{Math.round(part.value)}%</strong></div><span className="discover-score-track"><i style={{ width: `${Math.max(0, Math.min(100, part.value))}%` }} /></span></div>)}</div><div className="discover-evidence"><Github size={17} /><div><strong>Evidence-aware matching</strong></div></div></aside>
    </section>}

    {candidates.length > 1 && <section className="discover-enter discover-rail" aria-labelledby="discover-rail-title"><div className="discover-rail-heading"><h2 id="discover-rail-title">Keep exploring</h2><span>{candidates.length} relevant people</span></div><div className="discover-rail-list">{candidates.slice(0, 6).map((candidate) => <button type="button" key={candidate.userId} className={candidate.userId === selected?.userId ? 'selected' : ''} onClick={() => setSelectedId(candidate.userId)}><Avatar name={candidate.displayName} tone={candidate.avatarKey} size="sm" /><span><strong>{candidate.displayName}</strong><small>{candidate.primaryDomain || 'Collaborator'}</small></span><ChevronRight size={16} /></button>)}</div></section>}
  </div>;
};
