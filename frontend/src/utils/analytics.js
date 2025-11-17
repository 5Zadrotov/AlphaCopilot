import logger from './logger';

class Analytics {
  constructor() {
    this.events = [];
    this.metrics = {
      apiRequests: 0,
      apiErrors: 0,
      apiSuccesses: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  trackEvent(eventName, data) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      data
    };
    this.events.push(event);
    logger.debug('Event tracked', { event: eventName, data });
  }

  trackApiRequest(url, method, duration, success) {
    this.metrics.apiRequests++;
    this.metrics.responseTimes.push(duration);

    if (success) {
      this.metrics.apiSuccesses++;
    } else {
      this.metrics.apiErrors++;
    }

    this.metrics.averageResponseTime = 
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;

    this.trackEvent('api_request', {
      url,
      method,
      duration,
      success
    });
  }

  trackError(errorName, error) {
    this.trackEvent('error', {
      name: errorName,
      message: error.message,
      stack: error.stack
    });
  }

  trackUserAction(action, details) {
    this.trackEvent('user_action', {
      action,
      details
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      totalEvents: this.events.length,
      errorRate: this.metrics.apiRequests > 0 
        ? (this.metrics.apiErrors / this.metrics.apiRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  getEvents(limit = 100) {
    return this.events.slice(-limit);
  }

  exportMetrics() {
    return {
      metrics: this.getMetrics(),
      events: this.getEvents(),
      exportedAt: new Date().toISOString()
    };
  }

  clear() {
    this.events = [];
    this.metrics = {
      apiRequests: 0,
      apiErrors: 0,
      apiSuccesses: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
    logger.info('Analytics cleared');
  }
}

export const analytics = new Analytics();
export default analytics;
