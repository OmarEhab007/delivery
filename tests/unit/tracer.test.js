jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

const tracer = require('../../src/utils/tracer');
const logger = require('../../src/utils/logger');

describe('tracer (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates trace ids', () => {
    const id = tracer.generateTraceId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns null when no trace context', () => {
    expect(tracer.getCurrentTraceId()).toBeNull();
    expect(tracer.getCurrentSpanId()).toBeNull();
    expect(tracer.getTraceContext()).toBeUndefined();
  });

  it('creates a child span without context', () => {
    const span = tracer.createChildSpan('op');
    expect(typeof span.end).toBe('function');
    expect(() => span.end()).not.toThrow();
  });

  it('traces request lifecycle with middleware', () => {
    const middleware = tracer.tracingMiddleware();
    const req = {
      headers: {},
      method: 'GET',
      originalUrl: '/test',
    };
    let finishHandler;
    const res = {
      set: jest.fn(),
      on: jest.fn((event, handler) => {
        if (event === 'finish') {
          finishHandler = handler;
        }
      }),
      statusCode: 200,
    };

    middleware(req, res, () => {});

    expect(req.traceContext).toBeDefined();
    expect(res.set).toHaveBeenCalledWith('X-Trace-ID', expect.any(String));
    expect(res.set).toHaveBeenCalledWith('X-Span-ID', expect.any(String));
    expect(logger.info).toHaveBeenCalled();

    finishHandler();
    expect(logger.info).toHaveBeenCalled();
  });

  it('creates child span in context and records errors', () => {
    const middleware = tracer.tracingMiddleware();
    const req = {
      headers: {},
      method: 'GET',
      originalUrl: '/test',
    };
    const res = {
      set: jest.fn(),
      on: jest.fn(),
      statusCode: 200,
    };

    middleware(req, res, () => {
      const span = tracer.createChildSpan('op');
      span.addAttribute('key', 'value');
      span.end(new Error('fail'));
    });

    expect(logger.debug).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('traces wrapped functions', async () => {
    const middleware = tracer.tracingMiddleware();
    const req = {
      headers: {},
      method: 'GET',
      originalUrl: '/test',
    };
    const res = {
      set: jest.fn(),
      on: jest.fn(),
      statusCode: 200,
    };

    await new Promise((resolve, reject) => {
      middleware(req, res, async () => {
        try {
          const okFn = tracer.traceFunction(async () => 'ok', 'okFn');
          const failFn = tracer.traceFunction(async () => {
            throw new Error('boom');
          }, 'failFn');

          await expect(okFn()).resolves.toBe('ok');
          await expect(failFn()).rejects.toThrow('boom');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    expect(logger.debug).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
