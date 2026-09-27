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
} from '../types/api';
import { ApiClient, ApiError } from './client';

export class HttpApiAdapter implements ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
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

  // --- Extended endpoints fallback (routes not yet in openapi.yaml) ---

  async getRecommendations(): Promise<CandidateRecommendation[]> {
    return this.request<CandidateRecommendation[]>('/recommendations?limit=12');
  }

  async sendInterest(candidateId: string): Promise<{ matchId?: string; status: string }> {
    return this.request<{ matchId?: string; status: string }>(`/interests/${candidateId}`, { method: 'POST' });
  }

  async passCandidate(_candidateId: string): Promise<void> {
    // Client-side / mock action when backend route is not yet provisioned
    return Promise.resolve();
  }

  async saveCandidate(_candidateId: string): Promise<void> {
    return Promise.resolve();
  }

  async getIncomingInterests(): Promise<IncomingInterest[]> {
    return this.request<IncomingInterest[]>('/interests/incoming');
  }

  async acceptInterest(interestId: string): Promise<{ matchId: string }> {
    return this.request<{ matchId: string }>(`/interests/${interestId}/accept`, { method: 'PATCH' });
  }

  async declineInterest(interestId: string): Promise<void> {
    return this.request<void>(`/interests/${interestId}/decline`, { method: 'PATCH' });
  }

  async getMatches(): Promise<ConnectionMatch[]> {
    return this.request<ConnectionMatch[]>('/matches');
  }

  async getMessages(matchId: string): Promise<ChatMessage[]> {
    const data = await this.request<{ messages: ChatMessage[] }>(`/matches/${matchId}/messages`);
    return data.messages || [];
  }

  async sendMessage(matchId: string, content: string): Promise<ChatMessage> {
    return this.request<ChatMessage>(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: { content },
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(projectId: string): Promise<Project | null> {
    return this.request<Project>(`/projects/${projectId}`);
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    return this.request<Project>('/projects', { method: 'POST', body: project });
  }

  async createProjectTask(projectId: string, task: Omit<ProjectTask, 'id'>): Promise<ProjectTask> {
    return this.request<ProjectTask>(`/projects/${projectId}/tasks`, { method: 'POST', body: task });
  }

  async updateProjectTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    return this.request<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, { method: 'PATCH', body: updates });
  }

  async createProjectEvent(projectId: string, event: Omit<import('../types/api').ProjectEvent, 'id'>): Promise<import('../types/api').ProjectEvent> {
    return this.request<import('../types/api').ProjectEvent>(`/projects/${projectId}/events`, { method: 'POST', body: event });
  }

  async votePollSlot(projectId: string, pollId: string, slotId: string): Promise<AvailabilityPoll> {
    return this.request<AvailabilityPoll>(`/projects/${projectId}/polls/${pollId}/vote`, {
      method: 'POST',
      body: { slotId },
    });
  }

  async createAvailabilityPoll(projectId: string, poll: Omit<AvailabilityPoll, 'id' | 'voterCount'>): Promise<AvailabilityPoll> {
    return this.request<AvailabilityPoll>(`/projects/${projectId}/polls`, { method: 'POST', body: poll });
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    return this.request<PrivacySettings>('/profile/settings');
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    return this.request<PrivacySettings>('/profile/settings', { method: 'PUT', body: settings });
  }
}
