import { API_ENDPOINTS } from '../config/api';
import logger from './logger';
import { analytics } from './analytics';
import { responseCache } from './cache';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 30000;

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data;
  
  try {
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (e) {
    logger.error('Failed to parse response:', e);
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiRequest = async (url, options = {}) => {
  let lastError;
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  // Проверяем кэш для GET запросов
  if (method === 'GET') {
    const cached = responseCache.get(url, options);
    if (cached) {
      logger.info('Using cached response', { url });
      return cached;
    }
  }
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      logger.debug(`API request (attempt ${attempt}/${MAX_RETRIES}):`, { url, method });

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeout);
      const result = await handleResponse(response);
      
      // Кэшируем GET запросы
      if (method === 'GET') {
        responseCache.set(url, options, result);
      }
      
      const duration = Date.now() - startTime;
      analytics.trackApiRequest(url, method, duration, true);
      
      return result;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      
      if (error.name === 'AbortError') {
        lastError = new Error('Запрос истек. Проверьте интернет соединение.');
      }
      
      if (!navigator.onLine) {
        lastError = new Error('Нет интернет соединения');
      }
      
      if (error.status === 401 || error.status === 400) {
        logger.error('API request failed (no retry):', error);
        const duration = Date.now() - startTime;
        analytics.trackApiRequest(url, method, duration, false);
        analytics.trackError('api_error', error);
        throw error;
      }
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * attempt;
        logger.warn(`API request failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms:`, error.message);
        await sleep(delay);
        continue;
      }
      
      logger.error(`API request failed after ${MAX_RETRIES} attempts:`, error);
      const duration = Date.now() - startTime;
      analytics.trackApiRequest(url, method, duration, false);
      analytics.trackError('api_error_final', error);
      throw error;
    }
  }
  
  throw lastError;
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
    body: JSON.stringify({
      text: message.text,
      category: message.category || 'general',
      sessionId: message.sessionId
    }),
  }),
  
  getSessions: () => apiRequest(API_ENDPOINTS.CHAT.SESSIONS),
  
  createSession: (data) => apiRequest(API_ENDPOINTS.CHAT.SESSIONS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
