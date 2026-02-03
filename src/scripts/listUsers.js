const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const logger = require('../utils/logger');

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for listUsers');

    const users = await User.find().select('name email role adminPermissions active').sort('name');

    if (users.length === 0) {
      logger.info('No users found in the system.');
      return;
    }

    logger.info('User list summary', { totalUsers: users.length });

    const roleGroups = users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    Object.entries(roleGroups).forEach(([role, roleUsers]) => {
      logger.info('Role group', { role, count: roleUsers.length });
      roleUsers.forEach((user) => {
        logger.info('User detail', {
          name: user.name,
          email: user.email,
          active: user.active,
          permissions: user.adminPermissions,
        });
      });
    });
  } catch (error) {
    logger.error('Error listing users', { error: error.message });
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

listUsers();
