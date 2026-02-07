const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');

let mockSingleHandler;
let mockArrayHandler;

jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    single: jest.fn(() => (req, res, cb) => mockSingleHandler(req, res, cb)),
    array: jest.fn(() => (req, res, cb) => mockArrayHandler(req, res, cb)),
  }));

  class MulterError extends Error {
    constructor(code, message) {
      super(message || code);
      this.code = code;
    }
  }

  multer.MulterError = MulterError;
  multer.diskStorage = jest.fn(() => ({}));
  return multer;
});

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

const loadMiddleware = (uploadDir) => {
  process.env.UPLOAD_DIR = uploadDir;
  jest.resetModules();
  const multer = require('multer');
  const middleware = require('../../src/middleware/uploadMiddleware');
  return { ...middleware, multer };
};

describe('uploadMiddleware', () => {
  let uploadDir;

  beforeEach(() => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-mw-'));
    mockSingleHandler = jest.fn((req, res, cb) => cb(null));
    mockArrayHandler = jest.fn((req, res, cb) => cb(null));
  });

  afterEach(() => {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    delete process.env.UPLOAD_DIR;
  });

  it('handles multer file size errors', () => {
    const { singleUpload, multer } = loadMiddleware(uploadDir);
    mockSingleHandler = jest.fn((req, res, cb) =>
      cb(new multer.MulterError('LIMIT_FILE_SIZE', 'file'))
    );

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles other multer errors', () => {
    const { singleUpload, multer } = loadMiddleware(uploadDir);
    mockSingleHandler = jest.fn((req, res, cb) =>
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'))
    );

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles unknown upload errors', () => {
    const { singleUpload } = loadMiddleware(uploadDir);
    mockSingleHandler = jest.fn((req, res, cb) => cb(new Error('boom')));

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns error when no file uploaded', () => {
    const { singleUpload } = loadMiddleware(uploadDir);
    mockSingleHandler = jest.fn((req, res, cb) => cb(null));

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('moves uploaded file to entity directory', () => {
    const { singleUpload } = loadMiddleware(uploadDir);

    const tempDir = path.join(uploadDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, 'file.txt');
    fs.writeFileSync(tempFile, 'data');

    mockSingleHandler = jest.fn((req, res, cb) => {
      req.file = {
        path: tempFile,
        originalname: 'file.txt',
        filename: 'file.txt',
      };
      cb(null);
    });

    const req = {
      body: { entityType: 'Shipment', entityId: new mongoose.Types.ObjectId().toString() },
    };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(req.file.relativePath).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('leaves file in temp directory when entityType is missing', () => {
    const { singleUpload } = loadMiddleware(uploadDir);

    const tempDir = path.join(uploadDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, 'file.txt');
    fs.writeFileSync(tempFile, 'data');

    mockSingleHandler = jest.fn((req, res, cb) => {
      req.file = {
        path: tempFile,
        originalname: 'file.txt',
        filename: 'file.txt',
      };
      cb(null);
    });

    const req = {
      body: {},
    };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(req.file.relativePath).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('handles multi upload with no files', () => {
    const { multiUpload } = loadMiddleware(uploadDir);
    mockArrayHandler = jest.fn((req, res, cb) => cb(null));

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    multiUpload('files')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles multi upload file count errors', () => {
    const { multiUpload, multer } = loadMiddleware(uploadDir);
    mockArrayHandler = jest.fn((req, res, cb) =>
      cb(new multer.MulterError('LIMIT_FILE_COUNT', 'files'))
    );

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    multiUpload('files', 1)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles multi upload file size errors', () => {
    const { multiUpload, multer } = loadMiddleware(uploadDir);
    mockArrayHandler = jest.fn((req, res, cb) =>
      cb(new multer.MulterError('LIMIT_FILE_SIZE', 'files'))
    );

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    multiUpload('files', 1)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles multi upload unknown errors', () => {
    const { multiUpload } = loadMiddleware(uploadDir);
    mockArrayHandler = jest.fn((req, res, cb) => cb(new Error('boom')));

    const req = { body: {} };
    const res = {};
    const next = jest.fn();

    multiUpload('files', 1)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('allows files with approved mime types', () => {
    const { multer } = loadMiddleware(uploadDir);
    const fileFilter = multer.mock.calls[0][0].fileFilter;
    const cb = jest.fn();

    fileFilter({}, { mimetype: 'application/pdf' }, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rejects files with unsupported mime types', () => {
    const { multer } = loadMiddleware(uploadDir);
    const fileFilter = multer.mock.calls[0][0].fileFilter;
    const cb = jest.fn();

    fileFilter({}, { mimetype: 'application/x-msdownload' }, cb);

    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
  });

  it('moves files to temp directory when entity type is unknown', () => {
    const { singleUpload } = loadMiddleware(uploadDir);

    const tempDir = path.join(uploadDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, 'file.txt');
    fs.writeFileSync(tempFile, 'data');

    mockSingleHandler = jest.fn((req, res, cb) => {
      req.file = {
        path: tempFile,
        originalname: 'file.txt',
        filename: 'file.txt',
      };
      cb(null);
    });

    const req = {
      body: { entityType: 'Unknown', entityId: 'invalid' },
    };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(req.file.relativePath).toContain('temp');
    expect(next).toHaveBeenCalled();
  });

  it('handles missing source file during move', () => {
    const { singleUpload } = loadMiddleware(uploadDir);

    const tempDir = path.join(uploadDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, 'missing.txt');

    mockSingleHandler = jest.fn((req, res, cb) => {
      req.file = {
        path: tempFile,
        originalname: 'missing.txt',
        filename: 'missing.txt',
      };
      cb(null);
    });

    const req = {
      body: { entityType: 'Shipment', entityId: new mongoose.Types.ObjectId().toString() },
    };
    const res = {};
    const next = jest.fn();

    singleUpload('file')(req, res, next);

    expect(req.file.relativePath).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
