import React from 'react';
import './m3.css';

export interface NavDestination {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badgeCount?: number;
}

export interface NavigationProps {
  destinations: NavDestination[];
  activeId: string;
  onNavigate: (id: string) => void;
  brandSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export const NavigationRail: React.FC<NavigationProps> = ({
  destinations,
  activeId,
  onNavigate,
  brandSlot,
  footerSlot,
}) => {
  return (
    <aside className="m3-nav-rail" aria-label="Primary navigation rail">
      {brandSlot && <div className="m3-nav-rail-brand">{brandSlot}</div>}
      <nav className="m3-nav-rail-destinations">
        {destinations.map((dest) => {
          const isActive = dest.id === activeId;
          return (
            <button
              key={dest.id}
              type="button"
              className={`m3-nav-destination ${isActive ? 'm3-nav-destination-active' : ''}`}
              onClick={() => onNavigate(dest.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="m3-nav-indicator">
                {isActive && dest.activeIcon ? dest.activeIcon : dest.icon}
                {dest.badgeCount && dest.badgeCount > 0 ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--md-sys-color-error)',
                    }}
                  />
                ) : null}
              </div>
              <span className="m3-nav-label">{dest.label}</span>
            </button>
          );
        })}
      </nav>
      {footerSlot && <div className="m3-nav-rail-footer">{footerSlot}</div>}
    </aside>
  );
};

export const NavigationBar: React.FC<Omit<NavigationProps, 'brandSlot' | 'footerSlot'>> = ({
  destinations,
  activeId,
  onNavigate,
}) => {
  return (
    <nav className="m3-nav-bar" aria-label="Mobile navigation bar">
      {destinations.map((dest) => {
        const isActive = dest.id === activeId;
        return (
          <button
            key={dest.id}
            type="button"
            className={`m3-nav-destination ${isActive ? 'm3-nav-destination-active' : ''}`}
            onClick={() => onNavigate(dest.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="m3-nav-indicator">
              {isActive && dest.activeIcon ? dest.activeIcon : dest.icon}
              {dest.badgeCount && dest.badgeCount > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 12,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-error)',
                  }}
                />
              ) : null}
            </div>
            <span className="m3-nav-label">{dest.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
