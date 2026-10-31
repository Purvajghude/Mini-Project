import {
  AuthResponse,
  CandidateRecommendation,
  ChatMessage,
  ConnectionMatch,
  IncomingInterest,
  LoginRequest,
  PrivacySettings,
  Profile,
  Project,
  ProjectTask,
  RegisterRequest,
  ReplaceSkillsRequest,
  Skill,
  UpdateProfileRequest,
  AvailabilityPoll,
  ResourceItem,
  SavedResource,
  ResourceProgressStatus,
  AdminTransaction,
  AdminUser,
  DiscordConnectionStatus,
  GitHubConnectionStatus,
  OAuthAuthorizationUrl,
  ProjectDiscordRoom,
  BlueprintSuggestion, BlueprintSuggestionRequest, ProjectRequirements, ProjectRequirementInput,
} from '../types/api';
import { ApiClient, ApiError } from './client';
import { CURATED_RESOURCES } from '../data/resourcesData';

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = { profileVisibility: 'CAMPUS', showEmail: false, allowDiscovery: true, notifyOnMatch: true, notifyOnMessage: true, githubSyncEnabled: true };

function readBrowserSettings(): PrivacySettings {
  try { return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(localStorage.getItem('mesh_privacy_settings') || '{}') }; }
  catch { return DEFAULT_PRIVACY_SETTINGS; }
}

