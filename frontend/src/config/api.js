const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`
  },
  CHAT: {
    SESSIONS: `${API_BASE_URL}/api/sessions`,
    MESSAGES: `${API_BASE_URL}/api/chat/message`,
    HISTORY: (sessionId) => `${API_BASE_URL}/api/sessions/${sessionId}/messages`
  },
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE: `${API_BASE_URL}/api/user/update`
  },
  HEALTH: `${API_BASE_URL}/api/health`
};

export default API_BASE_URL;
