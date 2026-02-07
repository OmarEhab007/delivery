const request = require('supertest');

const getCsrfToken = async (agent) => {
  const response = await agent.get('/api/auth/csrf-token');
  return response.headers['x-csrf-token'];
};

const authHeaders = (token, csrfToken) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};

const createAgent = (app) => request.agent(app);

module.exports = {
  createAgent,
  getCsrfToken,
  authHeaders,
};
