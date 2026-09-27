import React from 'react';
import { Button, Card, MaterialSymbol } from '../components/m3';
import { User } from '../types/api';

interface WelcomeViewProps {
  currentUser: User | null;
  onEnterDashboard: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  currentUser,
  onEnterDashboard,
}) => {
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Scholar';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--md-sys-color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative M3 Expressive Background Shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '280px',
          height: '280px',
          borderRadius: 'var(--md-sys-shape-corner-xl)',
          backgroundColor: 'var(--md-sys-color-primary-container)',
          opacity: 0.45,
          transform: 'rotate(15deg)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          backgroundColor: 'var(--md-sys-color-tertiary-container)',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
      />

      <Card
        variant="elevated"
        style={{
          maxWidth: '720px',
          width: '100%',
          padding: '40px 36px',
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: 'var(--md-sys-elevation-level-2)',
          zIndex: 1,
        }}
      >
        {/* M3 Expressive Hero Illustration Collage */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {/* Flower / Scallop Shape */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '24px',
              backgroundColor: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-8deg)',
            }}
          >
            <MaterialSymbol name="hub" size={32} />
          </div>

          {/* Central Hexagon / Pill Shape */}
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: 'var(--md-sys-shape-corner-xl)',
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-level-2)',
            }}
          >
            <MaterialSymbol name="token" size={40} />
          </div>

          {/* Pill Shape */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              backgroundColor: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(8deg)',
            }}
          >
            <MaterialSymbol name="rocket_launch" size={30} />
          </div>
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          <MaterialSymbol name="auto_awesome" size={16} />
          Academic Collaboration Launchpad
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--md-ref-typeface-brand)',
            fontSize: '36px',
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--md-sys-color-on-surface)',
            margin: '0 0 12px 0',
          }}
        >
          Welcome to MESH, {firstName}!
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'var(--md-sys-color-on-surface-variant)',
            maxWidth: '560px',
            margin: '0 0 32px 0',
          }}
        >
          Your campus profile is ready. Discover peer collaborators, explore open project teams, coordinate daily tasks, and manage project milestones—all from your new collaborative dashboard.
        </p>

        {/* Feature Highlights Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            width: '100%',
            marginBottom: '36px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <div style={{ color: 'var(--md-sys-color-primary)', marginBottom: '8px' }}>
              <MaterialSymbol name="style" size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
              Discovery Deck
            </div>
            <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              Tactile cards with Nope, Maybe, and Yoppo! actions.
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <div style={{ color: 'var(--md-sys-color-tertiary)', marginBottom: '8px' }}>
              <MaterialSymbol name="event_upcoming" size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
              Integrated Calendar
            </div>
            <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              Track milestones, sprint deadlines, and team syncs.
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <div style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '8px' }}>
              <MaterialSymbol name="checklist" size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
              Daily Tasks
            </div>
            <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              Live to-do checklist syncing with project workspaces.
            </div>
          </div>
        </div>

        {/* Enter Dashboard Action */}
        <Button
          variant="filled"
          onClick={onEnterDashboard}
          trailingIcon={<MaterialSymbol name="arrow_forward" size={20} />}
          style={{
            minHeight: '52px',
            padding: '0 36px',
            fontSize: '16px',
            borderRadius: 'var(--md-sys-shape-corner-full)',
          }}
        >
          Enter Dashboard
        </Button>
      </Card>
    </div>
  );
};
