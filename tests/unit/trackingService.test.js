jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { Shipment } = require('../../src/models/Shipment');
const logger = require('../../src/utils/logger');
const trackingService = require('../../src/services/tracking/trackingService');

describe('trackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auth middleware rejects missing token', () => {
    const io = { use: jest.fn(), on: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) };

    trackingService.initializeTracking(io);

    const middleware = io.use.mock.calls[0][0];
    const socket = { id: 's1', handshake: { auth: {}, headers: {} }, data: {} };
    const next = jest.fn();

    middleware(socket, next);

    expect(logger.warn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('auth middleware rejects invalid token', () => {
    const io = { use: jest.fn(), on: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) };
    jwt.verify.mockImplementation(() => {
      throw new Error('bad');
    });

    trackingService.initializeTracking(io);

    const middleware = io.use.mock.calls[0][0];
    const socket = { id: 's1', handshake: { auth: { token: 'x' }, headers: {} }, data: {} };
    const next = jest.fn();

    middleware(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('auth middleware accepts valid token and sets socket data', () => {
    const io = { use: jest.fn(), on: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) };
    jwt.verify.mockReturnValue({ id: 'u1' });

    trackingService.initializeTracking(io);

    const middleware = io.use.mock.calls[0][0];
    const socket = { id: 's1', handshake: { auth: { token: 'x' }, headers: {} }, data: {} };
    const next = jest.fn();

    middleware(socket, next);

    expect(socket.data.user).toEqual({ id: 'u1' });
    expect(next).toHaveBeenCalled();
  });

  it('handles socket events for tracking', async () => {
    const io = {
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() })),
    };

    trackingService.initializeTracking(io);

    const handler = io.on.mock.calls.find((call) => call[0] === 'connection')[1];
    const events = {};
    const socket = {
      id: 's1',
      handshake: { auth: { token: 'x' }, headers: {} },
      on: jest.fn((event, cb) => {
        events[event] = cb;
      }),
      join: jest.fn(),
      leave: jest.fn(),
    };

    handler(socket);

    await events['driver:location']({ shipmentId: null, location: null });
    expect(logger.warn).toHaveBeenCalled();

    Shipment.findById.mockResolvedValue({ addTrackingPoint: jest.fn() });
    await events['driver:location']({ shipmentId: 's1', location: { lat: 1, lng: 2 } });
    expect(Shipment.findById).toHaveBeenCalled();

    events['join:shipment']('s1');
    expect(socket.join).toHaveBeenCalledWith('shipment:s1');

    events['leave:shipment']('s1');
    expect(socket.leave).toHaveBeenCalledWith('shipment:s1');

    events['disconnect']();
    expect(logger.info).toHaveBeenCalled();
  });

  it('updateShipmentLocation throws when shipment missing', async () => {
    Shipment.findById.mockResolvedValue(null);

    await expect(
      trackingService.updateShipmentLocation('missing', { lat: 1, lng: 2 })
    ).rejects.toThrow('Shipment not found');
  });

  it('getShipmentLocation returns current location', async () => {
    Shipment.findById.mockResolvedValue({ currentLocation: { lat: 1, lng: 2 } });

    const result = await trackingService.getShipmentLocation('s1');

    expect(result).toEqual({ lat: 1, lng: 2 });
  });

  it('recordLocationHistory adds timeline entry', async () => {
    const addTimelineEntry = jest.fn();
    Shipment.findById.mockResolvedValue({
      status: 'IN_TRANSIT',
      addTimelineEntry,
    });

    await trackingService.recordLocationHistory('s1', { lat: 1, lng: 2, address: 'A' });

    expect(addTimelineEntry).toHaveBeenCalled();
  });

  it('calculateETA returns a future date', async () => {
    Shipment.findById.mockResolvedValue({});

    const eta = await trackingService.calculateETA('s1');

    expect(eta).toBeInstanceOf(Date);
  });

  it('isWithinGeofence evaluates distance', () => {
    const inside = trackingService.isWithinGeofence(
      { lat: 0, lng: 0 },
      { centerLat: 0, centerLng: 0, radiusKm: 1 }
    );
    const outside = trackingService.isWithinGeofence(
      { lat: 10, lng: 10 },
      { centerLat: 0, centerLng: 0, radiusKm: 1 }
    );

    expect(inside).toBe(true);
    expect(outside).toBe(false);
  });
});
