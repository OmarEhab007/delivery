/**
 * NoSQL Injection Sanitization Middleware
 *
 * SEC-001: Prevents MongoDB operator injection attacks
 * OWASP A03:2021 - Injection
 *
 * This middleware sanitizes request body, query params, and URL params
 * by replacing any MongoDB operators (keys starting with $) with underscores.
 *
 * Example attack vectors prevented:
 * - { "email": { "$ne": null } } - Login bypass
 * - { "password": { "$gt": "" } } - Password field bypass
 * - { "role": { "$in": ["Admin"] } } - Role escalation
 */
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Configured express-mongo-sanitize middleware
 *
 * Options:
 * - replaceWith: '_' - Replace $ with _ to break operators
 *
 * This ensures any MongoDB operator in user input becomes harmless:
 * { "$ne": null } becomes { "_ne": null }
 */
module.exports = mongoSanitize({
  replaceWith: '_',
});
