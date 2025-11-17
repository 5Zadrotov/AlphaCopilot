const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

const formatTime = () => new Date().toLocaleTimeString();

const formatMessage = (level, msg, data) => {
  const time = formatTime();
  const prefix = `[${time}] [${level}]`;
  return data ? `${prefix} ${msg}` : `${prefix} ${msg}`;
};

export const logger = {
  debug: (msg, data) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', msg, data), data || '');
    }
  },

  info: (msg, data) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', msg, data), data || '');
    }
  },

  warn: (msg, data) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', msg, data), data || '');
    }
  },

  error: (msg, error) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', msg, error), error || '');
    }
  }
};

export default logger;
