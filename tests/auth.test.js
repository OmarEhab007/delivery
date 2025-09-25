const request = require('supertest');
const mongoose = require('mongoose');

const { app } = require('../src/server');
const User = require('../src/models/User');
const otpService = require('../src/services/auth/otpService');

jest.mock('../src/services/auth/otpService', () => {
  const actual = jest.requireActual('../src/services/auth/otpService');
  return {
    ...actual,
    deliverOtp: jest.fn().mockResolvedValue({ channel: 'log', simulated: true }),
  };
});

describe('OTP Authentication', () => {
  afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  test('should request OTP and verify successfully', async () => {
    const phone = '1234567890';
    const otpCode = '123456';

    await User.create({
      name: 'OTP User',
      email: 'otpuser@example.com',
      password: 'password123',
      phone,
      role: 'Merchant',
    });

    jest.spyOn(otpService, 'generateOtp').mockReturnValue(otpCode);
    jest.spyOn(otpService, 'hashOtp').mockReturnValue('hashed-code');
    jest.spyOn(otpService, 'canSendNewOtp').mockReturnValue(true);
    jest.spyOn(otpService, 'getExpiryMs').mockReturnValue(300000);

    const requestResponse = await request(app).post('/api/auth/otp/request').send({ phone });
    expect(requestResponse.status).toBe(200);

    jest.spyOn(otpService, 'verifyOtp').mockReturnValue(true);

    const response = await request(app)
      .post('/api/auth/otp/verify')
      .send({ phone, otp: otpCode })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.data.user.phone).toBe(phone);
  });

  test('should reject invalid OTP', async () => {
    const phone = '1234567891';

    await User.create({
      name: 'Invalid OTP User',
      email: 'invalidotp@example.com',
      password: 'password123',
      phone,
      role: 'Merchant',
      otp: {
        codeHash: 'hashed-code',
        expiresAt: new Date(Date.now() + 300000),
        attemptCount: 0,
        lastSentAt: new Date(),
      },
    });

    jest.spyOn(otpService, 'verifyOtp').mockReturnValue(false);
    jest.spyOn(otpService, 'hasAttemptsRemaining').mockReturnValue(true);

    await request(app).post('/api/auth/otp/verify').send({ phone, otp: '000000' }).expect(400);
  });
});
