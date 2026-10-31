import React, { useState } from 'react';
import { Button, Card, MaterialSymbol, TextArea, TextField } from '../m3';
import { BlueprintSuggestionRequest } from '../../types/api';

export interface ProjectIdeaInputProps {
  onSubmit: (request: BlueprintSuggestionRequest) => Promise<void>;
  isLoading?: boolean;
  availableDomains?: string[];
}

const PRESET_IDEAS = [
  {
    label: 'Campus Navigation & Accessibility',
    domain: 'CAMPUS_INFRASTRUCTURE',
    teamSize: 3,
    idea: 'An interactive campus map highlighting wheelchair-accessible ramps, working elevators, and indoor routes with low crowd density.',
  },
  {
    label: 'Autonomous Recycling Rover',
    domain: 'AI_AND_ROBOTICS',
    teamSize: 4,
    idea: 'A compact ground rover using computer vision and LiDAR to detect and sort plastic bottles and cans across campus grounds.',
  },
  {
    label: 'Peer Study & Notes Exchange',
    domain: 'WEB_DEVELOPMENT',
    teamSize: 3,
    idea: 'A collaborative markdown study hub where engineering students share peer-reviewed lecture summaries and past exam prep materials.',
  },
];

const DOMAIN_OPTIONS = [
  { value: '', label: 'Auto-detect domain' },
  { value: 'AI_AND_ROBOTICS', label: 'AI & Robotics' },
  { value: 'CAMPUS_INFRASTRUCTURE', label: 'Campus Infrastructure' },
  { value: 'CIVIC_AND_SOCIAL', label: 'Civic & Social Impact' },
  { value: 'HEALTH_TECH', label: 'HealthTech & Bio' },
  { value: 'WEB_DEVELOPMENT', label: 'Web & Distributed Systems' },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Apps' },
  { value: 'EMBEDDED_SYSTEMS', label: 'Embedded & IoT' },
];

export const ProjectIdeaInput: React.FC<ProjectIdeaInputProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [ideaText, setIdeaText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [targetTeamSize, setTargetTeamSize] = useState<number>(3);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePresetClick = (preset: typeof PRESET_IDEAS[0]) => {
    setIdeaText(preset.idea);
    setSelectedDomain(preset.domain);
    setTargetTeamSize(preset.teamSize);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ideaText.trim();
    if (!trimmed) {
      setValidationError('Please describe your project idea before generating a blueprint.');
      return;
    }
    if (trimmed.length < 10) {
      setValidationError('Please provide at least a few words so MESH can identify skill requirements.');
      return;
    }
    setValidationError(null);

    await onSubmit({
      idea: trimmed,
      domain: selectedDomain || null,
      targetTeamSize: targetTeamSize || undefined,
    });
  };

  return (
    <Card
      variant="outlined"
      style={{
        padding: '28px 32px',
        maxWidth: 760,
        margin: '0 auto',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        border: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontSize: 11,
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            <MaterialSymbol name="lightbulb" size={14} />
            Stage 1 — Idea Entry
          </div>

          <h2
            style={{
              margin: '0 0 6px 0',
              fontSize: 22,
              fontWeight: 750,
              color: 'var(--md-sys-color-on-surface)',
              letterSpacing: '-0.02em',
            }}
          >
            Describe your project idea.
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--md-sys-color-on-surface-variant)',
              lineHeight: 1.5,
            }}
          >
            Tell MESH what you want to build in everyday language. We will suggest an
            editable blueprint with required skills, competencies, and team roles.
          </p>
        </div>

        {/* Preset Starter Ideas */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 650,
              color: 'var(--md-sys-color-on-surface-variant)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Need inspiration? Try a template:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_IDEAS.map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface)';
                }}
              >
                <MaterialSymbol name="auto_awesome" size={14} color="var(--md-sys-color-primary)" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Idea Textarea Input */}
        <div style={{ marginBottom: 18 }}>
          <TextArea
            label="Project Description & Goals *"
            value={ideaText}
            onChange={(e) => {
              setIdeaText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="e.g. A cross-platform mobile application using Flutter and Firebase that lets students track real-time dining hall crowds and dietary tags..."
            rows={4}
            error={validationError || undefined}
            disabled={isLoading}
            maxLength={2000}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 4,
              fontSize: 11,
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {ideaText.length} / 2000
          </div>
        </div>

        {/* Optional Domain and Team Size Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
            padding: '16px',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            backgroundColor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {/* Domain Dropdown */}
          <div>
            <label
              htmlFor="domain-select"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 650,
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: 6,
              }}
            >
              Primary Engineering Domain
            </label>
            <select
              id="domain-select"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: 13,
                fontWeight: 500,
                outline: 'none',
              }}
            >
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Team Size Stepper */}
          <div>
            <label
              htmlFor="team-size-stepper"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 650,
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: 6,
              }}
            >
              Initial Target Team Size (1 – 8)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setTargetTeamSize((prev) => Math.max(1, prev - 1))}
                disabled={isLoading || targetTeamSize <= 1}
                aria-label="Decrease team size"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  cursor: targetTeamSize <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                −
              </button>

              <span
                id="team-size-stepper"
                style={{
                  fontSize: 16,
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
                onClick={() => setTargetTeamSize((prev) => Math.min(8, prev + 1))}
                disabled={isLoading || targetTeamSize >= 8}
                aria-label="Increase team size"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  cursor: targetTeamSize >= 8 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                +
              </button>

              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 6 }}>
                {targetTeamSize === 1 ? 'student (solo)' : 'students total'}
              </span>
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <MaterialSymbol name="security" size={16} />
            Deterministic template generator &middot; No mock data
          </div>

          <Button
            type="submit"
            variant="filled"
            disabled={isLoading || !ideaText.trim()}
            icon={<MaterialSymbol name="terminal" size={18} />}
          >
            {isLoading ? 'Generating Blueprint...' : 'Generate Project Blueprint'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
