const BASE_URL = 'http://localhost:5000/api';


async function fetcher(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `API error: ${res.statusText}`);
  }
  return res.json();
}

export async function createChannel(channelData) {
  return fetcher('/channels', {
    method: 'POST',
    body: JSON.stringify(channelData),
  });
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
  createTeam: (data) => fetcher('/teams', { method: 'POST', body: JSON.stringify(data) }),
  createTeamPost: (data) => fetcher('/teams', { method: 'POST', body: JSON.stringify(data) }),
  requestToJoinTeam: (teamId) => fetcher(`/teams/${teamId}/join`, { method: 'POST' }),
  requestJoinTeam: (teamId) => fetcher(`/teams/${teamId}/join`, { method: 'POST' }),
  deleteTeam: (teamId) => fetcher(`/teams/${teamId}`, { method: 'DELETE' }),
  acceptJoinRequest: (teamId, data = {}) => fetcher(`/teams/${teamId}/accept`, { method: 'POST', body: JSON.stringify(data) }),
  rejectJoinRequest: (teamId, data = {}) => fetcher(`/teams/${teamId}/reject`, { method: 'POST', body: JSON.stringify(data) }),

  // Mentorship & Opportunities
  getOpportunities: () => fetcher('/opportunities'),
  createOpportunity: (data) => fetcher('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  registerForOpportunity: (id) => fetcher(`/opportunities/${id}/register`, { method: 'POST' }),
  getMentors: () => fetcher('/mentors'),
  requestMentorship: (id, data = {}) => fetcher(`/mentors/${id}/request`, { method: 'POST', body: JSON.stringify(data) }),
  getQuestions: () => fetcher('/mentorship/questions'),
  askQuestion: (data) => fetcher('/mentorship/questions', { method: 'POST', body: JSON.stringify(data) }),
  answerQuestion: (questionId, data) => fetcher(`/mentorship/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify(data) }),

  // Skills
  getSkills: () => fetcher('/skills'),

  // Channels
  getChannels: () => fetcher('/channels'),
  createChannel: (channelData) => createChannel(channelData),
  sendChannelMessage: (data) => fetcher(`/channels/${data.channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  getMessages: (channelId) => fetcher(`/channels/${channelId}/messages`),
  sendMessage: (channelId, data) => fetcher(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => fetcher('/notifications'),
  respondToNotification: (id, action) => fetcher(`/notifications/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
  markNotificationsRead: () => fetcher('/notifications/mark-all-read', { method: 'POST' }),
};
