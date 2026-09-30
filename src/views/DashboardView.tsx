import React, { useState, useMemo } from 'react';
import {
  MaterialSymbol,
  Avatar,
  Dialog,
  Button,
} from '../components/m3';
import { CandidateRecommendation, Profile, Project } from '../types/api';
import { StackedDeck, DeckCardItem } from '../components/dashboard/StackedDeck';
import { CalendarWidget } from '../components/dashboard/CalendarWidget';
import { TodoWidget } from '../components/dashboard/TodoWidget';
import { QuickActionsToolbar } from '../components/dashboard/QuickActionsToolbar';

interface DashboardViewProps {
  currentUser: Profile | null;
  recommendations: CandidateRecommendation[];
  projects: Project[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  onConnect: (candidate: CandidateRecommendation) => void;
  onPass: (candidateId: string) => void;
  onSave: (candidateId: string) => void;
  onSignOut: () => void;
  onReplayWelcome: () => void;
  onToast: (msg: string) => void;
  unreadCount?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  recommendations,
  projects,
  activeRoute,
  onNavigate,
  onConnect,
  onPass,
  onSave,
  onSignOut,
  onReplayWelcome,
  onToast,
  unreadCount = 2,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'students' | 'projects'>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<DeckCardItem | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Blend candidates and projects into a unified deck
  const blendedDeckItems: DeckCardItem[] = useMemo(() => {
    const studentCards: DeckCardItem[] = recommendations.map((c) => ({
      id: c.userId,
      kind: 'student',
      title: c.displayName,
      subtitle: `${c.department} • Year ${c.yearOfStudy}`,
      description: c.bio || c.reason,
      category: c.primaryDomain || 'Student Peer',
      metaBadge: c.availability || 'Available',
      score: c.score,
      avatarKey: c.avatarKey,
      skills: c.skills?.map((s) => s.name),
      rawItem: c,
    }));

    const projectCards: DeckCardItem[] = projects.map((p) => ({
      id: p.id,
      kind: 'project',
      title: p.title,
      subtitle: `${p.department || 'Multidisciplinary'} • ${p.category}`,
      description: p.description,
      category: p.category,
      metaBadge: `${p.members?.length || 1} / ${p.requiredRoles?.length || 4} Members`,
      score: 92,
      skills: p.techStack,
      rawItem: p,
    }));

    // Interleave
    const blended: DeckCardItem[] = [];
    const maxLen = Math.max(studentCards.length, projectCards.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < studentCards.length) blended.push(studentCards[i]);
      if (i < projectCards.length) blended.push(projectCards[i]);
    }

    // Filter by kind and search
    return blended.filter((item) => {
      if (filterKind === 'students' && item.kind !== 'student') return false;
      if (filterKind === 'projects' && item.kind !== 'project') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.skills?.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [recommendations, projects, filterKind, searchQuery]);

  const handleNope = (item: DeckCardItem) => {
    if (item.kind === 'student') {
      onPass(item.id);
    }
    onToast(`Passed on ${item.title}.`);
  };

  const handleMaybe = (item: DeckCardItem) => {
    if (item.kind === 'student') {
      onSave(item.id);
    } else {
      onToast(`Bookmarked ${item.title} to your project list.`);
    }
  };

  const handleYoppo = (item: DeckCardItem) => {
    if (item.kind === 'student') {
      onConnect(item.rawItem as CandidateRecommendation);
    } else {
      onToast(`Team join request sent for ${item.title}!`);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Desktop: fixed rail / drawer)       */}
      {/* ============================================================== */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRight: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <div>
          {/* Logo & Brand Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 8px 24px 8px',
              borderBottom: '1px solid var(--md-sys-color-outline-variant)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--md-sys-elevation-level-1)',
              }}
            >
              <MaterialSymbol name="token" size={24} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--md-ref-typeface-brand)',
                  fontWeight: 800,
                  fontSize: '18px',
                  letterSpacing: '0.4px',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                MESH
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Campus Collaboration
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'discover', label: 'Discover', icon: 'explore' },
              { id: 'community', label: 'Community', icon: 'group' },
              { id: 'chat', label: 'Chat', icon: 'chat_bubble' },
              { id: 'projects', label: 'Projects', icon: 'folder_open' },
              { id: 'resources', label: 'Resources', icon: 'menu_book' },
            ].map((nav) => {
              const isActive = activeRoute === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => onNavigate(nav.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 18px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: isActive
                      ? 'var(--md-sys-color-secondary-container)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    border: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <MaterialSymbol
                    name={nav.icon}
                    size={22}
                    fill={isActive}
                    color={
                      isActive
                        ? 'var(--md-sys-color-on-secondary-container)'
                        : 'var(--md-sys-color-on-surface-variant)'
                    }
                  />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card / Footer */}
        <div
          onClick={() => onNavigate('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            cursor: 'pointer',
          }}
        >
          <Avatar
            name={currentUser?.displayName || 'User'}
            tone={currentUser?.avatarKey || 'blue'}
            size="sm"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentUser?.displayName || 'Student Scholar'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--md-sys-color-on-surface-variant)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentUser?.department || 'View Profile'}
            </div>
          </div>
          <MaterialSymbol name="chevron_right" size={20} color="var(--md-sys-color-outline)" />
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. CENTER CONTENT AREA & TOP APP BAR                            */}
      {/* ============================================================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Top App Bar with Global Search & User Actions */}
        <header
          style={{
            height: '68px',
            backgroundColor: 'var(--md-sys-color-surface)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 15,
            gap: '16px',
          }}
        >
          {/* Mobile Hamburger Menu Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--md-sys-color-on-surface)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
            }}
            aria-label="Open Navigation Menu"
          >
            <MaterialSymbol name="menu" size={26} />
          </button>

          {/* Search Field */}
          <div
            style={{
              flex: 1,
              maxWidth: '540px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--md-sys-color-outline)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <MaterialSymbol name="search" size={20} />
            </span>
            <input
              type="text"
              placeholder="Search for items, people, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 16px 0 44px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 150ms ease, background-color 150ms ease',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-outline)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <MaterialSymbol name="close" size={16} />
              </button>
            )}
          </div>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            {/* Mobile Tools Trigger */}
            <button
              className="mobile-tools-trigger"
              onClick={() => setMobileToolsOpen(true)}
              title="Open Calendar & Tasks"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--md-sys-color-on-surface-variant)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
              }}
            >
              <MaterialSymbol name="calendar_month" size={22} />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              title="Notifications"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                position: 'relative',
              }}
            >
              <MaterialSymbol name="notifications" size={24} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-error)',
                    color: 'var(--md-sys-color-on-error)',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Drawer */}
            {alertsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '320px',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  boxShadow: 'var(--md-sys-elevation-level-3)',
                  padding: '16px',
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Team Alerts</span>
                  <button
                    onClick={() => setAlertsOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <MaterialSymbol name="close" size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>Divya Kokane</div>
                    <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Requested to connect on Backend & APIs.
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>Autonomous Rover</div>
                    <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      New sprint task assigned to your role.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Profile Avatar with dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Avatar
                  name={currentUser?.displayName || 'User'}
                  tone={currentUser?.avatarKey || 'blue'}
                  size="sm"
                />
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '200px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    boxShadow: 'var(--md-sys-elevation-level-3)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('profile');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: 'var(--md-sys-color-on-surface)',
                      textAlign: 'left',
                    }}
                  >
                    <MaterialSymbol name="person" size={18} />
                    View Profile
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('settings');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: 'var(--md-sys-color-on-surface)',
                      textAlign: 'left',
                    }}
                  >
                    <MaterialSymbol name="settings" size={18} />
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onReplayWelcome();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: 'var(--md-sys-color-on-surface)',
                      textAlign: 'left',
                    }}
                  >
                    <MaterialSymbol name="celebration" size={18} />
                    Replay Welcome
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: 'var(--md-sys-color-error)',
                      textAlign: 'left',
                    }}
                  >
                    <MaterialSymbol name="logout" size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Center Content Stream (Feed + Card Stack) */}
        <div
          style={{
            flex: 1,
            padding: '24px 20px 40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '28px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              { id: 'all', label: 'All Discovery' },
              { id: 'students', label: 'Student Peers' },
              { id: 'projects', label: 'Open Projects' },
            ].map((f) => {
              const isSelected = filterKind === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterKind(f.id as any)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: isSelected
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-surface-container)',
                    color: isSelected
                      ? 'var(--md-sys-color-on-primary)'
                      : 'var(--md-sys-color-on-surface)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Stacked Discovery Deck */}
          <StackedDeck
            items={blendedDeckItems}
            onNope={handleNope}
            onMaybe={handleMaybe}
            onYoppo={handleYoppo}
            onSelectDetails={(item) => setSelectedItemDetails(item)}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. RIGHT SIDE-CAR PANEL (Desktop >= 1100px)                    */}
      {/* ============================================================== */}
      <aside
        className="desktop-sidecar"
        style={{
          width: '320px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--md-sys-color-surface)',
          borderLeft: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px 16px',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <CalendarWidget />
        <TodoWidget />
        <QuickActionsToolbar
          onOpenSchedule={() => onNavigate('projects')}
          onOpenNotifications={() => setAlertsOpen(true)}
          onCreateProject={() => onNavigate('projects')}
        />
      </aside>

      {/* ============================================================== */}
      {/* 4. MOBILE SLIDE-IN NAVIGATION DRAWER                           */}
      {/* ============================================================== */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
          }}
        >
          {/* Scrim backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
            }}
          />

          {/* Drawer content */}
          <div
            style={{
              position: 'relative',
              width: '280px',
              height: '100%',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--md-sys-elevation-level-4)',
              zIndex: 101,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MaterialSymbol name="token" size={24} color="var(--md-sys-color-primary)" />
                  <span style={{ fontWeight: 800, fontSize: '18px' }}>MESH</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <MaterialSymbol name="close" size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { id: 'discover', label: 'Discover', icon: 'explore' },
                  { id: 'community', label: 'Community', icon: 'group' },
                  { id: 'chat', label: 'Chat', icon: 'chat_bubble' },
                  { id: 'projects', label: 'Projects', icon: 'folder_open' },
                  { id: 'resources', label: 'Resources', icon: 'menu_book' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onNavigate(item.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      backgroundColor:
                        activeRoute === item.id
                          ? 'var(--md-sys-color-secondary-container)'
                          : 'transparent',
                      border: 'none',
                      color:
                        activeRoute === item.id
                          ? 'var(--md-sys-color-on-secondary-container)'
                          : 'var(--md-sys-color-on-surface)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <MaterialSymbol name={item.icon} size={22} fill={activeRoute === item.id} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onNavigate('profile');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <MaterialSymbol name="person" size={20} />
                Profile
              </button>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onNavigate('settings');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <MaterialSymbol name="settings" size={20} />
                Settings
              </button>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onSignOut();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-error)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <MaterialSymbol name="logout" size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MOBILE TOOLS MODAL (Calendar & Today's tasks)                */}
      {/* ============================================================== */}
      {mobileToolsOpen && (
        <Dialog
          open={mobileToolsOpen}
          onClose={() => setMobileToolsOpen(false)}
          headline="Calendar & Tasks"
          actions={
            <Button variant="text" onClick={() => setMobileToolsOpen(false)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CalendarWidget />
            <TodoWidget />
          </div>
        </Dialog>
      )}

      {/* ============================================================== */}
      {/* 6. CARD DETAILS MODAL (When card is clicked)                   */}
      {/* ============================================================== */}
      {selectedItemDetails && (
        <Dialog
          open={Boolean(selectedItemDetails)}
          onClose={() => setSelectedItemDetails(null)}
          headline={selectedItemDetails.title}
          actions={
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  handleNope(selectedItemDetails);
                  setSelectedItemDetails(null);
                }}
              >
                Pass
              </Button>
              <Button
                variant="filled"
                onClick={() => {
                  handleYoppo(selectedItemDetails);
                  setSelectedItemDetails(null);
                }}
              >
                Connect / Yoppo!
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-secondary)' }}>
              {selectedItemDetails.subtitle}
            </div>

            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--md-sys-color-on-surface-variant)' }}>
              {selectedItemDetails.description}
            </p>

            {selectedItemDetails.skills && selectedItemDetails.skills.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Skills & Technologies:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedItemDetails.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                        backgroundColor: 'var(--md-sys-color-secondary-container)',
                        color: 'var(--md-sys-color-on-secondary-container)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Media query styling for responsive breakpoint */}
      <style>{`
        @media (max-width: 1080px) {
          .desktop-sidecar {
            display: none !important;
          }
          .mobile-tools-trigger {
            display: flex !important;
          }
        }
        @media (max-width: 840px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
