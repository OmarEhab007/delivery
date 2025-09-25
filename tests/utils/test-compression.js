/**
 * Test script to verify compression functionality
 *
 * Usage:
 * - Start the server in one terminal: npm run dev
 * - Run this script in another terminal: node tests/utils/test-compression.js
 */

const zlib = require('zlib');
const { performance } = require('perf_hooks');

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_ENDPOINTS = [
  '/users', // Typically returns a list (larger response)
  '/health', // Small response
  '/debug-models', // Medium response
];

/**
 * Size formatter utility
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Test compression for a specific endpoint
 * @param {string} endpoint - API endpoint to test
 */
async function testCompression(endpoint) {
  console.log(`\n==== Testing Compression: ${endpoint} ====`);

  try {
    // Test 1: Request with compression (default)
    console.log('REQUEST WITH COMPRESSION:');
    const startCompressed = performance.now();
    const compressedResponse = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate',
      },
    });
    const endCompressed = performance.now();

    // Test 2: Request without compression
    console.log('REQUEST WITHOUT COMPRESSION:');
    const startUncompressed = performance.now();
    const uncompressedResponse = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept-Encoding': 'identity',
        'X-No-Compression': 'true',
      },
    });
    const endUncompressed = performance.now();

    // Calculate metrics
    const compressedSize =
      compressedResponse.headers['content-length'] ||
      (compressedResponse.data ? JSON.stringify(compressedResponse.data).length : 0);
    const uncompressedSize =
      uncompressedResponse.headers['content-length'] ||
      (uncompressedResponse.data ? JSON.stringify(uncompressedResponse.data).length : 0);
    const compressionRatio =
      uncompressedSize > 0 ? (1 - compressedSize / uncompressedSize) * 100 : 0;
    const compressedTime = endCompressed - startCompressed;
    const uncompressedTime = endUncompressed - startUncompressed;
    const timeChange = ((compressedTime - uncompressedTime) / uncompressedTime) * 100;

    // Log results
    console.log('\nCOMPRESSION RESULTS:');
    console.log(`Uncompressed size: ${formatBytes(uncompressedSize)}`);
    console.log(`Compressed size: ${formatBytes(compressedSize)}`);
    console.log(`Compression ratio: ${compressionRatio.toFixed(2)}%`);
    console.log(`Uncompressed response time: ${uncompressedTime.toFixed(2)}ms`);
    console.log(`Compressed response time: ${compressedTime.toFixed(2)}ms`);
    console.log(`Time difference: ${timeChange > 0 ? '+' : ''}${timeChange.toFixed(2)}%`);

    // Check content encoding header to verify compression
    const contentEncoding = compressedResponse.headers['content-encoding'];
    console.log(`Content-Encoding: ${contentEncoding || 'none'}`);

    if (contentEncoding && ['gzip', 'deflate'].includes(contentEncoding)) {
      console.log('✅ Compression is working correctly');
    } else if (compressedSize < uncompressedSize) {
      console.log(
        '✅ Response is smaller, but no Content-Encoding header (compression may be happening at another layer)'
      );
    } else {
      console.log('❌ Compression does not appear to be working');
    }

    return {
      endpoint,
      compressedSize,
      uncompressedSize,
      compressionRatio,
      compressedTime,
      uncompressedTime,
      contentEncoding,
    };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return {
      endpoint,
      error: error.message,
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('==============================================');
    console.log('COMPRESSION TEST SCRIPT');
    console.log('==============================================');

    const results = [];

    // Test each endpoint
    for (const endpoint of TEST_ENDPOINTS) {
      const result = await testCompression(endpoint);
      results.push(result);
    }

    // Summary
    console.log('\n==============================================');
    console.log('COMPRESSION TEST SUMMARY');
    console.log('==============================================');

    let totalUncompressed = 0;
    let totalCompressed = 0;

    results.forEach((result) => {
      if (!result.error) {
        totalUncompressed += result.uncompressedSize || 0;
        totalCompressed += result.compressedSize || 0;

        console.log(`${result.endpoint}: ${result.compressionRatio.toFixed(2)}% reduction`);
      } else {
        console.log(`${result.endpoint}: Error - ${result.error}`);
      }
    });

    const overallRatio =
      totalUncompressed > 0 ? (1 - totalCompressed / totalUncompressed) * 100 : 0;

    console.log(`\nOverall compression ratio: ${overallRatio.toFixed(2)}%`);
    console.log(`Total uncompressed size: ${formatBytes(totalUncompressed)}`);
    console.log(`Total compressed size: ${formatBytes(totalCompressed)}`);
    console.log(`Total bytes saved: ${formatBytes(totalUncompressed - totalCompressed)}`);

    console.log('\n==============================================');
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

// Run the tests
runTests();
