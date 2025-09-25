/**
 * Async function wrapper to eliminate try-catch blocks in route handlers
 * Catches any errors thrown by the async function and passes them to Express's error handler
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function that catches errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  catchAsync,
};
