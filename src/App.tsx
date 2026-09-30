import React, { useEffect, useState } from 'react';
import {
  Compass,
  FolderGit2,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  BookOpen,
} from 'lucide-react';
import { api } from './api/index';
import {
  Avatar,
  NavigationBar,
  NavigationRail,
  NavDestination,
  Snackbar,
} from './components/m3';
import {
  CandidateRecommendation,
  ConnectionMatch,
  IncomingInterest,
  LoginRequest,
  PrivacySettings,
  Profile,
  ProfileSkill,
  Project,
  RegisterRequest,
  Skill,
  UpdateProfileRequest,
  ResourceItem,
  SavedResource,
  ResourceProgressStatus,
  AdminTransaction,
  AdminUser,
  DiscordConnectionStatus,
  GitHubConnectionStatus,
  ProjectTask,
  ProjectEvent,
  AvailabilityPoll,
} from './types/api';
import { AuthView } from './views/AuthView';
import { ConnectionsView } from './views/ConnectionsView';
import { DiscoverView } from './views/DiscoverView';
import { OnboardingDialog } from './views/OnboardingDialog';
import { ProfileView } from './views/ProfileView';
import { ProjectsView } from './views/ProjectsView';
import { SettingsView } from './views/SettingsView';
import { WelcomeView } from './views/WelcomeView';
import { ResourcesView } from './views/ResourcesView';
import { MaterialSymbol } from './components/m3';
import Landing from './pages/Landing.jsx';

// Existing views placeholder for Milestone 3, 4, 5
import TeamBuilder from './components/TeamBuilder.jsx';

