import logger from './logger';

export const offlineManager = {
  isOnline: () => navigator.onLine,

  init: () => {
    window.addEventListener('online', () => {
      logger.info('Internet connection restored');
      window.dispatchEvent(new CustomEvent('app:online'));
    });

    window.addEventListener('offline', () => {
      logger.warn('Internet connection lost');
      window.dispatchEvent(new CustomEvent('app:offline'));
    });
  },

  queueMessage: (message) => {
    const queue = JSON.parse(localStorage.getItem('messageQueue') || '[]');
    queue.push({
      ...message,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('messageQueue', JSON.stringify(queue));
    logger.info('Message queued for later', { queueLength: queue.length });
  },

  getQueuedMessages: () => {
    return JSON.parse(localStorage.getItem('messageQueue') || '[]');
  },

  clearQueue: () => {
    localStorage.removeItem('messageQueue');
  },

  syncQueue: async (sendMessageFn) => {
    const queue = offlineManager.getQueuedMessages();
    if (queue.length === 0) return;

    logger.info('Syncing queued messages', { count: queue.length });

    for (const message of queue) {
      try {
        await sendMessageFn(message);
        logger.info('Synced message', { id: message.id });
      } catch (error) {
        logger.error('Failed to sync message', error);
        return; // Stop on first error
      }
    }

    offlineManager.clearQueue();
    logger.info('Queue synced successfully');
  }
};

export default offlineManager;
