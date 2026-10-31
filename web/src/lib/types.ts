// Mirrors contracts/openapi.yaml. Keep field names identical to the backend DTOs.

export type Lifecycle = 'DRAFT' | 'RECRUITING' | 'ACTIVE' | 'ARCHIVED';
export type Importance = 'REQUIRED' | 'PREFERRED';
export type Coverage = 'COVERED' | 'PARTIAL' | 'UNCOVERED';

export interface Skill { id: number; name: string; category: string }
export interface ProfileSkill extends Skill { proficiency: number; evidenceSupported: boolean }
export interface Goal { code: string; name: string }
export interface Interest { id: number; name: string }
export interface Domain { code: string; name: string }
export interface AvailabilityWindow { dayOfWeek: number; startMinute: number; endMinute: number }

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  department: string | null;
  yearOfStudy: number | null;
  bio: string | null;
  avatarKey: string | null;
  availability: string | null;
  availabilityTimezone: string | null;
  primaryDomain: string | null;
  onboardingComplete: boolean;
  skills: ProfileSkill[];
  goals: Goal[];
  interests: Interest[];
  desiredSkills: Skill[];
  availabilityWindows: AvailabilityWindow[];
}

export interface AuthResponse { token: string; tokenType: 'Bearer'; expiresAt: string; user: Profile }

export interface UpdateProfileRequest {
  displayName: string;
  department?: string | null;
  yearOfStudy?: number | null;
  bio?: string | null;
  availability?: string | null;
  primaryDomain?: string | null;
  onboardingComplete?: boolean;
}

export interface ProjectMember { userId: string; username: string; displayName: string; avatarKey: string | null; role: 'OWNER' | 'MEMBER' }
export interface Project {
  id: string;
  name: string;
  summary: string | null;
  domain: string | null;
  ownerUserId: string;
  createdAt: string;
  members: ProjectMember[];
  lifecycle: Lifecycle;
  targetTeamSize: number;
}
export interface ProjectInput { name: string; summary?: string | null; domain?: string | null }

export interface RequirementInput { skillId: number; minimumProficiency: number; importance: Importance; note?: string | null }
export interface Requirement extends RequirementInput { skillName: string }
export interface ProjectRequirements { projectId: string; lifecycle: Lifecycle; targetTeamSize: number; requirements: Requirement[] }

export interface BlueprintSuggestionRequest { idea: string; domain?: string | null; skillIds?: number[]; targetTeamSize?: number }
export interface BlueprintSuggestion {
  source: string;
  title: string;
  summary: string;
  domain: string | null;
  targetTeamSize: number;
  requirements: Requirement[];
  assumptions: string[];
}
/** Proposed extension served by POST /project-blueprints/ai-suggestions (see docs/mesh-v2/DEMO_API_HANDOFF.md). */
export interface AiBlueprintSuggestion extends BlueprintSuggestion {
  source: 'GEMINI' | 'DETERMINISTIC_TEMPLATE';
  objectives: string[];
  unmappedSkills: { name: string; importance: Importance; reason: string | null }[];
  fallbackReason: string | null;
}

export interface SkillGap {
  skillId: number;
  skillName: string;
  requiredProficiency: number;
  importance: Importance;
  coverageStatus: Coverage;
  satisfyingMemberIds: string[];
}
export interface SkillGapAnalysis {
  projectId: string;
  lifecycle: Lifecycle;
  targetTeamSize: number;
  currentMemberCount: number;
  remainingCapacity: number;
  required: SkillGap[];
  preferred: SkillGap[];
}

export type AvailabilityStatus = 'COMPATIBLE' | 'UNKNOWN' | 'INCOMPATIBLE';
export interface TeamCandidateReason {
  userId: string;
  displayName: string;
  covers: number[];
  partialCovers: number[];
  learningFit: number[];
  availabilityStatus: AvailabilityStatus;
  evidenceSupport: boolean;
  explanation: string;
}
export interface TeamAlternative {
  candidates: TeamCandidateReason[];
  coveredRequiredSkillIds: number[];
  uncoveredRequiredSkillIds: number[];
  coveredPreferredSkillIds: number[];
  seatsUnfilled: number;
  explanation: string;
}
export interface TeamSuggestionSet {
  projectId: string;
  targetTeamSize: number;
  currentMemberCount: number;
  remainingCapacity: number;
  gapAnalysis: SkillGapAnalysis;
  alternatives: TeamAlternative[];
  explanation: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterUserId: string;
  inviterName: string;
  inviteeUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  respondedAt: string | null;
}

export interface ConnectionRequest { id: string; senderId: string; senderUsername: string; senderName: string; status: string; createdAt: string }
export interface Collaborator { id: string; username: string; displayName: string; department: string | null; yearOfStudy: number | null; bio: string | null; avatarKey: string | null }
export interface Connection { id: string; collaborator: Collaborator; createdAt: string }

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeUserId: string | null;
  dueDate: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}
export interface CalendarEvent { id: string; projectId: string; title: string; description: string | null; startsAt: string; endsAt: string; createdByUserId: string; createdAt: string }
export interface PollOption { id: string; startsAt: string; endsAt: string; voteCount: number; votedByMe: boolean }
export interface AvailabilityPoll {
  id: string;
  projectId: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'SCHEDULED';
  selectedOptionId: string | null;
  createdByUserId: string;
  createdAt: string;
  options: PollOption[];
}
export interface ProjectMessage { id: string; projectId: string; senderId: string; senderName: string; content: string; createdAt: string }
