import React, { useState } from 'react';
import { MaterialSymbol } from '../m3';

export interface MilestoneEvent {
  date: number; // day of month
  title: string;
  project: string;
  type: 'milestone' | 'sprint' | 'review';
}

const DEFAULT_MILESTONES: Record<number, MilestoneEvent[]> = {
  15: [
    { date: 15, title: 'Sensor Fusion Pipeline Review', project: 'Autonomous Rover', type: 'review' },
  ],
  18: [
    { date: 18, title: 'Sprint 2 Retrospective', project: 'Biomedical Sensing', type: 'sprint' },
  ],
  22: [
    { date: 22, title: 'System Architecture Submission', project: 'Campus Mobility', type: 'milestone' },
  ],
  28: [
    { date: 28, title: 'Mid-term Demo Showcase', project: 'All Projects', type: 'milestone' },
  ],
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarWidget: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // September (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number>(15);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Basic calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  const activeMilestones = DEFAULT_MILESTONES[selectedDay] || [];

  return (
    <div
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-xl)',
        padding: '16px',
        border: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header Month Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            color: 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Previous Month"
        >
          <MaterialSymbol name="chevron_left" size={20} />
        </button>

        <span
          style={{
            fontFamily: 'var(--md-ref-typeface-brand)',
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--md-sys-color-on-surface)',
            letterSpacing: '0.1px',
          }}
        >
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>

        <button
          onClick={nextMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            color: 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Next Month"
        >
          <MaterialSymbol name="chevron_right" size={20} />
        </button>
      </div>

      {/* Weekday Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--md-sys-color-on-surface-variant)',
          opacity: 0.85,
        }}
      >
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
        <span>S</span>
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          textAlign: 'center',
        }}
      >
        {/* Leading blanks */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`blank-${i}`} style={{ height: '28px' }} />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected = dayNum === selectedDay;
          const isToday = currentMonth === 8 && currentYear === 2026 && dayNum === 15;
          const hasMilestone = Boolean(DEFAULT_MILESTONES[dayNum]);

          return (
            <button
              key={`day-${dayNum}`}
              onClick={() => setSelectedDay(dayNum)}
              style={{
                height: '28px',
                width: '28px',
                margin: '0 auto',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: isSelected || isToday ? 700 : 500,
                backgroundColor: isSelected
                  ? 'var(--md-sys-color-primary)'
                  : isToday
                  ? 'var(--md-sys-color-primary-container)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--md-sys-color-on-primary)'
                  : isToday
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'background-color 150ms ease',
              }}
            >
              <span>{dayNum}</span>
              {hasMilestone && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: isSelected
                      ? 'var(--md-sys-color-on-primary)'
                      : 'var(--md-sys-color-tertiary)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda Snippet */}
      {activeMilestones.length > 0 ? (
        <div
          style={{
            marginTop: '4px',
            padding: '8px 10px',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderLeft: '3px solid var(--md-sys-color-tertiary)',
            fontSize: '11px',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
            {activeMilestones[0].title}
          </div>
          <div style={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
            {activeMilestones[0].project}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: '4px',
            padding: '6px 10px',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            fontSize: '11px',
            color: 'var(--md-sys-color-on-surface-variant)',
            textAlign: 'center',
          }}
        >
          No deliverables scheduled for Sept {selectedDay}.
        </div>
      )}
    </div>
  );
};
