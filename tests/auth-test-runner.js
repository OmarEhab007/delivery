const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const app = require('../src/server');

async function runAuthTests() {
  console.log('Starting Auth Test Runner...');

  try {
    // Create test user
    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const email = `testauth${Date.now()}@example.com`;

    const user = await User.create({
      name: 'Auth Test User',
      email,
      password: hashedPassword,
      phone: '+1234567890',
      role: 'Merchant',
    });
    console.log('User created successfully:', user._id);

    // Test login
    console.log('Testing login...');
    const loginResponse = await request(app).post('/api/auth/login').send({
      email,
      password: 'password123',
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginResponse.body);

    if (loginResponse.status === 200 && loginResponse.body.token) {
      console.log('Login successful, got token');

      // Test get current user
      console.log('Testing get current user...');
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      console.log('Get user response status:', meResponse.status);
      console.log('Get user response:', meResponse.body);

      // Test password update
      console.log('Testing password update...');
      const passwordUpdateResponse = await request(app)
        .patch('/api/auth/updatePassword')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        });

      console.log('Password update response status:', passwordUpdateResponse.status);
      console.log('Password update response:', passwordUpdateResponse.body);

      // Test login with new password
      console.log('Testing login with new password...');
      const newLoginResponse = await request(app).post('/api/auth/login').send({
        email,
        password: 'newpassword123',
      });

      console.log('New login response status:', newLoginResponse.status);
      console.log('New login response:', newLoginResponse.body);
    } else {
      console.log('Login failed');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Clean up
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
}

runAuthTests().then(() => {
  console.log('Test runner completed');
  process.exit(0);
});
