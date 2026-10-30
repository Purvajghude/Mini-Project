import type * as T from './types';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
const TOKEN_KEY = 'mesh.session';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export const session = {
  load(): string | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const { token: saved, expiresAt } = JSON.parse(raw);
      if (Date.parse(expiresAt) <= Date.now()) return null;
      token = saved;
      return saved;
    } catch {
      return null;
    }
  },
  save(auth: T.AuthResponse) {
    token = auth.token;
    try { localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: auth.token, expiresAt: auth.expiresAt })); } catch { /* storage unavailable */ }
  },
  clear() {
    token = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
  token: () => token,
  onUnauthorized(handler: () => void) { onUnauthorized = handler; },
};
// Restore on module (re)load too, so a hot reload of this module doesn't drop the session.
session.load();

async function request<R>(path: string, method = 'GET', body?: unknown): Promise<R> {
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('MESH can’t reach its server right now. Check that the API is running.', 0);
  }
  if (response.status === 204) return undefined as R;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Auth endpoints return 401 for bad credentials; only a rejected session should sign the user out.
    if (response.status === 401 && token && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status, data?.fields ?? {});
  }
  return data as R;
}

const p = (id: string) => `/projects/${encodeURIComponent(id)}`;

export const api = {
  register: (b: { displayName: string; username: string; email: string; password: string }) => request<T.AuthResponse>('/auth/register', 'POST', b),
  login: (b: { email: string; password: string }) => request<T.AuthResponse>('/auth/login', 'POST', b),

  me: () => request<T.Profile>('/profile/me'),
  updateProfile: (b: T.UpdateProfileRequest) => request<T.Profile>('/profile/me', 'PUT', b),
  replaceSkills: (skills: { skillId: number; proficiency: number }[]) => request<T.Profile>('/profile/me/skills', 'PUT', { skills }),
  replaceInterests: (interestIds: number[]) => request<T.Profile>('/profile/me/interests', 'PUT', { interestIds }),
  replaceGoals: (goalCodes: string[]) => request<T.Profile>('/profile/me/goals', 'PUT', { goalCodes }),
  replaceAvailability: (timezone: string, windows: T.AvailabilityWindow[]) => request<T.Profile>('/profile/me/availability', 'PUT', { timezone, windows }),

  skills: () => request<T.Skill[]>('/skills'),
  goals: () => request<T.Goal[]>('/goals'),
  interests: () => request<T.Interest[]>('/interests'),
  domains: () => request<T.Domain[]>('/domains'),

  suggestBlueprint: (b: T.BlueprintSuggestionRequest) => request<T.BlueprintSuggestion>('/project-blueprints/suggestions', 'POST', b),
  suggestAiBlueprint: (b: T.BlueprintSuggestionRequest) => request<T.AiBlueprintSuggestion>('/project-blueprints/ai-suggestions', 'POST', b),

  projects: () => request<T.Project[]>('/projects'),
  project: (id: string) => request<T.Project>(p(id)),
  createProject: (b: T.ProjectInput) => request<T.Project>('/projects', 'POST', b),
  updateProject: (id: string, b: T.ProjectInput) => request<T.Project>(p(id), 'PUT', b),
  requirements: (id: string) => request<T.ProjectRequirements>(`${p(id)}/requirements`),
  saveRequirements: (id: string, b: { targetTeamSize: number; lifecycle: T.Lifecycle; requirements: T.RequirementInput[] }) =>
    request<T.ProjectRequirements>(`${p(id)}/requirements`, 'PUT', b),
  skillGap: (id: string) => request<T.SkillGapAnalysis>(`${p(id)}/skill-gap-analysis`),
  teamSuggestions: (id: string, b: { availabilityPolicy?: 'ALLOW_UNKNOWN' | 'REQUIRE_OVERLAP'; excludeCandidateIds?: string[] } = {}) =>
    request<T.TeamSuggestionSet>(`${p(id)}/team-suggestions`, 'POST', b),
  addMember: (id: string, userId: string) => request<T.Project>(`${p(id)}/members`, 'POST', { userId }),

  invite: (id: string, inviteeUserId: string) => request<T.ProjectInvitation>(`${p(id)}/invitations`, 'POST', { inviteeUserId }),
  projectInvitations: (id: string) => request<T.ProjectInvitation[]>(`${p(id)}/invitations`),
  cancelInvitation: (id: string, invitationId: string) => request<T.ProjectInvitation>(`${p(id)}/invitations/${invitationId}`, 'DELETE'),
  incomingInvitations: () => request<T.ProjectInvitation[]>('/project-invitations/incoming'),
  acceptInvitation: (invitationId: string) => request<T.ProjectInvitation>(`/project-invitations/${invitationId}/accept`, 'PATCH'),
  declineInvitation: (invitationId: string) => request<T.ProjectInvitation>(`/project-invitations/${invitationId}/decline`, 'PATCH'),

  tasks: (id: string) => request<T.ProjectTask[]>(`${p(id)}/tasks`),
  createTask: (id: string, b: { title: string; description?: string | null; assigneeUserId?: string | null; dueDate?: string | null }) =>
    request<T.ProjectTask>(`${p(id)}/tasks`, 'POST', b),
  updateTask: (id: string, taskId: string, b: { title: string; description: string | null; status: T.TaskStatus; assigneeUserId: string | null; dueDate: string | null }) =>
    request<T.ProjectTask>(`${p(id)}/tasks/${taskId}`, 'PUT', b),
  deleteTask: (id: string, taskId: string) => request<void>(`${p(id)}/tasks/${taskId}`, 'DELETE'),

  events: (id: string) => request<T.CalendarEvent[]>(`${p(id)}/events`),
  createEvent: (id: string, b: { title: string; description?: string | null; startsAt: string; endsAt: string }) =>
    request<T.CalendarEvent>(`${p(id)}/events`, 'POST', b),
  polls: (id: string) => request<T.AvailabilityPoll[]>(`${p(id)}/availability-polls`),
  createPoll: (id: string, b: { title: string; options: { startsAt: string; endsAt: string }[] }) =>
    request<T.AvailabilityPoll>(`${p(id)}/availability-polls`, 'POST', b),
  vote: (id: string, pollId: string, optionId: string, on: boolean) =>
    request<void>(`${p(id)}/availability-polls/${pollId}/options/${optionId}/vote`, on ? 'PUT' : 'DELETE'),
  closePoll: (id: string, pollId: string, selectedOptionId: string) =>
    request<T.AvailabilityPoll>(`${p(id)}/availability-polls/${pollId}/close`, 'PATCH', { selectedOptionId }),
  schedulePoll: (id: string, pollId: string) => request<T.CalendarEvent>(`${p(id)}/availability-polls/${pollId}/schedule`, 'POST'),

  messages: (id: string) => request<T.ProjectMessage[]>(`${p(id)}/messages?limit=100`),
  sendMessage: (id: string, content: string) => request<T.ProjectMessage>(`${p(id)}/messages`, 'POST', { content }),

  connections: () => request<T.Connection[]>('/connections'),
  incomingRequests: () => request<T.ConnectionRequest[]>('/connection-requests/incoming'),
  requestConnection: (recipientUserId: string) => request<T.ConnectionRequest>('/connection-requests', 'POST', { recipientUserId }),
  acceptRequest: (requestId: string) => request<T.Connection>(`/connection-requests/${requestId}/accept`, 'PATCH'),
  declineRequest: (requestId: string) => request<void>(`/connection-requests/${requestId}/decline`, 'PATCH'),
};
