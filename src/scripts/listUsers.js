const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find()
      .select('name email role adminPermissions active')
      .sort('name');
    
    if (users.length === 0) {
      console.log('No users found in the system.');
      return;
    }
    
    console.log('=== User List ===');
    console.log('Total users:', users.length);
    console.log('=================');
    
    // Group users by role
    const roleGroups = {};
    users.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      roleGroups[user.role].push(user);
    });
    
    // Display users by role
    for (const [role, roleUsers] of Object.entries(roleGroups)) {
      console.log(`\n--- ${role}s (${roleUsers.length}) ---`);
      roleUsers.forEach(user => {
        console.log(`- ${user.name} <${user.email}> ${user.active ? '' : '[INACTIVE]'}`);
        if (role === 'Admin' && user.adminPermissions && user.adminPermissions.length > 0) {
          console.log(`  Permissions: ${user.adminPermissions.join(', ')}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

listUsers(); 