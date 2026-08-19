/**
 * Thin client for the Mesh Connect REST API.
 *
 * The packaged build is served by the Spring Boot application itself, so the default
 * base URL is a same-origin relative path - no configuration, no CORS. During `npm run
 * dev` the Vite proxy forwards the same path to the API on port 8080. Set
 * VITE_API_BASE_URL only when the API lives on a different host.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const request = async (path, { method = 'GET', body, token } = {}) => {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // The request never reached the server (offline, or the API is not running).
    throw new ApiError('Could not reach the server. Check that the API is running.', 0);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', response.status, data?.fields);
  }
  return data;
};

export const api = {
  enabled: true,
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  profile: (token) => request('/profile/me', { token }),
  updateProfile: (body, token) => request('/profile/me', { method: 'PUT', body, token }),
  updateSkills: (body, token) => request('/profile/me/skills', { method: 'PUT', body, token }),
  skills: (token) => request('/skills', { token }),
  recommendations: (token) => request('/recommendations?limit=12', { token }),
  sendInterest: (userId, token) => request(`/interests/${userId}`, { method: 'POST', token }),
  incomingInterests: (token) => request('/interests/incoming', { token }),
  acceptInterest: (interestId, token) => request(`/interests/${interestId}/accept`, { method: 'PATCH', token }),
  declineInterest: (interestId, token) => request(`/interests/${interestId}/decline`, { method: 'PATCH', token }),
  matches: (token) => request('/matches', { token }),
  messages: (matchId, token) => request(`/matches/${matchId}/messages`, { token }),
  sendMessage: (matchId, content, token) => request(`/matches/${matchId}/messages`, { method: 'POST', body: { content }, token }),
  posts: (token) => request('/posts?page=0&size=20', { token }),
  createPost: (body, token) => request('/posts', { method: 'POST', body, token }),
  comments: (postId, token) => request(`/posts/${postId}/comments`, { token }),
  comment: (postId, body, token) => request(`/posts/${postId}/comments`, { method: 'POST', body: { body }, token }),
  suggestTeam: (body, token) => request('/teams/suggest', { method: 'POST', body, token }),
  markSolution: (postId, commentId, token) => request(`/posts/${postId}/solution/${commentId}`, { method: 'PATCH', token }),
};
