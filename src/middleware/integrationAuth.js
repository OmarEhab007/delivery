const { IntegrationCredential } = require('../models/IntegrationCredential');
const { ApiError } = require('./errorHandler');
const { hashApiKey } = require('../services/integration/apiKeyService');

const extractApiKey = (req) => {
  const headerKey = req.headers['x-api-key'];
  if (headerKey) {
    return headerKey.trim();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('ApiKey ')) {
    return authHeader.replace('ApiKey ', '').trim();
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  return null;
};

const authenticateIntegration = async (req, res, next) => {
  try {
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return next(new ApiError('API key is required', 401));
    }

    const apiKeyHash = hashApiKey(apiKey);
    const credential = await IntegrationCredential.findOne({ apiKeyHash, active: true });

    if (!credential) {
      return next(new ApiError('Invalid API key', 401));
    }

    credential.lastUsedAt = new Date();
    await credential.save();

    req.integration = {
      id: credential._id,
      merchantId: credential.merchantId,
      scopes: credential.scopes || [],
      name: credential.name,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

const requireIntegrationScope = (scope) => {
  return (req, res, next) => {
    const scopes = req.integration?.scopes || [];
    const hasScope = scopes.includes(scope) || scopes.includes('*');
    if (!hasScope) {
      return next(new ApiError('Insufficient API scope', 403));
    }
    return next();
  };
};

module.exports = {
  authenticateIntegration,
  requireIntegrationScope,
};
