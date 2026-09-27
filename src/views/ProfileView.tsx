import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Code2,
  Edit3,
  ExternalLink,
  GitBranch,
  Github,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, Dialog, TextField, TextArea } from '../components/m3';
import { GitHubEvidence, Profile, ProfileSkill, Skill, UpdateProfileRequest } from '../types/api';

interface ProfileViewProps {
  user: Profile;
  availableSkills: Skill[];
  onSaveProfile: (updates: UpdateProfileRequest) => Promise<void>;
  onSaveSkills: (skills: ProfileSkill[]) => Promise<void>;
  onToast: (message: string) => void;
  busy?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  availableSkills,
  onSaveProfile,
  onSaveSkills,
  onToast,
  busy = false,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    displayName: user.displayName,
    department: user.department || '',
    yearOfStudy: user.yearOfStudy || 3,
    bio: user.bio || '',
    availability: user.availability || '',
    primaryDomain: user.primaryDomain || '',
  });

  // Skills state
  const [currentSkills, setCurrentSkills] = useState<ProfileSkill[]>(user.skills || []);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [selectedCatalogSkillId, setSelectedCatalogSkillId] = useState<number | ''>('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<number>(3);
  const [skillsModified, setSkillsModified] = useState(false);

  // Simulated GitHub evidence
  const [githubEvidence, setGithubEvidence] = useState<GitHubEvidence>({
    connected: true,
    githubUsername: 'purvajghude',
    verifiedCommits: 384,
    topLanguages: [
      { language: 'TypeScript', percentage: 48 },
      { language: 'Java', percentage: 28 },
      { language: 'Python', percentage: 16 },
      { language: 'CSS/HTML', percentage: 8 },
    ],
    pinnedRepos: [
      {
        name: 'mesh-connect-platform',
        description: 'Academic student peer matching and skill collaboration system built with React, Vite, and Spring Boot.',
        stars: 42,
        forks: 11,
        primaryLanguage: 'TypeScript',
        updatedAt: 'Today',
        verified: true,
        commitsCount: 198,
      },
      {
        name: 'campus-event-sync',
        description: 'University calendar scheduler with transactional time-slot locking and notification worker.',
        stars: 19,
        forks: 5,
        primaryLanguage: 'Java',
        updatedAt: '3 days ago',
        verified: true,
        commitsCount: 94,
      },
      {
        name: 'a11y-design-tokens',
        description: 'WCAG AAA accessible Material Design 3 token spec generator for educational dashboards.',
        stars: 15,
        forks: 3,
        primaryLanguage: 'CSS',
        updatedAt: '1 week ago',
        verified: true,
        commitsCount: 46,
      },
    ],
    lastSyncedAt: 'Just now',
  });
  const [syncingGithub, setSyncingGithub] = useState(false);

  // Collaboration interests / goals
  const [goals, setGoals] = useState<string[]>([
    'Hackathon Teammate',
    'Open-Source Collaboration',
    'Semester Capstone Team',
  ]);
  const [newGoal, setNewGoal] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveProfile(profileForm);
    setIsEditingProfile(false);
    onToast('Working profile saved successfully.');
  };

  const handleProficiencyChange = (skillId: number, level: number) => {
    setCurrentSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, proficiency: level } : s))
    );
    setSkillsModified(true);
  };

  const handleRemoveSkill = (skillId: number) => {
    setCurrentSkills((prev) => prev.filter((s) => s.id !== skillId));
    setSkillsModified(true);
  };

  const handleAddSkillSubmit = () => {
    if (!selectedCatalogSkillId) return;
    const catalogSkill = availableSkills.find((s) => s.id === Number(selectedCatalogSkillId));
    if (!catalogSkill) return;

    if (currentSkills.some((s) => s.id === catalogSkill.id)) {
      onToast('Skill is already declared in your profile.');
      return;
    }

    const added: ProfileSkill = {
      ...catalogSkill,
      proficiency: newSkillProficiency,
      evidenceSupported: false,
    };

    setCurrentSkills([...currentSkills, added]);
    setSkillsModified(true);
    setIsAddingSkill(false);
    setSelectedCatalogSkillId('');
    onToast(`Added ${catalogSkill.name} to competencies.`);
  };

  const handleSaveSkills = async () => {
    await onSaveSkills(currentSkills);
    setSkillsModified(false);
    onToast('Skills updated! Recommendations will now reflect your changes.');
  };

  const handleSyncGithub = async () => {
    setSyncingGithub(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setGithubEvidence((prev) => ({
      ...prev,
      verifiedCommits: prev.verifiedCommits + 2,
      lastSyncedAt: 'Just now',
    }));
    setSyncingGithub(false);
    onToast('GitHub repositories & commit telemetry refreshed.');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    if (goals.includes(newGoal.trim())) return;
    setGoals([...goals, newGoal.trim()]);
    setNewGoal('');
    onToast('Added collaboration interest.');
  };

  const handleRemoveGoal = (goal: string) => {
    setGoals(goals.filter((g) => g !== goal));
  };

  // Profile Health calculation
  const hasBio = Boolean(user.bio && user.bio.trim().length > 20);
  const hasMinSkills = currentSkills.length >= 3;
  const hasAvailability = Boolean(user.availability);
  const hasGithub = githubEvidence.connected;

  const healthScore =
    (hasBio ? 25 : 0) +
    (hasMinSkills ? 30 : currentSkills.length * 10) +
    (hasAvailability ? 20 : 0) +
    (hasGithub ? 25 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Top Profile Header Card */}
      <Card variant="elevated" style={{ padding: 28 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Avatar name={user.displayName} tone={user.avatarKey || 'sapphire'} size="xl" online />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
                  {user.displayName}
                </h1>
                <Badge variant="synergy">Verified Student</Badge>
              </div>
              <p style={{ margin: '4px 0', fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>
                @{user.username} · {user.department || 'Engineering'} ·{' '}
                {user.yearOfStudy ? `Year ${user.yearOfStudy}` : 'Student'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-secondary-container)',
                    color: 'var(--md-sys-color-on-secondary-container)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Clock size={14} />
                  <span>{user.availability || 'Availability not set'}</span>
                </span>
                {user.primaryDomain && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <BookOpen size={14} />
                    <span>{user.primaryDomain}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="tonal"
            icon={<Edit3 size={16} />}
            onClick={() => {
              setProfileForm({
                displayName: user.displayName,
                department: user.department || '',
                yearOfStudy: user.yearOfStudy || 3,
                bio: user.bio || '',
                availability: user.availability || '',
                primaryDomain: user.primaryDomain || '',
              });
              setIsEditingProfile(true);
            }}
          >
            Edit Profile
          </Button>
        </div>

        {/* Bio Story */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--md-sys-color-on-surface)' }}>
            {user.bio ||
              'Add a personal bio explaining what kinds of projects and software problems you enjoy solving.'}
          </p>
        </div>

        {/* Profile Health Progress Bar */}
        <div
          style={{
            marginTop: 20,
            padding: '14px 18px',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Profile Match Readiness
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
              {healthScore}% Complete
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${healthScore}%`,
                height: '100%',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor:
                  healthScore === 100
                    ? 'var(--md-custom-color-synergy)'
                    : 'var(--md-sys-color-primary)',
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {healthScore === 100
              ? '✨ Your profile provides complete data for optimal algorithmic peer matching!'
              : 'Add at least 3 skills, availability, and link GitHub for highest match confidence.'}
          </span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left Column: Skills & Technical Competencies */}
        <Card variant="outlined" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                Declared Competencies
              </h2>
              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                {currentSkills.length} competencies registered
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outlined"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setIsAddingSkill(true)}
              >
                Add Skill
              </Button>
              {skillsModified && (
                <Button
                  variant="filled"
                  size="sm"
                  icon={<Check size={14} />}
                  onClick={handleSaveSkills}
                  loading={busy}
                >
                  Save
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentSkills.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>
                No skills added yet. Add competencies to discover matching projects.
              </p>
            ) : (
              currentSkills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{skill.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 8 }}>
                      {skill.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleProficiencyChange(skill.id, lvl)}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor:
                              lvl <= skill.proficiency
                                ? 'var(--md-sys-color-primary)'
                                : 'var(--md-sys-color-surface-container-high)',
                            color:
                              lvl <= skill.proficiency
                                ? 'var(--md-sys-color-on-primary)'
                                : 'var(--md-sys-color-on-surface-variant)',
                          }}
                          aria-label={`Set proficiency ${lvl}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--md-sys-color-error)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      aria-label={`Remove ${skill.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {skillsModified && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                backgroundColor: 'var(--md-custom-color-warning-container)',
                color: 'var(--md-custom-color-on-warning-container)',
                fontSize: 12,
              }}
            >
              <span>You have unsaved skill changes.</span>
              <button
                type="button"
                onClick={handleSaveSkills}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Save Now
              </button>
            </div>
          )}
        </Card>

        {/* Right Column: GitHub Evidence */}
        <Card variant="outlined" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Github size={20} />
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                GitHub Evidence
              </h2>
            </div>
            <Button
              variant="tonal"
              size="sm"
              icon={<RefreshCw size={13} className={syncingGithub ? 'm3-spin' : ''} />}
              onClick={handleSyncGithub}
              loading={syncingGithub}
            >
              Sync
            </Button>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 650 }}>
                Verified Commits
              </span>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                {githubEvidence.verifiedCommits}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 650 }}>
                Handle
              </span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                <a
                  href={`https://github.com/${githubEvidence.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--md-sys-color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  @{githubEvidence.githubUsername}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Top Languages bar */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Language Activity Distribution
            </span>
            <div
              style={{
                height: 8,
                borderRadius: 'var(--md-sys-shape-corner-full)',
                display: 'flex',
                overflow: 'hidden',
                marginTop: 6,
                marginBottom: 8,
              }}
            >
              <div style={{ width: '48%', backgroundColor: '#3178c6' }} title="TypeScript 48%" />
              <div style={{ width: '28%', backgroundColor: '#b07219' }} title="Java 28%" />
              <div style={{ width: '16%', backgroundColor: '#3572A5' }} title="Python 16%" />
              <div style={{ width: '8%', backgroundColor: '#563d7c' }} title="CSS/HTML 8%" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
              {githubEvidence.topLanguages.map((l) => (
                <span key={l.language} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary)' }} />
                  {l.language}: {l.percentage}%
                </span>
              ))}
            </div>
          </div>

          {/* Pinned Repositories */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 8, display: 'block' }}>
              Pinned Repositories &amp; Contributions
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {githubEvidence.pinnedRepos.map((repo) => (
                <div
                  key={repo.name}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13, color: 'var(--md-sys-color-primary)' }}>{repo.name}</strong>
                    <span style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Star size={12} /> {repo.stars}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 6px 0', fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {repo.description}
                  </p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--md-sys-color-outline)' }}>
                    <span>{repo.primaryLanguage}</span>
                    <span>{repo.commitsCount} commits</span>
                    <span>Updated {repo.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Collaboration Interests & Goals */}
      <Card variant="outlined" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>
          Collaboration Goals &amp; Project Types
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
          Let prospective collaborators know what kind of initiatives you are interested in joining.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {goals.map((g) => (
            <Chip key={g} onRemove={() => handleRemoveGoal(g)}>
              {g}
            </Chip>
          ))}
        </div>

        <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: 8, maxWidth: 440 }}>
          <TextField
            label="Add collaboration goal"
            placeholder="e.g. AI Research Paper, Robotics Hackathon"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />
          <Button type="submit" variant="tonal" icon={<Plus size={16} />} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            Add
          </Button>
        </form>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog
        open={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        headline="Edit Working Profile"
        actions={
          <>
            <Button variant="text" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={handleProfileSubmit} loading={busy}>
              Save Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label="Full Name"
            value={profileForm.displayName}
            onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <TextField
              label="Department"
              value={profileForm.department || ''}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              style={{ flex: 2 }}
            />
            <TextField
              label="Year of Study"
              type="number"
              min={1}
              max={8}
              value={profileForm.yearOfStudy || 1}
              onChange={(e) => setProfileForm({ ...profileForm, yearOfStudy: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
          </div>

          <TextField
            label="Primary Engineering Domain"
            value={profileForm.primaryDomain || ''}
            onChange={(e) => setProfileForm({ ...profileForm, primaryDomain: e.target.value })}
            placeholder="e.g. Frontend, Machine Learning, Embedded"
          />

          <TextField
            label="Weekly Bandwidth &amp; Availability"
            value={profileForm.availability || ''}
            onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
            placeholder="e.g. 6–8 hrs / week"
          />

          <TextArea
            label="Bio &amp; Problem Areas"
            value={profileForm.bio || ''}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            rows={4}
            maxLength={500}
            supportingText={`${(profileForm.bio || '').length}/500`}
          />
        </form>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog
        open={isAddingSkill}
        onClose={() => setIsAddingSkill(false)}
        headline="Add Skill from Catalog"
        actions={
          <>
            <Button variant="text" onClick={() => setIsAddingSkill(false)}>
              Cancel
            </Button>
            <Button
              variant="filled"
              disabled={!selectedCatalogSkillId}
              onClick={handleAddSkillSubmit}
            >
              Add to Profile
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Select Skill
            </label>
            <select
              value={selectedCatalogSkillId}
              onChange={(e) => setSelectedCatalogSkillId(Number(e.target.value))}
              style={{
                height: 48,
                borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                border: '1px solid var(--md-sys-color-outline)',
                padding: '0 12px',
                background: 'var(--md-sys-color-surface-container-lowest)',
                fontSize: 14,
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              <option value="" disabled>
                Choose from available skills...
              </option>
              {availableSkills
                .filter((s) => !currentSkills.some((cur) => cur.id === s.id))
                .map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: 8 }}>
              Proficiency Level (1: Beginner, 5: Expert)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNewSkillProficiency(lvl)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor:
                      lvl === newSkillProficiency
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-surface-container-low)',
                    color:
                      lvl === newSkillProficiency
                        ? 'var(--md-sys-color-on-primary)'
                        : 'var(--md-sys-color-on-surface)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Level {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
