/**
 * Test script to verify CSRF protection functionality
 *
 * Usage:
 * - Start the server in one terminal: npm run dev
 * - Run this script in another terminal: node tests/utils/test-csrf.js
 */

const { performance } = require('perf_hooks');

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const LOGIN_ENDPOINT = '/auth/login';
const TEST_ENDPOINTS = [
  {
    path: '/users/profile',
    method: 'put',
    data: { name: 'Test User' },
    description: 'Update user profile (should be CSRF protected)',
  },
  {
    path: '/shipments',
    method: 'post',
    data: { origin: 'New York', destination: 'Los Angeles' },
    description: 'Create shipment (should be CSRF protected)',
  },
];

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
};

/**
 * Authenticate with the API and get cookies and CSRF token
 * @returns {Promise<Object>} Authentication results with token and cookies
 */
async function authenticate() {
  try {
    console.log('Authenticating with test user credentials...');
    const response = await axios.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, TEST_USER, {
      withCredentials: true,
    });

    // Get CSRF token from response headers
    const csrfToken = response.headers['x-csrf-token'] || '';

    // Get cookies from response headers
    const cookies = response.headers['set-cookie'] || [];

    console.log(`Authentication ${response.status === 200 ? 'successful' : 'failed'}`);
    if (csrfToken) {
      console.log('CSRF token received');
    } else {
      console.log('No CSRF token found in response');
    }

    return {
      token: response.data.token,
      csrfToken,
      cookies,
      userId: response.data.user?.id,
    };
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return {
      token: null,
      csrfToken: null,
      cookies: [],
    };
  }
}

/**
 * Test CSRF protection on a specific endpoint
 * @param {Object} endpoint - Endpoint configuration
 * @param {Object} auth - Authentication data (token, csrfToken, cookies)
 */
async function testCSRFProtection(endpoint, auth) {
  const { path, method, data, description } = endpoint;

  console.log(`\n==== Testing CSRF Protection: ${path} ====`);
  console.log(`Description: ${description}`);

  // Test cases
  const testCases = [
    {
      name: 'With CSRF token (should succeed)',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'X-CSRF-Token': auth.csrfToken,
        Cookie: auth.cookies.join('; '),
      },
    },
    {
      name: 'Without CSRF token (should fail)',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Cookie: auth.cookies.join('; '),
      },
    },
    {
      name: 'With invalid CSRF token (should fail)',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'X-CSRF-Token': 'invalid-token',
        Cookie: auth.cookies.join('; '),
      },
    },
  ];

  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n--- Test: ${testCase.name} ---`);

    try {
      const startTime = performance.now();
      const response = await axios({
        method,
        url: `${API_BASE_URL}${path}`,
        data,
        headers: testCase.headers,
        validateStatus(status) {
          return status < 500; // Accept any non-server-error status
        },
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Status: ${response.status}`);
      console.log(`Response Time: ${duration.toFixed(2)}ms`);

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Request successful');
      } else if (response.status === 403 && testCase.name.includes('should fail')) {
        console.log('✅ CSRF protection working - request correctly rejected');
      } else if (response.status === 403 && !testCase.name.includes('should fail')) {
        console.log('❌ Request was rejected but should have succeeded');
      } else {
        console.log(`ℹ️ Unexpected status code: ${response.status}`);
      }

      if (response.data && response.data.message) {
        console.log(`Message: ${response.data.message}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);

      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        if (error.response.data && error.response.data.message) {
          console.log(`Message: ${error.response.data.message}`);
        }
      }
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('==============================================');
    console.log('CSRF PROTECTION TEST SCRIPT');
    console.log('==============================================');

    // First authenticate to get CSRF token
    const auth = await authenticate();

    if (!auth.token) {
      console.error('Cannot proceed with tests without authentication');
      return;
    }

    // Test each endpoint
    for (const endpoint of TEST_ENDPOINTS) {
      await testCSRFProtection(endpoint, auth);
    }

    console.log('\n==============================================');
    console.log('CSRF PROTECTION TEST SUMMARY');
    console.log('==============================================');

    if (auth.csrfToken) {
      console.log('✅ CSRF tokens are being generated correctly');
    } else {
      console.log('❌ CSRF tokens are not being generated');
    }

    console.log('\n==============================================');
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

// Run the tests
runTests();
