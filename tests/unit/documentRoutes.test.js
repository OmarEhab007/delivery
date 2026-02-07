const express = require('express');
const request = require('supertest');

const loadRouter = (env) => {
  jest.resetModules();
  process.env.NODE_ENV = env;

  const protect = jest.fn((req, res, next) => next());
  const restrictTo = jest.fn(() => (req, res, next) => next());

  jest.doMock('../../src/middleware/authMiddleware', () => ({
    protect,
    restrictTo,
  }));

  jest.doMock('../../src/middleware/uploadMiddleware', () => ({
    singleUpload: () => (req, res, next) => next(),
    multiUpload: () => (req, res, next) => next(),
  }));

  jest.doMock('../../src/controllers/documentController', () => ({
    debugModels: (req, res) => res.status(200).json({ ok: true }),
    uploadDocument: jest.fn((req, res) => res.status(200).json({})),
    uploadMultipleDocuments: jest.fn((req, res) => res.status(200).json({})),
    getDocument: jest.fn((req, res) => res.status(200).json({})),
    downloadDocument: jest.fn((req, res) => res.status(200).send('file')),
    getDocumentsByEntity: jest.fn((req, res) => res.status(200).json({})),
    deleteDocument: jest.fn((req, res) => res.status(200).json({})),
    verifyDocument: jest.fn((req, res) => res.status(200).json({})),
    updateDocument: jest.fn((req, res) => res.status(200).json({})),
  }));

  const Document = { findById: jest.fn() };
  jest.doMock('../../src/models/Document', () => ({ Document }));

  const fs = require('fs');
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);

  const router = require('../../src/routes/documentRoutes');
  const app = express();
  app.use('/', router);

  return {
    app,
    protect,
    restrictTo,
    Document,
    fs,
  };
};

describe('documentRoutes (unit)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('serves debug routes in non-production', async () => {
    const { app } = loadRouter('development');
    await request(app).get('/debug').expect(200);
  });

  it('returns not found and file status on debug-file', async () => {
    const { app, Document, fs } = loadRouter('development');

    Document.findById.mockResolvedValueOnce(null);
    await request(app).get('/debug-file/1').expect(404);

    Document.findById.mockResolvedValueOnce({ filePath: 'docs/file.pdf' });
    fs.existsSync.mockReturnValueOnce(false);

    const response = await request(app).get('/debug-file/1');
    expect(response.status).toBe(200);
    expect(response.body.data.filePath.exists).toBe(false);
  });

  it('returns 500 when debug-file handler throws', async () => {
    const { app, Document } = loadRouter('development');
    Document.findById.mockRejectedValueOnce(new Error('boom'));

    const response = await request(app).get('/debug-file/1');
    expect(response.status).toBe(500);
  });

  it('uses auth middleware for debug routes in production', async () => {
    const { app, protect, restrictTo } = loadRouter('production');
    await request(app).get('/debug').expect(200);

    expect(protect).toHaveBeenCalled();
    expect(restrictTo).toHaveBeenCalledWith('Admin');
  });
});
