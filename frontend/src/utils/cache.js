import logger from './logger';

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

class ResponseCache {
  constructor() {
    this.cache = new Map();
  }

  generateKey(url, options) {
    return `${url}:${JSON.stringify(options || {})}`;
  }

  get(url, options) {
    const key = this.generateKey(url, options);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return cached.data;
  }

  set(url, options, data) {
    const key = this.generateKey(url, options);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    logger.debug('Cache set', { key });
  }

  clear() {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const responseCache = new ResponseCache();
export default responseCache;
