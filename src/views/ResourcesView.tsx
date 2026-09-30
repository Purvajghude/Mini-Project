import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Bookmark, Check, CheckCircle2, ChevronDown, ExternalLink, FileText, Maximize2, Minus, Plus, RotateCcw, Search, Users } from 'lucide-react';
import { CandidateRecommendation, Profile, Project } from '../types/api';
import { ResourceItem, ResourceProgressStatus, SavedResource } from '../types/resources';
import { ROADMAP_DIRECTORY, RoadmapKind } from '../data/roadmapDirectory';
import './ResourcesView.css';

interface ResourcesViewProps {
  initialSection?: Section;
  currentUser: Profile;
  resources: ResourceItem[];
  savedResources: SavedResource[];
  recommendations: CandidateRecommendation[];
  projects: Project[];
  onSaveResource: (resourceId: string, status?: ResourceProgressStatus) => Promise<void>;
  onRemoveSavedResource: (resourceId: string) => Promise<void>;
  onUpdateResourceProgress: (resourceId: string, status: ResourceProgressStatus) => Promise<void>;
  onConnectWithPeer?: (candidate: CandidateRecommendation) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToDiscover?: (query?: string) => void;
  onToast: (msg: string) => void;
  busy?: boolean;
}

type TopicState = 'not_started' | 'learning' | 'done';
type Section = 'roadmaps' | 'build' | 'saved';
type MapView = 'diagram' | 'pdf';

interface RoadmapStage {
  id: string;
  title: string;
  description: string;
  position: number;
  topics: string[];
}

