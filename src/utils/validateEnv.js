const logger = require('./logger');

const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET', 'COOKIE_SECRET'];

const PRODUCTION_ONLY_ENV_VARS = [
  'FRONTEND_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_PHONE',
];

const DISALLOWED_DEFAULT_VALUES = {
  JWT_SECRET: ['your_jwt_secret_key_here', 'replace_with_strong_secret'],
  COOKIE_SECRET: ['your_cookie_secret_key_here', 'replace_with_cookie_secret'],
  ADMIN_PASSWORD: ['admin123456', 'replace_with_secure_password'],
};

const hasDisallowedValue = (key, value) => {
  if (!DISALLOWED_DEFAULT_VALUES[key]) {
    return false;
  }

  return DISALLOWED_DEFAULT_VALUES[key].includes(value);
};

const validateEnv = () => {
  const missing = [];

  REQUIRED_ENV_VARS.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    PRODUCTION_ONLY_ENV_VARS.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  Object.entries(DISALLOWED_DEFAULT_VALUES).forEach(([key, defaults]) => {
    const value = process.env[key];
    if (value && defaults.includes(value) && process.env.NODE_ENV === 'production') {
      const errorMessage = `Environment variable ${key} uses an insecure default value. Please override it for production.`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  });
};

module.exports = validateEnv;

