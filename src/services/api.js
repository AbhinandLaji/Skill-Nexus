const BASE_URL = '/api';

async function fetcher(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data) => fetcher('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => fetcher('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (token) => fetcher('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  // Users
  getMe: () => fetcher('/users/me'),
  updateMe: (data) => fetcher('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  updateUserSkills: (data) => fetcher('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getUserProfile: (userId) => fetcher(`/users/${userId}`),
  updateUserProfile: (data) => fetcher('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Teams & Matchmaking
  getTeams: () => fetcher('/teams'),
  requestToJoinTeam: (teamId) => fetcher(`/teams/${teamId}/join`, { method: 'POST' }),
  createTeamPost: (data) => fetcher('/teams', { method: 'POST', body: JSON.stringify(data) }),

  // Mentorship & Opportunities
  getOpportunities: () => fetcher('/opportunities'),
  registerForOpportunity: (id) => fetcher(`/opportunities/${id}/register`, { method: 'POST' }),
  getMentors: () => fetcher('/mentors'),
  requestMentorship: (id) => fetcher(`/mentors/${id}/request`, { method: 'POST' }),

  // Skills
  getSkills: () => fetcher('/skills'),

  // Channels
  getChannels: () => fetcher('/channels'),
  sendChannelMessage: (data) => fetcher(`/channels/${data.channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  getMessages: (channelId) => fetcher(`/channels/${channelId}/messages`),
  sendMessage: (channelId, data) => fetcher(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  // Teams
  getTeams: () => fetcher('/teams'),
  createTeam: (data) => fetcher('/teams', { method: 'POST', body: JSON.stringify(data) }),
  requestJoinTeam: (teamId) => fetcher(`/teams/${teamId}/join-request`, { method: 'POST' }),

  // Opportunities
  getOpportunities: () => fetcher('/opportunities'),

  // Mentorship
  getQuestions: () => fetcher('/mentorship/questions'),
  askQuestion: (data) => fetcher('/mentorship/questions', { method: 'POST', body: JSON.stringify(data) }),
  answerQuestion: (questionId, data) => fetcher(`/mentorship/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify(data) })
};
