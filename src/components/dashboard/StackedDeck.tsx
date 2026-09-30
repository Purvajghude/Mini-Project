import React, { useState, useEffect, useCallback } from 'react';
import { MaterialSymbol, Avatar } from '../m3';
import { CandidateRecommendation, Project } from '../../types/api';

export interface DeckCardItem {
  id: string;
  kind: 'student' | 'project';
  title: string;
  subtitle: string;
  description: string;
  category: string;
  metaBadge: string;
  score: number;
  avatarKey?: string;
  skills?: string[];
  rawItem: CandidateRecommendation | Project;
}

interface StackedDeckProps {
  items: DeckCardItem[];
  onNope: (item: DeckCardItem) => void;
  onMaybe: (item: DeckCardItem) => void;
  onYoppo: (item: DeckCardItem) => void;
  onSelectDetails?: (item: DeckCardItem) => void;
}

export const StackedDeck: React.FC<StackedDeckProps> = ({
  items,
  onNope,
  onMaybe,
  onYoppo,
  onSelectDetails,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<'nope' | 'maybe' | 'yoppo' | null>(null);

  // Keep index in bounds if items change
  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [items.length, currentIndex]);

  const handleAction = useCallback(
    (type: 'nope' | 'maybe' | 'yoppo') => {
      if (items.length === 0) return;
      const currentItem = items[currentIndex % items.length];
      setActionFeedback(type);

      setTimeout(() => {
        setActionFeedback(null);
        if (type === 'nope') onNope(currentItem);
        if (type === 'maybe') onMaybe(currentItem);
        if (type === 'yoppo') onYoppo(currentItem);

        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, 180);
    },
    [items, currentIndex, onNope, onMaybe, onYoppo]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAction('nope');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleAction('maybe');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAction('yoppo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  if (items.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          border: '1px dashed var(--md-sys-color-outline-variant)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <MaterialSymbol name="checklist_rtl" size={32} />
        </div>
        <h3
          style={{
            fontFamily: 'var(--md-ref-typeface-brand)',
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 0 6px 0',
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          Deck Complete
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--md-sys-color-on-surface-variant)',
            maxWidth: '380px',
            margin: '0 0 20px 0',
          }}
        >
          You've reviewed all student collaborator recommendations and project listings for today.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Review Deck Again
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex % items.length];
  const nextItem1 = items[(currentIndex + 1) % items.length];
  const nextItem2 = items[(currentIndex + 2) % items.length];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
      }}
    >
      {/* 3D Stack Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '320px',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Layer 3 (Bottom-most back card) */}
        {nextItem2 && (
          <div
            style={{
              position: 'absolute',
              top: '0px',
              width: '92%',
              height: '100%',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              transform: 'translateY(-24px) scale(0.92)',
              opacity: 0.5,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Layer 2 (Middle back card) */}
        {nextItem1 && (
          <div
            style={{
              position: 'absolute',
              top: '0px',
              width: '96%',
              height: '100%',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              transform: 'translateY(-12px) scale(0.96)',
              opacity: 0.8,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Layer 1 (Top Active Card) */}
        <div
          onClick={() => onSelectDetails?.(currentItem)}
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            border: `1px solid ${
              actionFeedback === 'yoppo'
                ? 'var(--action-yoppo-on-container)'
                : actionFeedback === 'nope'
                ? 'var(--action-nope-on-container)'
                : actionFeedback === 'maybe'
                ? 'var(--action-maybe-on-container)'
                : 'var(--md-sys-color-outline-variant)'
            }`,
            padding: '24px',
            boxShadow: 'var(--md-sys-elevation-level-2)',
            zIndex: 3,
            cursor: onSelectDetails ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'row',
            gap: '24px',
            alignItems: 'stretch',
            transition: 'border-color 150ms ease, transform 180ms ease',
            transform:
              actionFeedback === 'yoppo'
                ? 'translateX(24px) rotate(2deg)'
                : actionFeedback === 'nope'
                ? 'translateX(-24px) rotate(-2deg)'
                : actionFeedback === 'maybe'
                ? 'translateY(-16px)'
                : 'none',
          }}
        >
          {/* Card Left: Visual Thumbnail / Avatar */}
          <div
            style={{
              width: '180px',
              minWidth: '180px',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              backgroundColor:
                currentItem.kind === 'student'
                  ? 'var(--md-sys-color-secondary-container)'
                  : 'var(--md-sys-color-primary-container)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {currentItem.kind === 'student' ? (
              <>
                <Avatar
                  name={currentItem.title}
                  tone={currentItem.avatarKey || 'blue'}
                  size="xl"
                />
                <span
                  style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: 'var(--md-sys-color-on-secondary-container)',
                  }}
                >
                  Student Peer
                </span>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--md-sys-shape-corner-xl)',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialSymbol name="rocket_launch" size={36} />
                </div>
                <span
                  style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: 'var(--md-sys-color-on-primary-container)',
                  }}
                >
                  Project Team
                </span>
              </>
            )}

            {/* Match Score Badge */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '3px 8px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                color: 'var(--md-sys-color-primary)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: 'var(--md-sys-elevation-level-1)',
              }}
            >
              <MaterialSymbol name="auto_awesome" size={12} fill />
              {currentItem.score}%
            </div>
          </div>

          {/* Card Right: Information & Metadata */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--md-ref-typeface-brand)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-on-surface)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentItem.title}
                </h3>
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--md-sys-color-secondary)',
                  marginBottom: '10px',
                }}
              >
                {currentItem.subtitle}
              </div>

              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: 'var(--md-sys-color-on-surface-variant)',
                  margin: '0 0 16px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {currentItem.description}
              </p>
            </div>

            {/* Tags row: Category & Meta Info */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {currentItem.category}
              </span>

              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: 'var(--md-sys-color-tertiary-container)',
                  color: 'var(--md-sys-color-on-tertiary-container)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {currentItem.metaBadge}
              </span>

              {currentItem.skills && currentItem.skills.slice(0, 2).map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls (< ● ● ● ● >) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
          }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            color: 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Previous Card"
        >
          <MaterialSymbol name="chevron_left" size={24} />
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {items.slice(0, Math.min(items.length, 6)).map((_, idx) => {
            const isActive = idx === (currentIndex % Math.min(items.length, 6));
            return (
              <span
                key={`dot-${idx}`}
                style={{
                  width: isActive ? '20px' : '8px',
                  height: '8px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: isActive
                    ? 'var(--md-sys-color-primary)'
                    : 'var(--md-sys-color-outline-variant)',
                  transition: 'all 200ms ease',
                }}
              />
            );
          })}
        </div>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            color: 'var(--md-sys-color-on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Next Card"
        >
          <MaterialSymbol name="chevron_right" size={24} />
        </button>
      </div>

      {/* Expressive Action Buttons (Nope, Maybe, Yoppo!) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
        }}
      >
        {/* Nope (X) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleAction('nope')}
            title="Nope (Pass) — Left Arrow"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '2px solid var(--action-nope-on-container)',
              backgroundColor: 'var(--action-nope-container)',
              color: 'var(--action-nope-on-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-level-1)',
              transition: 'transform 150ms ease, background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="close" size={32} weight={600} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
            Nope
          </span>
        </div>

        {/* Maybe (★) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleAction('maybe')}
            title="Maybe (Bookmark) — Up Arrow"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '2px solid var(--action-maybe-on-container)',
              backgroundColor: 'var(--action-maybe-container)',
              color: 'var(--action-maybe-on-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-level-1)',
              transition: 'transform 150ms ease, background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="star" size={32} fill weight={600} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
            Maybe
          </span>
        </div>

        {/* Yoppo! (♡) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleAction('yoppo')}
            title="Yoppo! (Connect) — Right Arrow"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '2px solid var(--action-yoppo-on-container)',
              backgroundColor: 'var(--action-yoppo-container)',
              color: 'var(--action-yoppo-on-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-level-1)',
              transition: 'transform 150ms ease, background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="favorite" size={32} fill weight={600} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
            Yoppo!
          </span>
        </div>
      </div>
    </div>
  );
};
