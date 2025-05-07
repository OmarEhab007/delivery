/**
 * Test script to verify HTTP caching functionality
 * 
 * Usage: 
 * - Start the server in one terminal: npm run dev
 * - Run this script in another terminal: node tests/utils/test-caching.js
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'admin@deliveryapp.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123456'
};

const TEST_ENDPOINTS = [
  {
    path: '/users',
    description: 'Users list (should be cached with medium duration)'
  },
  {
    path: '/shipments',
    description: 'Shipments list (should be cached with short duration)'
  },
  {
    path: '/auth/login',
    description: 'Auth endpoint (should NOT be cached)',
    method: 'post', 
    data: AUTH_CREDENTIALS,
    skipAuth: true // Skip authentication for this endpoint
  }
];

// Store the auth token
let authToken = null;
let csrfToken = null;

/**
 * Parse Cache-Control header
 * @param {string} header - Cache-Control header value
 * @returns {Object} - Parsed cache directives
 */
const parseCacheControl = (header) => {
  if (!header) return {};
  
  const directives = {};
  const parts = header.split(',');
  
  parts.forEach(part => {
    const [key, value] = part.trim().split('=');
    directives[key] = value !== undefined ? parseInt(value) : true;
  });
  
  return directives;
};

/**
 * Format seconds into human-readable duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
const formatDuration = (seconds) => {
  if (seconds === undefined) return 'N/A';
  
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
};

/**
 * Get CSRF token for protected requests
 * @returns {Promise<string>} - CSRF token
 */
async function getCsrfToken() {
  console.log('\n==== Getting CSRF Token ====');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/test-csrf`);
    const token = response.headers['x-csrf-token'];
    
    if (token) {
      console.log('✅ CSRF token obtained successfully');
      return token;
    } else {
      console.error('❌ No CSRF token found in response headers');
      console.log('Headers received:', response.headers);
      throw new Error('No CSRF token found');
    }
  } catch (error) {
    console.error('❌ Failed to get CSRF token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Authenticate and get token
 * @returns {Promise<string>} - Authentication token
 */
async function authenticate() {
  console.log('\n==== Authenticating ====');
  
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/auth/login`,
      data: AUTH_CREDENTIALS
    });
    
    const token = response.data.token;
    console.log('✅ Authentication successful');
    
    // Save cookies if any were set
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      console.log('Cookies received:', cookies);
    }
    
    return token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Test caching for a specific endpoint
 * @param {Object} endpoint - Endpoint configuration
 */
async function testCaching(endpoint) {
  const { path, description, method = 'get', data = null, skipAuth = false } = endpoint;
  
  console.log(`\n==== Testing Cache: ${path} ====`);
  console.log(`Description: ${description}`);
  
  try {
    // Set up headers with authentication token if required
    const headers = {};
    if (!skipAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Add CSRF token for non-GET requests or if specifically needed
    if (method !== 'get' && csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    console.log('Using headers:', headers);
    
    // Make first request
    console.log('\nFIRST REQUEST:');
    const startFirst = performance.now();
    const firstResponse = await axios({
      method,
      url: `${API_BASE_URL}${path}`,
      headers,
      data,
      withCredentials: true
    });
    const endFirst = performance.now();
    const firstDuration = endFirst - startFirst;
    
    // Check caching headers
    const cacheControl = firstResponse.headers['cache-control'];
    const etag = firstResponse.headers['etag'];
    const lastModified = firstResponse.headers['last-modified'];
    
    // Parse cache control directives
    const cacheDirectives = parseCacheControl(cacheControl);
    
    console.log(`Status Code: ${firstResponse.status}`);
    console.log(`Cache-Control: ${cacheControl || 'Not set'}`);
    console.log(`Max-Age: ${formatDuration(cacheDirectives['max-age'])}`);
    console.log(`ETag: ${etag || 'Not set'}`);
    console.log(`Last-Modified: ${lastModified || 'Not set'}`);
    console.log(`Response Time: ${firstDuration.toFixed(2)}ms`);
    
    // Make second request (should be cached by browser/client)
    console.log('\nSECOND REQUEST (Testing client-side caching):');
    
    // Create headers for conditional request
    const secondHeaders = { ...headers };
    if (etag) {
      secondHeaders['If-None-Match'] = etag;
    }
    if (lastModified) {
      secondHeaders['If-Modified-Since'] = lastModified;
    }
    
    try {
      const startSecond = performance.now();
      const secondResponse = await axios({
        method,
        url: `${API_BASE_URL}${path}`,
        headers: secondHeaders,
        data,
        withCredentials: true,
        validateStatus: function (status) {
          return status < 500; // Accept 304 Not Modified
        }
      });
      const endSecond = performance.now();
      const secondDuration = endSecond - startSecond;
      
      console.log(`Status Code: ${secondResponse.status}`);
      console.log(`Response Time: ${secondDuration.toFixed(2)}ms`);
      
      if (secondResponse.status === 304) {
        console.log('✅ Resource not modified, using cached version (304 response)');
      } else {
        console.log('ℹ️ Received full response (not using cache)');
      }
      
      // Speed comparison
      const speedDiff = ((firstDuration - secondDuration) / firstDuration) * 100;
      if (speedDiff > 0) {
        console.log(`Speed improvement: ${speedDiff.toFixed(2)}% faster`);
      } else {
        console.log(`Speed change: ${speedDiff.toFixed(2)}% slower`);
      }
    } catch (error) {
      console.log(`Second request error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
      }
    }
    
    // Verdict
    console.log('\nCACHING VERDICT:');
    if (!cacheControl) {
      console.log('❌ No cache-control header set');
    } else if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      console.log('✅ Resource correctly set to not be cached');
    } else if (cacheDirectives['max-age']) {
      console.log(`✅ Resource cacheable for ${formatDuration(cacheDirectives['max-age'])}`);
    } else {
      console.log('⚠️ Cache-Control header set but no clear caching directive');
    }
    
    return {
      path,
      cacheControl,
      maxAge: cacheDirectives['max-age'],
      etag: etag !== undefined,
      lastModified: lastModified !== undefined
    };
  } catch (error) {
    console.error(`Error testing ${path}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
    return {
      path,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('==============================================');
    console.log('HTTP CACHING TEST SCRIPT');
    console.log('==============================================');
    
    // Get CSRF token first
    try {
      csrfToken = await getCsrfToken();
    } catch (error) {
      console.error('Failed to get CSRF token. Some tests may fail.');
    }
    
    // Authenticate second
    try {
      authToken = await authenticate();
    } catch (error) {
      console.error('Failed to authenticate. Protected endpoints will fail.');
    }
    
    const results = [];
    
    // Test each endpoint
    for (const endpoint of TEST_ENDPOINTS) {
      const result = await testCaching(endpoint);
      results.push(result);
    }
    
    // Summary
    console.log('\n==============================================');
    console.log('CACHING TEST SUMMARY');
    console.log('==============================================');
    
    results.forEach(result => {
      if (!result.error) {
        const cacheStatus = result.cacheControl 
          ? (result.cacheControl.includes('no-cache') ? 'No Cache' : `Cached (${formatDuration(result.maxAge)})`)
          : 'No Cache Header';
          
        console.log(`${result.path}: ${cacheStatus}`);
      } else {
        console.log(`${result.path}: Error - ${result.error}`);
      }
    });
    
    console.log('\n==============================================');
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

// Run the tests
runTests(); 