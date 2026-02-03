/**
 * Authentication Test Helpers
 *
 * Provides utilities for creating test users and obtaining authentication tokens
 * for use in integration and security tests.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const User = require('../../src/models/User');

// Default password for test users
const DEFAULT_PASSWORD = 'TestPassword123!';

/**
 * Create a test user with the specified role
 * @param {string} role - User role (Admin, Merchant, TruckOwner, Driver)
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<Object>} The created user document
 */
const createTestUser = async (role = 'Merchant', overrides = {}) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);

  const baseUserData = {
    name: `Test ${role} ${randomSuffix}`,
    email: `test-${role.toLowerCase()}-${timestamp}-${randomSuffix}@example.com`,
    password: DEFAULT_PASSWORD,
    phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    role,
    active: true,
  };

  // Add role-specific required fields
  if (role === 'TruckOwner') {
    baseUserData.companyName = overrides.companyName || `Test Company ${randomSuffix}`;
    baseUserData.companyAddress =
      overrides.companyAddress || `123 Test St, Test City ${randomSuffix}`;
  }

  if (role === 'Driver') {
    // Create a truck owner if ownerId is not provided
    if (!overrides.ownerId) {
      const owner = await createTestUser('TruckOwner');
      baseUserData.ownerId = owner._id;
    } else {
      baseUserData.ownerId = overrides.ownerId;
    }
    baseUserData.licenseNumber = overrides.licenseNumber || `DL-${timestamp}-${randomSuffix}`;
    baseUserData.isAvailable = overrides.isAvailable !== undefined ? overrides.isAvailable : true;
    baseUserData.driverStatus = overrides.driverStatus || 'ACTIVE';
  }

  if (role === 'Admin') {
    baseUserData.adminPermissions = overrides.adminPermissions || ['FULL_ACCESS'];
  }

  const userData = { ...baseUserData, ...overrides };

  const user = await User.create(userData);
  return user;
};

/**
 * Generate a JWT token for a user
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret', {
    expiresIn: '1h',
  });
};

/**
 * Create a test user and return their JWT token
 * @param {string} role - User role (Admin, Merchant, TruckOwner, Driver)
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<string>} JWT token
 */
const getAuthToken = async (role = 'Merchant', overrides = {}) => {
  const user = await createTestUser(role, overrides);
  return generateToken(user);
};

/**
 * Create a test user and return both user and token
 * @param {string} role - User role (Admin, Merchant, TruckOwner, Driver)
 * @param {Object} overrides - Optional properties to override defaults
 * @returns {Promise<{user: Object, token: string}>} Object containing user and token
 */
const createAuthenticatedUser = async (role = 'Merchant', overrides = {}) => {
  const user = await createTestUser(role, overrides);
  const token = generateToken(user);
  return { user, token };
};

/**
 * Login a user and return their token
 * @param {Object} app - Express app instance
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: Object, response: Object}>} Login result
 */
const loginAs = async (app, email, password = DEFAULT_PASSWORD) => {
  const response = await request(app).post('/api/auth/login').send({ email, password });

  return {
    // API returns accessToken, but we expose it as token for test convenience
    token: response.body.accessToken,
    refreshToken: response.body.refreshToken,
    user: response.body.data?.user,
    response,
  };
};

/**
 * Create a test user and login via API
 * @param {Object} app - Express app instance
 * @param {string} role - User role
 * @param {Object} overrides - Optional user overrides
 * @returns {Promise<{user: Object, token: string, response: Object}>}
 */
const createAndLogin = async (app, role = 'Merchant', overrides = {}) => {
  const user = await createTestUser(role, overrides);
  const { token, response } = await loginAs(app, user.email, DEFAULT_PASSWORD);
  return { user, token, response };
};

/**
 * Create a deactivated user for testing login rejection
 * @param {string} role - User role
 * @returns {Promise<Object>} Deactivated user document
 */
const createDeactivatedUser = async (role = 'Merchant') => {
  return await createTestUser(role, { active: false });
};

/**
 * Set up authorization header for requests
 * @param {string} token - JWT token
 * @returns {Object} Headers object
 */
const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Default test password constant for external use
 */
const TEST_PASSWORD = DEFAULT_PASSWORD;

module.exports = {
  createTestUser,
  generateToken,
  getAuthToken,
  createAuthenticatedUser,
  loginAs,
  createAndLogin,
  createDeactivatedUser,
  authHeader,
  TEST_PASSWORD,
};
