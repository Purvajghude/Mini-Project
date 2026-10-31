import React, { useState } from 'react';
import {
  BlueprintSuggestion,
  ProjectRequirement,
  ProjectRequirementInput,
  ReplaceProjectRequirements,
  Skill,
} from '../../types/api';
import { Button, Card, Dialog, MaterialSymbol, TextArea, TextField } from '../m3';
import { SkillRequirementChip } from './SkillRequirementChip';

export interface BlueprintEditorProps {
  initialBlueprint: BlueprintSuggestion;
  availableSkills: Skill[];
  onSave: (payload: {
    title: string;
    summary: string;
    domain: string | null;
    requirementsData: ReplaceProjectRequirements;
  }) => Promise<void>;
  onBackToIdea: () => void;
  isSaving?: boolean;
}

export const BlueprintEditor: React.FC<BlueprintEditorProps> = ({
  initialBlueprint,
  availableSkills,
  onSave,
  onBackToIdea,
  isSaving = false,
}) => {
  const [title, setTitle] = useState(initialBlueprint.title);
  const [summary, setSummary] = useState(initialBlueprint.summary);
  const [targetTeamSize, setTargetTeamSize] = useState<number>(initialBlueprint.targetTeamSize);
  const [lifecycle, setLifecycle] = useState<'DRAFT' | 'RECRUITING' | 'ACTIVE' | 'ARCHIVED'>('RECRUITING');
  const [requirements, setRequirements] = useState<ProjectRequirement[]>(initialBlueprint.requirements);

  // Skill Add Modal / Selector
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState<Skill | null>(null);
  const [newSkillProficiency, setNewSkillProficiency] = useState<number>(3);
  const [newSkillImportance, setNewSkillImportance] = useState<'REQUIRED' | 'PREFERRED'>('REQUIRED');
  const [newSkillNote, setNewSkillNote] = useState('');

  // Form Validation
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateRequirement = (index: number, updates: Partial<ProjectRequirementInput>) => {
    setRequirements((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAddSkill = () => {
    if (!selectedSkillToAdd) return;
    // Check if already in requirements
    if (requirements.some((r) => r.skillId === selectedSkillToAdd.id)) {
      setErrorMsg(`Skill "${selectedSkillToAdd.name}" is already in the project requirements.`);
      return;
    }

    const newReq: ProjectRequirement = {
      skillId: selectedSkillToAdd.id,
      skillName: selectedSkillToAdd.name,
      minimumProficiency: newSkillProficiency,
      importance: newSkillImportance,
      note: newSkillNote.trim() || null,
    };

    setRequirements((prev) => [...prev, newReq]);
    setIsAddSkillOpen(false);
    setSelectedSkillToAdd(null);
    setSkillSearchQuery('');
    setNewSkillNote('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Project title cannot be empty.');
      return;
    }
    if (requirements.length === 0) {
      setErrorMsg('Please specify at least one skill requirement for the team.');
      return;
    }
    setErrorMsg(null);

    const requirementsPayload: ReplaceProjectRequirements = {
      targetTeamSize,
      lifecycle,
      requirements: requirements.map((r) => ({
        skillId: r.skillId,
        minimumProficiency: r.minimumProficiency,
        importance: r.importance,
        note: r.note || null,
      })),
    };

    await onSave({
      title: title.trim(),
      summary: summary.trim(),
      domain: initialBlueprint.domain,
      requirementsData: requirementsPayload,
    });
  };

  const filteredCatalogSkills = availableSkills.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(skillSearchQuery.toLowerCase());
    const notAlreadySelected = !requirements.some((r) => r.skillId === s.id);
    return matchesSearch && notAlreadySelected;
  });

  return (
    <Card
      variant="outlined"
      style={{
        padding: '28px 32px',
        maxWidth: 880,
        margin: '0 auto',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        border: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header / Back Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-custom-color-synergy-container)',
                color: 'var(--md-custom-color-on-synergy-container)',
                fontSize: 11,
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              <MaterialSymbol name="edit_document" size={14} />
              Stage 2 — Blueprint Workbench
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 750,
                color: 'var(--md-sys-color-on-surface)',
                letterSpacing: '-0.02em',
              }}
            >
              Review & Customize Blueprint
            </h2>
          </div>

          <Button
            type="button"
            variant="outlined"
            onClick={onBackToIdea}
            disabled={isSaving}
            icon={<MaterialSymbol name="arrow_back" size={16} />}
          >
            Revise Idea
          </Button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              backgroundColor: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialSymbol name="error" size={18} />
            {errorMsg}
          </div>
        )}

        {/* Blueprint Assumptions Callout */}
        {initialBlueprint.assumptions && initialBlueprint.assumptions.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--md-sys-color-primary)',
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}
            >
              <MaterialSymbol name="info" size={14} />
              Suggested Architecture Assumptions
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 12,
                color: 'var(--md-sys-color-on-surface-variant)',
                lineHeight: 1.5,
              }}
            >
              {initialBlueprint.assumptions.map((assumption, idx) => (
                <li key={idx}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Project Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <TextField
            label="Project Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
            maxLength={120}
          />

          <TextArea
            label="Project Summary *"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isSaving}
            rows={3}
            maxLength={1000}
          />
        </div>

        {/* Section 2: Team Capacity and Lifecycle Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 28,
            padding: 16,
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            backgroundColor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {/* Target Team Size */}
          <div>
            <label
              htmlFor="blueprint-team-size"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 650,
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: 6,
              }}
            >
              Target Team Size (including creator)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setTargetTeamSize((s) => Math.max(1, s - 1))}
                disabled={isSaving || targetTeamSize <= 1}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  cursor: targetTeamSize <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                −
              </button>

              <span
                id="blueprint-team-size"
                style={{
                  fontSize: 18,
                  fontWeight: 750,
                  color: 'var(--md-sys-color-primary)',
                  minWidth: 40,
                  textAlign: 'center',
                }}
              >
                {targetTeamSize}
              </span>

              <button
                type="button"
                onClick={() => setTargetTeamSize((s) => Math.min(8, s + 1))}
                disabled={isSaving || targetTeamSize >= 8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  cursor: targetTeamSize >= 8 ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                +
              </button>

              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 6 }}>
                members
              </span>
            </div>
          </div>

          {/* Project Lifecycle */}
          <div>
            <label
              htmlFor="blueprint-lifecycle"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 650,
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: 6,
              }}
            >
              Initial Lifecycle State
            </label>
            <select
              id="blueprint-lifecycle"
              value={lifecycle}
              onChange={(e) => setLifecycle(e.target.value as any)}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="RECRUITING">Recruiting (Open for Teammates)</option>
              <option value="DRAFT">Draft (Work in Progress)</option>
              <option value="ACTIVE">Active (Team Formed)</option>
            </select>
          </div>
        </div>

        {/* Section 3: Skill Requirements Roster */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                Required Technical Competencies ({requirements.length})
              </h3>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: 12,
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Click importance badge to toggle Required/Preferred; click dots to set minimum proficiency.
              </p>
            </div>

            <Button
              type="button"
              variant="tonal"
              onClick={() => setIsAddSkillOpen(true)}
              disabled={isSaving}
              icon={<MaterialSymbol name="add" size={16} />}
            >
              Add Skill
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              padding: 16,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              minHeight: 100,
            }}
          >
            {requirements.map((req, index) => (
              <SkillRequirementChip
                key={req.skillId}
                skillId={req.skillId}
                skillName={req.skillName}
                minimumProficiency={req.minimumProficiency}
                importance={req.importance}
                note={req.note}
                isEditable={!isSaving}
                onUpdate={(updates) => handleUpdateRequirement(index, updates)}
                onRemove={() => handleRemoveRequirement(index)}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <Button
            type="button"
            variant="text"
            onClick={onBackToIdea}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="filled"
            disabled={isSaving || requirements.length === 0}
            icon={<MaterialSymbol name="check_circle" size={18} />}
          >
            {isSaving ? 'Creating Project...' : 'Save & Create Project'}
          </Button>
        </div>
      </form>

      {/* Add Skill Dialog */}
      <Dialog
        open={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        headline="Add Skill Requirement"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="text" onClick={() => setIsAddSkillOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="filled"
              disabled={!selectedSkillToAdd}
              onClick={handleConfirmAddSkill}
            >
              Add to Blueprint
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 }}>
          <TextField
            label="Search Skill Catalogue"
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            placeholder="e.g. PyTorch, Docker, React, ROS2..."
          />

          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              borderRadius: 'var(--md-sys-shape-corner-extra-small)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              padding: 6,
            }}
          >
            {filteredCatalogSkills.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
                No matching skills found.
              </div>
            ) : (
              filteredCatalogSkills.slice(0, 15).map((skill) => {
                const isSelected = selectedSkillToAdd?.id === skill.id;
                return (
                  <button
                    type="button"
                    key={skill.id}
                    onClick={() => setSelectedSkillToAdd(skill)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                      border: 'none',
                      backgroundColor: isSelected
                        ? 'var(--md-sys-color-primary-container)'
                        : 'transparent',
                      color: isSelected
                        ? 'var(--md-sys-color-on-primary-container)'
                        : 'var(--md-sys-color-on-surface)',
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{skill.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {skill.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {selectedSkillToAdd && (
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--md-sys-shape-corner-small)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                Configuring: {selectedSkillToAdd.name}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  Minimum Proficiency: Level {newSkillProficiency}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setNewSkillProficiency(lvl)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 4,
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: lvl === newSkillProficiency
                          ? 'var(--md-sys-color-primary)'
                          : 'var(--md-sys-color-surface)',
                        color: lvl === newSkillProficiency ? '#fff' : 'inherit',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  Requirement Importance
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setNewSkillImportance('REQUIRED')}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 4,
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: newSkillImportance === 'REQUIRED'
                        ? 'var(--md-sys-color-primary-container)'
                        : 'var(--md-sys-color-surface)',
                      color: newSkillImportance === 'REQUIRED'
                        ? 'var(--md-sys-color-on-primary-container)'
                        : 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    REQUIRED
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSkillImportance('PREFERRED')}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 4,
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: newSkillImportance === 'PREFERRED'
                        ? 'var(--md-sys-color-secondary-container)'
                        : 'var(--md-sys-color-surface)',
                      color: newSkillImportance === 'PREFERRED'
                        ? 'var(--md-sys-color-on-secondary-container)'
                        : 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    PREFERRED
                  </button>
                </div>
              </div>

              <TextField
                label="Role or task context (optional)"
                value={newSkillNote}
                onChange={(e) => setNewSkillNote(e.target.value)}
                placeholder="e.g. Lead edge sensor firmware"
                maxLength={300}
              />
            </div>
          )}
        </div>
      </Dialog>
    </Card>
  );
};
