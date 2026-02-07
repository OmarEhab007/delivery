jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'access-token'),
}));

jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/RefreshToken', () => ({
  findByToken: jest.fn(),
  revokeToken: jest.fn(),
  createToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
}));

jest.mock('../../src/models/UserRegistrationRequest', () => ({
  UserRegistrationRequest: {
    create: jest.fn(),
  },
}));

jest.mock('../../src/services/auth/otpService', () => ({
  canSendNewOtp: jest.fn(),
  getResendIntervalMs: jest.fn(),
  generateOtp: jest.fn(),
  hashOtp: jest.fn(),
  getExpiryMs: jest.fn(),
  deliverOtp: jest.fn(),
  hasAttemptsRemaining: jest.fn(),
  verifyOtp: jest.fn(),
}));

jest.mock('../../src/services/email/emailService', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const { validationResult } = require('express-validator');
const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const { UserRegistrationRequest } = require('../../src/models/UserRegistrationRequest');
const otpService = require('../../src/services/auth/otpService');
const { sendPasswordResetEmail } = require('../../src/services/email/emailService');
require('../../src/utils/polyfills');
const controller = require('../../src/controllers/auth/authController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const makeSelectQuery = (result) => ({
  select: jest.fn().mockReturnValue(Promise.resolve(result)),
});

