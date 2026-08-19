import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from './api.js';
import Landing from './pages/Landing.jsx';
import TopPicksDeck from './components/TopPicksDeck.jsx';
import TeamBuilder from './components/TeamBuilder.jsx';
import LineSidebar from './components/reactbits/LineSidebar.jsx';
import {
  activity,
  conversations as demoConversations,
  currentUser as demoUser,
  feedItems as demoFeed,
  interestRequests as demoRequests,
  matches as demoMatches,
  recommendations as demoRecommendations,
  skillCatalog as demoSkillCatalog,
} from './data/demoData.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const ROUTES = [
  { id: 'discover', label: 'Discover', icon: 'spark' },
  { id: 'team', label: 'Build a team', icon: 'spark' },
  { id: 'matches', label: 'Connections', icon: 'message' },
  { id: 'feed', label: 'Help board', icon: 'board' },
  { id: 'profile', label: 'My profile', icon: 'user' },
];

const iconPaths = {
  spark: <><path d="m12 2 1.55 5.12L18 8.65l-4.45 1.53L12 15.3l-1.55-5.12L6 8.65l4.45-1.53L12 2Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.65 8.65 0 0 1-3.86-.94L4 19.5l1.35-3.65A7.24 7.24 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" /></>,
  board: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h6M7 16h8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  send: <><path d="m21 3-7.5 18-2.9-7.6L3 10.5 21 3Z" /><path d="m10.6 13.4 4.3-4.3" /></>,
  check: <path d="m5 12 4.2 4.2L19 6.5" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
};

