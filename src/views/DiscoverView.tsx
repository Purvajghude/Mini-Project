import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Code2,
  ExternalLink,
  Eye,
  Filter,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, Dialog, Github, TextField } from '../components/m3';
import { CandidateRecommendation, Profile } from '../types/api';

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

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  currentUser,
  recommendations,
  onConnect,
  onPass,
  onSave,
  onEditProfile,
  onToast,
  busy = false,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() => {
    return recommendations[0]?.userId || null;
  });

  const [filterMode, setFilterMode] = useState<'all' | 'saved' | 'top_synergy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [mobileDossierOpen, setMobileDossierOpen] = useState(false);

  // Available candidate items (filtering out passed ones unless reset)
  const activeCandidates = useMemo(() => {
    return recommendations.filter((c) => {
      // Filter out passed candidates
      if (c.status === 'passed') return false;

      // Filter tabs
      if (filterMode === 'saved' && !c.savedForLater) return false;
      if (filterMode === 'top_synergy' && c.score < 88) return false;

      // Domain filter
      if (selectedDomain !== 'all' && c.primaryDomain !== selectedDomain) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = c.displayName.toLowerCase().includes(query);
        const matchesDomain = (c.primaryDomain || '').toLowerCase().includes(query);
        const matchesSkill = c.skills.some((s) => s.name.toLowerCase().includes(query));
        return matchesName || matchesDomain || matchesSkill;
      }

      return true;
    });
  }, [recommendations, filterMode, selectedDomain, searchQuery]);

  // Keep selected candidate in sync with active candidates
  useEffect(() => {
    if (activeCandidates.length > 0) {
      if (!selectedCandidateId || !activeCandidates.some((c) => c.userId === selectedCandidateId)) {
        setSelectedCandidateId(activeCandidates[0].userId);
      }
    } else {
      setSelectedCandidateId(null);
    }
  }, [activeCandidates, selectedCandidateId]);

  const selected = useMemo(() => {
    return recommendations.find((c) => c.userId === selectedCandidateId) || null;
  }, [recommendations, selectedCandidateId]);

  // Unique domains for filtering
  const domains = useMemo(() => {
    const set = new Set<string>();
    recommendations.forEach((c) => {
      if (c.primaryDomain) set.add(c.primaryDomain);
    });
    return Array.from(set);
  }, [recommendations]);

  const handleConnectClick = async (e: React.MouseEvent, candidate: CandidateRecommendation) => {
    e.stopPropagation();
    await onConnect(candidate);
  };

  const handlePassClick = async (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    await onPass(candidateId);
    onToast('Candidate skipped for this session.');
  };

  const handleSaveClick = async (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    await onSave(candidateId);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight') {
        // Connect
        onConnect(selected);
      } else if (e.key === 'ArrowLeft') {
        // Pass
        onPass(selected.userId);
        onToast('Candidate skipped.');
      } else if (e.key === 'ArrowUp') {
        // Save
        onSave(selected.userId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, onConnect, onPass, onSave, onToast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Studio Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 16,
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              Algorithmic Peer Matching Studio
            </span>
            <Badge variant="synergy">{activeCandidates.length} Available Candidates</Badge>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 24, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
            Collaborator Discovery Feed
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Ranked by multi-factor technical complementarity with your profile competencies.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Chip
            selected={filterMode === 'all'}
            onClick={() => setFilterMode('all')}
          >
            All Candidates
          </Chip>
          <Chip
            selected={filterMode === 'saved'}
            onClick={() => setFilterMode('saved')}
            icon={<Bookmark size={14} />}
          >
            Saved / Shortlist
          </Chip>
          <Chip
            selected={filterMode === 'top_synergy'}
            onClick={() => setFilterMode('top_synergy')}
            icon={<Sparkles size={14} />}
          >
            Top Synergy (90%+)
          </Chip>
        </div>
      </div>

      {/* Search & Domain Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <TextField
            label="Search by name, skill, or role"
            placeholder="e.g. Divya, Spring Boot, Figma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leadingIcon={<Search size={18} />}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Domain:
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            style={{
              height: 48,
              borderRadius: 'var(--md-sys-shape-corner-extra-small)',
              border: '1px solid var(--md-sys-color-outline)',
              padding: '0 12px',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: 13,
            }}
          >
            <option value="all">All Domains</option>
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column Split Screen Studio */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 0.95fr)',
          gap: 24,
          alignItems: 'start',
        }}
        className="discover-studio-grid"
      >
        {/* Left Column: Feed of Candidate Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeCandidates.length === 0 ? (
            <Card
              variant="outlined"
              style={{
                padding: 40,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--md-sys-color-primary)',
                }}
              >
                <Sparkles size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {filterMode === 'saved'
                  ? 'No saved candidates in your shortlist'
                  : 'You have reviewed all available candidates'}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 440 }}>
                {filterMode === 'saved'
                  ? 'Use the "Save" action on any candidate card to shortlist them for later review.'
                  : 'Add more competencies to your profile to discover candidates from complementary engineering fields.'}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilterMode('all');
                    setSelectedDomain('all');
                    setSearchQuery('');
                  }}
                  icon={<RotateCcw size={15} />}
                >
                  Reset Filters
                </Button>
                <Button variant="filled" onClick={onEditProfile}>
                  Configure Profile
                </Button>
              </div>
            </Card>
          ) : (
            activeCandidates.map((candidate) => {
              const isSelected = candidate.userId === selected?.userId;
              const isConnected = candidate.status === 'connected' || candidate.status === 'interested';

              return (
                <Card
                  key={candidate.userId}
                  variant={isSelected ? 'elevated' : 'outlined'}
                  interactive
                  onClick={() => {
                    setSelectedCandidateId(candidate.userId);
                    // On mobile, also trigger the dossier drawer
                    if (window.innerWidth <= 840) {
                      setMobileDossierOpen(true);
                    }
                  }}
                  style={{
                    padding: 20,
                    cursor: 'pointer',
                    borderColor: isSelected
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-outline-variant)',
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isSelected
                      ? 'var(--md-sys-color-surface-container-low)'
                      : 'var(--md-sys-color-surface)',
                  }}
                >
                  {/* Top Row: Info & Match Badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar
                        name={candidate.displayName}
                        tone={candidate.avatarKey || 'sapphire'}
                        size="md"
                        online
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
                            {candidate.displayName}
                          </strong>
                          {candidate.githubEvidence?.connected && (
                            <span title="GitHub Evidence Verified" style={{ display: 'inline-flex', color: 'var(--md-sys-color-primary)' }}>
                              <Github size={15} />
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                          {candidate.department || 'Engineering'} ·{' '}
                          {candidate.yearOfStudy ? `Year ${candidate.yearOfStudy}` : ''}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        backgroundColor: 'var(--md-custom-color-synergy-container)',
                        color: 'var(--md-custom-color-on-synergy-container)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <Sparkles size={13} />
                      <span>{Math.round(candidate.score)}% Synergy</span>
                    </div>
                  </div>

                  {/* Verbal Synergy Summary */}
                  <p
                    style={{
                      margin: '0 0 14px 0',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--md-sys-color-on-surface)',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      padding: '10px 14px',
                      borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                    }}
                  >
                    💡 <strong>Complementary Fit:</strong> {candidate.reason}
                  </p>

                  {/* Skills tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(candidate.complementarySkills || candidate.skills.map((s) => s.name))
                      .slice(0, 4)
                      .map((skillName) => (
                        <span
                          key={skillName}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 'var(--md-sys-shape-corner-small)',
                            backgroundColor: 'var(--md-sys-color-secondary-container)',
                            color: 'var(--md-sys-color-on-secondary-container)',
                          }}
                        >
                          {skillName}
                        </span>
                      ))}
                    {candidate.availability && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          backgroundColor: 'var(--md-sys-color-surface-container-high)',
                          color: 'var(--md-sys-color-on-surface-variant)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={11} /> {candidate.availability}
                      </span>
                    )}
                  </div>

                  {/* Decision Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--md-sys-color-outline-variant)',
                      paddingTop: 12,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button
                        variant="outlined"
                        size="sm"
                        icon={<X size={14} />}
                        onClick={(e) => handlePassClick(e, candidate.userId)}
                        title="Pass on candidate for this session"
                      >
                        Pass
                      </Button>
                      <Button
                        variant={candidate.savedForLater ? 'filled' : 'outlined'}
                        size="sm"
                        icon={candidate.savedForLater ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                        onClick={(e) => handleSaveClick(e, candidate.userId)}
                        title="Shortlist / Save for later"
                      >
                        {candidate.savedForLater ? 'Saved' : 'Maybe'}
                      </Button>
                    </div>

                    <Button
                      variant={isConnected ? 'tonal' : 'filled'}
                      size="sm"
                      icon={isConnected ? <Check size={14} /> : <ArrowRight size={14} />}
                      disabled={busy || isConnected}
                      onClick={(e) => handleConnectClick(e, candidate)}
                    >
                      {isConnected ? 'Request Sent' : 'Connect'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Right Column: Contextual Inspector / "Why this match?" Dossier (Sticky on Desktop) */}
        <aside
          style={{
            position: 'sticky',
            top: 84,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
          className="discover-dossier-column"
        >
          {selected ? (
            <Card variant="elevated" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Dossier Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--md-sys-color-primary)' }}>
                  Candidate Dossier &amp; Synergy Matrix
                </span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-custom-color-synergy-container)',
                    color: 'var(--md-custom-color-on-synergy-container)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={12} />
                  {Math.round(selected.score)}% Synergy
                </div>
              </div>

              {/* Candidate Info */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Avatar
                  name={selected.displayName}
                  tone={selected.avatarKey || 'sapphire'}
                  size="lg"
                  online
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
                    {selected.displayName}
                  </h2>
                  <p style={{ margin: '2px 0', fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    @{selected.username} · {selected.department}
                  </p>
                  <span style={{ fontSize: 12, color: 'var(--md-sys-color-outline)' }}>
                    {selected.yearOfStudy ? `Year ${selected.yearOfStudy}` : ''} · {selected.primaryDomain}
                  </span>
                </div>
              </div>

              {/* Bio snippet */}
              {selected.bio && (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  "{selected.bio}"
                </p>
              )}

              {/* "Why This Match?" Section */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="var(--md-sys-color-primary)" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                    Why This Match?
                  </h3>
                </div>

                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--md-sys-color-on-surface)' }}>
                  {selected.reason}
                </p>

                {/* Algorithmic Scoring Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Multi-Factor Scoring Matrix
                  </span>

                  {[
                    { label: 'Technical Gap Resolution', value: selected.breakdown?.gapFill || 94, color: 'var(--md-sys-color-primary)' },
                    { label: 'Shared Engineering Ground', value: selected.breakdown?.sharedGround || 86, color: 'var(--md-sys-color-tertiary)' },
                    { label: 'Proficiency Depth', value: selected.breakdown?.depth || 90, color: '#0284c7' },
                    { label: 'Cross-Disciplinary Reach', value: selected.breakdown?.categoryReach || 88, color: '#7c3aed' },
                  ].map((metric) => (
                    <div key={metric.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>{metric.label}</span>
                        <strong style={{ color: metric.color }}>{metric.value}%</strong>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 'var(--md-sys-shape-corner-full)',
                          backgroundColor: 'var(--md-sys-color-surface-container)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${metric.value}%`,
                            height: '100%',
                            backgroundColor: metric.color,
                            borderRadius: 'var(--md-sys-shape-corner-full)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Declared Competencies */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: 8 }}>
                  Declared Technical Skills
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.skills.map((skill) => (
                    <span
                      key={skill.id || skill.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span>{skill.name}</span>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: 'var(--md-sys-color-primary)',
                          color: 'var(--md-sys-color-on-primary)',
                          fontSize: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {skill.proficiency}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* GitHub Evidence Preview */}
              {selected.githubEvidence && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Github size={16} />
                      <strong style={{ fontSize: 13 }}>GitHub Code Evidence</strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--md-sys-color-primary)', fontWeight: 650 }}>
                      {selected.githubEvidence.verifiedCommits} verified commits
                    </span>
                  </div>

                  {selected.githubEvidence.pinnedRepos.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      <strong>Pinned repo:</strong>{' '}
                      <span style={{ color: 'var(--md-sys-color-primary)' }}>
                        {selected.githubEvidence.pinnedRepos[0].name}
                      </span>{' '}
                      ({selected.githubEvidence.pinnedRepos[0].primaryLanguage}) —{' '}
                      {selected.githubEvidence.pinnedRepos[0].description}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Connect CTA */}
              <Button
                variant={selected.status === 'interested' ? 'tonal' : 'filled'}
                fullWidth
                icon={selected.status === 'interested' ? <Check size={16} /> : <ArrowRight size={16} />}
                disabled={busy || selected.status === 'interested'}
                onClick={() => onConnect(selected)}
              >
                {selected.status === 'interested' ? 'Connection Request Sent' : 'Send Connection Request'}
              </Button>
            </Card>
          ) : (
            <Card variant="outlined" style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Select a candidate from the discovery feed to inspect their compatibility dossier.
              </p>
            </Card>
          )}
        </aside>
      </div>

      {/* Mobile Candidate Dossier Dialog / Bottom Sheet */}
      {selected && (
        <Dialog
          open={mobileDossierOpen}
          onClose={() => setMobileDossierOpen(false)}
          headline={`${selected.displayName}'s Compatibility Dossier`}
          actions={
            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => setMobileDossierOpen(false)}>
                Close
              </Button>
              <Button
                variant={selected.status === 'interested' ? 'tonal' : 'filled'}
                icon={selected.status === 'interested' ? <Check size={16} /> : <ArrowRight size={16} />}
                disabled={busy || selected.status === 'interested'}
                onClick={async () => {
                  await onConnect(selected);
                  setMobileDossierOpen(false);
                }}
              >
                {selected.status === 'interested' ? 'Sent' : 'Connect'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={selected.displayName} tone={selected.avatarKey || 'sapphire'} size="md" />
              <div>
                <strong style={{ fontSize: 16 }}>{selected.displayName}</strong>
                <div style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {selected.department} · {selected.yearOfStudy ? `Year ${selected.yearOfStudy}` : ''}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
              }}
            >
              <strong style={{ fontSize: 13, color: 'var(--md-sys-color-primary)', display: 'block', marginBottom: 4 }}>
                Synergy Summary ({Math.round(selected.score)}% Fit)
              </strong>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{selected.reason}</p>
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Technical Competencies
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.skills.map((skill) => (
                  <span
                    key={skill.id || skill.name}
                    style={{
                      fontSize: 12,
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    }}
                  >
                    {skill.name} (Lvl {skill.proficiency})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
