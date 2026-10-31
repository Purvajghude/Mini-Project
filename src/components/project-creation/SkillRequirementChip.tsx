import React from 'react';
import { ProjectRequirementInput } from '../../types/api';
import { MaterialSymbol } from '../m3';

export interface SkillRequirementChipProps {
  skillId: number;
  skillName: string;
  minimumProficiency: number; // 1 to 5
  importance: 'REQUIRED' | 'PREFERRED';
  note?: string | null;
  isEditable?: boolean;
  onUpdate?: (updates: Partial<ProjectRequirementInput>) => void;
  onRemove?: () => void;
}

const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Novice',
  2: 'Adv. Beginner',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
};

export const SkillRequirementChip: React.FC<SkillRequirementChipProps> = ({
  skillId,
  skillName,
  minimumProficiency,
  importance,
  note,
  isEditable = false,
  onUpdate,
  onRemove,
}) => {
  const isRequired = importance === 'REQUIRED';

  const handleImportanceToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditable || !onUpdate) return;
    onUpdate({ importance: isRequired ? 'PREFERRED' : 'REQUIRED' });
  };

  const handleProficiencyChange = (newLevel: number) => {
    if (!isEditable || !onUpdate) return;
    onUpdate({ minimumProficiency: newLevel });
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 6,
        padding: '10px 14px',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        backgroundColor: isRequired
          ? 'var(--md-sys-color-surface-container-high)'
          : 'var(--md-sys-color-surface-container)',
        border: `1px solid ${
          isRequired
            ? 'var(--md-sys-color-primary)'
            : 'var(--md-sys-color-outline-variant)'
        }`,
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        minWidth: 220,
        maxWidth: 320,
      }}
    >
      {/* Top Row: Skill Name, Importance Tag, Delete */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--md-sys-color-on-surface)',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={skillName}
        >
          {skillName}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleImportanceToggle}
            disabled={!isEditable}
            title={isEditable ? 'Click to toggle Required / Preferred' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              fontSize: 10,
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: 'none',
              cursor: isEditable ? 'pointer' : 'default',
              backgroundColor: isRequired
                ? 'var(--md-sys-color-primary-container)'
                : 'var(--md-sys-color-secondary-container)',
              color: isRequired
                ? 'var(--md-sys-color-on-primary-container)'
                : 'var(--md-sys-color-on-secondary-container)',
              transition: 'all 0.15s ease',
            }}
          >
            {isRequired ? 'Required' : 'Preferred'}
          </button>

          {isEditable && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove skill requirement"
              aria-label={`Remove ${skillName}`}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--md-sys-color-on-surface-variant)',
                borderRadius: '50%',
              }}
            >
              <MaterialSymbol name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Discrete Proficiency Pips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((level) => {
            const isFilled = level <= minimumProficiency;
            return (
              <button
                type="button"
                key={level}
                onClick={() => handleProficiencyChange(level)}
                disabled={!isEditable}
                title={`Level ${level}: ${PROFICIENCY_LABELS[level]}`}
                aria-label={`Set minimum proficiency to ${level}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: isFilled
                    ? 'none'
                    : '1.5px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: isFilled
                    ? 'var(--md-sys-color-primary)'
                    : 'transparent',
                  padding: 0,
                  cursor: isEditable ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface-variant)',
            fontFamily: 'monospace',
          }}
        >
          Min: {PROFICIENCY_LABELS[minimumProficiency] || `Lvl ${minimumProficiency}`}
        </span>
      </div>

      {/* Optional Note / Context */}
      {note && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--md-sys-color-on-surface-variant)',
            fontStyle: 'italic',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={note}
        >
          &ldquo;{note}&rdquo;
        </div>
      )}
    </div>
  );
};

