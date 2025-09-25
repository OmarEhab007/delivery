/**
 * Migration script to add pricingType field to existing shipments
 * This ensures backward compatibility by setting all existing shipments to 'BIDDING'
 *
 * Run this script once after deploying the fixed-price feature:
 * node src/scripts/database/migrateShipmentsPricingType.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../../config/database');
const { Shipment } = require('../../models/Shipment');
const logger = require('../../utils/logger');

async function migrateShipments() {
  try {
    // Connect to database
    await connectDB();

    logger.info('Starting shipment pricing type migration');

    // Count shipments without pricingType
    const countWithoutPricing = await Shipment.countDocuments({
      pricingType: { $exists: false },
    });

    logger.info(`Shipments without pricingType: ${countWithoutPricing}`);

    if (countWithoutPricing === 0) {
      logger.info('No shipments need migration');
      process.exit(0);
    }

    // Update all shipments without pricingType to 'BIDDING'
    const updateResult = await Shipment.updateMany(
      { pricingType: { $exists: false } },
      {
        $set: {
          pricingType: 'BIDDING',
          fixedPriceDetails: {
            autoAssign: false,
          },
        },
      }
    );

    logger.info(`Migration completed: ${updateResult.modifiedCount} shipments updated`);

    // Verify migration
    const verifyCount = await Shipment.countDocuments({
      pricingType: { $exists: false },
    });

    if (verifyCount === 0) {
      logger.info('Migration verified successfully: all shipments now have pricingType');
    } else {
      logger.warn(`${verifyCount} shipments still missing pricingType after migration`);
    }

    // Show statistics
    const stats = await Shipment.aggregate([
      {
        $group: {
          _id: '$pricingType',
          count: { $sum: 1 },
        },
      },
    ]);

    stats.forEach((stat) => {
      logger.info('Shipment pricing type distribution', {
        pricingType: stat._id,
        count: stat.count,
      });
    });

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run migration
migrateShipments();
