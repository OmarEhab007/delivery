const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const ensureLogDirectory = require('../../src/utils/ensureLogDir');

describe('ensureLogDir', () => {
  it('creates logs directory and writes test file when missing', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logs-test-'));
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    await expect(ensureLogDirectory()).resolves.toBe(true);

    const logDir = path.join(tempDir, 'logs');
    expect(fs.existsSync(logDir)).toBe(true);

    cwdSpy.mockRestore();
  });

  it('throws when log directory is not writable', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logs-test-'));
    const logDir = path.join(tempDir, 'logs');
    fs.mkdirSync(logDir, { recursive: true });

    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
    const writeSpy = jest.spyOn(fs.promises, 'writeFile').mockRejectedValue(new Error('nope'));

    await expect(ensureLogDirectory()).rejects.toThrow('Log directory exists but is not writable');

    writeSpy.mockRestore();
    cwdSpy.mockRestore();
  });
});
