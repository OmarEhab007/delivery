const { app } = require('../../src/server');
const { createAuthenticatedUser } = require('../utils/authHelpers');
const { createAgent, authHeaders } = require('../utils/requestHelpers');

describe('Reporting & Analytics API', () => {
  it('returns KPI and lane reports for merchant', async () => {
    const { token } = await createAuthenticatedUser('Merchant');
    const agent = createAgent(app);

    await agent
      .get('/api/reports/kpis')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get('/api/reports/lanes')
      .set(authHeaders(token))
      .expect(200);
  });

  it('returns admin reports', async () => {
    const { token } = await createAuthenticatedUser('Admin');
    const agent = createAgent(app);

    await agent
      .get('/api/reports/revenue')
      .set(authHeaders(token))
      .expect(200);

    await agent
      .get('/api/reports/shipments/status-trends')
      .set(authHeaders(token))
      .expect(200);
  });
});
