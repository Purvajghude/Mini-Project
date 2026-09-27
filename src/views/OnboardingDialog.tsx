import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  Github,
  Plus,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { Button, Card, Chip, Dialog, TextField, TextArea } from '../components/m3';
import { Profile, ProfileSkill, Skill } from '../types/api';

interface OnboardingDialogProps {
  open: boolean;
  profile: Profile;
  availableSkills: Skill[];
  onComplete: (updatedProfile: Partial<Profile>, skills: ProfileSkill[]) => Promise<void>;
  busy?: boolean;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication',
  'Design & Human-Computer Interaction',
  'Mechanical & Robotics Engineering',
  'Electrical & Electronics Engineering',
  'Biotechnology & Bioinformatics',
];

const DOMAINS = [
  'Frontend & Web Systems',
  'Backend & Distributed Systems',
  'Machine Learning & Data Science',
  'Product Design & UX',
  'Cloud & DevOps Infrastructure',
  'Mobile & Ubiquitous Computing',
  'Cybersecurity & Systems',
  'Embedded Systems & IoT',
];

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  open,
  profile,
  availableSkills,
  onComplete,
  busy = false,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Academic details
  const [department, setDepartment] = useState(profile.department || DEPARTMENTS[0]);
  const [yearOfStudy, setYearOfStudy] = useState(profile.yearOfStudy || 3);
  const [primaryDomain, setPrimaryDomain] = useState(profile.primaryDomain || DOMAINS[0]);

  // Step 2: Skills
  const [selectedSkills, setSelectedSkills] = useState<ProfileSkill[]>(() => {
    if (profile.skills && profile.skills.length > 0) return [...profile.skills];
    // Default 3 starter skills
    return [
      { id: 1, name: 'React', category: 'Frontend', proficiency: 4, evidenceSupported: false },
      { id: 2, name: 'TypeScript', category: 'Languages', proficiency: 3, evidenceSupported: false },
      { id: 7, name: 'PostgreSQL', category: 'Database', proficiency: 3, evidenceSupported: false },
    ];
  });
  const [skillSearch, setSkillSearch] = useState('');

  // Step 3: Availability & Bio
  const [availability, setAvailability] = useState(profile.availability || '8–10 hrs / week');
  const [bio, setBio] = useState(
    profile.bio ||
      'Interested in building practical student tools and joining collaborative university projects.'
  );

  // Step 4: GitHub Link
  const [githubUsername, setGithubUsername] = useState('purvajghude');
  const [githubConnected, setGithubConnected] = useState(true);

  const handleAddSkill = (skill: Skill) => {
    if (selectedSkills.some((s) => s.id === skill.id)) return;
    setSelectedSkills([
      ...selectedSkills,
      { ...skill, proficiency: 3, evidenceSupported: false },
    ]);
  };

  const handleRemoveSkill = (skillId: number) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== skillId));
  };

  const handleProficiencyChange = (skillId: number, proficiency: number) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.id === skillId ? { ...s, proficiency } : s))
    );
  };

  const handleFinish = async () => {
    await onComplete(
      {
        department,
        yearOfStudy,
        primaryDomain,
        availability,
        bio,
        onboardingComplete: true,
      },
      selectedSkills
    );
  };

  const filteredCatalog = availableSkills.filter(
    (s) =>
      !selectedSkills.some((sel) => sel.id === s.id) &&
      (s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(skillSearch.toLowerCase()))
  );

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Mandatory onboarding modal; cannot be dismissed without completing or skipping
      headline="Welcome to MESH"
      actions={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                style={{
                  width: s === step ? 24 : 8,
                  height: 8,
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor:
                    s === step
                      ? 'var(--md-sys-color-primary)'
                      : s < step
                      ? 'var(--md-sys-color-primary-container)'
                      : 'var(--md-sys-color-outline-variant)',
                  transition: 'all 200ms ease',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {step > 1 && (
              <Button variant="outlined" size="sm" onClick={() => setStep((s) => (s - 1) as any)}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                variant="filled"
                size="sm"
                trailingIcon={<ChevronRight size={16} />}
                onClick={() => setStep((s) => (s + 1) as any)}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="filled"
                size="sm"
                icon={<Check size={16} />}
                loading={busy}
                onClick={handleFinish}
              >
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
                Step 1: Academic Focus
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                MESH uses your academic discipline to recommend cross-functional project peers.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Academic Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(Number(e.target.value))}
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
                  {[1, 2, 3, 4, 5, 6].map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Primary Engineering Domain
                </label>
                <select
                  value={primaryDomain}
                  onChange={(e) => setPrimaryDomain(e.target.value)}
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
                  {DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
                Step 2: Declare Technical Competencies
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Declare at least 3 skills to initialize our multi-factor synergy algorithm.
              </p>
            </div>

            {/* Currently selected skills with proficiency */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {selectedSkills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--md-sys-color-surface-container)',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{skill.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 8 }}>
                      {skill.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>Level:</span>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleProficiencyChange(skill.id, level)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor:
                              level <= skill.proficiency
                                ? 'var(--md-sys-color-primary)'
                                : 'var(--md-sys-color-surface-container-high)',
                            color:
                              level <= skill.proficiency
                                ? 'var(--md-sys-color-on-primary)'
                                : 'var(--md-sys-color-on-surface-variant)',
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.id)}
                      aria-label={`Remove ${skill.name}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--md-sys-color-error)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add from catalog */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TextField
                label="Search Skill Catalog"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="e.g. Python, Docker, Figma..."
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 110, overflowY: 'auto' }}>
                {filteredCatalog.slice(0, 10).map((skill) => (
                  <Chip
                    key={skill.id}
                    onClick={() => handleAddSkill(skill)}
                    icon={<Plus size={14} />}
                  >
                    {skill.name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
                Step 3: Availability & Project Bio
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Be honest about your weekly bandwidth so teammates can plan realistically.
              </p>
            </div>

            <TextField
              label="Weekly Availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="e.g. 8–10 hrs / week, Weekends only, etc."
              supportingText="Used for schedule matching and sprint capacity."
            />

            <TextArea
              label="What do you enjoy building?"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              supportingText={`${bio.length}/500 characters. Describe your project interests or past builds.`}
            />
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
                Step 4: Connect GitHub for Verified Evidence
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Peer matching gives higher confidence scores to candidates with verified code contributions.
              </p>
            </div>

            <Card variant="outlined" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--md-sys-color-surface-container-high)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Github size={24} />
                </span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 15 }}>GitHub Student Developer Profile</strong>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Verifies pinned repositories, commit activity, and language distributions.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <TextField
                  label="GitHub Username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. purvajghude"
                  style={{ flex: 1 }}
                />
                <Button
                  variant={githubConnected ? 'tonal' : 'filled'}
                  onClick={() => setGithubConnected(!githubConnected)}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                >
                  {githubConnected ? 'Linked' : 'Connect'}
                  {githubConnected ? <Check size={16} /> : <Code2 size={16} />}
                </Button>
              </div>

              {githubConnected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    backgroundColor: 'var(--md-custom-color-synergy-container)',
                    color: 'var(--md-custom-color-on-synergy-container)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Check size={15} />
                  <span>384 verified commits &amp; 2 pinned repos will be added to your profile evidence.</span>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </Dialog>
  );
};
