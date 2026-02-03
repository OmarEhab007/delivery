const Broker = require('../../models/Broker');
const { ApiError } = require('../../middleware/errorHandler');
const { ApiSuccess } = require('../../middleware/apiSuccess');
const { asyncHandler } = require('../../middleware/asyncHandler');

const listBrokers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const brokers = await Broker.find(filter).sort({ createdAt: -1 });
  return ApiSuccess(res, { brokers });
});

const createBroker = asyncHandler(async (req, res, next) => {
  const { name, licenseNumber, countriesServed, contacts, notes } = req.body;

  if (!name || !licenseNumber) {
    return next(new ApiError('Name and licenseNumber are required', 400));
  }

  const broker = await Broker.create({
    name,
    licenseNumber,
    countriesServed,
    contacts,
    notes,
  });

  return ApiSuccess(res, { broker }, 201);
});

const getBrokerById = asyncHandler(async (req, res, next) => {
  const broker = await Broker.findById(req.params.id);
  if (!broker) {
    return next(new ApiError('Broker not found', 404));
  }
  return ApiSuccess(res, { broker });
});

const updateBroker = asyncHandler(async (req, res, next) => {
  const broker = await Broker.findById(req.params.id);
  if (!broker) {
    return next(new ApiError('Broker not found', 404));
  }

  const { name, licenseNumber, countriesServed, contacts, status, notes } = req.body;

  if (name !== undefined) broker.name = name;
  if (licenseNumber !== undefined) broker.licenseNumber = licenseNumber;
  if (countriesServed !== undefined) broker.countriesServed = countriesServed;
  if (contacts !== undefined) broker.contacts = contacts;
  if (status !== undefined) broker.status = status;
  if (notes !== undefined) broker.notes = notes;

  await broker.save();

  return ApiSuccess(res, { broker });
});

const deactivateBroker = asyncHandler(async (req, res, next) => {
  const broker = await Broker.findById(req.params.id);
  if (!broker) {
    return next(new ApiError('Broker not found', 404));
  }

  broker.status = 'INACTIVE';
  await broker.save();

  return ApiSuccess(res, { broker });
});

module.exports = {
  listBrokers,
  createBroker,
  getBrokerById,
  updateBroker,
  deactivateBroker,
};