describe('authController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  it('registerMerchant rejects existing users', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1' });

    const next = jest.fn();
    await controller.registerMerchant(
      { body: { email: 'test@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('registerTruckOwner rejects existing users', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1' });

    const next = jest.fn();
    await controller.registerTruckOwner(
      { body: { email: 'test@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('registerDriver rejects existing users', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1' });

    const next = jest.fn();
    await controller.registerDriver(
      { body: { email: 'test@example.com' }, user: { _id: 'owner1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('login rejects invalid credentials', async () => {
    User.findOne.mockReturnValue(makeSelectQuery(null));

    const next = jest.fn();
    await controller.login({ body: { email: 'a', password: 'b' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('login rejects inactive user', async () => {
    User.findOne.mockReturnValue(
      makeSelectQuery({ active: false, comparePassword: jest.fn() })
    );

    const next = jest.fn();
    await controller.login({ body: { email: 'a', password: 'b' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('login rejects wrong password', async () => {
    User.findOne.mockReturnValue(
      makeSelectQuery({ active: true, comparePassword: jest.fn().mockResolvedValue(false) })
    );

    const next = jest.fn();
    await controller.login({ body: { email: 'a', password: 'b' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('refreshAccessToken requires refresh token', async () => {
    const next = jest.fn();
    await controller.refreshAccessToken({ body: {} }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('refreshAccessToken rejects invalid token', async () => {
    RefreshToken.findByToken.mockResolvedValue(null);

    const next = jest.fn();
    await controller.refreshAccessToken(
      { body: { refreshToken: 'bad' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('refreshAccessToken rejects when user missing', async () => {
    RefreshToken.findByToken.mockResolvedValue({ userId: 'u1' });
    User.findById.mockResolvedValue(null);

    const next = jest.fn();
    await controller.refreshAccessToken(
      { body: { refreshToken: 'token' } },
      makeRes(),
      next
    );

    expect(RefreshToken.revokeToken).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('requestOtp rejects missing user', async () => {
    User.findOne.mockResolvedValue(null);

    const next = jest.fn();
    await controller.requestOtp({ body: { phone: '+123' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('requestOtp rate limits resend attempts', async () => {
    const lastSentAt = new Date();
    User.findOne.mockResolvedValue({
      active: true,
      otp: { lastSentAt },
      save: jest.fn(),
    });
    otpService.canSendNewOtp.mockReturnValue(false);
    otpService.getResendIntervalMs.mockReturnValue(60000);

    const next = jest.fn();
    await controller.requestOtp({ body: { phone: '+123' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('verifyOtp rejects invalid otp', async () => {
    User.findOne.mockReturnValue(makeSelectQuery(null));

    const next = jest.fn();
    await controller.verifyOtp({ body: { phone: '+123', otp: '0000' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('forgotPassword rejects unknown email', async () => {
    User.findOne.mockResolvedValue(null);

    const next = jest.fn();
    await controller.forgotPassword({ body: { email: 'test@example.com' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('resetPassword rejects invalid token', async () => {
    User.findOne.mockResolvedValue(null);

    const next = jest.fn();
    await controller.resetPassword(
      { params: { token: 'bad' }, body: { password: 'newpass' }, headers: {} },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('updatePassword rejects incorrect current password', async () => {
    User.findById.mockReturnValue(makeSelectQuery({ comparePassword: jest.fn().mockResolvedValue(false) }));

    const next = jest.fn();
    await controller.updatePassword(
      { user: { _id: 'u1' }, body: { currentPassword: 'old', newPassword: 'new' }, headers: {} },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('logout revokes refresh token when provided', async () => {
    const res = makeRes();
    await controller.logout({ body: { refreshToken: 'token' } }, res, jest.fn());

    expect(RefreshToken.revokeToken).toHaveBeenCalledWith('token');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('registerTestAdmin rejects when user exists', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1' });

    const next = jest.fn();
    await controller.registerTestAdmin(
      { body: { email: 'test@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('registerMerchant succeeds when user does not exist', async () => {
    User.findOne.mockResolvedValue(null);
    UserRegistrationRequest.create.mockResolvedValue({ _id: 'req1', state: 'PENDING' });

    const res = makeRes();
    await controller.registerMerchant(
      { body: { name: 'M', email: 'm@example.com', password: 'secret', phone: '123' } },
      res,
      jest.fn()
    );

    expect(UserRegistrationRequest.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it('login succeeds with valid credentials', async () => {
    const user = {
      _id: 'u1',
      email: 'm@example.com',
      active: true,
      password: 'secret',
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue(makeSelectQuery(user));
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    const res = makeRes();
    await controller.login(
      { body: { email: 'm@example.com', password: 'secret' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(RefreshToken.createToken).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(user.password).toBeUndefined();
  });

  it('refreshAccessToken rotates token for active user', async () => {
    RefreshToken.findByToken.mockResolvedValue({ userId: 'u1' });
    RefreshToken.createToken.mockResolvedValue({ token: 'new-refresh' });
    User.findById.mockResolvedValue({ _id: 'u1', active: true });

    const res = makeRes();
    await controller.refreshAccessToken(
      { body: { refreshToken: 'old' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(RefreshToken.revokeToken).toHaveBeenCalledWith('old');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('requestOtp sends OTP when allowed', async () => {
    const user = {
      _id: 'u1',
      phone: '+123',
      active: true,
      otp: { resendCount: 1, lastSentAt: new Date() },
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockResolvedValue(user);
    otpService.canSendNewOtp.mockReturnValue(true);
    otpService.generateOtp.mockReturnValue('1234');
    otpService.hashOtp.mockReturnValue('hashed');
    otpService.getExpiryMs.mockReturnValue(60000);
    otpService.deliverOtp.mockResolvedValue();

    const res = makeRes();
    await controller.requestOtp({ body: { phone: '+123' } }, res, jest.fn());

    expect(user.save).toHaveBeenCalled();
    expect(otpService.deliverOtp).toHaveBeenCalledWith('+123', '1234');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('verifyOtp logs in and clears otp on success', async () => {
    const user = {
      _id: 'u1',
      otp: { codeHash: 'hashed', attemptCount: 0, expiresAt: new Date(Date.now() + 60000) },
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockReturnValue(makeSelectQuery(user));
    otpService.hasAttemptsRemaining.mockReturnValue(true);
    otpService.verifyOtp.mockReturnValue(true);
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    const res = makeRes();
    await controller.verifyOtp(
      { body: { phone: '+123', otp: '1234' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(user.otp).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forgotPassword includes reset token in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const user = {
      _id: 'u1',
      email: 'm@example.com',
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockResolvedValue(user);
    sendPasswordResetEmail.mockResolvedValue();

    const res = makeRes();
    await controller.forgotPassword(
      { body: { email: 'm@example.com' } },
      res,
      jest.fn()
    );

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ resetToken: expect.any(String) }));

    process.env.NODE_ENV = originalEnv;
  });

  it('resetPassword updates credentials and issues tokens', async () => {
    const user = {
      _id: 'u1',
      email: 'm@example.com',
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockResolvedValue(user);
    RefreshToken.revokeAllUserTokens.mockResolvedValue();
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    const res = makeRes();
    await controller.resetPassword(
      { params: { token: 'reset-token' }, body: { password: 'newpass' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updatePassword updates password and issues tokens', async () => {
    const user = {
      _id: 'u1',
      email: 'm@example.com',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(),
    };
    User.findById.mockReturnValue(makeSelectQuery(user));
    RefreshToken.revokeAllUserTokens.mockResolvedValue();
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    const res = makeRes();
    await controller.updatePassword(
      { user: { _id: 'u1' }, body: { currentPassword: 'old', newPassword: 'new' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(RefreshToken.revokeAllUserTokens).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('registerTestAdmin succeeds for new user', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'u1',
      name: 'Admin',
      email: 'admin@example.com',
      phone: '123',
      role: 'Admin',
    });
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    const res = makeRes();
    await controller.registerTestAdmin(
      { body: { name: 'Admin', email: 'admin@example.com', password: 'secret', phone: '123' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('refreshAccessToken returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.refreshAccessToken({ body: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('refreshAccessToken rejects inactive user', async () => {
    RefreshToken.findByToken.mockResolvedValue({ userId: 'u1' });
    User.findById.mockResolvedValue({ _id: 'u1', active: false });

    const next = jest.fn();
    await controller.refreshAccessToken(
      { body: { refreshToken: 'token' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      makeRes(),
      next
    );

    expect(RefreshToken.revokeToken).toHaveBeenCalledWith('token');
    expect(next).toHaveBeenCalled();
  });

  it('logout succeeds without refresh token', async () => {
    const res = makeRes();
    await controller.logout({ body: {} }, res, jest.fn());

    expect(RefreshToken.revokeToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('requestOtp returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.requestOtp({ body: { phone: '+123' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('requestOtp rejects inactive user', async () => {
    User.findOne.mockResolvedValue({ active: false });

    const next = jest.fn();
    await controller.requestOtp({ body: { phone: '+123' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('verifyOtp returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.verifyOtp({ body: { phone: '+123', otp: '0000' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('verifyOtp rejects expired otp', async () => {
    const user = {
      otp: { codeHash: 'hashed', expiresAt: new Date(Date.now() - 1000) },
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockReturnValue(makeSelectQuery(user));

    const next = jest.fn();
    await controller.verifyOtp(
      { body: { phone: '+123', otp: '0000' } },
      makeRes(),
      next
    );

    expect(user.save).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('verifyOtp rejects when attempts exceeded', async () => {
    const user = {
      otp: { codeHash: 'hashed', expiresAt: new Date(Date.now() + 60000) },
    };
    User.findOne.mockReturnValue(makeSelectQuery(user));
    otpService.hasAttemptsRemaining.mockReturnValue(false);

    const next = jest.fn();
    await controller.verifyOtp(
      { body: { phone: '+123', otp: '0000' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('forgotPassword returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.forgotPassword({ body: { email: 'x@example.com' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('forgotPassword omits reset token outside development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const user = {
      _id: 'u1',
      email: 'm@example.com',
      save: jest.fn().mockResolvedValue(),
    };
    User.findOne.mockResolvedValue(user);
    sendPasswordResetEmail.mockResolvedValue();

    const res = makeRes();
    await controller.forgotPassword(
      { body: { email: 'm@example.com' } },
      res,
      jest.fn()
    );

    const payload = res.json.mock.calls[0][0];
    expect(payload.resetToken).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('resetPassword returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.resetPassword(
      { params: { token: 'bad' }, body: { password: 'newpass' }, headers: {} },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updatePassword returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.updatePassword(
      { user: { _id: 'u1' }, body: { currentPassword: 'old', newPassword: 'new' }, headers: {} },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('registerAdmin rejects existing user', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1' });
    const next = jest.fn();

    await controller.registerAdmin(
      { body: { email: 'admin@example.com' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('registerAdmin creates admin with default permissions', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'admin1',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'Admin',
      adminPermissions: ['FULL_ACCESS'],
    });
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    const res = makeRes();
    await controller.registerAdmin(
      { body: { name: 'Admin', email: 'admin@example.com', password: 'secret', phone: '123' }, headers: { 'user-agent': 'ua' }, ip: '1.1.1.1' },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registerAdmin uses provided permissions', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'admin2',
      name: 'Admin',
      email: 'admin2@example.com',
      role: 'Admin',
      adminPermissions: ['LIMITED'],
    });
    RefreshToken.createToken.mockResolvedValue({ token: 'refresh-token' });

    await controller.registerAdmin(
      {
        body: {
          name: 'Admin',
          email: 'admin2@example.com',
          password: 'secret',
          phone: '123',
          adminPermissions: ['LIMITED'],
        },
        headers: { 'user-agent': 'ua' },
        ip: '1.1.1.1',
      },
      makeRes(),
      jest.fn()
    );

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ adminPermissions: ['LIMITED'] })
    );
  });

  it('registerTestAdmin returns validation errors', async () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'bad' }],
    });

    const res = makeRes();
    await controller.registerTestAdmin({ body: {} }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
