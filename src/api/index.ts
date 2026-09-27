import { ApiClient } from './client';
import { HttpApiAdapter } from './httpAdapter';
import { MockApiAdapter } from './mockAdapter';

// Determine default adapter mode: if VITE_USE_MOCK is explicitly 'false', use HttpApiAdapter;
// otherwise default to MockApiAdapter for reliable local development & evaluation while backend endpoints are in progress.
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const mockAdapter = new MockApiAdapter();
export const httpAdapter = new HttpApiAdapter();

let currentAdapter: ApiClient = useMock ? mockAdapter : httpAdapter;

export const api: ApiClient = {
  register: (body) => currentAdapter.register(body),
  login: (body) => currentAdapter.login(body),
  getProfile: () => currentAdapter.getProfile(),
  updateProfile: (body) => currentAdapter.updateProfile(body),
  replaceSkills: (body) => currentAdapter.replaceSkills(body),
  getSkills: () => currentAdapter.getSkills(),

  getRecommendations: () => currentAdapter.getRecommendations(),
  sendInterest: (id) => currentAdapter.sendInterest(id),
  passCandidate: (id) => currentAdapter.passCandidate(id),
  saveCandidate: (id) => currentAdapter.saveCandidate(id),

  getIncomingInterests: () => currentAdapter.getIncomingInterests(),
  acceptInterest: (id) => currentAdapter.acceptInterest(id),
  declineInterest: (id) => currentAdapter.declineInterest(id),

  getMatches: () => currentAdapter.getMatches(),
  getMessages: (matchId) => currentAdapter.getMessages(matchId),
  sendMessage: (matchId, content) => currentAdapter.sendMessage(matchId, content),

  getProjects: () => currentAdapter.getProjects(),
  getProject: (id) => currentAdapter.getProject(id),
  createProject: (project) => currentAdapter.createProject(project),
  createProjectTask: (id, task) => currentAdapter.createProjectTask(id, task),
  updateProjectTask: (id, taskId, updates) => currentAdapter.updateProjectTask(id, taskId, updates),
  createProjectEvent: (id, event) => currentAdapter.createProjectEvent(id, event),
  votePollSlot: (id, pollId, slotId) => currentAdapter.votePollSlot(id, pollId, slotId),
  createAvailabilityPoll: (id, poll) => currentAdapter.createAvailabilityPoll(id, poll),

  getPrivacySettings: () => currentAdapter.getPrivacySettings(),
  updatePrivacySettings: (settings) => currentAdapter.updatePrivacySettings(settings),

  setToken: (token) => {
    mockAdapter.setToken(token);
    httpAdapter.setToken(token);
  },
  getToken: () => currentAdapter.getToken(),
};

export const setApiMode = (mode: 'mock' | 'http') => {
  currentAdapter = mode === 'mock' ? mockAdapter : httpAdapter;
};

export const isUsingMock = () => currentAdapter === mockAdapter;

export { ApiError } from './client';
