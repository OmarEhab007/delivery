jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const User = require('../../src/models/User');
const logger = require('../../src/utils/logger');
const initializeAdminUser = require('../../src/utils/initAdmin');

describe('initAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when admin already exists', async () => {
    User.findOne.mockResolvedValue({ email: 'admin@example.com' });

    await initializeAdminUser();

    expect(User.create).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it('creates an admin when none exists', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ email: 'admin@deliveryapp.com' });

    await initializeAdminUser();

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Admin',
        adminPermissions: ['FULL_ACCESS'],
      })
    );
    expect(logger.warn).toHaveBeenCalled();
  });

  it('logs errors when initialization fails', async () => {
    User.findOne.mockRejectedValue(new Error('boom'));

    await initializeAdminUser();

    expect(logger.error).toHaveBeenCalled();
  });
});
