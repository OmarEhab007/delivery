const User = require('../models/User');

const logger = require('./logger');

/**
 * Checks if an admin user exists in the system
 * If not, creates a default admin based on environment variables
 */
const initializeAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });

    if (existingAdmin) {
      logger.info(`Admin user already exists with email: ${existingAdmin.email}`);
      return;
    }

    // No admin user exists, create one using environment variables
    const adminUser = await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@deliveryapp.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      phone: process.env.ADMIN_PHONE || '1234567890',
      role: 'Admin',
      adminPermissions: ['FULL_ACCESS'],
    });

    logger.info(`Initial admin user created successfully with email: ${adminUser.email}`);
    logger.warn('Please change the default admin password after first login!');
  } catch (error) {
    logger.error(`Error initializing admin user: ${error.message}`);
  }
};

module.exports = initializeAdminUser;
