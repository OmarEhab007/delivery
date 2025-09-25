const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const logger = require('../utils/logger');

const makeUserAdmin = async (email, createIfNotExist = false) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for makeUserAdmin');

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'Admin';
      user.adminPermissions = ['FULL_ACCESS'];
      await user.save();
      logger.info('User promoted to admin', { email });
    } else if (createIfNotExist) {
      const newPassword = process.env.ADMIN_PASSWORD || 'admin123456';
      user = await User.create({
        name: 'Admin User',
        email,
        password: newPassword,
        phone: process.env.ADMIN_PHONE || '1234567890',
        role: 'Admin',
        adminPermissions: ['FULL_ACCESS'],
      });
      logger.warn('New admin user created; password should be rotated immediately', {
        email,
      });
    } else {
      logger.warn('User not found for admin promotion', { email });
    }
  } catch (error) {
    logger.error('Failed to promote or create admin user', { error: error.message });
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

const args = process.argv.slice(2);
const emailArg = args.find((arg) => !arg.startsWith('--'));
const shouldCreate = args.includes('--create');

if (!emailArg) {
  logger.error('Usage: node makeUserAdmin.js <email> [--create]');
  logger.info('  --create: Create a new admin user if the email does not exist');
  process.exit(1);
}

makeUserAdmin(emailArg, shouldCreate);
