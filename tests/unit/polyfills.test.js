jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
}));

const buffer = require('buffer');

describe('polyfills', () => {
  const originalSlowBuffer = buffer.SlowBuffer;

  afterEach(() => {
    buffer.SlowBuffer = originalSlowBuffer;
  });

  it('adds SlowBuffer and equal polyfill when missing', () => {
    buffer.SlowBuffer = undefined;

    jest.resetModules();
    require('../../src/utils/polyfills');

    expect(buffer.SlowBuffer).toBe(buffer.Buffer);
    expect(typeof buffer.SlowBuffer.prototype.equal).toBe('function');
    const slowBufferInstance = buffer.SlowBuffer.from('a');
    expect(slowBufferInstance.equal(buffer.Buffer.from('a'))).toBe(true);
    expect(slowBufferInstance.equal('not-buffer')).toBe(false);
  });

  it('keeps existing equal implementation', () => {
    const custom = function SlowBufferStub() {};
    custom.prototype.equal = jest.fn(() => true);
    buffer.SlowBuffer = custom;

    jest.resetModules();
    require('../../src/utils/polyfills');

    expect(buffer.SlowBuffer.prototype.equal).toBe(custom.prototype.equal);
  });

  it('adds equal when SlowBuffer exists without it', () => {
    const custom = function SlowBufferStub() {};
    buffer.SlowBuffer = custom;

    jest.resetModules();
    require('../../src/utils/polyfills');

    expect(typeof buffer.SlowBuffer.prototype.equal).toBe('function');
    const left = buffer.Buffer.from('ab');
    expect(buffer.SlowBuffer.prototype.equal.call(left, buffer.Buffer.from('a'))).toBe(false);
    expect(buffer.SlowBuffer.prototype.equal.call(left, buffer.Buffer.from('ac'))).toBe(false);
  });
});
