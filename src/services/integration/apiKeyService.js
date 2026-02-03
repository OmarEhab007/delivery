const crypto = require('crypto');

const generateApiKey = () => {
  const rawKey = `deliv_${crypto.randomBytes(24).toString('hex')}`;
  const apiKeyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const apiKeyPrefix = rawKey.slice(0, 12);

  return {
    rawKey,
    apiKeyHash,
    apiKeyPrefix,
  };
};

const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

module.exports = {
  generateApiKey,
  hashApiKey,
};
