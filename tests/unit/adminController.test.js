jest.mock('../../src/models/User', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  startSession: jest.fn(),
}));

jest.mock('../../src/models/Application', () => ({
  Application: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../src/models/Truck', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../../src/models/UserRegistrationRequest', () => ({
  UserRegistrationRequest: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
  UserRegistrationState: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
}));

jest.mock('../../src/utils/db', () => ({
  supportsTransactions: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../src/services/email/emailService', () => ({
  sendRegistrationApprovedEmail: jest.fn(),
  sendRejectionEmail: jest.fn(),
  maskEmail: jest.fn((email) => email),
}));

const User = require('../../src/models/User');
const { Application } = require('../../src/models/Application');
const Truck = require('../../src/models/Truck');
const { Shipment } = require('../../src/models/Shipment');
const { UserRegistrationRequest, UserRegistrationState } = require('../../src/models/UserRegistrationRequest');
const db = require('../../src/utils/db');
const emailService = require('../../src/services/email/emailService');
const controller = require('../../src/controllers/admin/adminController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

const makeChainQuery = (result) => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

describe('adminController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets all users with role filter', async () => {
    User.find.mockReturnValue(makeQuery([{ id: 1 }]));
    User.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getAllUsers({ query: { role: 'Merchant', page: '1', limit: '5' } }, res, jest.fn());

    expect(User.find).toHaveBeenCalledWith({ role: 'Merchant' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when user not found', async () => {
    User.findById.mockReturnValue(makeQuery(null));
    const next = jest.fn();

    await controller.getUserById({ params: { id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('updates user with filtered permissions', async () => {
    const user = {
      save: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
    };
    User.findById.mockResolvedValue(user);
    const res = makeRes();

    await controller.updateUser(
      {
        params: { id: 'u1' },
        body: { role: 'Admin', adminPermissions: ['FULL_ACCESS', 'BAD'], active: true },
      },
      res,
      jest.fn()
    );

    expect(user.adminPermissions).toEqual(['FULL_ACCESS']);
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updates user profile fields and role', async () => {
    const user = {
      save: jest.fn(),
      toObject: jest.fn().mockReturnValue({}),
    };
    User.findById.mockResolvedValue(user);
    const res = makeRes();

    await controller.updateUser(
      {
        params: { id: 'u1' },
        body: { name: 'Name', email: 'email@example.com', phone: '123', role: 'Merchant', active: false },
      },
      res,
      jest.fn()
    );

    expect(user.name).toBe('Name');
    expect(user.email).toBe('email@example.com');
    expect(user.phone).toBe('123');
    expect(user.role).toBe('Merchant');
    expect(user.active).toBe(false);
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when updating missing user', async () => {
    User.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateUser(
      { params: { id: 'u1' }, body: { name: 'Name' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('deletes user', async () => {
    const user = { deleteOne: jest.fn() };
    User.findById.mockResolvedValue(user);
    const res = makeRes();

    await controller.deleteUser({ params: { id: 'u1' } }, res, jest.fn());

    expect(user.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when deleting missing user', async () => {
    User.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.deleteUser({ params: { id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks create user when email exists', async () => {
    User.findOne.mockResolvedValue({ id: 'u1' });
    const next = jest.fn();

    await controller.createUser(
      { body: { email: 'test@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('requires truck owner fields', async () => {
    User.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.createUser(
      { body: { role: 'TruckOwner', email: 'x@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('creates truck owner user with company fields', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) });
    const res = makeRes();

    await controller.createUser(
      {
        body: {
          name: 'Owner',
          email: 'owner@example.com',
          password: 'password',
          phone: '1',
          role: 'TruckOwner',
          companyName: 'Co',
          companyAddress: 'Addr',
        },
      },
      res,
      jest.fn()
    );

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Co', companyAddress: 'Addr' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates admin user with permissions', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) });
    const res = makeRes();

    await controller.createUser(
      {
        body: {
          name: 'Admin',
          email: 'admin@example.com',
          password: 'password',
          phone: '1',
          role: 'Admin',
          adminPermissions: ['FULL_ACCESS'],
        },
      },
      res,
      jest.fn()
    );

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ adminPermissions: ['FULL_ACCESS'] }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects driver creation when license info is missing', async () => {
    User.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await controller.createUser(
      { body: { role: 'Driver', email: 'driver@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns registration requests with filters', async () => {
    UserRegistrationRequest.find.mockReturnValue(makeQuery([{ id: 'r1' }]));
    UserRegistrationRequest.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getUserRegistrationRequests(
      { query: { state: 'PENDING', role: 'Driver', page: '1', limit: '5' } },
      res,
      jest.fn()
    );

    expect(UserRegistrationRequest.find).toHaveBeenCalledWith({ state: 'PENDING', role: 'Driver' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects registration approval when request is missing', async () => {
    UserRegistrationRequest.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects registration approval when request is not pending', async () => {
    UserRegistrationRequest.findById.mockResolvedValue({
      state: UserRegistrationState.APPROVED,
    });
    const next = jest.fn();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects registration approval when user exists', async () => {
    UserRegistrationRequest.findById.mockResolvedValue({
      state: UserRegistrationState.PENDING,
      payload: { email: 'test@example.com' },
      role: 'Merchant',
    });
    User.findOne.mockResolvedValue({ _id: 'u1' });
    const next = jest.fn();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('approves truck owner registration and sets company fields', async () => {
    const request = {
      _id: 'r1',
      state: UserRegistrationState.PENDING,
      payload: {
        email: 'owner@example.com',
        name: 'Owner',
        password: 'p',
        phone: '1',
        companyName: 'Co',
        companyAddress: 'Addr',
      },
      role: 'TruckOwner',
    };
    UserRegistrationRequest.findById.mockResolvedValue(request);
    User.findOne.mockResolvedValue(null);
    db.supportsTransactions.mockResolvedValue(false);
    User.create.mockResolvedValue({
      _id: 'u1',
      email: 'owner@example.com',
      toObject: jest.fn().mockReturnValue({}),
    });
    UserRegistrationRequest.updateOne.mockResolvedValue({});
    const res = makeRes();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      res,
      jest.fn()
    );

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Co', companyAddress: 'Addr' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('approves driver registration and sets license fields', async () => {
    const request = {
      _id: 'r1',
      state: UserRegistrationState.PENDING,
      payload: {
        email: 'driver@example.com',
        name: 'Driver',
        password: 'p',
        phone: '1',
        licenseNumber: 'LIC',
        ownerId: 'owner1',
      },
      role: 'Driver',
    };
    UserRegistrationRequest.findById.mockResolvedValue(request);
    User.findOne.mockResolvedValue(null);
    db.supportsTransactions.mockResolvedValue(false);
    User.create.mockResolvedValue({
      _id: 'u1',
      email: 'driver@example.com',
      toObject: jest.fn().mockReturnValue({}),
    });
    UserRegistrationRequest.updateOne.mockResolvedValue({});
    const res = makeRes();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      res,
      jest.fn()
    );

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ licenseNumber: 'LIC', ownerId: 'owner1' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('approves registration request without transactions', async () => {
    const request = {
      _id: 'r1',
      state: UserRegistrationState.PENDING,
      payload: { email: 'test@example.com', name: 'T', password: 'p', phone: '1' },
      role: 'Merchant',
    };
    UserRegistrationRequest.findById.mockResolvedValue(request);
    User.findOne.mockResolvedValue(null);
    db.supportsTransactions.mockResolvedValue(false);
    User.create.mockResolvedValue({
      _id: 'u1',
      email: 'test@example.com',
      toObject: jest.fn().mockReturnValue({}),
    });
    UserRegistrationRequest.updateOne.mockResolvedValue({});
    const res = makeRes();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects registration request when request is missing', async () => {
    UserRegistrationRequest.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.rejectUserRegistrationRequest(
      { params: { id: 'r1' }, body: { reason: 'no' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects registration request when not pending', async () => {
    UserRegistrationRequest.findById.mockResolvedValue({ state: UserRegistrationState.APPROVED });
    const next = jest.fn();

    await controller.rejectUserRegistrationRequest(
      { params: { id: 'r1' }, body: { reason: 'no' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects registration request and continues on email error', async () => {
    UserRegistrationRequest.findById.mockResolvedValue({
      _id: 'r1',
      state: UserRegistrationState.PENDING,
      payload: { email: 'test@example.com' },
      save: jest.fn(),
    });
    emailService.sendRejectionEmail.mockRejectedValue(new Error('email fail'));
    const res = makeRes();

    await controller.rejectUserRegistrationRequest(
      { params: { id: 'r1' }, body: { reason: 'no' }, user: { _id: 'admin1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns dashboard stats with recent activity', async () => {
    User.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);
    Truck.countDocuments
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    Shipment.countDocuments
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    Application.countDocuments
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);

    Shipment.find
      .mockReturnValueOnce(makeChainQuery([{ _id: 's1' }]))
      .mockReturnValueOnce(
        makeChainQuery([
          { _id: 's2', status: 'REQUESTED', updatedAt: new Date(Date.now() - 30 * 1000), merchantId: { name: 'M' } },
          { _id: 's3', status: 'CONFIRMED', updatedAt: new Date(Date.now() - 5 * 60 * 1000), merchantId: { name: 'M' } },
          { _id: 's4', status: 'IN_TRANSIT', updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), merchantId: { name: 'M' } },
          { _id: 's5', status: 'DELIVERED', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), merchantId: { name: 'M' } },
          { _id: 's6', status: 'CANCELLED', updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), merchantId: null },
        ])
      );
    User.find.mockReturnValueOnce(
      makeChainQuery([{ _id: 'u1', name: 'User1', createdAt: new Date(Date.now() - 30000) }])
    );

    const res = makeRes();
    await controller.getDashboardStats({ query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns dashboard stats with non-zero last month values', async () => {
    User.countDocuments
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(3);
    Truck.countDocuments
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    Shipment.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    Application.countDocuments
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    Shipment.find
      .mockReturnValueOnce(makeChainQuery([{ _id: 's1' }]))
      .mockReturnValueOnce(
        makeChainQuery([
          { _id: 's2', status: 'UNKNOWN', updatedAt: new Date(Date.now() - 2 * 60 * 1000), merchantId: null },
        ])
      );
    User.find.mockReturnValueOnce(
      makeChainQuery([{ _id: 'u1', name: 'User1', createdAt: new Date(Date.now() - 3600 * 1000) }])
    );

    const res = makeRes();
    await controller.getDashboardStats({ query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('formats recent activity time across ranges', async () => {
    jest.useFakeTimers();
    const now = new Date('2024-02-01T00:00:00Z');
    jest.setSystemTime(now);

    User.countDocuments.mockResolvedValue(0);
    Truck.countDocuments.mockResolvedValue(0);
    Shipment.countDocuments.mockResolvedValue(0);
    Application.countDocuments.mockResolvedValue(0);

    Shipment.find
      .mockReturnValueOnce(makeChainQuery([]))
      .mockReturnValueOnce(
        makeChainQuery([
          { _id: 's1', status: 'REQUESTED', updatedAt: new Date(now.getTime() - 2 * 60 * 1000), merchantId: { name: 'M' } },
          { _id: 's2', status: 'CONFIRMED', updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), merchantId: { name: 'M' } },
          { _id: 's3', status: 'DELIVERED', updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), merchantId: { name: 'M' } },
          { _id: 's4', status: 'CANCELLED', updatedAt: new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000), merchantId: { name: 'M' } },
        ])
      );
    User.find.mockReturnValueOnce(
      makeChainQuery([
        { _id: 'u1', name: 'User1', createdAt: new Date(now.getTime() - 2 * 60 * 1000) },
        { _id: 'u2', name: 'User2', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        { _id: 'u3', name: 'User3', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      ])
    );

    const res = makeRes();
    await controller.getDashboardStats({ query: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    jest.useRealTimers();
  });

  it('creates driver user with license info', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) });
    const res = makeRes();

    await controller.createUser(
      {
        body: {
          name: 'Driver',
          email: 'driver@example.com',
          password: 'password',
          phone: '1',
          role: 'Driver',
          licenseNumber: 'LIC',
          ownerId: 'owner1',
        },
      },
      res,
      jest.fn()
    );

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ licenseNumber: 'LIC', ownerId: 'owner1' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('approves registration request with transactions', async () => {
    const request = {
      _id: 'r1',
      state: UserRegistrationState.PENDING,
      payload: { email: 'test@example.com', name: 'T', password: 'p', phone: '1' },
      role: 'Merchant',
    };
    UserRegistrationRequest.findById.mockResolvedValue(request);
    User.findOne.mockResolvedValue(null);
    db.supportsTransactions.mockResolvedValue(true);
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    User.startSession.mockResolvedValue(session);
    User.create.mockResolvedValue([{ _id: 'u1', email: 'test@example.com', toObject: jest.fn() }]);
    UserRegistrationRequest.updateOne.mockResolvedValue({});
    emailService.sendRegistrationApprovedEmail.mockResolvedValue();
    const res = makeRes();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      res,
      jest.fn()
    );

    expect(session.commitTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rolls back user creation when request update fails', async () => {
    const request = {
      _id: 'r1',
      state: UserRegistrationState.PENDING,
      payload: { email: 'test@example.com', name: 'T', password: 'p', phone: '1' },
      role: 'Merchant',
    };
    UserRegistrationRequest.findById.mockResolvedValue(request);
    User.findOne.mockResolvedValue(null);
    db.supportsTransactions.mockResolvedValue(false);
    User.create.mockResolvedValue({
      _id: 'u1',
      email: 'test@example.com',
      toObject: jest.fn().mockReturnValue({}),
    });
    UserRegistrationRequest.updateOne.mockRejectedValue(new Error('update failed'));
    const next = jest.fn();

    await controller.approveUserRegistrationRequest(
      { params: { id: 'r1' }, user: { _id: 'admin1' } },
      makeRes(),
      next
    );

    expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'u1' });
    expect(next).toHaveBeenCalled();
  });
});
