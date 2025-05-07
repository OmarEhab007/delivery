/**
 * Cache diagnosis script
 * This script checks all aspects of the caching system to diagnose issues
 */
const axios = require('axios');
const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_ENDPOINTS = [
  '/health',
  '/api/shipments',
  '/uploads/test.jpg'  // This might not exist but we'll test anyway
];

/**
 * Make a direct HTTP request without Axios to see raw headers
 * @param {string} urlString - URL to request
 * @param {Object} customHeaders - Custom headers to add to the request
 * @returns {Promise<Object>} - HTTP response
 */
function makeDirectRequest(urlString, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(urlString);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'cache-diagnosis-tool/1.0',
        ...customHeaders
      }
    };
    
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      const headers = res.headers;
      const statusCode = res.statusCode;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode,
          headers,
          data: data.slice(0, 100) + (data.length > 100 ? '...' : '')  // Truncate long responses
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Format headers for display
 * @param {Object} headers - Response headers
 * @returns {string} - Formatted headers
 */
function formatHeaders(headers) {
  return Object.entries(headers)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');
}

/**
 * Perform the diagnosis
 */
async function diagnoseCache() {
  console.log('=============================================');
  console.log('CACHE DIAGNOSIS TOOL');
  console.log('=============================================');
  
  // Test each endpoint
  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`\n----- Testing ${endpoint} -----`);
    
    try {
      console.log('Making direct HTTP request...');
      const response = await makeDirectRequest(`${API_BASE_URL}${endpoint}`);
      
      console.log(`Status: ${response.statusCode}`);
      console.log('Response headers:');
      console.log(formatHeaders(response.headers));
      
      // Analyze cache headers
      const cacheControl = response.headers['cache-control'];
      const etag = response.headers['etag'];
      const lastModified = response.headers['last-modified'];
      
      console.log('\nCache Analysis:');
      if (cacheControl) {
        console.log(`✅ Cache-Control: ${cacheControl}`);
      } else {
        console.log('❌ No Cache-Control header found');
      }
      
      if (etag) {
        console.log(`✅ ETag: ${etag}`);
      } else {
        console.log('❌ No ETag header found');
      }
      
      if (lastModified) {
        console.log(`✅ Last-Modified: ${lastModified}`);
      } else {
        console.log('❌ No Last-Modified header found');
      }
      
      // Make conditional request if we have etag or last-modified
      if (etag || lastModified) {
        console.log('\nTesting conditional request...');
        
        const conditionalHeaders = {};
        if (etag) {
          conditionalHeaders['If-None-Match'] = etag;
        }
        if (lastModified) {
          conditionalHeaders['If-Modified-Since'] = lastModified;
        }
        
        try {
          const condResponse = await makeDirectRequest(`${API_BASE_URL}${endpoint}`, conditionalHeaders);
          
          console.log(`Status: ${condResponse.statusCode}`);
          if (condResponse.statusCode === 304) {
            console.log('✅ Conditional request worked (304 Not Modified)');
          } else {
            console.log('❌ Conditional request didn\'t return 304');
          }
        } catch (error) {
          console.log(`Error making conditional request: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error testing ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n=============================================');
  console.log('CACHE MIDDLEWARE DIAGNOSIS');
  console.log('=============================================');
  
  // Test middleware registration
  console.log('\nChecking middleware registration...');
  console.log('1. Verify server.js includes cache middleware imports');
  console.log('2. Verify middleware is applied to routes in correct order');
  console.log('3. Check for any middleware that might overwrite headers');
  
  console.log('\nCommon issues:');
  console.log('- Security middleware overriding cache headers');
  console.log('- Multiple conflicting cache directives');
  console.log('- Response already sent before headers set');
  console.log('- Middleware order incorrect');
  
  console.log('\n=============================================');
}

// Run the diagnosis
diagnoseCache(); 