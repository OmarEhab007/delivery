jest.mock('../../src/models/AutomationRule', () => ({
  AutomationRule: {
    find: jest.fn(),
  },
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../src/services/notification/notificationService', () => ({
  sendNotification: jest.fn(),
  EventTypes: {
    SHIPMENT_DELAY_ALERT: 'SHIPMENT_DELAY_ALERT',
    SHIPMENT_MISSING_UPDATE: 'SHIPMENT_MISSING_UPDATE',
  },
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
}));

const { AutomationRule } = require('../../src/models/AutomationRule');
const User = require('../../src/models/User');
const { sendNotification, EventTypes } = require('../../src/services/notification/notificationService');
const logger = require('../../src/utils/logger');
const { evaluateAutomationRules } = require('../../src/services/automation/automationService');

describe('automationService', () => {
  const now = new Date('2025-01-01T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it('returns early when shipment has no merchantId', async () => {
    await evaluateAutomationRules({ _id: 's1' });
    expect(AutomationRule.find).not.toHaveBeenCalled();
  });

  it('does nothing when no active rules exist', async () => {
    AutomationRule.find.mockResolvedValue([]);

    await evaluateAutomationRules({ _id: 's1', merchantId: 'm1' });

    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('triggers delay rule and updates rule state', async () => {
    const rule = {
      triggerType: 'delay',
      threshold: 1,
      action: 'notify',
      lastTriggeredAt: null,
      lastTriggeredShipmentId: null,
      save: jest.fn(),
    };
    AutomationRule.find.mockResolvedValue([rule]);
    User.findById.mockResolvedValue({ _id: 'm1', phone: '+15550001111' });

    const shipment = {
      _id: 's1',
      merchantId: 'm1',
      estimatedDeliveryDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: 'IN_TRANSIT',
    };

    await evaluateAutomationRules(shipment);

    expect(sendNotification).toHaveBeenCalledWith(
      EventTypes.SHIPMENT_DELAY_ALERT,
      expect.any(Object),
      expect.objectContaining({ merchant: expect.any(Object) })
    );
    expect(rule.save).toHaveBeenCalled();
  });

  it('does not trigger delay rule when throttled', async () => {
    const rule = {
      triggerType: 'delay',
      threshold: 1,
      lastTriggeredAt: new Date(now.getTime() - 30 * 60 * 1000),
      lastTriggeredShipmentId: 's1',
      save: jest.fn(),
    };
    AutomationRule.find.mockResolvedValue([rule]);
    User.findById.mockResolvedValue({ _id: 'm1', phone: '+15550001111' });

    const shipment = {
      _id: 's1',
      merchantId: 'm1',
      estimatedDeliveryDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: 'IN_TRANSIT',
    };

    await evaluateAutomationRules(shipment);

    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('does not trigger when shipment is in a terminal status', async () => {
    const rule = {
      triggerType: 'delay',
      threshold: 1,
      lastTriggeredAt: null,
      lastTriggeredShipmentId: null,
      save: jest.fn(),
    };
    AutomationRule.find.mockResolvedValue([rule]);

    const shipment = {
      _id: 's1',
      merchantId: 'm1',
      estimatedDeliveryDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: 'DELIVERED',
    };

    await evaluateAutomationRules(shipment);

    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('triggers missing-update rule for stale tracking', async () => {
    const rule = {
      triggerType: 'missing-update',
      threshold: 1,
      action: 'notify',
      lastTriggeredAt: null,
      lastTriggeredShipmentId: null,
      save: jest.fn(),
    };
    AutomationRule.find.mockResolvedValue([rule]);
    User.findById.mockResolvedValue({ _id: 'm1', phone: '+15550001111' });

    const shipment = {
      _id: 's1',
      merchantId: 'm1',
      currentLocation: {
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      status: 'IN_TRANSIT',
    };

    await evaluateAutomationRules(shipment);

    expect(sendNotification).toHaveBeenCalledWith(
      EventTypes.SHIPMENT_MISSING_UPDATE,
      expect.any(Object),
      expect.objectContaining({ merchant: expect.any(Object) })
    );
    expect(rule.save).toHaveBeenCalled();
  });

  it('escalates to admins when rule action is escalate', async () => {
    const rule = {
      triggerType: 'delay',
      threshold: 1,
      action: 'escalate',
      lastTriggeredAt: null,
      lastTriggeredShipmentId: null,
      save: jest.fn(),
    };
    AutomationRule.find.mockResolvedValue([rule]);
    User.findById.mockResolvedValue({ _id: 'm1', phone: '+15550001111' });
    User.find.mockResolvedValue([{ _id: 'a1', phone: '+15550002222', role: 'Admin' }]);

    const shipment = {
      _id: 's1',
      merchantId: 'm1',
      estimatedDeliveryDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: 'IN_TRANSIT',
    };

    await evaluateAutomationRules(shipment);

    const recipients = sendNotification.mock.calls[0][2];
    expect(recipients).toHaveProperty('admin_0');
  });

  it('logs and continues when notification fails', async () => {
    const rule = {
      triggerType: 'delay',
      threshold: 1,
      lastTriggeredAt: null,
      lastTriggeredShipmentId: null,
      save: jest.fn(),
    };
    AutomationRule.find.mockResolvedValue([rule]);
    User.findById.mockResolvedValue({ _id: 'm1', phone: '+15550001111' });
    sendNotification.mockRejectedValue(new Error('boom'));

    const shipment = {
      _id: 's1',
      merchantId: 'm1',
      estimatedDeliveryDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: 'IN_TRANSIT',
    };

    await evaluateAutomationRules(shipment);

    expect(logger.warn).toHaveBeenCalled();
  });
});
