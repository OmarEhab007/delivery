/**
 * Test script to verify Content Security Policy (CSP) functionality
 *
 * Usage:
 * - Start the server in one terminal: npm run dev
 * - Run this script in another terminal: node tests/utils/test-csp.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_ENDPOINTS = ['/users', '/health', '/shipments'];

/**
 * Parse CSP directives
 * @param {string} policy - CSP policy string
 * @returns {Object} - Parsed CSP directives
 */
function parseCSP(policy) {
  if (!policy) return {};

  const directives = {};
  const parts = policy
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  parts.forEach((part) => {
    const [directive, ...sources] = part.split(/\s+/);
    directives[directive] = sources;
  });

  return directives;
}

/**
 * Test CSP for a specific endpoint
 * @param {string} endpoint - API endpoint to test
 */
async function testCSP(endpoint) {
  console.log(`\n==== Testing CSP: ${endpoint} ====`);

  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      validateStatus(status) {
        return status < 500; // Accept any non-server-error status
      },
    });

    // Get all security headers
    const csp = response.headers['content-security-policy'];
    const cspReportOnly = response.headers['content-security-policy-report-only'];
    const xContentTypeOptions = response.headers['x-content-type-options'];
    const xFrameOptions = response.headers['x-frame-options'];
    const xXssProtection = response.headers['x-xss-protection'];
    const referrerPolicy = response.headers['referrer-policy'];

    // Log all security headers
    console.log('\nSECURITY HEADERS:');
    console.log(`Status Code: ${response.status}`);
    console.log(`X-Content-Type-Options: ${xContentTypeOptions || 'Not set'}`);
    console.log(`X-Frame-Options: ${xFrameOptions || 'Not set'}`);
    console.log(`X-XSS-Protection: ${xXssProtection || 'Not set'}`);
    console.log(`Referrer-Policy: ${referrerPolicy || 'Not set'}`);

    // Focus on CSP
    console.log('\nCONTENT SECURITY POLICY:');
    if (csp) {
      console.log('CSP Header: Set (Enforced)');
      const directives = parseCSP(csp);

      Object.keys(directives).forEach((directive) => {
        console.log(`  ${directive}: ${directives[directive].join(' ')}`);
      });

      // Check for crucial directives
      const crucialDirectives = ['default-src', 'script-src', 'connect-src', 'object-src'];
      const missingDirectives = crucialDirectives.filter((d) => !directives[d]);

      if (missingDirectives.length > 0) {
        console.log(`\n⚠️ Missing crucial directives: ${missingDirectives.join(', ')}`);
      }

      if (directives['report-uri']) {
        console.log('✅ CSP violation reporting is enabled');
      }
    } else {
      console.log('❌ CSP Header: Not set');
    }

    if (cspReportOnly) {
      console.log('\nCSP Report-Only Header: Set (Monitoring only)');
      const reportOnlyDirectives = parseCSP(cspReportOnly);

      if (reportOnlyDirectives['report-uri']) {
        console.log(`✅ CSP violations will be reported to: ${reportOnlyDirectives['report-uri']}`);
      }
    }

    // Verdict
    if (csp || cspReportOnly) {
      console.log('\n✅ Content Security Policy is configured');
    } else {
      console.log('\n❌ Content Security Policy is not configured');
    }

    return {
      endpoint,
      csp: !!csp,
      cspReportOnly: !!cspReportOnly,
      xContentTypeOptions: !!xContentTypeOptions,
      xFrameOptions: !!xFrameOptions,
      xXssProtection: !!xXssProtection,
      referrerPolicy: !!referrerPolicy,
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
    console.log('CONTENT SECURITY POLICY TEST SCRIPT');
    console.log('==============================================');

    const results = [];

    // Test each endpoint
    for (const endpoint of TEST_ENDPOINTS) {
      const result = await testCSP(endpoint);
      results.push(result);
    }

    // Summary
    console.log('\n==============================================');
    console.log('CONTENT SECURITY POLICY TEST SUMMARY');
    console.log('==============================================');

    let cspCount = 0;
    let xContentTypeOptionsCount = 0;
    let xFrameOptionsCount = 0;
    let xXssProtectionCount = 0;

    results.forEach((result) => {
      if (!result.error) {
        cspCount += result.csp || result.cspReportOnly ? 1 : 0;
        xContentTypeOptionsCount += result.xContentTypeOptions ? 1 : 0;
        xFrameOptionsCount += result.xFrameOptions ? 1 : 0;
        xXssProtectionCount += result.xXssProtection ? 1 : 0;
      }
    });

    console.log(`CSP: ${cspCount}/${results.length} endpoints protected`);
    console.log(
      `X-Content-Type-Options: ${xContentTypeOptionsCount}/${results.length} endpoints protected`
    );
    console.log(`X-Frame-Options: ${xFrameOptionsCount}/${results.length} endpoints protected`);
    console.log(`X-XSS-Protection: ${xXssProtectionCount}/${results.length} endpoints protected`);

    if (cspCount === results.length && xContentTypeOptionsCount === results.length) {
      console.log('\n✅ Security headers are consistently applied across endpoints');
    } else {
      console.log('\n⚠️ Security headers are not consistently applied across all endpoints');
    }

    console.log('\n==============================================');
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

// Run the tests
runTests();