function formatTime(value?: string): string {
  if (!value) return 'Just now';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function toProject(item: any): Project {
  return {
    id: item.id,
    title: item.name,
    slug: String(item.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: item.summary || 'A MESH project workspace.',
    category: item.domain || 'Student collaboration',
    status: item.lifecycle === 'DRAFT' ? 'PLANNING' : item.lifecycle === 'ARCHIVED' ? 'COMPLETED' : 'ACTIVE',
    lead: { id: item.ownerUserId, displayName: item.members?.find((member: any) => member.userId === item.ownerUserId)?.displayName || 'Project owner', username: item.members?.find((member: any) => member.userId === item.ownerUserId)?.username || 'owner' },
    members: (item.members || []).map((member: any) => ({ id: member.userId, displayName: member.displayName, username: member.username, role: member.role, avatarKey: member.avatarKey })),
    openRoles: [], tags: item.domain ? [item.domain] : [], tasks: [], events: [], availabilityPolls: [], createdAt: item.createdAt,
  };
}

function toTask(item: any, project: Project): ProjectTask {
  const member = project.members.find((m) => m.id === item.assigneeUserId);
  return { id: item.id, title: item.title, description: item.description || '', status: item.status,
    priority: 'MEDIUM', assignee: member ? { id: member.id, displayName: member.displayName, avatarKey: member.avatarKey } : undefined,
    dueDate: item.dueDate || undefined, tags: [] };
}

function toEvent(item: any): import('../types/api').ProjectEvent {
  return { id: item.id, title: item.title, description: item.description || '', startDate: item.startsAt,
    endDate: item.endsAt, type: 'MEETING' };
}

function toPoll(item: any): AvailabilityPoll {
  return { id: item.id, title: item.title, description: '', status: item.status === 'OPEN' ? 'OPEN' : 'RESOLVED',
    slots: (item.options || []).map((option: any) => ({ id: option.id,
      day: new Date(option.startsAt).toLocaleDateString([], { weekday: 'long' }),
      timeRange: `${new Date(option.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(option.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      votes: [], voteCount: option.voteCount, votedByMe: option.votedByMe })),
    voterCount: (item.options || []).reduce((total: number, option: any) => total + option.voteCount, 0) };
}

export class HttpApiAdapter implements ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    const productionApi = import.meta.env.PROD ? 'https://mesh-api-nzii.onrender.com/api/v1' : '/api/v1';
    this.baseUrl = (baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? productionApi).replace(/\/$/, '');
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const { method = 'GET', body } = options;
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new ApiError('Could not reach the server. Verify that the backend is running.', 0);
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.message || 'The server returned an error.',
        response.status,
        data?.fields
      );
    }

    return data as T;
  }

  // --- OpenAPI 3.1.0 Contract Endpoints ---

  async register(body: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', { method: 'POST', body });
  }

  async login(body: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', { method: 'POST', body });
  }

  async getProfile(): Promise<Profile> {
    return this.request<Profile>('/profile/me');
  }

  async updateProfile(body: UpdateProfileRequest): Promise<Profile> {
    return this.request<Profile>('/profile/me', { method: 'PUT', body });
  }

  async replaceSkills(body: ReplaceSkillsRequest): Promise<Profile> {
    return this.request<Profile>('/profile/me/skills', { method: 'PUT', body });
  }

  async getSkills(): Promise<Skill[]> {
    return this.request<Skill[]>('/skills');
  }

  // --- Shared collaboration endpoints ---

  async getRecommendations(): Promise<CandidateRecommendation[]> {
    const results = await this.request<any[]>('/recommendations?limit=24');
    return results.map((item) => ({ ...item, score: Math.round(item.score), sharedSkills: [], status: 'none', savedForLater: Boolean(item.saved), breakdown: { gapFill: Math.round(item.breakdown?.complementarySkills || 0), sharedGround: Math.round(item.breakdown?.sharedInterests || 0), depth: Math.round(item.breakdown?.skillEvidence || 0), categoryReach: Math.round(item.breakdown?.projectGoals || 0) } }));
  }

  async sendInterest(candidateId: string): Promise<{ matchId?: string; status: string }> {
    await this.request('/connection-requests', { method: 'POST', body: { recipientUserId: candidateId } });
    return { status: 'REQUEST_SENT' };
  }

  async passCandidate(candidateId: string): Promise<void> {
    await this.request<void>(`/discover/${candidateId}/pass`, { method: 'PUT' });
  }

  async saveCandidate(candidateId: string): Promise<void> {
    await this.request<void>(`/discover/${candidateId}/save`, { method: 'PUT' });
  }

  async getIncomingInterests(): Promise<IncomingInterest[]> {
    const results = await this.request<any[]>('/connection-requests/incoming');
    return results.map((item) => ({ id: item.id, senderId: item.senderId, senderName: item.senderName, status: item.status, note: 'This student wants to connect and collaborate.', reason: 'Review their shared profile and project interests.', matchScore: 0, sentAt: formatTime(item.createdAt) }));
  }

  async acceptInterest(interestId: string): Promise<{ matchId: string }> {
    const result = await this.request<any>(`/connection-requests/${interestId}/accept`, { method: 'PATCH' });
    return { matchId: result.id };
  }

  async declineInterest(interestId: string): Promise<void> {
    await this.request<void>(`/connection-requests/${interestId}/decline`, { method: 'PATCH' });
  }

  async getMatches(): Promise<ConnectionMatch[]> {
    const results = await this.request<any[]>('/connections');
    return results.map((item) => ({ id: item.id, collaborator: { ...item.collaborator, onboardingComplete: true, skills: [] }, projectTitle: 'New MESH connection', status: 'ACTIVE', fitDescription: 'You are connected. Start with a project idea or a shared learning goal.', lastMessage: '', lastMessageAt: formatTime(item.createdAt), unreadCount: 0 }));
  }

  async getMessages(matchId: string): Promise<ChatMessage[]> {
    const results = await this.request<any[]>(`/connections/${matchId}/messages`);
    return results.map((item) => ({ id: item.id, senderId: item.senderId, senderName: item.senderName, content: item.content, sentAt: formatTime(item.createdAt), isSelf: false }));
  }

  async sendMessage(matchId: string, content: string): Promise<ChatMessage> {
    const item = await this.request<any>(`/connections/${matchId}/messages`, {
      method: 'POST',
      body: { content },
    });
    return { id: item.id, senderId: item.senderId, senderName: item.senderName, content: item.content, sentAt: formatTime(item.createdAt), isSelf: true };
  }

  async getProjects(): Promise<Project[]> {
    const results = await this.request<any[]>('/projects');
    return Promise.all(results.map((item) => this.hydrateProject(item)));
  }

  async suggestProjectBlueprint(input: BlueprintSuggestionRequest): Promise<BlueprintSuggestion> {
    return this.request<BlueprintSuggestion>('/project-blueprints/suggestions', { method: 'POST', body: input });
  }

  async getProjectRequirements(projectId: string): Promise<ProjectRequirements> {
    return this.request<ProjectRequirements>(`/projects/${projectId}/requirements`);
  }

  async replaceProjectRequirements(projectId: string, input: { targetTeamSize: number; lifecycle: ProjectRequirements['lifecycle']; requirements: ProjectRequirementInput[] }): Promise<ProjectRequirements> {
    return this.request<ProjectRequirements>(`/projects/${projectId}/requirements`, { method: 'PUT', body: input });
  }

  async getProject(projectId: string): Promise<Project | null> {
    return this.hydrateProject(await this.request<any>(`/projects/${projectId}`));
  }

  private async hydrateProject(item: any): Promise<Project> {
    const project = toProject(item);
    const [tasks, events, polls] = await Promise.all([
      this.request<any[]>(`/projects/${item.id}/tasks`),
      this.request<any[]>(`/projects/${item.id}/events`),
      this.request<any[]>(`/projects/${item.id}/availability-polls`),
    ]);
    return { ...project, tasks: tasks.map((task) => toTask(task, project)), events: events.map(toEvent), availabilityPolls: polls.map(toPoll) };
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    return toProject(await this.request<any>('/projects', { method: 'POST', body: { name: project.title, summary: project.description, domain: project.category } }));
  }

  async createProjectTask(projectId: string, task: Omit<ProjectTask, 'id'>): Promise<ProjectTask> {
    const project = await this.getProject(projectId);
    const created = await this.request<any>(`/projects/${projectId}/tasks`, { method: 'POST', body: {
      title: task.title, description: task.description, assigneeUserId: task.assignee?.id || null, dueDate: task.dueDate || null,
    } });
    return toTask(created, project!);
  }

  async updateProjectTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    const project = await this.getProject(projectId);
    const current = project?.tasks.find((task) => task.id === taskId);
    if (!current) throw new ApiError('Task was not found.', 404);
    const next = { ...current, ...updates };
    const updated = await this.request<any>(`/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: {
      title: next.title, description: next.description, status: next.status,
      assigneeUserId: next.assignee?.id || null, dueDate: next.dueDate || null,
    } });
    return toTask(updated, project!);
  }

  async createProjectEvent(projectId: string, event: Omit<import('../types/api').ProjectEvent, 'id'>): Promise<import('../types/api').ProjectEvent> {
    return toEvent(await this.request<any>(`/projects/${projectId}/events`, { method: 'POST', body: {
      title: event.title, description: event.description, startsAt: new Date(event.startDate).toISOString(),
      endsAt: new Date(new Date(event.endDate).getTime() > new Date(event.startDate).getTime() ? event.endDate : new Date(new Date(event.startDate).getTime() + 3600000)).toISOString(),
    } }));
  }

  async votePollSlot(projectId: string, pollId: string, slotId: string): Promise<AvailabilityPoll> {
    await this.request<void>(`/projects/${projectId}/availability-polls/${pollId}/options/${slotId}/vote`, { method: 'PUT' });
    const polls = await this.request<any[]>(`/projects/${projectId}/availability-polls`);
    return toPoll(polls.find((poll) => poll.id === pollId));
  }

  async createAvailabilityPoll(projectId: string, poll: Omit<AvailabilityPoll, 'id' | 'voterCount'>): Promise<AvailabilityPoll> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const options = poll.slots.map((slot) => {
      const offset = (days.indexOf(slot.day) - now.getDay() + 7) % 7 || 7;
      const [start, end] = slot.timeRange.split(' - ');
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number);
      const startsAt = new Date(date); startsAt.setHours(sh, sm, 0, 0);
      const endsAt = new Date(date); endsAt.setHours(eh, em, 0, 0);
      return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
    });
    return toPoll(await this.request<any>(`/projects/${projectId}/availability-polls`, { method: 'POST', body: { title: poll.title, options } }));
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    return readBrowserSettings();
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const next = { ...readBrowserSettings(), ...settings };
    try { localStorage.setItem('mesh_privacy_settings', JSON.stringify(next)); } catch {}
    return next;
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return [];
  }

  async createAdminUser(user: Omit<AdminUser, 'id' | 'joinedAt' | 'verifiedSkills'> & { verifiedSkills?: number }): Promise<AdminUser> {
    return this.request<AdminUser>('/admin/users', { method: 'POST', body: user });
  }

  async deleteAdminUser(userId: string): Promise<void> {
    return this.request<void>(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  async getAdminTransactions(): Promise<AdminTransaction[]> {
    return [];
  }

  async beginGitHubAuthorization(): Promise<OAuthAuthorizationUrl> { return this.request<OAuthAuthorizationUrl>('/github/authorization-url', { method: 'POST' }); }
  async getGitHubConnection(): Promise<GitHubConnectionStatus> { return this.request<GitHubConnectionStatus>('/github/connection'); }
  async beginDiscordAuthorization(): Promise<OAuthAuthorizationUrl> { return this.request<OAuthAuthorizationUrl>('/discord/authorization-url', { method: 'POST' }); }
  async getDiscordConnection(): Promise<DiscordConnectionStatus> { return this.request<DiscordConnectionStatus>('/discord/connection'); }
  async getProjectDiscordRoom(projectId: string): Promise<ProjectDiscordRoom> { return this.request<ProjectDiscordRoom>(`/projects/${projectId}/discord-room`); }
  async createProjectDiscordRoom(projectId: string): Promise<ProjectDiscordRoom> { return this.request<ProjectDiscordRoom>(`/projects/${projectId}/discord-room`, { method: 'POST' }); }

  // --- Resources & Learning List ---

  async getResources(): Promise<ResourceItem[]> {
    try {
      return await this.request<ResourceItem[]>('/resources');
    } catch {
      return JSON.parse(JSON.stringify(CURATED_RESOURCES));
    }
  }

  async getSavedResources(): Promise<SavedResource[]> {
    try {
      return await this.request<SavedResource[]>('/resources/saved');
    } catch {
      try {
        const stored = localStorage.getItem('mesh_saved_resources');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  }

  async saveResource(resourceId: string, status: ResourceProgressStatus = 'not_started'): Promise<SavedResource[]> {
    try {
      return await this.request<SavedResource[]>('/resources/saved', {
        method: 'POST',
        body: { resourceId, status },
      });
    } catch {
      let current: SavedResource[] = [];
      try {
        const stored = localStorage.getItem('mesh_saved_resources');
        if (stored) current = JSON.parse(stored);
      } catch {}
      const existing = current.find((r) => r.resourceId === resourceId);
      if (existing) {
        existing.status = status;
      } else {
        current.push({ resourceId, savedAt: new Date().toISOString(), status });
      }
      try {
        localStorage.setItem('mesh_saved_resources', JSON.stringify(current));
      } catch {}
      return current;
    }
  }

  async removeSavedResource(resourceId: string): Promise<SavedResource[]> {
    try {
      return await this.request<SavedResource[]>(`/resources/saved/${resourceId}`, {
        method: 'DELETE',
      });
    } catch {
      let current: SavedResource[] = [];
      try {
        const stored = localStorage.getItem('mesh_saved_resources');
        if (stored) current = JSON.parse(stored);
      } catch {}
      current = current.filter((r) => r.resourceId !== resourceId);
      try {
        localStorage.setItem('mesh_saved_resources', JSON.stringify(current));
      } catch {}
      return current;
    }
  }

  async updateResourceProgress(resourceId: string, status: ResourceProgressStatus): Promise<SavedResource[]> {
    try {
      return await this.request<SavedResource[]>(`/resources/saved/${resourceId}/progress`, {
        method: 'PATCH',
        body: { status },
      });
    } catch {
      return this.saveResource(resourceId, status);
    }
  }
}

