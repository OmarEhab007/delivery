const RefreshToken = require('../../src/models/RefreshToken');
const ORIGINAL_REFRESH_TOKEN_EXPIRES_IN_DAYS = process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS;

describe('RefreshToken model statics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (ORIGINAL_REFRESH_TOKEN_EXPIRES_IN_DAYS === undefined) {
      delete process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS;
    } else {
      process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = ORIGINAL_REFRESH_TOKEN_EXPIRES_IN_DAYS;
    }
  });

  it('hashes and generates tokens', () => {
    const token = RefreshToken.generateToken();
    const hash = RefreshToken.hashToken(token);

    expect(typeof token).toBe('string');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(token);
  });

  it('creates token with default expiry', async () => {
    const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ _id: 'rt1' });
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    delete process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS;
    const result = await RefreshToken.createToken('user1', { userAgent: 'ua', ipAddress: 'ip' });

    expect(result.token).toBeDefined();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        userAgent: 'ua',
        ipAddress: 'ip',
      })
    );
  });

  it('uses configured expiry days', async () => {
    const createSpy = jest.spyOn(RefreshToken, 'create').mockResolvedValue({ _id: 'rt2' });
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(2_000_000);
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '1';

    await RefreshToken.createToken('user2');

    const expiresAt = createSpy.mock.calls[0][0].expiresAt;
    expect(expiresAt.getTime()).toBe(2_000_000 + 24 * 60 * 60 * 1000);
  });

  it('revokes tokens', async () => {
    jest.spyOn(RefreshToken, 'updateOne').mockResolvedValue({ modifiedCount: 1 });

    const result = await RefreshToken.revokeToken('token');

    expect(result).toBe(true);
  });

  it('returns false when revoke does not modify', async () => {
    jest.spyOn(RefreshToken, 'updateOne').mockResolvedValue({ modifiedCount: 0 });

    const result = await RefreshToken.revokeToken('token');

    expect(result).toBe(false);
  });

  it('revokes all user tokens', async () => {
    jest.spyOn(RefreshToken, 'updateMany').mockResolvedValue({ modifiedCount: 3 });

    const result = await RefreshToken.revokeAllUserTokens('user1');

    expect(result).toBe(3);
  });

  it('cleans up expired tokens', async () => {
    jest.spyOn(RefreshToken, 'deleteMany').mockResolvedValue({ deletedCount: 5 });

    const result = await RefreshToken.cleanupExpired();

    expect(result).toBe(5);
  });
});
