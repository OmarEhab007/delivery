/**
 * Test script to verify rate limiting functionality
 *
 * Usage:
 * - Start the server in one terminal: npm run dev
 * - Run this script in another terminal: node tests/utils/test-rate-limit.js
 */

const { performance } = require('perf_hooks');

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_ENDPOINT = '/auth/login';
const REGULAR_ENDPOINT = '/users';
const NUM_REQUESTS = 15; // Number of requests to send to each endpoint

// Test data
const loginData = {
  email: 'test@example.com',
  password: 'password123',
};

/**
 * Send a request to the specified endpoint
 * @param {string} endpoint - API endpoint to test
 * @param {object} data - Request body data
 * @returns {Promise} - API response or error object
 */
async function sendRequest(endpoint, data = null) {
  try {
    let response;
    if (data) {
      response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
    } else {
      response = await axios.get(`${API_BASE_URL}${endpoint}`);
    }
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      headers: error.response?.headers,
    };
  }
}

/**
 * Test rate limiting for a specific endpoint
 * @param {string} endpoint - API endpoint to test
 * @param {object} data - Request body data
 * @param {string} testName - Name of the test
 */
async function testRateLimit(endpoint, data, testName) {
  console.log(`\n==== Testing ${testName} ====`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Sending ${NUM_REQUESTS} requests...\n`);

  const startTime = performance.now();
  const results = [];

  for (let i = 0; i < NUM_REQUESTS; i++) {
    const result = await sendRequest(endpoint, data);
    const status = result.success ? 'SUCCESS' : 'FAILED';
    const rateLimitRemaining = result.headers?.['ratelimit-remaining'];
    const statusCode = result.status;

    console.log(
      `Request ${i + 1}: ${status} (${statusCode}) - Remaining: ${rateLimitRemaining || 'N/A'}`
    );
    results.push(result);

    // Short delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Calculate statistics
  const successfulRequests = results.filter((r) => r.success).length;
  const failedRequests = results.filter((r) => !r.success).length;
  const rateLimitedRequests = results.filter((r) => r.status === 429).length;

  console.log(`\n==== Test Results for ${testName} ====`);
  console.log(`Duration: ${duration} seconds`);
  console.log(`Total Requests: ${NUM_REQUESTS}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Rate Limited Requests: ${rateLimitedRequests}`);
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('==============================================');
    console.log('RATE LIMITING TEST SCRIPT');
    console.log('==============================================');

    // Test 1: Regular API endpoint (general rate limiter)
    await testRateLimit(REGULAR_ENDPOINT, null, 'General API Rate Limiter');

    // Test 2: Authentication endpoint (stricter rate limiter)
    await testRateLimit(AUTH_ENDPOINT, loginData, 'Authentication Rate Limiter');

    console.log('\n==============================================');
    console.log('ALL TESTS COMPLETED');
    console.log('==============================================');
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

// Run the tests
runTests();
