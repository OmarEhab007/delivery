jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require('express-validator');
const { validateRequest } = require('../../src/middleware/validationMiddleware');

describe('validateRequest middleware', () => {
  it('returns 400 with errors when validation fails', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid' }],
    });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateRequest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errors: [{ msg: 'Invalid' }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when validation succeeds', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