function Icon({ name, size = 20, stroke = 1.8 }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

/**
 * Compact relative time for conversation lists. Falls back to a date once something is
 * more than a week old, because "9 days ago" is harder to place than "12 Aug".
 */
function formatWhen(value) {
  if (!value) return '';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '';
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'MC';
}

function Avatar({ person, size = 'md' }) {
  const accent = person?.accent || person?.avatarKey || 'ink';
  return <span className={`avatar avatar-${size} avatar-${accent}`} aria-label={person?.displayName || 'Profile avatar'}>{person?.initials || initials(person?.displayName)}</span>;
}

function SkillPill({ skill, compact = false }) {
  const label = typeof skill === 'string' ? skill : skill.name;
  const level = typeof skill === 'object' ? (skill.level ?? skill.proficiency) : null;
  return <span className={`skill-pill ${compact ? 'skill-pill-compact' : ''}`}>{label}{level ? <span className="skill-level" aria-label={`level ${level}`}>{level}</span> : null}</span>;
}

function Button({ children, variant = 'primary', icon, className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{icon ? <Icon name={icon} size={17} /> : null}<span>{children}</span></button>;
}

function Toast({ notice, onDismiss }) {
  if (!notice) return null;
  return <div className={`toast toast-${notice.type || 'info'}`} role="status"><Icon name={notice.type === 'error' ? 'info' : 'check'} size={18} /><span>{notice.message}</span><button className="icon-button" onClick={onDismiss} aria-label="Dismiss message"><Icon name="close" size={17} /></button></div>;
}

const toProfile = (profile) => ({
  id: profile.id,
  username: profile.username,
  displayName: profile.displayName,
  initials: initials(profile.displayName),
  course: [profile.department, profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : null].filter(Boolean).join(' · '),
  // Kept raw as well as formatted: the edit form writes these straight back, and
  // dropping them here meant saving any field blanked the ones that were missing.
  department: profile.department ?? '',
  yearOfStudy: profile.yearOfStudy ?? '',
  avatarKey: profile.avatarKey ?? null,
  headline: profile.bio || 'Building meaningful student projects.',
  bio: profile.bio || '',
  availability: profile.availability || 'Availability not set',
  accent: profile.avatarKey || 'ink',
  skills: (profile.skills || []).map((skill) => ({ ...skill, level: skill.proficiency })),
  onboardingComplete: profile.onboardingComplete,
});

const toRecommendation = (candidate) => ({
  id: candidate.userId,
  username: candidate.username,
  displayName: candidate.displayName,
  initials: initials(candidate.displayName),
  accent: candidate.avatarKey || 'ink',
  headline: candidate.bio || 'Open to a focused collaboration.',
  course: [candidate.department, candidate.yearOfStudy ? `Year ${candidate.yearOfStudy}` : null].filter(Boolean).join(' · '),
  availability: candidate.availability || 'Availability not set',
  score: candidate.score,
  reason: candidate.reason,
  skills: (candidate.skills || []).map((skill) => ({ ...skill, level: skill.proficiency })),
  sharedSkills: candidate.sharedSkills || [],
  complementarySkills: candidate.complementarySkills || [],
  breakdown: candidate.breakdown || null,
  bio: candidate.bio || '',
});

const toRequest = (interest) => ({
  id: interest.id,
  senderId: interest.senderId,
  senderName: interest.senderName,
  status: interest.status,
  note: 'Wants to collaborate',
  reason: '',
});

const toFeedItem = (post) => ({
  id: post.id,
  author: { ...post.author, initials: initials(post.author?.displayName), accent: post.author?.avatarKey || 'ink' },
  kind: post.kind,
  createdAt: post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Now',
  title: post.title,
  body: post.body,
  tags: post.tags || [],
  replies: post.commentCount ?? 0,
  helped: post.status === 'SOLVED',
  status: post.status,
});

function AuthPage({ mode, onModeChange, onDemo, onSubmit, busy, error }) {
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const signIn = mode === 'login';
  const submit = (event) => { event.preventDefault(); onSubmit(form); };
  return <main className="auth-page"><button className="auth-brand" onClick={() => onModeChange('landing')}><span className="wordmark-mark">M</span> Mesh</button><section className="auth-panel"><div className="auth-copy"><p className="section-label">{signIn ? 'Welcome back' : 'Start with your working profile'}</p><h1>{signIn ? 'Pick up where your next project left off.' : 'Find the skills that move your idea forward.'}</h1><p>{signIn ? 'Sign in to see your collaborators, conversations, and campus help board.' : 'Create an account, add what you can contribute, and see who could complete the team.'}</p></div><form className="auth-form" onSubmit={submit} noValidate>{!signIn ? <><label>Display name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Your name" required /></label><label>Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="e.g. sam.builds" required /></label></> : null}<label>College email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@college.edu" required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={signIn ? 'Your password' : 'At least 8 characters'} required minLength="8" /></label>{error ? <p className="form-error" role="alert"><Icon name="info" size={17} />{error}</p> : null}<Button type="submit" disabled={busy}>{busy ? 'Please wait...' : signIn ? 'Sign in' : 'Create account'} <Icon name="arrow" size={16} /></Button></form><div className="auth-divider"><span>or</span></div><button className="demo-button" onClick={onDemo}><span className="demo-dot" /> Explore the working demo</button><p className="auth-switch">{signIn ? 'New here?' : 'Already have an account?'} <button onClick={() => onModeChange(signIn ? 'register' : 'login')}>{signIn ? 'Create an account' : 'Sign in'}</button></p></section></main>;
}

function AppShell({ route, onRoute, user, onSignOut, apiActive, children }) {
  const current = ROUTES.find((item) => item.id === route);
  return <div className="app-shell"><div className="app-grid-bg" aria-hidden="true" /><aside className="sidebar"><a className="wordmark" href="#discover" onClick={() => onRoute('discover')}><span className="wordmark-mark">M</span><span>Mesh</span></a><nav aria-label="Primary navigation" className="sidebar-nav"><LineSidebar items={ROUTES.map((item) => item.label)} accentColor="#171719" textColor="#5e5e66" markerColor="#dcdce1" showIndex showMarker proximityRadius={100} maxShift={30} falloff="smooth" markerLength={60} markerGap={0} tickScale={0.5} scaleTick itemGap={20} fontSize={1.1} smoothing={100} defaultActive={Math.max(0, ROUTES.findIndex((item) => item.id === route))} onItemClick={(index) => onRoute(ROUTES[index].id)} /></nav><div className="sidebar-bottom"><div className="environment-note"><span className={`environment-dot ${apiActive ? 'environment-dot-live' : ''}`} />{apiActive ? 'Connected to API' : 'Demo workspace'}</div><button className="account-control" onClick={() => onRoute('profile')}><Avatar person={user} size="sm" /><span><strong>{user.displayName}</strong><small>@{user.username}</small></span><Icon name="chevron" size={16} /></button><button className="signout-control" onClick={onSignOut}><Icon name="logout" size={17} />Sign out</button></div></aside><div className="app-content"><header className="app-topbar"><div><p className="topbar-context">Mesh Connect</p><h1>{current?.label}</h1></div><div className="topbar-actions"><Avatar person={user} size="sm" /></div></header><main className="workspace">{children}</main></div><nav className="mobile-nav" aria-label="Mobile navigation">{ROUTES.map((item) => <button className={route === item.id ? 'mobile-nav-active' : ''} key={item.id} onClick={() => onRoute(item.id)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}</nav></div>;
}

function InterestInbox({ requests, onAccept, onDecline, busy }) {
  if (!requests.length) return null;
  return <section className="interest-inbox" aria-labelledby="interest-inbox-title">
    <div className="interest-inbox-head">
      <h3 id="interest-inbox-title">{requests.length === 1 ? '1 student wants to work with you' : `${requests.length} students want to work with you`}</h3>
      <p>Accepting opens a private conversation. Declining tells them nothing.</p>
    </div>
    <ul className="interest-request-list">{requests.map((request) => <li className="interest-request" key={request.id}>
      <Avatar person={{ displayName: request.senderName }} size="md" />
      <div className="interest-request-main">
        <strong>{request.senderName}</strong>
        <span>{request.note}</span>
      </div>
      <div className="interest-request-actions">
        <Button variant="secondary" disabled={busy} onClick={() => onDecline(request)}>Decline</Button>
        <Button variant="primary" disabled={busy} onClick={() => onAccept(request)}>Accept <Icon name="check" size={15} /></Button>
      </div>
    </li>)}</ul>
  </section>;
}

function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;
  const parts = [
    { label: 'Fills your gaps', value: breakdown.gapFill },
    { label: 'Shared ground', value: breakdown.sharedGround },
    { label: 'Depth of skill', value: breakdown.depth },
    { label: 'Different discipline', value: breakdown.categoryReach },
  ];
  return <div className="score-breakdown"><span>How this score was built</span><dl>{parts.map((part) => <div className="score-row" key={part.label}>
    <dt>{part.label}</dt>
    <dd><span className="score-track"><span className="score-fill" style={{ transform: `scaleX(${Math.max(0, Math.min(100, part.value)) / 100})` }} /></span><em>{Math.round(part.value)}</em></dd>
  </div>)}</dl></div>;
}

function CandidateSkeleton() {
  return <div className="candidate-skeletons" aria-hidden="true">{[0, 1, 2].map((row) => <div className="candidate-skeleton" key={row}>
    <span className="skeleton-avatar" />
    <span className="skeleton-lines"><span className="skeleton-line skeleton-line-name" /><span className="skeleton-line skeleton-line-meta" /><span className="skeleton-line skeleton-line-body" /></span>
  </div>)}</div>;
}

function DiscoverView({ user, recommendations, requests, loading, onInterest, onReject, onAccept, onDecline, onEditProfile, busy, selectedId, onSelect }) {
  const selected = recommendations.find((candidate) => candidate.id === selectedId) || recommendations[0];
  const profileStrength = user.skills?.length ? `${user.skills.length} skills mapped` : 'Add skills to improve matches';
  return <div className="discover-layout"><section className="discover-main"><div className="page-intro"><div><p className="section-label">A better starting point than a group chat</p><h2>People who make your next project more complete.</h2><p>Suggestions prioritize skills you are missing, then look for enough shared ground to work well together.</p></div><div className="intro-status"><span className="status-dot" /> {profileStrength}</div></div><InterestInbox requests={requests} onAccept={onAccept} onDecline={onDecline} busy={busy} />{!loading && recommendations.length ? <TopPicksDeck candidates={recommendations} topId={selectedId} onTopChange={onSelect} onInterest={onInterest} onReject={onReject} busy={busy} /> : null}{loading ? <><p className="sr-only" role="status">Loading your suggestions</p><CandidateSkeleton /></> : null}<div className="recommendation-list">{loading ? null : recommendations.length ? recommendations.map((candidate) => <article className={`candidate-row ${candidate.id === selected?.id ? 'candidate-row-selected' : ''}`} key={candidate.id} onClick={() => onSelect(candidate.id)}><Avatar person={candidate} size="lg" /><div className="candidate-main"><div className="candidate-heading"><div><h3>{candidate.displayName}</h3><p>{candidate.course || candidate.availability}</p></div><strong className="fit-score">{Math.round(candidate.score)}% <span>fit</span></strong></div><p className="candidate-headline">{candidate.headline}</p><div className="candidate-skills">{candidate.skills.slice(0, 4).map((skill) => <SkillPill key={skill.name} skill={skill} compact />)}</div></div>{/* Secondary on purpose. This is a shortcut repeated down the whole list; the
    considered decision lives on the focused profile, which keeps the single
    signal-coloured control on the screen. */}
<div className="candidate-action"><Button variant="secondary" disabled={busy || candidate.interested} onClick={(event) => { event.stopPropagation(); onInterest(candidate); }}>{candidate.interested ? 'Interest sent' : 'Connect'} {!candidate.interested ? <Icon name="arrow" size={15} /> : <Icon name="check" size={15} />}</Button></div></article>) : <EmptyState icon="spark" title="Your first suggestions will appear here" copy="Add at least three skills to your profile so Mesh can look for complementary teammates." action="Edit my profile" onAction={onEditProfile} />}</div></section><aside className="discover-aside">{selected ? <ProfilePreview candidate={selected} onInterest={() => onInterest(selected)} busy={busy} /> : null}</aside></div>;
}

function ProfilePreview({ candidate, onInterest, busy }) {
  return <section className="profile-preview"><div className="preview-header"><span>Selected profile</span></div><Avatar person={candidate} size="xl" /><h2>{candidate.displayName}</h2><p className="preview-role">{candidate.course || 'Campus collaborator'}</p><p className="preview-bio">{candidate.bio || candidate.headline}</p><div className="reason-block reason-block-compact"><Icon name="spark" size={19} /><div><strong>Why Mesh picked this</strong><p>{candidate.reason}</p></div></div><ScoreBreakdown breakdown={candidate.breakdown} /><div className="preview-section"><span>Strongest skills</span><div className="candidate-skills">{candidate.skills.map((skill) => <SkillPill key={skill.name} skill={skill} compact />)}</div></div><div className="preview-section"><span>Available</span><strong>{candidate.availability}</strong></div><Button variant={candidate.interested ? 'secondary' : 'signal'} className="wide-button" onClick={onInterest} disabled={busy || candidate.interested}>{candidate.interested ? 'Interest sent' : 'Send interest'} {candidate.interested ? <Icon name="check" size={16} /> : <Icon name="arrow" size={16} />}</Button></section>;
}

function MatchesView({ user, matches, conversations, onSend, onOpen, busy }) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id || null);
  const [text, setText] = useState('');
  useEffect(() => { if (!matches.some((item) => item.id === selectedId)) setSelectedId(matches[0]?.id || null); }, [matches, selectedId]);
  // Conversations are fetched on demand rather than all at once, so opening the
  // Connections tab costs one request instead of one per match.
  useEffect(() => { if (selectedId) onOpen(selectedId); }, [selectedId]);
  const selected = matches.find((item) => item.id === selectedId);
  const selectedMessages = conversations[selectedId] || [];
  const send = (event) => { event.preventDefault(); if (!text.trim() || !selected) return; onSend(selected.id, text.trim()); setText(''); };
  return <div className="messages-layout"><section className="thread-list"><div className="thread-list-heading"><div><p className="section-label">Mutual interest only</p><h2>Connections</h2></div><span>{matches.length === 1 ? '1 connection' : `${matches.length} connections`}</span></div>{matches.length ? matches.map((match) => <button className={`thread-row ${match.id === selectedId ? 'thread-row-selected' : ''}`} key={match.id} onClick={() => setSelectedId(match.id)}><Avatar person={match.profile || match.collaborator} /><span className="thread-copy"><strong>{(match.profile || match.collaborator).displayName}</strong><small>{match.lastMessage || (match.status === 'PENDING' ? 'Waiting for a response' : 'Start the conversation')}</small></span><span className="thread-meta"><small>{formatWhen(match.lastMessageAt)}</small>{match.unread ? <b>{match.unread}</b> : null}</span></button>) : <EmptyState icon="message" title="No connections yet" copy="When someone accepts your interest, the conversation will start here." />}</section>{selected ? <section className="conversation"><header className="conversation-header"><div className="conversation-person"><Avatar person={selected.profile || selected.collaborator} /><div><h2>{(selected.profile || selected.collaborator).displayName}</h2><p>{selected.project || 'A private collaboration connection'}</p></div></div></header><div className="fit-strip"><Icon name="spark" size={18} /><span>{selected.fit || 'You matched because your profiles have complementary skills.'}</span></div><div className="message-stream" aria-live="polite">{selectedMessages.length ? selectedMessages.map((message) => <div className={`message-bubble ${message.sender === 'me' || message.senderId === user.id ? 'message-own' : ''}`} key={message.id}><p>{message.content}</p><span>{message.time || (message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span></div>) : <div className="conversation-empty"><Icon name="message" size={28} /><p>Start with the project context, not a generic hello.</p></div>}</div><form className="message-composer" onSubmit={send}><label className="sr-only" htmlFor="message">Write a message</label><textarea id="message" value={text} onChange={(event) => setText(event.target.value)} placeholder={`Message ${(selected.profile || selected.collaborator).displayName.split(' ')[0]}...`} rows="1" maxLength="2000" /><Button type="submit" variant="signal" disabled={!text.trim() || busy} aria-label="Send message"><Icon name="send" size={18} /></Button></form><p className="conversation-note"><Icon name="info" size={15} /> Only matched students can read or send messages here.</p></section> : <section className="conversation conversation-no-selection"><EmptyState icon="message" title="Choose a connection" copy="Your project conversations stay organized here." /></section>}</div>;
}

function FeedView({ feed, comments, onCreatePost, onComment, onOpenPost, showActivity, busy }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [draft, setDraft] = useState({ kind: 'HELP', title: '', body: '', category: '', tags: '' });
  const [reply, setReply] = useState('');
  const submitPost = (event) => { event.preventDefault(); if (!draft.title.trim() || !draft.body.trim()) return; onCreatePost(draft); setDraft({ kind: 'HELP', title: '', body: '', category: '', tags: '' }); setComposerOpen(false); };
  const submitComment = (event) => { event.preventDefault(); if (!activePost || !reply.trim()) return; onComment(activePost, reply.trim()); setReply(''); };
  return <div className="feed-layout"><section className="feed-main"><div className="page-intro page-intro-feed"><div><p className="section-label">Ask early, unblock faster</p><h2>Campus help, with context.</h2><p>Share a real project question, then let people who know the work help you move it forward.</p></div><Button variant={composerOpen ? 'secondary' : 'primary'} onClick={() => setComposerOpen(!composerOpen)}>{composerOpen ? 'Close composer' : 'Write a post'} {!composerOpen ? <Icon name="plus" size={17} /> : <Icon name="close" size={17} />}</Button></div>{composerOpen ? <form className="post-composer" onSubmit={submitPost}><div className="composer-header"><strong>Start a useful conversation</strong><span>Posts with a clear project context get better replies.</span></div><div className="composer-fields"><label>Post type<select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}><option value="HELP">I need help</option><option value="PROJECT">Looking for a collaborator</option><option value="SHOWCASE">Share a project</option></select></label><label>Topic<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="e.g. Spring Boot" /></label></div><label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What would you like help with?" maxLength="160" required /></label><label>Details<textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="What have you tried, and where are you stuck?" rows="4" maxLength="4000" required /></label><div className="composer-footer"><label>Tags<input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Java, Database, UI" /></label><Button type="submit" variant="signal" disabled={busy}>Publish post <Icon name="arrow" size={16} /></Button></div></form> : null}<div className="feed-list">{!feed.length ? <EmptyState icon="board" title="No posts yet" copy="Ask a real project question, or share something you built. Posts with clear context get the best replies." action="Write a post" onAction={() => setComposerOpen(true)} /> : null}{feed.map((post) => <article className="feed-post" key={post.id}><header><Avatar person={post.author} /><div><strong>{post.author.displayName}</strong><span>@{post.author.username} · {post.createdAt}</span></div><span className={`post-kind post-kind-${post.kind.toLowerCase()}`}>{post.kind === 'HELP' ? 'Needs help' : post.kind === 'PROJECT' ? 'Project' : 'Showcase'}</span></header><h3>{post.title}</h3><p>{post.body}</p><div className="post-footer"><div className="candidate-skills">{post.tags.map((tag) => <SkillPill skill={tag} compact key={tag} />)}</div><button className="reply-button" onClick={() => { const next = activePost === post.id ? null : post.id; setActivePost(next); setReply(''); if (next) onOpenPost(next); }}><Icon name="message" size={17} />{post.replies} {post.replies === 1 ? 'reply' : 'replies'}{post.helped ? <span className="solved-label"><Icon name="check" size={14} />Solved</span> : null}</button></div>{activePost === post.id ? <div className="post-replies"><div className="reply-list">{(comments[post.id] || []).map((comment) => <div className="reply" key={comment.id}><Avatar person={comment.author} size="sm" /><div><strong>{comment.author.displayName}</strong><p>{comment.body}</p></div></div>)}{!(comments[post.id] || []).length ? <p className="quiet-copy">Be the first person to add a useful answer.</p> : null}</div><form className="reply-form" onSubmit={submitComment}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a helpful reply..." maxLength="2000" /><Button type="submit" variant="primary" disabled={!reply.trim() || busy}><Icon name="send" size={16} /></Button></form></div> : null}</article>)}</div></section><aside className="feed-aside"><section className="side-note"><p className="section-label">Good help is specific</p><h3>Give people enough context to be useful.</h3><ul><li>Say what you are building.</li><li>Share what you already tried.</li><li>Ask for one clear next step.</li></ul></section>{showActivity ? <section className="side-note"><p className="section-label">Your recent activity</p><ul className="activity-list">{activity.map((item) => <li key={item.label}><span>{item.label}</span><small>{item.when}</small></li>)}</ul></section> : null}</aside></div>;
}

function ProfileView({ user, skillCatalog, onSave, onSaveSkills, busy }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({ displayName: user.displayName || '', department: user.department || '', yearOfStudy: user.yearOfStudy || '', bio: user.bio || user.about || '', availability: user.availability || '' }));
  const [skills, setSkills] = useState(() => user.skills || []);
  useEffect(() => { setForm({ displayName: user.displayName || '', department: user.department || '', yearOfStudy: user.yearOfStudy || '', bio: user.bio || user.about || '', availability: user.availability || '' }); setSkills(user.skills || []); }, [user]);
  const addSkill = (event) => { const id = Number(event.target.value); const candidate = skillCatalog.find((skill) => Number(skill.id) === id); if (candidate && !skills.some((skill) => Number(skill.id) === id)) setSkills([...skills, { ...candidate, proficiency: 3, level: 3 }]); event.target.value = ''; };
  const save = (event) => { event.preventDefault(); onSave({ ...form, yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : null, onboardingComplete: true }); setEditing(false); };
  return <div className="profile-layout"><section className="profile-main"><header className="profile-heading"><Avatar person={user} size="xl" /><div><p className="section-label">Your working profile</p><h2>{user.displayName}</h2><p>{user.course || [user.department, user.yearOfStudy ? `Year ${user.yearOfStudy}` : null].filter(Boolean).join(' · ') || 'Add your course details'}</p></div><Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'} <Icon name={editing ? 'close' : 'edit'} size={16} /></Button></header>{editing ? <form className="profile-form" onSubmit={save}><div className="form-two-column"><label>Display name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required /></label><label>Department<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="e.g. Computer Science" /></label><label>Year of study<select value={form.yearOfStudy} onChange={(event) => setForm({ ...form, yearOfStudy: event.target.value })}><option value="">Not set</option>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}</select></label><label>Availability<input value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })} placeholder="e.g. 6-8 hrs/week" /></label></div><label>What do you enjoy building?<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows="4" maxLength="500" /></label><div className="form-actions"><Button type="submit" disabled={busy}>Save profile <Icon name="check" size={16} /></Button></div></form> : <div className="profile-story"><p>{user.bio || user.about || 'Add a short profile note to help the right people understand what you enjoy building.'}</p><div><span>Available</span><strong>{user.availability || 'Not set'}</strong></div></div>}<section className="skills-section"><div className="section-heading"><div><p className="section-label">What you bring</p><h3>Skills and confidence</h3></div><span>{skills.length} listed</span></div><div className="skill-editor">{skills.map((skill) => <div className="editable-skill" key={skill.id || skill.name}><SkillPill skill={skill} /><select value={skill.proficiency ?? skill.level} onChange={(event) => setSkills(skills.map((item) => item.id === skill.id ? { ...item, proficiency: Number(event.target.value), level: Number(event.target.value) } : item))} aria-label={`Set ${skill.name} level`}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Level {level}</option>)}</select><button className="remove-skill" onClick={() => setSkills(skills.filter((item) => item.id !== skill.id))} aria-label={`Remove ${skill.name}`}><Icon name="close" size={16} /></button></div>)}<label className="add-skill">Add a skill<select defaultValue="" onChange={addSkill}><option value="" disabled>Select from catalog</option>{skillCatalog.filter((skill) => !skills.some((item) => Number(item.id) === Number(skill.id))).map((skill) => <option value={skill.id} key={skill.id}>{skill.name} · {skill.category}</option>)}</select></label></div><div className="form-actions"><Button variant="primary" onClick={() => onSaveSkills(skills)} disabled={!skills.length || busy}>Save skills <Icon name="check" size={16} /></Button></div></section></section><aside className="profile-aside"><section className="profile-health"><p className="section-label">Profile health</p><h3>{skills.length >= 3 && user.bio ? 'Ready for matching' : 'One small step left'}</h3><p>{skills.length >= 3 && user.bio ? 'Your profile gives other students enough context to make a thoughtful decision.' : 'Add at least three skills and a short bio to receive useful recommendations.'}</p><div className="health-progress"><span style={{ transform: `scaleX(${Math.min(100, (skills.length >= 3 ? 50 : skills.length * 16) + (user.bio ? 30 : 0) + (user.availability ? 20 : 0)) / 100})` }} /></div></section><section className="profile-health"><p className="section-label">Privacy</p><p>Only the profile details shown here are used for matching. Your email is never shown to other students.</p></section></aside></div>;
}

function EmptyState({ icon, title, copy, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={25} /></span><h3>{title}</h3><p>{copy}</p>{action ? <Button variant="secondary" onClick={onAction}>{action}</Button> : null}</div>;
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('mesh-auth') || 'null'); } catch { return null; }
  });
  const [route, setRoute] = useState(() => auth ? 'discover' : 'landing');
  const [user, setUser] = useState(clone(demoUser));
  const [recommendations, setRecommendations] = useState(clone(demoRecommendations));
  const [matches, setMatches] = useState(clone(demoMatches));
  const [requests, setRequests] = useState(clone(demoRequests));
  const [conversations, setConversations] = useState(clone(demoConversations));
  const [feed, setFeed] = useState(clone(demoFeed));
  const [comments, setComments] = useState({});
  const [skills, setSkills] = useState(demoSkillCatalog.map((name, index) => ({ id: index + 1, name, category: 'Skill' })));
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const toastTimer = useRef(null);
  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);
  const [authError, setAuthError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(demoRecommendations[0]?.id);

  const demoMode = !auth || auth.demo || !api.enabled;
  const toast = (message, type = 'success') => {
    setNotice({ message, type });
    // Held so a second toast cancels the first one's timer; otherwise the earlier
    // timeout fires mid-way through the newer message and cuts it short.
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setNotice(null), 4200);
  };
  const navigate = (next) => { setRoute(next); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const hydrate = async (token) => {
    // Clear the offline sample data first. Without this the real workspace renders
    // over demo profiles for as long as the request takes, which briefly shows the
    // student people who do not exist.
    setHydrating(true);
    setRecommendations([]); setMatches([]); setRequests([]); setFeed([]);
    setConversations({}); setComments({});
    try {
      await loadWorkspace(token);
    } finally {
      setHydrating(false);
    }
  };

  const loadWorkspace = async (token) => {
    const [profile, recommendationRows, matchRows, requestRows, postPage, catalog] = await Promise.all([
      api.profile(token), api.recommendations(token), api.matches(token),
      api.incomingInterests(token), api.posts(token), api.skills(token),
    ]);
    setUser(toProfile(profile));
    const normalizedRecommendations = recommendationRows.map(toRecommendation);
    setRecommendations(normalizedRecommendations);
    setSelectedCandidate(normalizedRecommendations[0]?.id);
    setMatches(matchRows.map((match) => ({ ...match, profile: toProfile(match.collaborator), lastMessageAt: match.lastMessageAt })));
    setRequests(requestRows.map(toRequest));
    setFeed(postPage.items.map(toFeedItem));
    setSkills(catalog);
  };

  useEffect(() => {
    if (auth && !auth.demo && api.enabled) {
      hydrate(auth.token).catch((error) => toast(error.message || 'Could not refresh the workspace.', 'error'));
    }
  }, []);

  const authenticate = async (form, mode) => {
    setBusy(true); setAuthError('');
    try {
      if (!api.enabled) { useDemo(); return; }
      const response = mode === 'login' ? await api.login({ email: form.email, password: form.password }) : await api.register(form);
      const nextAuth = { token: response.token, demo: false };
      sessionStorage.setItem('mesh-auth', JSON.stringify(nextAuth));
      setAuth(nextAuth); setUser(toProfile(response.user)); setRoute('discover');
      await hydrate(response.token);
      toast(mode === 'login' ? 'Welcome back.' : 'Your profile is ready to complete.');
    } catch (error) {
      setAuthError(error instanceof ApiError ? error.message : 'Could not sign you in. Please try again.');
    } finally { setBusy(false); }
  };

  const useDemo = () => {
    const nextAuth = { demo: true, token: 'demo' };
    sessionStorage.setItem('mesh-auth', JSON.stringify(nextAuth));
    setAuth(nextAuth); setRoute('discover'); setAuthError(''); toast('You are exploring the working demo.', 'info');
  };

  const signOut = () => {
    sessionStorage.removeItem('mesh-auth');
    setAuth(null);
    // Every slice, not just auth: conversations and comments are keyed by database id,
    // so leaving them behind showed the previous account's messages to the next one.
    setUser(clone(demoUser));
    setRecommendations(clone(demoRecommendations));
    setMatches(clone(demoMatches));
    setRequests(clone(demoRequests));
    setFeed(clone(demoFeed));
    setConversations({});
    setComments({});
    setSelectedCandidate(demoRecommendations[0]?.id);
    setRoute('landing');
    toast('You have signed out.', 'info');
  };

  const sendInterest = async (candidate) => {
    setBusy(true);
    try {
      let result = null;
      if (!demoMode) result = await api.sendInterest(candidate.id, auth.token);
      // The API stops recommending anyone you have already sent interest to, so drop
      // them here too rather than leaving a stale card that the next refresh removes.
      // It also means the deck advances to the next person instead of snapping back.
      dropFromDeck(candidate.id);
      // The API returns a matchId when the other student had already sent interest,
      // which means this request completed the handshake rather than starting one.
      if (result?.matchId) {
        toast(`You matched with ${candidate.displayName}. The conversation is open.`);
        await refreshConnections();
      } else {
        toast(`Interest sent to ${candidate.displayName}.`);
      }
    } catch (error) { toast(error.message || 'Could not send interest.', 'error'); } finally { setBusy(false); }
  };

  /** Removes someone from the deck and keeps the selection on a card that still exists. */
  const dropFromDeck = (candidateId) => {
    setRecommendations((items) => {
      const next = items.filter((item) => item.id !== candidateId);
      setSelectedCandidate((current) => (current === candidateId ? next[0]?.id : current));
      return next;
    });
  };

  const rejectCandidate = (candidate) => {
    dropFromDeck(candidate.id);
    toast(`${candidate.displayName} will not be suggested again in this session.`, 'info');
  };

  const refreshConnections = async () => {
    if (demoMode) return;
    const [matchRows, requestRows, recommendationRows] = await Promise.all([
      api.matches(auth.token), api.incomingInterests(auth.token), api.recommendations(auth.token),
    ]);
    setMatches(matchRows.map((match) => ({ ...match, profile: toProfile(match.collaborator), lastMessageAt: match.lastMessageAt })));
    setRequests(requestRows.map(toRequest));
    setRecommendations(recommendationRows.map(toRecommendation));
  };

  const acceptRequest = async (request) => {
    setBusy(true);
    try {
      if (demoMode) setRequests((items) => items.filter((item) => item.id !== request.id));
      else { await api.acceptInterest(request.id, auth.token); await refreshConnections(); }
      toast(`You matched with ${request.senderName}. The conversation is open.`);
      navigate('matches');
    } catch (error) { toast(error.message || 'Could not accept the request.', 'error'); } finally { setBusy(false); }
  };

  const declineRequest = async (request) => {
    setBusy(true);
    try {
      if (demoMode) setRequests((items) => items.filter((item) => item.id !== request.id));
      else { await api.declineInterest(request.id, auth.token); await refreshConnections(); }
      toast('Request declined.', 'info');
    } catch (error) { toast(error.message || 'Could not decline the request.', 'error'); } finally { setBusy(false); }
  };

  const openPost = async (postId) => {
    if (demoMode || !postId || comments[postId]) return;
    try {
      const rows = await api.comments(postId, auth.token);
      setComments((current) => ({ ...current, [postId]: rows }));
    } catch (error) {
      toast(error.message || 'Could not load the replies.', 'error');
    }
  };

  const openConversation = async (matchId) => {
    if (demoMode || !matchId) return;
    // Already loaded, so do not refetch on every re-render of the list.
    if (conversations[matchId]) return;
    try {
      const response = await api.messages(matchId, auth.token);
      setConversations((current) => ({ ...current, [matchId]: response.messages || [] }));
    } catch (error) {
      toast(error.message || 'Could not load the conversation.', 'error');
    }
  };

  const sendMessage = async (matchId, content) => {
    setBusy(true);
    try {
      let message;
      if (demoMode) message = { id: `demo-${Date.now()}`, sender: 'me', content, time: 'Now' };
      else { const saved = await api.sendMessage(matchId, content, auth.token); message = { ...saved, senderId: saved.senderId }; }
      setConversations((items) => ({ ...items, [matchId]: [...(items[matchId] || []), message] }));
      setMatches((items) => items.map((item) => item.id === matchId ? { ...item, lastMessage: content, lastMessageAt: new Date().toISOString() } : item));
    } catch (error) { toast(error.message || 'Could not send message.', 'error'); } finally { setBusy(false); }
  };

  const createPost = async (draft) => {
    setBusy(true);
    try {
      if (demoMode) {
        const newPost = { id: `feed-${Date.now()}`, author: { displayName: user.displayName, username: user.username, initials: user.initials, accent: user.accent }, kind: draft.kind, createdAt: 'Now', title: draft.title, body: draft.body, tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean), replies: 0, helped: false };
        setFeed((items) => [newPost, ...items]);
      } else {
        const saved = await api.createPost(draft, auth.token);
        setFeed((items) => [toFeedItem(saved), ...items]);
      }
      toast('Your post is live on the help board.');
    } catch (error) { toast(error.message || 'Could not publish the post.', 'error'); } finally { setBusy(false); }
  };

  const addComment = async (postId, body) => {
    setBusy(true);
    try {
      if (demoMode) {
        const nextComment = { id: `comment-${Date.now()}`, author: { displayName: user.displayName, initials: user.initials, accent: user.accent }, body };
        setComments((items) => ({ ...items, [postId]: [...(items[postId] || []), nextComment] }));
      } else {
        const saved = await api.comment(postId, body, auth.token);
        setComments((items) => ({ ...items, [postId]: [...(items[postId] || []), saved] }));
      }
      setFeed((items) => items.map((item) => item.id === postId ? { ...item, replies: item.replies + 1 } : item));
    } catch (error) { toast(error.message || 'Could not add the reply.', 'error'); } finally { setBusy(false); }
  };

  const saveProfile = async (draft) => {
    setBusy(true);
    try {
      if (demoMode) setUser((current) => ({ ...current, ...draft, course: [draft.department, draft.yearOfStudy ? `Year ${draft.yearOfStudy}` : null].filter(Boolean).join(' · ') }));
      // avatarKey is not on the edit form, but the endpoint replaces the whole profile,
      // so omitting it would clear the user's avatar colour on every save.
      else setUser(toProfile(await api.updateProfile({ ...draft, avatarKey: user.avatarKey }, auth.token)));
      toast('Profile updated.');
    } catch (error) { toast(error.message || 'Could not save profile.', 'error'); } finally { setBusy(false); }
  };

  const saveSkills = async (selectedSkills) => {
    setBusy(true);
    try {
      if (demoMode) setUser((current) => ({ ...current, skills: selectedSkills }));
      else setUser(toProfile(await api.updateSkills({ skills: selectedSkills.map((skill) => ({ skillId: skill.id, proficiency: skill.proficiency ?? skill.level })) }, auth.token)));
      toast('Skills updated. Recommendations will reflect the change.');
    } catch (error) { toast(error.message || 'Could not save skills.', 'error'); } finally { setBusy(false); }
  };

  if (!auth) {
    if (route === 'login' || route === 'register') return <><AuthPage mode={route} onModeChange={navigate} onDemo={useDemo} onSubmit={(form) => authenticate(form, route)} busy={busy} error={authError} /><Toast notice={notice} onDismiss={() => setNotice(null)} /></>;
    return <Landing onStart={() => navigate('register')} onSignIn={() => navigate('login')} />;
  }

  const content = route === 'discover'
    ? <DiscoverView user={user} recommendations={recommendations} requests={requests} loading={hydrating} onInterest={sendInterest} onReject={rejectCandidate} onAccept={acceptRequest} onDecline={declineRequest} onEditProfile={() => navigate('profile')} busy={busy} selectedId={selectedCandidate} onSelect={setSelectedCandidate} />
    : route === 'team'
      ? <TeamBuilder skills={skills} mySkills={user.skills} onSuggest={(body) => api.suggestTeam(body, auth.token)} busy={busy} />
    : route === 'matches'
      ? <MatchesView user={user} matches={matches} conversations={conversations} onSend={sendMessage} onOpen={openConversation} busy={busy} />
      : route === 'feed'
        ? <FeedView feed={feed} comments={comments} onCreatePost={createPost} onComment={addComment} onOpenPost={openPost} showActivity={demoMode} busy={busy} />
        : <ProfileView user={user} skillCatalog={skills} onSave={saveProfile} onSaveSkills={saveSkills} busy={busy} />;

  return <><AppShell route={route} onRoute={navigate} user={user} onSignOut={signOut} apiActive={!demoMode}>{content}</AppShell><Toast notice={notice} onDismiss={() => setNotice(null)} /></>;
}
