const { validationResult } = require('express-validator');

const { IntegrationCredential } = require('../../models/IntegrationCredential');
const { WebhookSubscription } = require('../../models/WebhookSubscription');
const { Shipment, ShipmentStatus, ShipmentApprovalState } = require('../../models/Shipment');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { generateApiKey } = require('../../services/integration/apiKeyService');
const logger = require('../../utils/logger');

const ALLOWED_SCOPES = new Set([
  'shipments:read',
  'shipments:write',
  'webhooks:read',
  'webhooks:write',
]);

const sanitizeScopes = (scopes = []) => {
  if (!Array.isArray(scopes)) return [];
  return scopes.filter((scope) => ALLOWED_SCOPES.has(scope));
};

const pickAllowedFields = (source, allowedFields) => {
  const result = {};
  allowedFields.forEach((field) => {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  });
  return result;
};

const SHIPMENT_ALLOWED_FIELDS = [
  'origin',
  'destination',
  'cargoDetails',
  'pricing',
  'notes',
  'scheduledDate',
  'pricingType',
  'specialRequirements',
  'estimatedPickupDate',
  'estimatedDeliveryDate',
];

const getMerchantId = (req) => {
  if (req.user?.role === 'Admin' && req.body?.merchantId) {
    return req.body.merchantId;
  }
  return req.user.id;
};

const createCredential = asyncHandler(async (req, res, next) => {
  const { name, scopes } = req.body;
  if (!name) {
    return next(new ApiError('Credential name is required', 400));
  }

  const sanitizedScopes = sanitizeScopes(scopes);
  const { rawKey, apiKeyHash, apiKeyPrefix } = generateApiKey();
  const merchantId = getMerchantId(req);

  const credential = await IntegrationCredential.create({
    name,
    apiKeyHash,
    apiKeyPrefix,
    scopes: sanitizedScopes.length ? sanitizedScopes : undefined,
    merchantId,
    createdBy: req.user.id,
  });

  return ApiSuccess(
    res,
    {
      credential: {
        id: credential._id,
        name: credential.name,
        scopes: credential.scopes,
        apiKeyPrefix: credential.apiKeyPrefix,
        active: credential.active,
        createdAt: credential.createdAt,
      },
      apiKey: rawKey,
    },
    201
  );
});

const listCredentials = asyncHandler(async (req, res, next) => {
  const merchantId = req.user.role === 'Admin' && req.query.merchantId ? req.query.merchantId : req.user.id;

  const credentials = await IntegrationCredential.find({ merchantId }).sort({ createdAt: -1 });

  return ApiSuccess(res, { credentials });
});

const createWebhook = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const merchantId = getMerchantId(req);
  const { endpointUrl, eventTypes } = req.body;
  const sanitizedEvents = Array.isArray(eventTypes) && eventTypes.length ? eventTypes : undefined;
  const secret = generateApiKey().rawKey;

  const webhook = await WebhookSubscription.create({
    merchantId,
    createdBy: req.user.id,
    endpointUrl,
    eventTypes: sanitizedEvents,
    secret,
  });

  return ApiSuccess(
    res,
    {
      webhook: {
        id: webhook._id,
        endpointUrl: webhook.endpointUrl,
        eventTypes: webhook.eventTypes,
        status: webhook.status,
        createdAt: webhook.createdAt,
      },
      secret,
    },
    201
  );
});

const listWebhooks = asyncHandler(async (req, res, next) => {
  const merchantId = req.user.role === 'Admin' && req.query.merchantId ? req.query.merchantId : req.user.id;
  const webhooks = await WebhookSubscription.find({ merchantId }).sort({ createdAt: -1 });

  return ApiSuccess(res, { webhooks });
});

const createShipmentViaIntegration = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const idempotencyKey = req.headers['x-idempotency-key'] || req.headers['x-external-reference'];

  if (idempotencyKey) {
    const existing = await Shipment.findOne({
      'integrationReference.credentialId': req.integration.id,
      'integrationReference.referenceId': idempotencyKey,
    });

    if (existing) {
      return ApiSuccess(res, { shipment: existing, duplicate: true });
    }
  }

  const shipmentData = pickAllowedFields(req.body, SHIPMENT_ALLOWED_FIELDS);
  shipmentData.merchantId = req.integration.merchantId;
  shipmentData.status = ShipmentStatus.PENDING_APPROVAL;
  shipmentData.approval = {
    state: ShipmentApprovalState.PENDING,
    submittedBy: req.integration.merchantId,
    submittedAt: new Date(),
  };
  shipmentData.timeline = [
    {
      status: ShipmentStatus.PENDING_APPROVAL,
      note: 'Shipment submitted via integration API',
    },
  ];

  if (!shipmentData.pricingType) {
    shipmentData.pricingType = 'BIDDING';
  }

  if (idempotencyKey) {
    shipmentData.integrationReference = {
      credentialId: req.integration.id,
      referenceId: idempotencyKey,
      receivedAt: new Date(),
    };
  }

  const shipment = await Shipment.create(shipmentData);

  logger.info('Shipment created via integration API', {
    shipmentId: shipment._id,
    merchantId: req.integration.merchantId,
    credentialId: req.integration.id,
  });

  return ApiSuccess(res, { shipment }, 201);
});

const getShipmentStatusViaIntegration = asyncHandler(async (req, res, next) => {
  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    return next(new ApiError('Shipment not found', 404));
  }

  if (shipment.merchantId.toString() !== req.integration.merchantId.toString()) {
    return next(new ApiError('You do not have access to this shipment', 403));
  }

  return ApiSuccess(res, {
    shipment: {
      id: shipment._id,
      status: shipment.status,
      approval: shipment.approval,
      origin: shipment.origin,
      destination: shipment.destination,
      updatedAt: shipment.updatedAt,
      estimatedPickupDate: shipment.estimatedPickupDate,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
    },
  });
});

module.exports = {
  createCredential,
  listCredentials,
  createWebhook,
  listWebhooks,
  createShipmentViaIntegration,
  getShipmentStatusViaIntegration,
};
