const mongoose = require('mongoose');
const { Shipment } = require('../../models/Shipment');

const buildDateRangeFilter = (startDate, endDate, field = 'createdAt') => {
  if (!startDate && !endDate) return {};

  const range = {};
  if (startDate) {
    range.$gte = new Date(startDate);
  }
  if (endDate) {
    range.$lte = new Date(endDate);
  }

  return { [field]: range };
};

const getKpiSummary = async ({ merchantId, startDate, endDate }) => {
  const match = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    ...buildDateRangeFilter(startDate, endDate, 'createdAt'),
  };

  const totalShipments = await Shipment.countDocuments(match);

  const deliveredMatch = {
    ...match,
    actualDeliveryDate: { $ne: null },
  };

  const deliveredCount = await Shipment.countDocuments(deliveredMatch);

  const pipeline = [
    { $match: deliveredMatch },
    {
      $project: {
        onTime: {
          $cond: [
            {
              $and: [
                { $ifNull: ['$estimatedDeliveryDate', false] },
                { $lte: ['$actualDeliveryDate', '$estimatedDeliveryDate'] },
              ],
            },
            1,
            0,
          ],
        },
        transitHours: {
          $cond: [
            {
              $and: [
                { $ifNull: ['$actualPickupDate', false] },
                { $ifNull: ['$actualDeliveryDate', false] },
              ],
            },
            {
              $divide: [
                { $subtract: ['$actualDeliveryDate', '$actualPickupDate'] },
                1000 * 60 * 60,
              ],
            },
            null,
          ],
        },
        delayHours: {
          $cond: [
            {
              $and: [
                { $ifNull: ['$estimatedDeliveryDate', false] },
                { $ifNull: ['$actualDeliveryDate', false] },
                { $gt: ['$actualDeliveryDate', '$estimatedDeliveryDate'] },
              ],
            },
            {
              $divide: [
                { $subtract: ['$actualDeliveryDate', '$estimatedDeliveryDate'] },
                1000 * 60 * 60,
              ],
            },
            null,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        onTimeCount: { $sum: '$onTime' },
        avgTransitHours: { $avg: '$transitHours' },
        avgDelayHours: { $avg: '$delayHours' },
      },
    },
  ];

  const [summary] = await Shipment.aggregate(pipeline);

  return {
    totalShipments,
    deliveredCount,
    onTimeRate: deliveredCount > 0 && summary ? (summary.onTimeCount || 0) / deliveredCount : 0,
    averageTransitHours: summary?.avgTransitHours ?? 0,
    averageDelayHours: summary?.avgDelayHours ?? 0,
  };
};

const getLanePerformance = async ({ merchantId, startDate, endDate, limit = 10 }) => {
  const match = {
    merchantId: new mongoose.Types.ObjectId(merchantId),
    ...buildDateRangeFilter(startDate, endDate, 'createdAt'),
  };

  const pipeline = [
    { $match: match },
    {
      $project: {
        originCountry: '$origin.country',
        destinationCountry: '$destination.country',
        actualPickupDate: 1,
        actualDeliveryDate: 1,
        estimatedDeliveryDate: 1,
      },
    },
    {
      $addFields: {
        transitHours: {
          $cond: [
            {
              $and: [
                { $ifNull: ['$actualPickupDate', false] },
                { $ifNull: ['$actualDeliveryDate', false] },
              ],
            },
            {
              $divide: [
                { $subtract: ['$actualDeliveryDate', '$actualPickupDate'] },
                1000 * 60 * 60,
              ],
            },
            null,
          ],
        },
        onTime: {
          $cond: [
            {
              $and: [
                { $ifNull: ['$estimatedDeliveryDate', false] },
                { $ifNull: ['$actualDeliveryDate', false] },
                { $lte: ['$actualDeliveryDate', '$estimatedDeliveryDate'] },
              ],
            },
            1,
            0,
          ],
        },
        delivered: {
          $cond: [{ $ifNull: ['$actualDeliveryDate', false] }, 1, 0],
        },
      },
    },
    {
      $group: {
        _id: {
          originCountry: '$originCountry',
          destinationCountry: '$destinationCountry',
        },
        shipmentCount: { $sum: 1 },
        deliveredCount: { $sum: '$delivered' },
        onTimeCount: { $sum: '$onTime' },
        avgTransitHours: { $avg: '$transitHours' },
      },
    },
    {
      $project: {
        _id: 0,
        originCountry: '$_id.originCountry',
        destinationCountry: '$_id.destinationCountry',
        shipmentCount: 1,
        deliveredCount: 1,
        onTimeRate: {
          $cond: [
            { $gt: ['$deliveredCount', 0] },
            { $divide: ['$onTimeCount', '$deliveredCount'] },
            0,
          ],
        },
        avgTransitHours: 1,
      },
    },
    { $sort: { shipmentCount: -1 } },
    { $limit: parseInt(limit, 10) },
  ];

  return Shipment.aggregate(pipeline);
};

module.exports = {
  getKpiSummary,
  getLanePerformance,
};
