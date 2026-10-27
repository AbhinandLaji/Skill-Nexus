export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('/uploads')) {
    return `${BACKEND_URL}${avatar}`;
  }
  return avatar;
};

export const getChannelFileUrl = (channelId, filename) => {
  if (!channelId || !filename) return '#';
  return `${BASE_URL}/channels/${channelId}/files/${encodeURIComponent(filename)}`;
};

async function fetcher(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend server. Please make sure the backend server is running on ${BACKEND_URL}`);
    }
    throw err;
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `API error: ${res.statusText}`);
  }
  return res.json();
}

async function uploadFetcher(endpoint, formData) {
  const token = localStorage.getItem('auth_token');
  const headers = {};

  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token}`;
  }

  // NOTE: Do not set Content-Type header here!
  // The browser sets multipart/form-data with the boundary automatically.
  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend server. Please make sure the backend server is running on ${BACKEND_URL}`);
    }
    throw err;
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `Upload error: ${res.statusText}`);
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
  verifyOtp: (data) => fetcher('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendOtp: (data) => fetcher('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (token) => fetcher('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  // Users
  getMe: () => fetcher('/users/me'),
  updateMe: (data) => fetcher('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  updateUserSkills: (data) => fetcher('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getUserProfile: (userId) => fetcher(`/users/${userId}`),
  updateUserProfile: (data) => fetcher('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Teams & Matchmaking
  getTeams: (params = {}) => {
    const query = new URLSearchParams();
    if (params.skill && params.skill !== 'All') query.append('skill', params.skill);
    if (params.type && params.type !== 'All') query.append('type', params.type);
    if (params.search) query.append('search', params.search);
    if (params.showAll) query.append('showAll', params.showAll);
    if (params.authorId) query.append('authorId', params.authorId);
    const qs = query.toString();
    return fetcher(`/teams${qs ? `?${qs}` : ''}`);
  },
  getTeamRecommendations: () => fetcher('/teams/recommendations'),
  createTeam: (data) => fetcher('/teams', { method: 'POST', body: JSON.stringify(data) }),
  createTeamPost: (data) => fetcher('/teams', { method: 'POST', body: JSON.stringify(data) }),
  requestToJoinTeam: (teamId) => fetcher(`/teams/${teamId}/join`, { method: 'POST' }),
  requestJoinTeam: (teamId) => fetcher(`/teams/${teamId}/join`, { method: 'POST' }),
  deleteTeam: (teamId) => fetcher(`/teams/${teamId}`, { method: 'DELETE' }),
  acceptJoinRequest: (teamId, data = {}) => fetcher(`/teams/${teamId}/accept`, { method: 'POST', body: JSON.stringify(data) }),
  rejectJoinRequest: (teamId, data = {}) => fetcher(`/teams/${teamId}/reject`, { method: 'POST', body: JSON.stringify(data) }),

  // Mentorship & Opportunities
  getOpportunities: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.tag) query.append('tag', params.tag);
    const qs = query.toString();
    return fetcher(`/opportunities${qs ? `?${qs}` : ''}`);
  },
  createOpportunity: (data) => fetcher('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  registerForOpportunity: (id) => fetcher(`/opportunities/${id}/register`, { method: 'POST' }),
  getMentors: () => fetcher('/mentors'),
  requestMentorship: (id, data = {}) => fetcher(`/mentors/${id}/request`, { method: 'POST', body: JSON.stringify(data) }),
  getQuestions: () => fetcher('/mentorship/questions'),
  askQuestion: (data) => fetcher('/mentorship/questions', { method: 'POST', body: JSON.stringify(data) }),
  answerQuestion: (questionId, data) => fetcher(`/mentorship/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify(data) }),

  // File Uploads (Module IV: 4.5)
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFetcher('/upload', formData);
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return uploadFetcher('/users/me/avatar', formData);
  },

  // Global Search & Discovery
  search: (query) => fetcher(`/search?q=${encodeURIComponent(query)}`),

  // Activity Feed
  getFeed: () => fetcher('/feed'),

  // Skills
  getSkills: () => fetcher('/skills'),

  // Channels
  getChannels: () => fetcher('/channels'),
  getSuggestedChannels: () => fetcher('/channels/suggested'),
  getChannel: (channelId) => fetcher(`/channels/${channelId}`),
  joinChannel: (channelId) => fetcher(`/channels/${channelId}/join`, { method: 'POST' }),
  leaveChannel: (channelId) => fetcher(`/channels/${channelId}/membership`, { method: 'DELETE' }),
  deleteChannel: (channelId) => fetcher(`/channels/${channelId}`, { method: 'DELETE' }),
  inviteToChannel: (channelId, email) => fetcher(`/channels/${channelId}/invitations`, {
    method: 'POST', body: JSON.stringify({ email })
  }),
  createChannel: (channelData) => createChannel(channelData),
  sendChannelMessage: (data) => fetcher(`/channels/${data.channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  getMessages: (channelId) => fetcher(`/channels/${channelId}/messages`),
  sendMessage: (channelId, data) => fetcher(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  getPinnedMessages: (channelId) => fetcher(`/channels/${channelId}/pins`),
  toggleMessagePin: (channelId, messageId) => fetcher(`/channels/${channelId}/messages/${messageId}/pin`, { method: 'POST' }),
  toggleMessageReaction: (channelId, messageId, emoji) => fetcher(`/channels/${channelId}/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  getMessageReplies: (channelId, messageId) => fetcher(`/channels/${channelId}/messages/${messageId}/replies`),
  sendMessageReply: (channelId, messageId, text) => fetcher(`/channels/${channelId}/messages/${messageId}/replies`, { method: 'POST', body: JSON.stringify({ text }) }),
  getForumPosts: (channelId) => fetcher(`/channels/${channelId}/forum`),
  createForumPost: (channelId, data) => fetcher(`/channels/${channelId}/forum`, { method: 'POST', body: JSON.stringify(data) }),
  replyToForumPost: (channelId, postId, text) => fetcher(`/channels/${channelId}/forum/${postId}/replies`, { method: 'POST', body: JSON.stringify({ text }) }),
  getCommunityEvents: (channelId) => fetcher(`/channels/${channelId}/events`),
  createCommunityEvent: (channelId, data) => fetcher(`/channels/${channelId}/events`, { method: 'POST', body: JSON.stringify(data) }),
  rsvpCommunityEvent: (channelId, eventId) => fetcher(`/channels/${channelId}/events/${eventId}/rsvp`, { method: 'POST' }),

  // Direct and group conversations
  getConversations: () => fetcher('/conversations'),
  createConversation: (data) => fetcher('/conversations', { method: 'POST', body: JSON.stringify(data) }),
  getConversationMessages: (conversationId) => fetcher(`/conversations/${conversationId}/messages`),
  sendConversationMessage: (conversationId, text) => fetcher(`/conversations/${conversationId}/messages`, {
    method: 'POST', body: JSON.stringify({ text })
  }),

  // Notifications
  getNotifications: () => fetcher('/notifications'),
  respondToNotification: (id, action) => fetcher(`/notifications/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
  markNotificationsRead: () => fetcher('/notifications/mark-all-read', { method: 'POST' }),
};
