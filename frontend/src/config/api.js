const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`
  },
  CHAT: {
    SESSIONS: `${API_BASE_URL}/sessions`,
    MESSAGES: `${API_BASE_URL}/chat/message`,
    HISTORY: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/messages`
  },
  USER: {
    PROFILE: `${API_BASE_URL}/user/profile`,
    UPDATE: `${API_BASE_URL}/user/update`
  }
};

export default API_BASE_URL;