export default function App() {
  const [auth, setAuth] = useState<{ token: string; demo: boolean } | null>(() => {
    try {
      const stored = sessionStorage.getItem('mesh-auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [route, setRoute] = useState<string>(() => {
    try {
      const stored = sessionStorage.getItem('mesh-auth');
      return stored ? 'discover' : 'landing';
    } catch {
      return 'landing';
    }
  });
  const [user, setUser] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [matches, setMatches] = useState<ConnectionMatch[]>([]);
  const [requests, setRequests] = useState<IncomingInterest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [githubConnection, setGithubConnection] = useState<GitHubConnectionStatus>({ connected: false, login: null, avatarUrl: null, publicRepositoryCount: 0, authorizedAt: null, lastSyncedAt: null });
  const [discordConnection, setDiscordConnection] = useState<DiscordConnectionStatus>({ connected: false, discordUserId: null, username: null, globalName: null, connectedAt: null });

  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const toast = (msg: string) => {
    setNotice(msg);
  };

  const loadData = async () => {
    try {
      setBusy(true);
      const [profileData, skillCatalog, recs, incoming, matchesList, projectList, settings, resourceList, savedList, userDirectory, transactionList, githubStatus, discordStatus] =
        await Promise.all([
          api.getProfile(),
          api.getSkills(),
          api.getRecommendations(),
          api.getIncomingInterests(),
          api.getMatches(),
          api.getProjects(),
          api.getPrivacySettings(),
          api.getResources(),
          api.getSavedResources(),
          api.getAdminUsers(),
          api.getAdminTransactions(),
          api.getGitHubConnection(),
          api.getDiscordConnection(),
        ]);

      setUser(profileData);
      setSkills(skillCatalog);
      setRecommendations(recs);
      setRequests(incoming);
      setMatches(matchesList);
      setProjects(projectList);
      setPrivacySettings(settings);
      setResources(resourceList);
      setSavedResources(savedList);
      setAdminUsers(userDirectory);
      setTransactions(transactionList);
      setGithubConnection(githubStatus);
      setDiscordConnection(discordStatus);

      // Check if onboarding is needed
      if (!profileData.onboardingComplete) {
        setShowOnboarding(true);
      }
    } catch (err: any) {
      toast(err.message || 'Error loading platform data');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (auth) {
      api.setToken(auth.token);
      loadData();
    }
  }, [auth]);

  const handleAuthenticate = async (
    data: RegisterRequest | LoginRequest,
    isRegister: boolean
  ) => {
    setBusy(true);
    setAuthError(null);
    try {
      const response = isRegister
        ? await api.register(data as RegisterRequest)
        : await api.login(data as LoginRequest);

      api.setToken(response.token);
      const nextAuth = { token: response.token, demo: false };
      sessionStorage.setItem('mesh-auth', JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setUser(response.user);

      if (!response.user.onboardingComplete) {
        setShowOnboarding(true);
      }
      setRoute('discover');
      toast(isRegister ? 'Account created! Welcome to MESH.' : 'Welcome back!');
      try {
        await loadData();
      } catch (loadErr) {
        console.warn('Background data load warning:', loadErr);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('mesh-auth');
    setAuth(null);
    setUser(null);
    setRoute('landing');
    toast('Signed out successfully.');
  };

  const handleSaveProfile = async (updates: UpdateProfileRequest) => {
    setBusy(true);
    try {
      const updated = await api.updateProfile(updates);
      setUser(updated);
    } catch (err: any) {
      toast(err.message || 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSkills = async (newSkills: ProfileSkill[]) => {
    setBusy(true);
    try {
      const updated = await api.replaceSkills({
        skills: newSkills.map((s) => ({ skillId: s.id, proficiency: s.proficiency })),
      });
      setUser(updated);
    } catch (err: any) {
      toast(err.message || 'Could not update skills.');
    } finally {
      setBusy(false);
    }
  };

  const handleOnboardingComplete = async (
    profileUpdates: Partial<Profile>,
    newSkills: ProfileSkill[]
  ) => {
    setBusy(true);
    try {
      await api.replaceSkills({
        skills: newSkills.map((s) => ({ skillId: s.id, proficiency: s.proficiency })),
      });
      const updated = await api.updateProfile({
        displayName: user?.displayName || 'Student',
        ...profileUpdates,
        onboardingComplete: true,
      });
      setUser(updated);
      setShowOnboarding(false);
      setShowWelcome(true);
      toast('Onboarding completed! Welcome to MESH.');
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Could not save onboarding data.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    try {
      const updated = await api.updatePrivacySettings(updates);
      setPrivacySettings(updated);
    } catch (err: any) {
      toast(err.message || 'Could not update settings.');
    }
  };

  const handleConnect = async (candidate: CandidateRecommendation) => {
    setBusy(true);
    try {
      const res = await api.sendInterest(candidate.userId);
      setRecommendations((prev) =>
        prev.map((c) => (c.userId === candidate.userId ? { ...c, status: 'interested' } : c))
      );
      if (res.status === 'MATCHED') {
        toast(`Mutual match! You are now connected with ${candidate.displayName}.`);
        const matchesList = await api.getMatches();
        setMatches(matchesList);
      } else {
        toast(`Connection request sent to ${candidate.displayName}.`);
      }
    } catch (err: any) {
      toast(err.message || 'Could not send connection request.');
    } finally {
      setBusy(false);
    }
  };

  const handlePass = async (candidateId: string) => {
    try {
      await api.passCandidate(candidateId);
      setRecommendations((prev) =>
        prev.map((c) => (c.userId === candidateId ? { ...c, status: 'passed' } : c))
      );
    } catch (err: any) {
      toast(err.message || 'Could not pass candidate.');
    }
  };

  const handleSave = async (candidateId: string) => {
    try {
      await api.saveCandidate(candidateId);
      setRecommendations((prev) =>
        prev.map((c) => {
          if (c.userId === candidateId) {
            const nextSaved = !c.savedForLater;
            toast(nextSaved ? 'Candidate saved to shortlist.' : 'Candidate removed from shortlist.');
            return { ...c, savedForLater: nextSaved, status: nextSaved ? 'saved' : 'none' };
          }
          return c;
        })
      );
    } catch (err: any) {
      toast(err.message || 'Could not update save status.');
    }
  };

  const handleSendMessage = async (matchId: string, content: string) => {
    try {
      const msg = await api.sendMessage(matchId, content);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, lastMessage: content, lastMessageAt: 'Just now' }
            : m
        )
      );
      toast('Message sent.');
    } catch (err: any) {
      toast(err.message || 'Could not send message.');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setBusy(true);
    try {
      const res = await api.acceptInterest(requestId);
      toast('Collaboration request accepted! Channel provisioned.');
      const [newRequests, newMatches] = await Promise.all([
        api.getIncomingInterests(),
        api.getMatches(),
      ]);
      setRequests(newRequests);
      setMatches(newMatches);
    } catch (err: any) {
      toast(err.message || 'Could not accept request.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setBusy(true);
    try {
      await api.declineInterest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast('Collaboration request dismissed.');
    } catch (err: any) {
      toast(err.message || 'Could not decline request.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    setBusy(true);
    try {
      const created = await api.createProject(projectData);
      setProjects((prev) => [created, ...prev]);
      toast('Project created successfully!');
    } catch (err: any) {
      toast(err.message || 'Could not create project.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTask = async (projectId: string, taskData: Omit<ProjectTask, 'id'>) => {
    try {
      const created = await api.createProjectTask(projectId, taskData);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, created] } : p))
      );
      toast('Task added to Kanban.');
    } catch (err: any) {
      toast(err.message || 'Could not add task.');
    }
  };

  const handleUpdateTask = async (
    projectId: string,
    taskId: string,
    updates: Partial<ProjectTask>
  ) => {
    try {
      const updated = await api.updateProjectTask(projectId, taskId, updates);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? updated : t)) }
            : p
        )
      );
    } catch (err: any) {
      toast(err.message || 'Could not update task.');
    }
  };

  const handleCreateEvent = async (
    projectId: string,
    eventData: Omit<ProjectEvent, 'id'>
  ) => {
    try {
      const created = await api.createProjectEvent(projectId, eventData);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, events: [...p.events, created] } : p))
      );
      toast('Event / Milestone scheduled.');
    } catch (err: any) {
      toast(err.message || 'Could not schedule event.');
    }
  };

  const handleVotePoll = async (projectId: string, pollId: string, slotId: string) => {
    try {
      const updatedPoll = await api.votePollSlot(projectId, pollId, slotId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                availabilityPolls: p.availabilityPolls.map((pol) =>
                  pol.id === pollId ? updatedPoll : pol
                ),
              }
            : p
        )
      );
      toast('Availability vote recorded.');
    } catch (err: any) {
      toast(err.message || 'Could not vote on availability slot.');
    }
  };

  const handleCreatePoll = async (
    projectId: string,
    pollData: Omit<AvailabilityPoll, 'id' | 'voterCount'>
  ) => {
    try {
      const created = await api.createAvailabilityPoll(projectId, pollData);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, availabilityPolls: [created, ...p.availabilityPolls] }
            : p
        )
      );
      toast('Availability poll launched.');
    } catch (err: any) {
      toast(err.message || 'Could not launch poll.');
    }
  };

  const handleSaveResource = async (resourceId: string, status?: ResourceProgressStatus) => {
    try {
      const updated = await api.saveResource(resourceId, status);
      setSavedResources(updated);
    } catch (err: any) {
      toast(err.message || 'Could not save resource.');
    }
  };

  const handleRemoveSavedResource = async (resourceId: string) => {
    try {
      const updated = await api.removeSavedResource(resourceId);
      setSavedResources(updated);
    } catch (err: any) {
      toast(err.message || 'Could not remove resource.');
    }
  };

  const handleUpdateResourceProgress = async (resourceId: string, status: ResourceProgressStatus) => {
    try {
      const updated = await api.updateResourceProgress(resourceId, status);
      setSavedResources(updated);
    } catch (err: any) {
      toast(err.message || 'Could not update resource progress.');
    }
  };

  const handleCreateAdminUser = async (newUser: Omit<AdminUser, 'id' | 'joinedAt' | 'verifiedSkills'> & { verifiedSkills?: number }) => {
    try {
      const created = await api.createAdminUser(newUser);
      setAdminUsers((current) => [created, ...current]);
      toast(`${created.displayName} was added to the demo directory.`);
    } catch (err: any) { toast(err.message || 'Could not add this user.'); }
  };

  const handleDeleteAdminUser = async (userId: string) => {
    try {
      await api.deleteAdminUser(userId);
      setAdminUsers((current) => current.filter((member) => member.id !== userId));
      setRecommendations((current) => current.filter((candidate) => candidate.userId !== userId));
      toast('User removed from the demo directory.');
    } catch (err: any) { toast(err.message || 'Could not remove this user.'); }
  };

  const handleBeginGitHubAuthorization = async () => {
    try { window.location.assign((await api.beginGitHubAuthorization()).authorizationUrl); }
    catch (err: any) { toast(err.message || 'Could not start GitHub verification.'); }
  };

  const handleBeginDiscordAuthorization = async () => {
    try { window.location.assign((await api.beginDiscordAuthorization()).authorizationUrl); }
    catch (err: any) { toast(err.message || 'Could not start Discord linking.'); }
  };

  const handleOpenDiscordRoom = async (projectId: string) => {
    try {
      let room = await api.getProjectDiscordRoom(projectId);
      if (!room.available) room = await api.createProjectDiscordRoom(projectId);
      if (!room.inviteUrl) throw new Error('The Discord room could not provide an invite link.');
      window.open(room.inviteUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) { toast(err.message || 'Could not open the Discord project room.'); }
  };

  // Destinations for M3 Navigation
  const unreadMessagesCount = matches.reduce((acc, m) => acc + (m.unreadCount || 0), 0);
  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  const destinations: NavDestination[] = [
    {
      id: 'discover',
      label: 'Discover',
      icon: <Compass size={22} />,
    },
    {
      id: 'connections',
      label: 'Community',
      icon: <MessageSquare size={22} />,
      badgeCount: unreadMessagesCount + pendingRequestsCount,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderGit2 size={22} />,
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: <BookOpen size={22} />,
    },
    {
      id: 'build-guides',
      label: 'Build guides',
      icon: <Sparkles size={22} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={22} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={22} />,
    },
  ];

  if (!auth) {
    if (route === 'login' || route === 'register') {
      return (
        <>
          <AuthView
            mode={route}
            onModeChange={(m) => setRoute(m)}
            onSubmit={handleAuthenticate}
            busy={busy}
            error={authError}
          />
          <Snackbar message={notice} onDismiss={() => setNotice(null)} />
        </>
      );
    }
    return (
      <>
        <Landing onStart={() => setRoute('register')} onSignIn={() => setRoute('login')} />
        <Snackbar message={notice} onDismiss={() => setNotice(null)} />
      </>
    );
  }

  // Welcome Screen Celebration Flow
  if (showWelcome && user) {
    return (
      <>
        <WelcomeView
          currentUser={user}
          onEnterDashboard={() => {
            setShowWelcome(false);
            setRoute('discover');
          }}
        />
        <Snackbar message={notice} onDismiss={() => setNotice(null)} />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)' }}>
      {/* Desktop M3 Navigation Rail */}
      <NavigationRail
        destinations={destinations}
        activeId={route}
        onNavigate={(nextRoute) => setRoute(nextRoute)}
        brandSlot={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className="m3-nav-rail-brand-mark">M</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--md-sys-color-primary)', letterSpacing: '0.04em' }}>
              MESH
            </span>
          </div>
        }
        footerSlot={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {user && (
              <button
                type="button"
                onClick={() => setRoute('profile')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                title={`Signed in as ${user.displayName}`}
              >
                <Avatar name={user.displayName} tone={user.avatarKey || 'sapphire'} size="sm" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--md-sys-color-on-surface-variant)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%',
              }}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        }
      />

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top App Bar */}
        <header
          style={{
            height: 64,
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mesh Academic Platform
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
              {destinations.find((d) => d.id === route)?.label || 'Workspace'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-custom-color-synergy-container)',
                color: 'var(--md-custom-color-on-synergy-container)',
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--md-custom-color-synergy)' }} />
              Campus Network Active
            </span>
            {user && (
              <button
                type="button"
                onClick={() => setRoute('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                }}
              >
                <Avatar name={user.displayName} tone={user.avatarKey || 'sapphire'} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                  {user.displayName.split(' ')[0]}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* View Surface Content */}
        <main
          style={{
            flex: 1,
            padding: 24,
            paddingBottom: 96, // space for mobile navigation bar
            overflowY: 'auto',
          }}
        >
          {route === 'profile' && user && (
            <ProfileView
              user={user}
              availableSkills={skills}
              onSaveProfile={handleSaveProfile}
              onSaveSkills={handleSaveSkills}
              onToast={toast}
              busy={busy}
            />
          )}

          {route === 'settings' && privacySettings && (
            <SettingsView
              settings={privacySettings}
              adminUsers={adminUsers}
              transactions={transactions}
              githubConnection={githubConnection}
              discordConnection={discordConnection}
              onUpdateSettings={handleUpdatePrivacySettings}
              onBeginGitHubAuthorization={handleBeginGitHubAuthorization}
              onBeginDiscordAuthorization={handleBeginDiscordAuthorization}
              onCreateAdminUser={handleCreateAdminUser}
              onDeleteAdminUser={handleDeleteAdminUser}
              onSignOut={handleSignOut}
              onToast={toast}
              busy={busy}
            />
          )}

          {route === 'discover' && user && (
            <DiscoverView
              currentUser={user}
              recommendations={recommendations}
              onConnect={handleConnect}
              onPass={handlePass}
              onSave={handleSave}
              onEditProfile={() => setRoute('profile')}
              onToast={toast}
              busy={busy}
            />
          )}

          {route === 'connections' && user && (
            <ConnectionsView
              currentUser={user}
              matches={matches}
              incomingRequests={requests}
              onSendMessage={handleSendMessage}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onToast={toast}
              busy={busy}
            />
          )}

          {route === 'projects' && user && (
            <ProjectsView
              currentUser={user}
              projects={projects}
              onCreateProject={handleCreateProject}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onCreateEvent={handleCreateEvent}
              onVotePoll={handleVotePoll}
              onCreatePoll={handleCreatePoll}
              onOpenDiscordRoom={handleOpenDiscordRoom}
              onToast={toast}
              busy={busy}
            />
          )}

          {(route === 'resources' || route === 'build-guides') && user && (
            <ResourcesView
              initialSection={route === 'build-guides' ? 'build' : 'roadmaps'}
              currentUser={user}
              resources={resources}
              savedResources={savedResources}
              recommendations={recommendations}
              projects={projects}
              onSaveResource={handleSaveResource}
              onRemoveSavedResource={handleRemoveSavedResource}
              onUpdateResourceProgress={handleUpdateResourceProgress}
              onConnectWithPeer={handleConnect}
              onNavigateToProject={() => setRoute('projects')}
              onNavigateToDiscover={() => setRoute('discover')}
              onToast={toast}
              busy={busy}
            />
          )}
        </main>
      </div>

      {/* Mobile M3 Navigation Bar */}
      <NavigationBar
        destinations={destinations}
        activeId={route}
        onNavigate={(nextRoute) => setRoute(nextRoute)}
      />

      {/* Multi-step Onboarding Modal */}
      {user && (
        <OnboardingDialog
          open={showOnboarding}
          profile={user}
          availableSkills={skills}
          onComplete={handleOnboardingComplete}
          busy={busy}
        />
      )}

      {/* Global Snackbar */}
      <Snackbar message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
