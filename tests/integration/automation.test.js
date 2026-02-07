const { app } = require('../../src/server');
const { createAuthenticatedUser } = require('../utils/authHelpers');
const { createAgent, getCsrfToken, authHeaders } = require('../utils/requestHelpers');

describe('Automation API', () => {
  it('creates, lists, and updates automation rules', async () => {
    const { token } = await createAuthenticatedUser('Merchant');

    const agent = createAgent(app);
    const csrfToken = await getCsrfToken(agent);

    const createResponse = await agent
      .post('/api/automation/rules')
      .set(authHeaders(token, csrfToken))
      .send({
        triggerType: 'delay',
        threshold: 6,
        thresholdUnit: 'hours',
        action: 'notify',
        name: 'Delay Alert',
      })
      .expect(201);

    const ruleId = createResponse.body.data.rule._id;

    const listResponse = await agent
      .get('/api/automation/rules')
      .set(authHeaders(token))
      .expect(200);

    expect(listResponse.body.data.rules.length).toBeGreaterThan(0);

    await agent
      .patch(`/api/automation/rules/${ruleId}`)
      .set(authHeaders(token, csrfToken))
      .send({ active: false })
      .expect(200);
  });
});
