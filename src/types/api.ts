/**
 * Types strictly adhering to contracts/openapi.yaml
 */

export interface RegisterRequest {
  displayName: string;
  username: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface ProfileSkill extends Skill {
  proficiency: number; // 1 to 5
  evidenceSupported: boolean; // Always false in milestone 1 per openapi.yaml
}

export interface Profile {
  id: string; // uuid
  username: string;
  displayName: string;
  department: string | null;
  yearOfStudy: number | null;
  bio: string | null;
  avatarKey: string | null;
  availability: string | null;
  primaryDomain: string | null;
  onboardingComplete: boolean;
  skills: ProfileSkill[];
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: Profile;
}

export interface UpdateProfileRequest {
  displayName: string;
  department?: string | null;
  yearOfStudy?: number | null;
  bio?: string | null;
  avatarKey?: string | null;
  availability?: string | null;
  primaryDomain?: string | null;
  onboardingComplete?: boolean;
}

export interface ReplaceSkillsRequest {
  skills: Array<{
    skillId: number;
    proficiency: number;
  }>;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fields?: Record<string, string>;
  path: string;
}

// -------------------------------------------------------------
// Extended domain types for client user flows (matching future backend contracts)
// -------------------------------------------------------------

export interface CandidateBreakdown {
  gapFill: number;
  sharedGround: number;
  depth: number;
  categoryReach: number;
}

export interface GitHubRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  primaryLanguage: string;
  updatedAt: string;
  verified: boolean;
  commitsCount: number;
}

export interface GitHubEvidence {
  connected: boolean;
  githubUsername: string | null;
  verifiedCommits: number;
  topLanguages: Array<{ language: string; percentage: number }>;
  pinnedRepos: GitHubRepo[];
  lastSyncedAt: string | null;
}

export interface CandidateRecommendation {
  userId: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  department: string | null;
  yearOfStudy: number | null;
  bio: string | null;
  availability: string | null;
  primaryDomain: string | null;
  score: number; // 0 - 100
  reason: string;
  skills: ProfileSkill[];
  sharedSkills: string[];
  complementarySkills: string[];
  breakdown: CandidateBreakdown;
  githubEvidence?: GitHubEvidence;
  savedForLater?: boolean;
  status?: 'none' | 'passed' | 'saved' | 'interested' | 'connected';
}

export interface IncomingInterest {
  id: string;
  senderId: string;
  senderName: string;
  senderDepartment?: string;
  senderYear?: number;
  avatarKey?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  note: string;
  reason: string;
  matchScore: number;
  sentAt: string;
}

export interface ConnectionMatch {
  id: string;
  collaborator: Profile & {
    headline?: string;
    course?: string;
    githubEvidence?: GitHubEvidence;
  };
  projectTitle: string;
  projectId?: string;
  status: 'ACTIVE' | 'PENDING';
  fitDescription: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
  isSelf: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee?: {
    id: string;
    displayName: string;
    avatarKey?: string | null;
  };
  dueDate?: string;
  tags: string[];
}

export interface ProjectEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'DEADLINE' | 'MILESTONE' | 'MEETING' | 'SPRINT';
  location?: string;
}

export interface PollSlot {
  id: string;
  day: string; // e.g., 'Monday', 'Tuesday'
  timeRange: string; // e.g., '14:00 - 16:00'
  votes: string[]; // userIds who are available
}

export interface AvailabilityPoll {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  slots: PollSlot[];
  voterCount: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
  lead: {
    id: string;
    displayName: string;
    username: string;
  };
  members: Array<{
    id: string;
    displayName: string;
    username: string;
    role: string;
    avatarKey?: string | null;
  }>;
  openRoles: Array<{
    title: string;
    skillsNeeded: string[];
    capacity: number;
  }>;
  tags: string[];
  tasks: ProjectTask[];
  events: ProjectEvent[];
  availabilityPolls: AvailabilityPoll[];
  githubRepoUrl?: string;
  createdAt: string;
}

export interface PrivacySettings {
  profileVisibility: 'CAMPUS' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  showEmail: boolean;
  allowDiscovery: boolean;
  notifyOnMatch: boolean;
  notifyOnMessage: boolean;
  githubSyncEnabled: boolean;
}
