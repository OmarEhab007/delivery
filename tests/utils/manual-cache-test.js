/**
 * Simplified cache test script - tests a public endpoint
 */
const { performance } = require('perf_hooks');

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_ENDPOINTS = [
  '/health',
  '/health/cache-test',
  '/uploads/test.jpg', // This might not exist but we'll test anyway
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Parse Cache-Control header
 * @param {string} header - Cache-Control header value
 * @returns {Object} - Parsed cache directives
 */
const parseCacheControl = (header) => {
  if (!header) return {};

  const directives = {};
  const parts = header.split(',');

  parts.forEach((part) => {
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
 * Test caching for each endpoint
 */
async function testCaching() {
  console.log(`${colors.cyan}==============================================`);
  console.log('SIMPLIFIED CACHING TEST');
  console.log(`===============================================${colors.reset}`);

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`\n${colors.blue}==== Testing Cache for: ${endpoint} ====${colors.reset}`);

    try {
      // Make first request
      console.log(`\n${colors.magenta}FIRST REQUEST:${colors.reset}`);
      const startFirst = performance.now();
      const firstResponse = await axios.get(`${API_BASE_URL}${endpoint}`);
      const endFirst = performance.now();
      const firstDuration = endFirst - startFirst;

      // Check caching headers
      const cacheControl = firstResponse.headers['cache-control'];
      const { etag } = firstResponse.headers;
      const lastModified = firstResponse.headers['last-modified'];

      // Parse cache control directives
      const cacheDirectives = parseCacheControl(cacheControl);

      console.log(`Status Code: ${firstResponse.status}`);
      console.log(`Cache-Control: ${cacheControl || 'Not set'}`);
      console.log(`Max-Age: ${formatDuration(cacheDirectives['max-age'])}`);
      console.log(`ETag: ${etag || 'Not set'}`);
      console.log(`Last-Modified: ${lastModified || 'Not set'}`);
      console.log(`Response Time: ${firstDuration.toFixed(2)}ms`);

      // Small delay to make sure we can see the difference
      console.log('\nWaiting 1 second...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Make second request (should be cached by browser/client)
      console.log(
        `\n${colors.magenta}SECOND REQUEST (Testing client-side caching):${colors.reset}`
      );

      // Create headers for conditional request
      const headers = {};
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      if (lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }

      try {
        const startSecond = performance.now();
        const secondResponse = await axios({
          method: 'get',
          url: `${API_BASE_URL}${endpoint}`,
          headers,
          validateStatus(status) {
            return status < 500; // Accept 304 Not Modified
          },
        });
        const endSecond = performance.now();
        const secondDuration = endSecond - startSecond;

        console.log(`Status Code: ${secondResponse.status}`);
        console.log(`Response Time: ${secondDuration.toFixed(2)}ms`);

        if (secondResponse.status === 304) {
          console.log(
            `${colors.green}✅ Resource not modified, using cached version (304 response)${colors.reset}`
          );
        } else {
          console.log(`${colors.yellow}ℹ️ Received full response (not using cache)${colors.reset}`);
        }

        // Speed comparison
        const speedDiff = ((firstDuration - secondDuration) / firstDuration) * 100;
        if (speedDiff > 0) {
          console.log(`Speed improvement: ${speedDiff.toFixed(2)}% faster`);
        } else {
          console.log(`Speed change: ${speedDiff.toFixed(2)}% slower`);
        }

        // Verdict
        console.log(`\n${colors.cyan}CACHING VERDICT:${colors.reset}`);
        if (!cacheControl) {
          console.log(`${colors.red}❌ No cache-control header set${colors.reset}`);
        } else if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
          console.log(`${colors.green}✅ Resource correctly set to not be cached${colors.reset}`);
        } else if (cacheDirectives['max-age']) {
          console.log(
            `${colors.green}✅ Resource cacheable for ${formatDuration(cacheDirectives['max-age'])}${colors.reset}`
          );
        } else {
          console.log(
            `${colors.yellow}⚠️ Cache-Control header set but no clear caching directive${colors.reset}`
          );
        }

        if (!etag && !lastModified) {
          console.log(
            `${colors.yellow}⚠️ No ETag or Last-Modified headers - conditional requests won't work${colors.reset}`
          );
        }
      } catch (error) {
        console.error(`${colors.red}Second request error: ${error.message}${colors.reset}`);
      }
    } catch (error) {
      console.error(
        `${colors.red}Error testing endpoint ${endpoint}: ${error.message}${colors.reset}`
      );
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response headers:', error.response.headers);
      }
    }
  }

  console.log(`\n${colors.cyan}===============================================${colors.reset}`);
}

// Run the test
testCaching();
