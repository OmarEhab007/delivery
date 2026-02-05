/**
 * MSW Server for Node.js test environment
 */

const { setupServer } = require('msw/node');
const { handlers } = require('./handlers');

export const server = setupServer(...handlers);
