const { ApiError } = require('../../src/utils/apiError');
const { createCustomError, formatErrorResponse } = require('../../src/utils/errorResponse');

describe('error utilities', () => {
  it('creates ApiError with status metadata', () => {
    const err = new ApiError('Bad request', 400);

    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });

  it('creates custom error with status code', () => {
    const err = createCustomError('Not found', 404);

    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
  });

  it('formats error response with optional data', () => {
    const response = formatErrorResponse('Invalid input', 422, { field: 'email' });

    expect(response.success).toBe(false);
    expect(response.error.message).toBe('Invalid input');
    expect(response.error.statusCode).toBe(422);
    expect(response.error.data).toEqual({ field: 'email' });
  });

  it('formats error response without optional data', () => {
    const response = formatErrorResponse('Forbidden', 403);

    expect(response.error.data).toBeUndefined();
  });
});
