const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const makeUserAdmin = async (email, createIfNotExist = false) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email
    let user = await User.findOne({ email });
    
    if (user) {
      // Update user to admin if found
      user.role = 'Admin';
      user.adminPermissions = ['FULL_ACCESS'];
      await user.save();
      console.log(`User ${email} has been upgraded to Admin role with FULL_ACCESS permissions.`);
    } else if (createIfNotExist) {
      // Create new admin user if not found and flag is set
      const newPassword = process.env.ADMIN_PASSWORD || 'admin123456';
      user = await User.create({
        name: 'Admin User',
        email,
        password: newPassword,
        phone: '1234567890',
        role: 'Admin',
        adminPermissions: ['FULL_ACCESS']
      });
      console.log(`New admin user created with email: ${email} and password: ${newPassword}`);
      console.log('Please change the default password after first login!');
    } else {
      console.log(`User with email ${email} not found. Use --create flag to create a new admin.`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
const emailArg = args.find(arg => !arg.startsWith('--'));
const shouldCreate = args.includes('--create');

if (!emailArg) {
  console.log('Usage: node makeUserAdmin.js <email> [--create]');
  console.log('  --create: Create a new admin user if the email does not exist');
  process.exit(1);
}

makeUserAdmin(emailArg, shouldCreate); 