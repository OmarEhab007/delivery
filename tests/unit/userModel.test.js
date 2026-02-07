jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed-password'),
  compare: jest.fn(async () => true),
}));

const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');

describe('User model', () => {
  const baseUser = {
    name: 'Test User',
    email: 'test-user@example.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'Merchant',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('hashed-password');
    bcrypt.compare.mockResolvedValue(true);
  });

  it('hashes password on save when modified', async () => {
    const user = new User({ ...baseUser, email: `hash-${Date.now()}@example.com` });
    await user.save();

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(user.password).toBe('hashed-password');

    bcrypt.hash.mockClear();
    user.name = 'Updated';
    await user.save();

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('compares passwords', async () => {
    const user = new User({ ...baseUser, email: `compare-${Date.now()}@example.com` });
    user.password = 'hashed-password';

    const result = await user.comparePassword('candidate');

    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('candidate', 'hashed-password');
  });

  it('adds document and updates driver license for drivers', async () => {
    const docId = new (require('mongoose').Types.ObjectId)();
    const user = new User({
      ...baseUser,
      role: 'Driver',
      ownerId: '000000000000000000000010',
      licenseNumber: 'DL-123',
      requiredDocuments: [{ documentType: 'DRIVER_LICENSE', isProvided: false }],
      verificationStatus: 'UNVERIFIED',
    });
    user.driverLicense = {};
    user.save = jest.fn().mockResolvedValue(user);

    await user.addDocument({
      _id: docId,
      name: 'License',
      documentType: 'DRIVER_LICENSE',
    });

    expect(user.driverLicense.documentId.toString()).toBe(docId.toString());
    expect(user.verificationStatus).toBe('PENDING');
    expect(user.requiredDocuments[0].isProvided).toBe(true);
  });

  it('skips duplicate documents', async () => {
    const docId = new (require('mongoose').Types.ObjectId)();
    const user = new User({
      ...baseUser,
      documents: [{ documentId: docId }],
    });
    user.save = jest.fn().mockResolvedValue(user);

    const result = await user.addDocument({
      _id: docId,
      name: 'Doc',
      documentType: 'OTHER',
    });

    expect(result).toBe(user);
    expect(user.documents).toHaveLength(1);
  });
});
