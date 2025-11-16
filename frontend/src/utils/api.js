import { API_ENDPOINTS } from '../config/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  return response.json();
};

export const apiRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const authAPI = {
  login: (credentials) => apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  register: (userData) => apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

export const chatAPI = {
  sendMessage: (message) => apiRequest(API_ENDPOINTS.CHAT.MESSAGES, {
    method: 'POST',
    body: JSON.stringify(message),
  }),
  
  getSessions: () => apiRequest(API_ENDPOINTS.CHAT.SESSIONS),
};