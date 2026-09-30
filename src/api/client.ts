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
} from '../types/api';

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, status: number = 400, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

export interface ApiClient {
  // OpenAPI 3.1.0 Contract Endpoints
  register(body: RegisterRequest): Promise<AuthResponse>;
  login(body: LoginRequest): Promise<AuthResponse>;
  getProfile(): Promise<Profile>;
  updateProfile(body: UpdateProfileRequest): Promise<Profile>;
  replaceSkills(body: ReplaceSkillsRequest): Promise<Profile>;
  getSkills(): Promise<Skill[]>;

  // Extended Domain Flows (Discovery, Messaging, Projects, Tasks, Polls, Settings)
  getRecommendations(): Promise<CandidateRecommendation[]>;
  sendInterest(candidateId: string): Promise<{ matchId?: string; status: string }>;
  passCandidate(candidateId: string): Promise<void>;
  saveCandidate(candidateId: string): Promise<void>;

  getIncomingInterests(): Promise<IncomingInterest[]>;
  acceptInterest(interestId: string): Promise<{ matchId: string }>;
  declineInterest(interestId: string): Promise<void>;

  getMatches(): Promise<ConnectionMatch[]>;
  getMessages(matchId: string): Promise<ChatMessage[]>;
  sendMessage(matchId: string, content: string): Promise<ChatMessage>;

  getProjects(): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project>;
  createProjectTask(projectId: string, task: Omit<ProjectTask, 'id'>): Promise<ProjectTask>;
  updateProjectTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask>;
  createProjectEvent(projectId: string, event: Omit<import('../types/api').ProjectEvent, 'id'>): Promise<import('../types/api').ProjectEvent>;
  votePollSlot(projectId: string, pollId: string, slotId: string): Promise<AvailabilityPoll>;
  createAvailabilityPoll(projectId: string, poll: Omit<AvailabilityPoll, 'id' | 'voterCount'>): Promise<AvailabilityPoll>;

  // Resources & Learning List
  getResources(): Promise<ResourceItem[]>;
  getSavedResources(): Promise<SavedResource[]>;
  saveResource(resourceId: string, status?: ResourceProgressStatus): Promise<SavedResource[]>;
  removeSavedResource(resourceId: string): Promise<SavedResource[]>;
  updateResourceProgress(resourceId: string, status: ResourceProgressStatus): Promise<SavedResource[]>;

  getPrivacySettings(): Promise<PrivacySettings>;
  updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings>;

  // Demo administration
  getAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(user: Omit<AdminUser, 'id' | 'joinedAt' | 'verifiedSkills'> & { verifiedSkills?: number }): Promise<AdminUser>;
  deleteAdminUser(userId: string): Promise<void>;
  getAdminTransactions(): Promise<AdminTransaction[]>;

  beginGitHubAuthorization(): Promise<OAuthAuthorizationUrl>;
  getGitHubConnection(): Promise<GitHubConnectionStatus>;
  beginDiscordAuthorization(): Promise<OAuthAuthorizationUrl>;
  getDiscordConnection(): Promise<DiscordConnectionStatus>;
  getProjectDiscordRoom(projectId: string): Promise<ProjectDiscordRoom>;
  createProjectDiscordRoom(projectId: string): Promise<ProjectDiscordRoom>;

  // Session management
  setToken(token: string | null): void;
  getToken(): string | null;
}
