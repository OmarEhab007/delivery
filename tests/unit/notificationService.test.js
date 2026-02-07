jest.mock('../../src/utils/sendWhatsApp', () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ sid: 'SM1' }),
  sendTemplateMessage: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

const { sendWhatsAppMessage } = require('../../src/utils/sendWhatsApp');
const logger = require('../../src/utils/logger');

const {
  EventTypes,
  sendNotification,
  notifyNewShipment,
  notifyNewApplication,
  notifyApplicationApproved,
} = require('../../src/services/notification/notificationService');

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips recipients without phone', async () => {
    await sendNotification(EventTypes.SHIPMENT_CREATED, {}, { recipient: { name: 'NoPhone' } });
    expect(logger.warn).toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('sends notifications for each supported event type', async () => {
    const recipient = { name: 'Test', phone: '+15550001111' };
    const cases = [
      [EventTypes.SHIPMENT_CREATED, { origin: { address: 'A' }, destination: { address: 'B' }, cargoDetails: { description: 'Cargo' } }],
      [EventTypes.APPLICATION_SUBMITTED, { shipmentId: 'S1', ownerName: 'Owner', truckDetails: 'Truck' }],
      [EventTypes.APPLICATION_APPROVED, { shipmentId: 'S1', origin: 'A', destination: 'B' }],
      [EventTypes.APPLICATION_REJECTED, { shipmentId: 'S1', reason: 'No' }],
      [EventTypes.SHIPMENT_STATUS_UPDATED, { shipmentId: 'S1', status: 'IN_TRANSIT', notes: 'Ok', documentUrls: [] }],
      [EventTypes.SHIPMENT_DELIVERED, { shipmentId: 'S1', destination: 'B', documentUrls: [] }],
      [EventTypes.PAYMENT_UPLOADED, { shipmentId: 'S1', receiptUrl: 'http://example.com/r.pdf' }],
      [EventTypes.FIXED_PRICE_SHIPMENT_AVAILABLE, { origin: 'A', destination: 'B', currency: 'USD', price: 100, cargo: 'Goods' }],
      [EventTypes.FIXED_PRICE_SHIPMENT_ACCEPTED, { shipmentId: 'S1', truckOwnerName: 'Owner', truckDetails: 'Truck', driverName: 'Driver', currency: 'USD', price: 100 }],
      [EventTypes.ASSIGNED_TO_SHIPMENT, { shipmentId: 'S1', origin: 'A', destination: 'B', cargo: 'Goods' }],
      [EventTypes.SHIPMENT_DELAY_ALERT, { shipmentId: 'S1', status: 'IN_TRANSIT' }],
      [EventTypes.SHIPMENT_MISSING_UPDATE, { shipmentId: 'S1', status: 'IN_TRANSIT' }],
    ];

    for (const [eventType, data] of cases) {
      await sendNotification(eventType, data, { recipient });
    }

    expect(sendWhatsAppMessage).toHaveBeenCalledTimes(cases.length);
  });

  it('does not send for unknown event types', async () => {
    await sendNotification('UNKNOWN_EVENT', {}, { recipient: { phone: '+15550001111' } });
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('uses helper notification methods', async () => {
    await notifyNewShipment(
      { origin: { address: 'A' }, destination: { address: 'B' }, cargoDetails: { description: 'Cargo' } },
      { phone: '+15550001111' }
    );

    await notifyNewApplication(
      { shipmentId: 'S1' },
      { phone: '+15550001111' },
      { name: 'Owner' },
      { model: 'Model', plateNumber: 'ABC' }
    );

    await notifyApplicationApproved(
      { shipmentId: 'S1' },
      { _id: 'S1', origin: { address: 'A' }, destination: { address: 'B' }, estimatedPickupDate: '2025-01-01' },
      { phone: '+15550001111' },
      { phone: '+15550002222' }
    );

    expect(sendWhatsAppMessage).toHaveBeenCalled();
  });
});
