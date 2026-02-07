const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../src/models/Document', () => {
  const Document = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Document.findById = jest.fn();
  Document.findByIdAndDelete = jest.fn();
  Document.find = jest.fn();

  return {
    Document,
    DocumentType: {
      SHIPPING_INVOICE: 'SHIPPING_INVOICE',
      DRIVER_LICENSE: 'DRIVER_LICENSE',
    },
  };
});

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));

const loadService = (uploadDir) => {
  process.env.UPLOAD_DIR = uploadDir;
  jest.resetModules();
  const service = require('../../src/services/documentService');
  const { Document, DocumentType } = require('../../src/models/Document');
  const User = require('../../src/models/User');
  return { service, Document, DocumentType, User };
};

describe('documentService (local storage)', () => {
  let uploadDir;

  beforeEach(() => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-'));
  });

  afterEach(() => {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    delete process.env.UPLOAD_DIR;
  });

  it('saves documents using file buffers', async () => {
    const { service, Document, DocumentType } = loadService(uploadDir);
    const file = {
      originalname: 'invoice.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('data'),
    };

    const doc = await service.saveDocument(file, {
      name: 'Invoice',
      documentType: DocumentType.SHIPPING_INVOICE,
      entityType: 'Shipment',
      entityId: 's1',
      uploadedBy: 'u1',
    });

    expect(Document).toHaveBeenCalled();
    expect(doc.filePath).toContain('shipments');
    expect(fs.existsSync(path.join(uploadDir, doc.filePath))).toBe(true);
  });

  it('initializes storage when base directory is missing', async () => {
    const missingDir = path.join(os.tmpdir(), `docs-missing-${Date.now()}`);
    const { service } = loadService(missingDir);

    const result = await service.initializeStorage();

    expect(result).toBe(true);
    expect(fs.existsSync(path.join(missingDir, 'shipments'))).toBe(true);
  });

  it('saves documents using file paths', async () => {
    const { service, DocumentType } = loadService(uploadDir);
    const tempFile = path.join(uploadDir, 'temp.txt');
    fs.writeFileSync(tempFile, 'data');

    const file = {
      originalname: 'temp.txt',
      mimetype: 'text/plain',
      path: tempFile,
    };

    const doc = await service.saveDocument(file, {
      name: 'Temp',
      documentType: DocumentType.SHIPPING_INVOICE,
      entityType: 'Shipment',
      entityId: 's2',
      uploadedBy: 'u2',
    });

    expect(doc.filePath).toContain('shipments');
    expect(fs.existsSync(path.join(uploadDir, doc.filePath))).toBe(true);
  });

  it('saves documents when entity directory already exists', async () => {
    const { service, DocumentType } = loadService(uploadDir);
    const file = {
      originalname: 'exists.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('data'),
    };

    const entityDir = path.join(uploadDir, 'shipments', 's10');
    fs.mkdirSync(entityDir, { recursive: true });

    const doc = await service.saveDocument(file, {
      name: 'Existing Dir',
      documentType: DocumentType.SHIPPING_INVOICE,
      entityType: 'Shipment',
      entityId: 's10',
      uploadedBy: 'u10',
    });

    expect(doc.filePath).toContain('shipments');
  });

  it('stores documents under the correct subdirectories', async () => {
    const { service, DocumentType } = loadService(uploadDir);
    const baseFile = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('data'),
    };

    const entities = [
      { entityType: 'Application', entityId: 'a1', dir: 'applications' },
      { entityType: 'Truck', entityId: 't1', dir: 'trucks' },
      { entityType: 'User', entityId: 'u1', dir: 'users' },
    ];

    for (const entity of entities) {
      const doc = await service.saveDocument(baseFile, {
        name: 'Doc',
        documentType: DocumentType.SHIPPING_INVOICE,
        entityType: entity.entityType,
        entityId: entity.entityId,
        uploadedBy: 'u',
        metadata: { key: 'value' },
      });

      expect(doc.filePath).toContain(entity.dir);
    }
  });

  it('rejects missing files and invalid document types', async () => {
    const { service } = loadService(uploadDir);

    await expect(service.saveDocument(null, {})).rejects.toThrow('No file provided');

    await expect(
      service.saveDocument(
        {
          originalname: 'file.pdf',
          mimetype: 'application/pdf',
          size: 1,
          buffer: Buffer.from('data'),
        },
        {
          name: 'Bad',
          documentType: 'INVALID',
          entityType: 'Shipment',
          entityId: 's3',
          uploadedBy: 'u3',
        }
      )
    ).rejects.toThrow('Invalid document type');
  });

  it('rejects files without buffers or valid paths', async () => {
    const { service, DocumentType } = loadService(uploadDir);

    await expect(
      service.saveDocument(
        {
          originalname: 'file.pdf',
          mimetype: 'application/pdf',
          size: 1,
        },
        {
          name: 'NoPath',
          documentType: DocumentType.SHIPPING_INVOICE,
          entityType: 'Shipment',
          entityId: 's4',
          uploadedBy: 'u4',
        }
      )
    ).rejects.toThrow('File has no buffer');
  });

  it('handles missing file after write', async () => {
    const { service, DocumentType } = loadService(uploadDir);
    const originalExists = fs.existsSync;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(0);
    const crypto = require('crypto');
    const cryptoSpy = jest
      .spyOn(crypto, 'randomBytes')
      .mockReturnValue(Buffer.from('0101010101010101', 'hex'));

    const file = {
      originalname: 'missing.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('data'),
    };
    const expectedPath = path.join(
      uploadDir,
      'shipments',
      's11',
      '0-0101010101010101.pdf'
    );

    jest.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (p === expectedPath) {
        return false;
      }
      return originalExists(p);
    });

    await expect(
      service.saveDocument(file, {
        name: 'Missing',
        documentType: DocumentType.SHIPPING_INVOICE,
        entityType: 'Shipment',
        entityId: 's11',
        uploadedBy: 'u11',
      })
    ).rejects.toThrow('File verification failed');

    fs.existsSync.mockRestore();
    cryptoSpy.mockRestore();
    nowSpy.mockRestore();
  });

  it('deletes documents when authorized', async () => {
    const { service, Document } = loadService(uploadDir);
    const relPath = path.join('shipments', 's5', 'file.pdf');
    const fullPath = path.join(uploadDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'data');

    Document.findById.mockResolvedValue({
      _id: 'd1',
      filePath: relPath,
      uploadedBy: { toString: () => 'u5' },
    });
    Document.findByIdAndDelete.mockResolvedValue({});

    const result = await service.deleteDocument('d1', 'u5');

    expect(result.success).toBe(true);
    expect(fs.existsSync(fullPath)).toBe(false);
  });

  it('throws when deleting missing documents', async () => {
    const { service, Document } = loadService(uploadDir);

    Document.findById.mockResolvedValue(null);

    await expect(service.deleteDocument('missing', 'u1')).rejects.toThrow('Document not found');
  });

  it('blocks deletion when user lacks permission', async () => {
    const { service, Document, User } = loadService(uploadDir);

    Document.findById.mockResolvedValue({
      _id: 'd2',
      filePath: 'shipments/s2/file.pdf',
      uploadedBy: { toString: () => 'u6' },
    });
    User.findById.mockResolvedValue({ role: 'Merchant' });

    await expect(service.deleteDocument('d2', 'u7')).rejects.toThrow('Not authorized');
  });

  it('blocks deletion when user is missing', async () => {
    const { service, Document, User } = loadService(uploadDir);

    Document.findById.mockResolvedValue({
      _id: 'd7',
      filePath: 'shipments/s2/file.pdf',
      uploadedBy: { toString: () => 'u9' },
    });
    User.findById.mockResolvedValue(null);

    await expect(service.deleteDocument('d7', 'u8')).rejects.toThrow('Not authorized');
  });

  it('returns file buffers for stored documents', async () => {
    const { service, Document } = loadService(uploadDir);
    const relPath = path.join('shipments', 's6', 'file.pdf');
    const fullPath = path.join(uploadDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'data');

    Document.findById.mockResolvedValue({
      _id: 'd3',
      filePath: relPath,
      name: 'Doc',
      mimeType: 'application/pdf',
      fileSize: 4,
      originalName: 'file.pdf',
    });

    const result = await service.getDocumentFile('d3', 'u1');

    expect(result.file).toBeInstanceOf(Buffer);
    expect(result.metadata.originalName).toBe('file.pdf');
  });

  it('errors when document file is missing', async () => {
    const { service, Document } = loadService(uploadDir);

    Document.findById.mockResolvedValue({
      _id: 'd4',
      filePath: 'shipments/s7/missing.pdf',
    });

    await expect(service.getDocumentFile('d4', 'u1')).rejects.toThrow(
      'Document file not found on disk'
    );
  });

  it('errors when document is missing during file retrieval', async () => {
    const { service, Document } = loadService(uploadDir);
    Document.findById.mockResolvedValue(null);

    await expect(service.getDocumentFile('missing', 'u1')).rejects.toThrow('Document not found');
  });

  it('errors when document is missing during lookup', async () => {
    const { service, Document } = loadService(uploadDir);

    Document.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => Promise.resolve(null).then(resolve),
    });

    await expect(service.getDocumentById('missing')).rejects.toThrow('Document not found');
  });

  it('errors when verifying missing documents', async () => {
    const { service, Document } = loadService(uploadDir);
    Document.findById.mockResolvedValue(null);

    await expect(service.verifyDocument('missing', 'u1')).rejects.toThrow('Document not found');
  });

  it('verifies documents and updates metadata', async () => {
    const { service, DocumentType, Document, User } = loadService(uploadDir);
    const doc = {
      _id: 'd5',
      uploadedBy: { toString: () => 'u8' },
      save: jest.fn().mockResolvedValue(true),
    };
    Document.findById.mockResolvedValue(doc);
    User.findById.mockResolvedValue({ role: 'Admin' });

    await service.verifyDocument('d5', 'u8', 'ok');

    expect(doc.isVerified).toBe(true);
    expect(doc.verificationNotes).toBe('ok');

    await service.updateDocumentMetadata('d5', 'u8', {
      name: 'New Name',
      documentType: DocumentType.DRIVER_LICENSE,
      metadata: { foo: 'bar' },
      ignoredField: 'skip',
    });

    expect(doc.name).toBe('New Name');
    expect(doc.metadata).toBeInstanceOf(Map);
  });

  it('allows admin updates when uploader differs', async () => {
    const { service, Document, User } = loadService(uploadDir);
    const doc = {
      _id: 'd8',
      uploadedBy: { toString: () => 'u12' },
      save: jest.fn().mockResolvedValue(true),
    };
    Document.findById.mockResolvedValue(doc);
    User.findById.mockResolvedValue({ role: 'Admin' });

    await service.updateDocumentMetadata('d8', 'u13', { name: 'Admin Update' });

    expect(doc.name).toBe('Admin Update');
  });

  it('rejects updates when document is missing', async () => {
    const { service, Document } = loadService(uploadDir);
    Document.findById.mockResolvedValue(null);

    await expect(service.updateDocumentMetadata('missing', 'u1', {})).rejects.toThrow(
      'Document not found'
    );
  });
});
