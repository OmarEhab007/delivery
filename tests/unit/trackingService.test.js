const mongoose = require('mongoose');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { Shipment, ShipmentStatus } = require('../../src/models/Shipment');
const logger = require('../../src/utils/logger');
const trackingService = require('../../src/services/tracking/trackingService');

const createShipment = async (overrides = {}) => {
  return Shipment.create({
    merchantId: new mongoose.Types.ObjectId(),
    origin: {
      address: 'Origin',
      coordinates: { lat: 1, lng: 2 },
      country: 'US',
    },
    destination: {
      address: 'Destination',
      coordinates: { lat: 3, lng: 4 },
      country: 'CA',
    },
    cargoDetails: {
      description: 'Cargo',
      weight: 1000,
      category: 'general',
    },
    status: ShipmentStatus.REQUESTED,
    approval: {
      state: 'APPROVED',
      submittedBy: new mongoose.Types.ObjectId(),
    },
    timeline: [],
    ...overrides,
  });
};

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
    expect(next).toHaveBeenCalledWith();
  });

  it('handles socket events for tracking', async () => {
    const roomEmitter = { emit: jest.fn() };
    const io = {
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn(() => roomEmitter),
    };

    trackingService.initializeTracking(io);

    const shipment = await createShipment({
      status: ShipmentStatus.IN_TRANSIT,
      trackingHistory: [],
    });

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

    await events['driver:location']({
      shipmentId: shipment._id.toString(),
      location: { lat: 1, lng: 2, address: 'A' },
    });
    const updated = await Shipment.findById(shipment._id);
    expect(updated.trackingHistory).toHaveLength(1);
    expect(io.to).toHaveBeenCalledWith(`shipment:${shipment._id.toString()}`);
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      'shipment:location',
      expect.objectContaining({
        shipmentId: shipment._id.toString(),
        location: expect.objectContaining({ lat: 1, lng: 2 }),
      })
    );

    events['join:shipment']('s1');
    expect(socket.join).toHaveBeenCalledWith('shipment:s1');

    events['leave:shipment']('s1');
    expect(socket.leave).toHaveBeenCalledWith('shipment:s1');

    events.disconnect();
    expect(logger.info).toHaveBeenCalled();
  });

  it('updateShipmentLocation throws when shipment missing', async () => {
    await expect(
      trackingService.updateShipmentLocation(new mongoose.Types.ObjectId().toString(), {
        lat: 1,
        lng: 2,
      })
    ).rejects.toThrow('Shipment not found');
  });

  it('getShipmentLocation returns current location', async () => {
    const shipment = await createShipment({
      currentLocation: {
        type: 'Point',
        coordinates: [2, 1],
        address: 'Current',
      },
    });

    const result = await trackingService.getShipmentLocation(shipment._id.toString());

    expect(result).toEqual(
      expect.objectContaining({
        coordinates: [2, 1],
        address: 'Current',
      })
    );
  });

  it('recordLocationHistory adds timeline entry', async () => {
    const shipment = await createShipment({
      status: ShipmentStatus.IN_TRANSIT,
      timeline: [],
    });

    await trackingService.recordLocationHistory(shipment._id.toString(), {
      lat: 1,
      lng: 2,
      address: 'A',
    });

    const updated = await Shipment.findById(shipment._id);
    expect(updated.timeline).toHaveLength(1);
    expect(updated.timeline[0]).toEqual(
      expect.objectContaining({
        status: ShipmentStatus.IN_TRANSIT,
        location: expect.objectContaining({ address: 'A' }),
      })
    );
  });

  it('calculateETA returns a future date', async () => {
    const shipment = await createShipment();

    const eta = await trackingService.calculateETA(shipment._id.toString());

    expect(eta).toBeInstanceOf(Date);
    expect(eta.getTime()).toBeGreaterThan(Date.now());
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