// The topic index follows the supplied Frontend roadmap PDF. The PDF remains
// the complete visual source; the index gives MESH its own progress controls.
const FRONTEND_STAGES: RoadmapStage[] = [
  { id: 'internet', title: 'Internet', description: 'How browsers find and deliver the pages you build.', position: 0.095, topics: ['How the internet works', 'HTTP', 'Domain names', 'Hosting', 'DNS', 'Browsers'] },
  { id: 'html', title: 'HTML', description: 'Structure, meaning, forms, and accessibility.', position: 0.155, topics: ['HTML basics', 'Semantic HTML', 'Forms and validation', 'Accessibility', 'SEO basics'] },
  { id: 'css', title: 'CSS', description: 'Layout and responsive presentation.', position: 0.215, topics: ['CSS basics', 'Layouts', 'Responsive design'] },
  { id: 'javascript', title: 'JavaScript', description: 'The behavior behind interactive pages.', position: 0.275, topics: ['JavaScript basics', 'DOM manipulation', 'Fetch API and Ajax'] },
  { id: 'version-control', title: 'Version control', description: 'Work safely with code and collaborators.', position: 0.34, topics: ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Package managers'] },
  { id: 'frameworks', title: 'Frameworks', description: 'Choose one framework and learn its foundations well.', position: 0.425, topics: ['React', 'Vue', 'Angular', 'Svelte', 'Solid JS', 'Qwik'] },
  { id: 'build-tools', title: 'Build tools', description: 'The tools that package, check, and ship your work.', position: 0.51, topics: ['CSS architecture', 'CSS preprocessors', 'Vite', 'Module bundlers', 'Linters and formatters'] },
  { id: 'testing', title: 'Testing and security', description: 'Make a reliable application, then protect it.', position: 0.59, topics: ['Vitest or Jest', 'Playwright or Cypress', 'Web security basics', 'Authentication strategies'] },
  { id: 'advanced', title: 'Advanced frontend', description: 'Types, rendering strategies, and browser capabilities.', position: 0.69, topics: ['TypeScript', 'Web components', 'Server-side rendering', 'GraphQL', 'Static site generators'] },
  { id: 'platforms', title: 'Performance and platforms', description: 'Measure real performance and expand beyond the browser.', position: 0.82, topics: ['PWAs', 'Browser APIs', 'Performance measurement', 'Mobile apps', 'Desktop apps'] },
];

const PDF_URL = '/roadmaps/frontend.pdf';
const IMAGE_URL = '/roadmaps/frontend.png';

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  initialSection = 'roadmaps',
  currentUser, resources, savedResources, recommendations, projects,
  onSaveResource, onRemoveSavedResource, onUpdateResourceProgress,
  onConnectWithPeer, onNavigateToProject, onNavigateToDiscover, onToast, busy = false,
}) => {
  const [section, setSection] = useState<Section>(initialSection);
  const [mapView, setMapView] = useState<MapView>('diagram');
  const [selectedStageId, setSelectedStageId] = useState(FRONTEND_STAGES[0].id);
  const [selectedTopic, setSelectedTopic] = useState(FRONTEND_STAGES[0].topics[0]);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState('');
  const [directoryKind, setDirectoryKind] = useState<'all' | RoadmapKind>('all');
  const [topicStates, setTopicStates] = useState<Record<string, TopicState>>({});
  const mapViewport = useRef<HTMLDivElement>(null);
  const mapImage = useRef<HTMLImageElement>(null);

  useEffect(() => { setSection(initialSection); setQuery(''); }, [initialSection]);

  const storageKey = `mesh-roadmap-frontend-${currentUser.id}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setTopicStates(saved ? JSON.parse(saved) : {});
    } catch {
      setTopicStates({});
    }
  }, [storageKey]);

  useEffect(() => {
    if (mapView !== 'diagram') return;
    const frame = requestAnimationFrame(() => {
      if (!mapViewport.current || !mapImage.current) return;
      mapViewport.current.scrollLeft = Math.max(0, (mapImage.current.clientWidth - mapViewport.current.clientWidth) / 2);
    });
    return () => cancelAnimationFrame(frame);
  }, [mapView, zoom, section, query]);

  const setTopicState = (stageId: string, topic: string, next: TopicState) => {
    const key = `${stageId}:${topic}`;
    const updated = { ...topicStates, [key]: next };
    setTopicStates(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { onToast('Progress could not be saved on this device.'); }
  };

  const selectedStage = FRONTEND_STAGES.find((stage) => stage.id === selectedStageId) || FRONTEND_STAGES[0];
  const allTopics = FRONTEND_STAGES.flatMap((stage) => stage.topics.map((topic) => `${stage.id}:${topic}`));
  const doneCount = allTopics.filter((key) => topicStates[key] === 'done').length;
  const learningCount = allTopics.filter((key) => topicStates[key] === 'learning').length;
  const percent = Math.round((doneCount / allTopics.length) * 100);
  const frontend = resources.find((item) => item.id === 'rm-frontend');
  const savedMap = useMemo(() => new Map(savedResources.map((item) => [item.resourceId, item])), [savedResources]);
  const directoryResources = useMemo(() => ROADMAP_DIRECTORY.map((entry): ResourceItem => resources.find((item) => item.url === entry.url) || {
    id: entry.id,
    title: entry.title,
    type: 'Roadmap',
    category: entry.kind === 'role' ? 'Role Paths' : entry.kind === 'practice' ? 'Best Practices' : 'Skills',
    description: `Explore the ${entry.title} diagram on roadmap.sh.`,
    url: entry.url,
    source: 'roadmap.sh',
    technologies: [],
    skills: [],
  }), [resources]);
  const allResources = useMemo(() => [...resources, ...directoryResources.filter((entry) => !resources.some((item) => item.id === entry.id))], [resources, directoryResources]);
  const directoryEntries = useMemo(() => ROADMAP_DIRECTORY.filter((entry) => {
    if (directoryKind !== 'all' && entry.kind !== directoryKind) return false;
    return entry.title.toLowerCase().includes(query.trim().toLowerCase());
  }), [directoryKind, query]);
  const resourceList = useMemo(() => allResources.filter((item) => {
    if (section === 'build' && item.type !== 'How to build X') return false;
    if (section === 'saved' && !savedMap.has(item.id)) return false;
    const text = `${item.title} ${item.description} ${item.category} ${item.technologies.join(' ')} ${item.skills.join(' ')}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }), [allResources, section, savedMap, query]);
  const buildGuides = useMemo(() => allResources.filter((item) => item.type === 'How to build X'), [allResources]);

  const goToStage = (stage: RoadmapStage) => {
    setSelectedStageId(stage.id);
    setSelectedTopic(stage.topics[0]);
    if (mapView !== 'diagram') setMapView('diagram');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!mapViewport.current || !mapImage.current) return;
      const target = stage.position * mapImage.current.clientHeight;
      mapViewport.current.scrollTo({ top: Math.max(0, target - 90), behavior: 'smooth' });
    }));
  };

  const updateZoom = (next: number) => setZoom(Math.max(0.7, Math.min(2.4, Math.round(next * 10) / 10)));

  const toggleSave = async (item: ResourceItem) => {
    try {
      if (savedMap.has(item.id)) {
        await onRemoveSavedResource(item.id);
        onToast('Removed from your learning list.');
      } else {
        await onSaveResource(item.id, 'not_started');
        onToast('Added to your learning list.');
      }
    } catch { onToast('Could not update your learning list.'); }
  };

  const setResourceStatus = async (item: ResourceItem, status: ResourceProgressStatus) => {
    try { await onUpdateResourceProgress(item.id, status); }
    catch { onToast('Could not update resource progress.'); }
  };

  const relatedPeople = recommendations.filter((person) => person.skills?.some((skill) => frontend?.skills.some((name) => name.toLowerCase() === skill.name.toLowerCase()))).slice(0, 2);
  const relatedProjects = projects.filter((project) => [...project.tags, ...project.openRoles.flatMap((role) => role.skillsNeeded)].some((tech) => frontend?.technologies.some((name) => name.toLowerCase().includes(tech.toLowerCase()) || tech.toLowerCase().includes(name.toLowerCase())))).slice(0, 2);

  return (
    <main className="resource-studio">
      <header className="resource-hero">
        <div className="resource-hero-copy">
          <span className="resource-eyebrow">MESH / LEARNING</span>
          <h1>Find your path. <span>Build with people.</span></h1>
          <button type="button" className="resource-browse-link" onClick={() => { setSection('roadmaps'); setQuery(''); requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('resource-directory-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))); }}>Browse all {ROADMAP_DIRECTORY.length} roadmaps <ArrowRight size={14} /></button>
        </div>
        <div className="resource-hero-progress" aria-label={`${percent}% of Frontend topics completed`}>
          <div><strong>{percent}%</strong><span>Frontend progress</span></div>
          <div className="resource-progress-track"><span style={{ width: `${percent}%` }} /></div>
          <small>{doneCount} done · {learningCount} learning · {allTopics.length} topics</small>
        </div>
      </header>

      <nav className="resource-main-tabs" aria-label="Resource sections">
        <button type="button" className={section === 'roadmaps' ? 'active' : ''} onClick={() => setSection('roadmaps')}>Roadmaps</button>
        <button type="button" className={section === 'build' ? 'active' : ''} onClick={() => setSection('build')}>Build guides</button>
        <button type="button" className={section === 'saved' ? 'active' : ''} onClick={() => setSection('saved')}>Saved <span>{savedResources.length}</span></button>
      </nav>

      {section === 'roadmaps' && frontend && !query && (
        <section className="resource-roadmap-workspace" aria-labelledby="frontend-map-title">
          <div className="resource-workspace-topbar">
            <div>
              <span className="resource-eyebrow">ROLE ROADMAP / 01</span>
              <h2 id="frontend-map-title">Frontend developer</h2>
            </div>
            <div className="resource-workspace-actions">
              <button type="button" className="resource-text-action" onClick={() => toggleSave(frontend)} disabled={busy} aria-pressed={savedMap.has(frontend.id)}>
                <Bookmark size={16} fill={savedMap.has(frontend.id) ? 'currentColor' : 'none'} /> {savedMap.has(frontend.id) ? 'Saved' : 'Save roadmap'}
              </button>
              <a className="resource-source-action" href={frontend.url} target="_blank" rel="noopener noreferrer">Open on roadmap.sh <ExternalLink size={15} /></a>
            </div>
          </div>

          <div className="resource-workspace-body">
            <aside className="resource-stage-rail" aria-label="Frontend roadmap sections">
              <div className="resource-rail-heading">THE PATH <span>{FRONTEND_STAGES.length} sections</span></div>
              <div className="resource-stage-list">
                {FRONTEND_STAGES.map((stage, index) => {
                  const completed = stage.topics.filter((topic) => topicStates[`${stage.id}:${topic}`] === 'done').length;
                  return <button type="button" key={stage.id} className={`resource-stage ${selectedStageId === stage.id ? 'selected' : ''}`} onClick={() => goToStage(stage)}>
                    <span className="resource-stage-num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="resource-stage-name">{stage.title}<small>{completed}/{stage.topics.length} done</small></span>
                    {completed === stage.topics.length ? <CheckCircle2 size={16} /> : <ArrowRight size={15} />}
                  </button>;
                })}
              </div>
              <div className="resource-rail-footer"><BookOpen size={16} /><span>Based on the roadmap.sh Frontend diagram supplied for MESH.</span></div>
            </aside>

            <div className="resource-map-column">
              <div className="resource-map-toolbar">
                <div className="resource-view-switch" role="group" aria-label="Roadmap view">
                  <button type="button" className={mapView === 'diagram' ? 'active' : ''} onClick={() => setMapView('diagram')}>Diagram</button>
                  <button type="button" className={mapView === 'pdf' ? 'active' : ''} onClick={() => setMapView('pdf')}>Original PDF</button>
                </div>
                <div className="resource-map-tools">
                  {mapView === 'diagram' && <>
                    <button type="button" aria-label="Zoom out" onClick={() => updateZoom(zoom - 0.2)}><Minus size={16} /></button>
                    <span aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>{Math.round(zoom * 100)}%</span>
                    <button type="button" aria-label="Zoom in" onClick={() => updateZoom(zoom + 0.2)}><Plus size={16} /></button>
                    <button type="button" aria-label="Reset zoom" onClick={() => updateZoom(1)}><RotateCcw size={15} /></button>
                  </>}
                  <a href={PDF_URL} target="_blank" rel="noopener noreferrer" aria-label="Open roadmap PDF in new tab" title="Open PDF in new tab"><Maximize2 size={16} /></a>
                </div>
              </div>
              {mapView === 'diagram' ? (
                <div className="resource-map-viewport" ref={mapViewport} tabIndex={0} aria-label="Frontend roadmap diagram. Scroll to explore the full map.">
                  <div className="resource-map-paper"><img ref={mapImage} src={IMAGE_URL} alt="Complete Frontend developer flow diagram, from Internet and HTML through frameworks, testing, performance, and apps" style={{ width: `${1020 * zoom}px` }} /></div>
                </div>
              ) : <iframe className="resource-pdf-frame" title="Original Frontend roadmap PDF" src={PDF_URL} />}
              <div className="resource-map-credit"><span>Full diagram by <a href={frontend.url} target="_blank" rel="noopener noreferrer">roadmap.sh</a></span><span>Scroll to explore · Use the path index to jump</span></div>
            </div>

            <aside className="resource-topic-panel" aria-label="Selected roadmap section">
              <div className="resource-topic-heading"><span className="resource-eyebrow">CURRENT SECTION</span><h3>{selectedStage.title}</h3><p>{selectedStage.description}</p></div>
              <div className="resource-topic-list">
                {selectedStage.topics.map((topic) => {
                  const status = topicStates[`${selectedStage.id}:${topic}`] || 'not_started';
                  return <button type="button" key={topic} className={`resource-topic ${selectedTopic === topic ? 'selected' : ''}`} onClick={() => setSelectedTopic(topic)}>
                    <span className={`resource-topic-mark ${status}`}>{status === 'done' ? <Check size={12} /> : status === 'learning' ? '•' : ''}</span>
                    <span>{topic}</span>
                    <ChevronDown size={14} />
                  </button>;
                })}
              </div>
              <div className="resource-topic-detail">
                <span className="resource-eyebrow">SELECTED TOPIC</span>
                <h4>{selectedTopic}</h4>
                <p>Track this topic here, then open the original roadmap for its explanations and learning links.</p>
                <div className="resource-topic-status" role="group" aria-label={`Progress for ${selectedTopic}`}>
                  {([['not_started', 'To learn'], ['learning', 'Learning'], ['done', 'Done']] as const).map(([value, label]) => <button type="button" key={value} className={(topicStates[`${selectedStage.id}:${selectedTopic}`] || 'not_started') === value ? 'active' : ''} onClick={() => setTopicState(selectedStage.id, selectedTopic, value)}>{label}</button>)}
                </div>
                <a href={frontend.url} target="_blank" rel="noopener noreferrer">Read on roadmap.sh <ExternalLink size={13} /></a>
              </div>
              <div className="resource-topic-note">Topic progress is saved in this browser for your MESH profile.</div>
            </aside>
          </div>
        </section>
      )}

      {section === 'roadmaps' && !query && (relatedPeople.length > 0 || relatedProjects.length > 0) && (
        <section className="resource-collab-strip">
          <div><span className="resource-eyebrow">LEARN TOGETHER</span><h2>Put the roadmap to work.</h2></div>
          <div className="resource-collab-items">
            {relatedProjects.map((project) => <button type="button" key={project.id} onClick={() => onNavigateToProject?.(project.id)}><span>PROJECT</span><strong>{project.title}</strong><ArrowRight size={16} /></button>)}
            {relatedPeople.map((person) => <button type="button" key={person.userId} onClick={() => onConnectWithPeer?.(person)}><span>COLLABORATOR</span><strong>{person.displayName}</strong><ArrowRight size={16} /></button>)}
          </div>
        </section>
      )}

      {section === 'roadmaps' && <section className="resource-directory" aria-labelledby="resource-directory-title">
        <div className="resource-directory-heading">
          <div><span className="resource-eyebrow">THE DIRECTORY</span><h2 id="resource-directory-title">Every roadmap, one place.</h2></div>
          <label className="resource-search"><Search size={17} /><span className="sr-only">Search roadmaps</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a roadmap" type="search" /></label>
        </div>
        <div className="resource-directory-filters" role="group" aria-label="Roadmap categories">
          {([['all', 'All', ROADMAP_DIRECTORY.length], ['role', 'Role paths', ROADMAP_DIRECTORY.filter((entry) => entry.kind === 'role').length], ['skill', 'Skills', ROADMAP_DIRECTORY.filter((entry) => entry.kind === 'skill').length], ['practice', 'Best practices', ROADMAP_DIRECTORY.filter((entry) => entry.kind === 'practice').length]] as const).map(([kind, label, count]) => <button type="button" key={kind} className={directoryKind === kind ? 'active' : ''} onClick={() => setDirectoryKind(kind)}>{label}<span>{count}</span></button>)}
        </div>
        <div className="resource-directory-grid">
          {directoryEntries.map((entry, index) => {
            const item = directoryResources.find((resource) => resource.url === entry.url)!;
            const isSaved = savedMap.has(item.id);
            return <article className="resource-directory-item" key={entry.id}>
              <span className="resource-directory-index">{String(index + 1).padStart(2, '0')}</span>
              <div><span className="resource-directory-kind">{entry.kind === 'role' ? 'ROLE PATH' : entry.kind === 'practice' ? 'BEST PRACTICE' : 'SKILL PATH'}</span><h3><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.title}</a></h3></div>
              <div className="resource-directory-actions">
                <button type="button" onClick={() => toggleSave(item)} aria-label={isSaved ? `Remove ${entry.title} from saved` : `Save ${entry.title}`} aria-pressed={isSaved} title={isSaved ? 'Remove from saved' : 'Save'} disabled={busy}><Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} /></button>
                <a href={entry.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${entry.title} on roadmap.sh`} title="Open on roadmap.sh"><ArrowRight size={17} /></a>
              </div>
            </article>;
          })}
          {directoryEntries.length === 0 && <div className="resource-empty"><h3>No roadmaps found</h3><p>Try a different topic or category.</p><button type="button" onClick={() => { setQuery(''); setDirectoryKind('all'); }}>Clear filters</button></div>}
        </div>
        <div className="resource-directory-credit">Roadmap titles and links: <a href="https://roadmap.sh/" target="_blank" rel="noopener noreferrer">roadmap.sh</a>. Interactive diagrams open at their original source.</div>
      </section>}

      {section === 'build' && <section className="build-x-page" aria-labelledby="build-x-title">
        <header className="build-x-hero">
          <div><span className="resource-eyebrow">BUILD YOUR OWN X</span><h2 id="build-x-title">Understand the systems you use by rebuilding one.</h2><div className="build-x-actions"><a className="build-x-primary" href="https://github.com/codecrafters-io/build-your-own-x" target="_blank" rel="noopener noreferrer">Open Build Your Own X <ExternalLink size={16} /></a><span>Curated learning paths · direct source links</span></div></div>
          <aside className="build-x-brief"><span>THE LOOP</span><ol><li><b>Choose a system</b><small>Pick one that stretches a skill you want to prove.</small></li><li><b>Build the core</b><small>Start with the smallest working architecture.</small></li><li><b>Share the evidence</b><small>Connect commits, a demo, and what you learned.</small></li></ol></aside>
        </header>
        <div className="build-x-section-head"><div><span className="resource-eyebrow">STARTER SYSTEMS</span><h2>Make a hard thing tangible.</h2></div><label className="resource-search"><Search size={17} /><span className="sr-only">Search build guides</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a system" type="search" /></label></div>
        <div className="build-x-grid">{buildGuides.filter((guide) => `${guide.title} ${guide.description} ${guide.category}`.toLowerCase().includes(query.toLowerCase())).map((guide, index) => { const saved = savedMap.get(guide.id); return <article className={`build-x-card build-x-card-${index % 5}`} key={guide.id}><div className="build-x-card-top"><span>{String(index + 1).padStart(2, '0')}</span><button type="button" onClick={() => toggleSave(guide)} disabled={busy} aria-label={saved ? `Remove ${guide.title} from learning list` : `Save ${guide.title} to learning list`}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button></div><div><span className="build-x-category">{guide.category}</span><h3>{guide.title}</h3><p>{guide.description}</p></div><div className="build-x-tech">{guide.technologies.slice(0, 4).map((technology) => <span key={technology}>{technology}</span>)}</div><footer><span>{guide.estimatedTime || '2 weekends'}</span><a href={guide.url} target="_blank" rel="noopener noreferrer">View resources <ArrowRight size={16} /></a></footer></article>; })}</div>
        <section className="build-x-method"><div><span className="resource-eyebrow">PROJECT METHOD</span><h2>Turn a guide into evidence.</h2></div><div className="build-x-method-steps"><article><b>01</b><h3>Scope one core</h3><p>Define the smallest end-to-end behavior before you add features.</p></article><article><b>02</b><h3>Show your decisions</h3><p>Record trade-offs in the README, issues, and pull requests.</p></article><article><b>03</b><h3>Find a collaborator</h3><p>Use MESH to add a complementary skill where the system gets difficult.</p></article></div></section>
      </section>}

      {section === 'saved' && <section className="resource-library" aria-labelledby="resource-library-title">
        <div className="resource-library-heading">
          <div><span className="resource-eyebrow">YOUR LEARNING LIST</span><h2 id="resource-library-title">Resources you saved</h2></div>
          <label className="resource-search"><Search size={17} /><span className="sr-only">Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skills or topics" type="search" /></label>
        </div>
        <div className="resource-list">
          {resourceList.map((item) => {
            const saved = savedMap.get(item.id);
            return <article className="resource-row" key={item.id}>
              <div className="resource-row-type">{item.type === 'Roadmap' ? <BookOpen size={19} /> : <FileText size={19} />}<span>{item.type === 'Roadmap' ? 'ROADMAP' : 'BUILD GUIDE'}</span></div>
              <div className="resource-row-main"><h3>{item.title}</h3><p>{item.description}</p><div className="resource-row-meta">{item.category}{item.technologies.length > 0 && <> <span>·</span> {item.technologies.slice(0, 3).join(' / ')}</>}</div></div>
              <div className="resource-row-actions">
                {saved && <select aria-label={`Progress for ${item.title}`} value={saved.status} onChange={(event) => setResourceStatus(item, event.target.value as ResourceProgressStatus)}><option value="not_started">To learn</option><option value="in_progress">Learning</option><option value="completed">Done</option></select>}
                <button type="button" aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`} title={saved ? 'Remove from saved' : 'Save'} onClick={() => toggleSave(item)} disabled={busy}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button>
                {item.id === 'rm-frontend' ? <button type="button" className="resource-row-link" onClick={() => { setSection('roadmaps'); setQuery(''); requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('frontend-map-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))); }}>View map <ArrowRight size={16} /></button> : <a className="resource-row-link" href={item.url} target="_blank" rel="noopener noreferrer">Open resource <ExternalLink size={15} /></a>}
              </div>
            </article>;
          })}
          {resourceList.length === 0 && <div className="resource-empty"><h3>{section === 'saved' && !query ? 'Nothing saved yet' : 'No matching resources'}</h3><p>{section === 'saved' && !query ? 'Save a roadmap or build guide to keep it here.' : 'Try a different skill or topic.'}</p>{query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}</div>}
        </div>
      </section>}
      {section === 'roadmaps' && onNavigateToDiscover && <div className="resource-footer-link"><Users size={17} /><span>Ready to use these skills?</span><button type="button" onClick={() => onNavigateToDiscover('Frontend Development')}>Find collaborators <ArrowRight size={15} /></button></div>}
    </main>
  );
};
