const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const logger = require('../utils/logger');

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for createAdminUser');

    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      logger.info('Admin user already exists', { email: existingAdmin.email });
      process.exit(0);
    }

    const password = process.env.ADMIN_PASSWORD || 'admin123456';

    const adminUser = await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@deliveryapp.com',
      password,
      phone: process.env.ADMIN_PHONE || '1234567890',
      role: 'Admin',
      adminPermissions: ['FULL_ACCESS'],
    });

    logger.warn('Admin user created. Rotate password immediately.', {
      email: adminUser.email,
    });
  } catch (error) {
    logger.error('Error creating admin user', { error: error.message });
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdminUser();
