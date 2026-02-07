jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/documentService', () => ({
  getDocumentById: jest.fn(),
  getDocumentFile: jest.fn(),
  getDocumentsByEntity: jest.fn(),
  deleteDocument: jest.fn(),
  updateDocumentMetadata: jest.fn(),
  verifyDocument: jest.fn(),
  saveDocument: jest.fn(),
}));

jest.mock('../../src/models/Document', () => {
  const Document = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Document.findById = jest.fn();

  return {
    Document,
    DocumentType: {
      SHIPPING_INVOICE: 'SHIPPING_INVOICE',
      INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
      DRIVER_LICENSE: 'DRIVER_LICENSE',
      VEHICLE_REGISTRATION: 'VEHICLE_REGISTRATION',
      TECHNICAL_INSPECTION: 'TECHNICAL_INSPECTION',
    },
  };
});

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Application', () => ({
  Application: {
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Truck', () => ({
  findById: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
}));

const fs = require('fs');
const mongoose = require('mongoose');
const documentService = require('../../src/services/documentService');
const { Document, DocumentType } = require('../../src/models/Document');
const { Shipment } = require('../../src/models/Shipment');
const { Application } = require('../../src/models/Application');
const Truck = require('../../src/models/Truck');
const User = require('../../src/models/User');
const controller = require('../../src/controllers/documentController');

const flushPromises = () => new Promise(setImmediate);

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('documentController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Document.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue(this);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires mandatory fields for upload', async () => {
    const next = jest.fn();
    controller.uploadDocument({ body: {}, user: { id: 'u1' } }, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('returns error when upload has no file', async () => {
    Shipment.findById.mockResolvedValue({ _id: 's1' });

    const req = {
      body: { entityType: 'Shipment', entityId: 's1', documentType: 'TYPE', name: 'Doc' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('rejects upload with invalid entity type', async () => {
    const req = {
      body: { entityType: 'Bad', entityId: 'x1', documentType: 'TYPE', name: 'Doc' },
      file: { originalname: 'file.pdf', mimetype: 'application/pdf', size: 1, path: 'file.pdf' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('rejects upload when Shipment model is not initialized', async () => {
    const originalFind = Shipment.findById;
    Shipment.findById = null;

    const req = {
      body: { entityType: 'Shipment', entityId: 's1', documentType: 'TYPE', name: 'Doc' },
      file: { originalname: 'file.pdf', mimetype: 'application/pdf', size: 1, path: 'file.pdf' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
    Shipment.findById = originalFind;
  });

  it('rejects upload when Application model is not initialized', async () => {
    const originalFind = Application.findById;
    Application.findById = null;

    const req = {
      body: { entityType: 'Application', entityId: 'a1', documentType: 'TYPE', name: 'Doc' },
      file: { originalname: 'file.pdf', mimetype: 'application/pdf', size: 1, path: 'file.pdf' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
    Application.findById = originalFind;
  });

  it('rejects upload when User model is not initialized', async () => {
    const originalFind = User.findById;
    User.findById = null;

    const req = {
      body: { entityType: 'User', entityId: 'u2', documentType: 'TYPE', name: 'Doc' },
      file: { originalname: 'file.pdf', mimetype: 'application/pdf', size: 1, path: 'file.pdf' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
    User.findById = originalFind;
  });

  it('uploads document for application', async () => {
    Application.findById.mockResolvedValue({ _id: 'a1' });

    const req = {
      body: {
        entityType: 'Application',
        entityId: 'a1',
        documentType: 'TYPE',
        name: 'Doc',
        metadata: { foo: 'bar' },
      },
      file: {
        originalname: 'file.pdf',
        mimetype: 'application/pdf',
        size: 10,
        path: 'uploads/file.pdf',
        relativePath: 'applications/a1/file.pdf',
      },
      user: { id: 'u1' },
    };
    const res = makeRes();
    const next = jest.fn();

    controller.uploadDocument(req, res, next);
    await flushPromises();

    if (next.mock.calls.length) {
      throw next.mock.calls[0][0];
    }
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads document without metadata and relative path', async () => {
    Shipment.findById.mockResolvedValue({ _id: 's1' });

    const req = {
      body: {
        entityType: 'Shipment',
        entityId: 's1',
        documentType: 'TYPE',
        name: 'Doc',
      },
      file: {
        originalname: 'file.pdf',
        mimetype: 'application/pdf',
        size: 10,
        path: `${process.cwd()}/uploads/file.pdf`,
      },
      user: { id: 'u1' },
    };
    const res = makeRes();
    const next = jest.fn();

    controller.uploadDocument(req, res, next);
    await flushPromises();

    if (next.mock.calls.length) {
      throw next.mock.calls[0][0];
    }
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects upload multiple with invalid entity type', async () => {
    const req = { body: { entityType: 'Bad', entityId: 's1' }, files: [], user: { id: 'u1' } };
    const next = jest.fn();

    controller.uploadMultipleDocuments(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('rejects upload multiple when entityType or entityId is missing', async () => {
    const req = { body: { entityType: 'Shipment' }, files: [], user: { id: 'u1' } };
    const next = jest.fn();

    controller.uploadMultipleDocuments(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('rejects upload multiple with invalid entity id', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = { body: { entityType: 'Shipment', entityId: 'bad' }, files: [], user: { id: 'u1' } };
    const next = jest.fn();

    controller.uploadMultipleDocuments(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('uploads multiple documents with relative paths', async () => {
    const shipment = { addDocument: jest.fn() };
    Shipment.findById.mockResolvedValue(shipment);

    const req = {
      body: {
        entityType: 'Shipment',
        entityId: 's1',
        fileData_doc1: JSON.stringify({ documentType: DocumentType.SHIPPING_INVOICE }),
      },
      files: [
        {
          originalname: 'doc1',
          mimetype: 'application/pdf',
          size: 1,
          relativePath: 'shipments/s1/doc1.pdf',
        },
      ],
      user: { id: 'u1' },
    };
    const res = makeRes();
    const next = jest.fn();

    controller.uploadMultipleDocuments(req, res, next);
    await flushPromises();

    if (next.mock.calls.length) {
      throw next.mock.calls[0][0];
    }
    expect(shipment.addDocument).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads multiple documents for application with metadata and expiry date', async () => {
    const application = { addDocument: jest.fn() };
    Application.findById.mockResolvedValue(application);

    const req = {
      body: {
        entityType: 'Application',
        entityId: 'a1',
        fileData_doc1: JSON.stringify({
          documentType: DocumentType.SHIPPING_INVOICE,
          metadata: { foo: 'bar' },
          expiryDate: '2024-01-01',
        }),
      },
      files: [
        {
          originalname: 'doc1',
          mimetype: 'application/pdf',
          size: 1,
          relativePath: 'applications/a1/doc1.pdf',
        },
      ],
      user: { id: 'u1' },
    };
    const res = makeRes();

    controller.uploadMultipleDocuments(req, res, jest.fn());
    await flushPromises();

    const docArgs = Document.mock.calls[Document.mock.calls.length - 1][0];
    expect(docArgs.metadata).toBeInstanceOf(Map);
    expect(docArgs.expiryDate).toBeInstanceOf(Date);
    expect(application.addDocument).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads multiple documents for truck entity', async () => {
    const truck = { addDocument: jest.fn() };
    Truck.findById.mockResolvedValue(truck);

    const req = {
      body: {
        entityType: 'Truck',
        entityId: 't1',
        fileData_doc1: JSON.stringify({ documentType: DocumentType.SHIPPING_INVOICE }),
      },
      files: [
        {
          originalname: 'doc1',
          mimetype: 'application/pdf',
          size: 1,
          relativePath: 'trucks/t1/doc1.pdf',
        },
      ],
      user: { id: 'u1' },
    };
    const res = makeRes();

    controller.uploadMultipleDocuments(req, res, jest.fn());
    await flushPromises();

    expect(truck.addDocument).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads multiple documents for user entity', async () => {
    const user = { addDocument: jest.fn() };
    User.findById.mockResolvedValue(user);

    const req = {
      body: {
        entityType: 'User',
        entityId: 'u1',
        fileData_doc1: JSON.stringify({ documentType: DocumentType.SHIPPING_INVOICE }),
      },
      files: [
        {
          originalname: 'doc1',
          mimetype: 'application/pdf',
          size: 1,
          relativePath: 'users/u1/doc1.pdf',
        },
      ],
      user: { id: 'u1' },
    };
    const res = makeRes();

    controller.uploadMultipleDocuments(req, res, jest.fn());
    await flushPromises();

    expect(user.addDocument).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects upload multiple with invalid document type', async () => {
    const shipment = { addDocument: jest.fn() };
    Shipment.findById.mockResolvedValue(shipment);

    const req = {
      body: {
        entityType: 'Shipment',
        entityId: 's1',
        fileData_doc1: JSON.stringify({ documentType: 'BAD' }),
      },
      files: [
        {
          originalname: 'doc1',
          mimetype: 'application/pdf',
          size: 1,
          relativePath: 'shipments/s1/doc1.pdf',
        },
      ],
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadMultipleDocuments(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('uploads multiple documents via service when no relativePath', async () => {
    const shipment = { addDocument: jest.fn() };
    Shipment.findById.mockResolvedValue(shipment);
    documentService.saveDocument.mockResolvedValue({ _id: 'doc1' });

    const req = {
      body: {
        entityType: 'Shipment',
        entityId: 's1',
        fileData_doc2: JSON.stringify({ documentType: DocumentType.SHIPPING_INVOICE }),
      },
      files: [
        {
          originalname: 'doc2',
          mimetype: 'application/pdf',
          size: 1,
        },
      ],
      user: { id: 'u1' },
    };
    const res = makeRes();

    controller.uploadMultipleDocuments(req, res, jest.fn());
    await flushPromises();

    expect(documentService.saveDocument).toHaveBeenCalled();
    expect(shipment.addDocument).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('blocks access to document without permissions', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'User',
      entityId: 'other',
      uploadedBy: { id: 'uploader' },
    });

    const req = { params: { id: 'd1' }, user: { id: 'u1', role: 'Merchant' } };
    const next = jest.fn();

    controller.getDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('allows admin to access document', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'User',
      entityId: 'other',
      uploadedBy: { id: 'uploader' },
    });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows uploader to access document', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'User',
      entityId: 'other',
      uploadedBy: { id: 'u1' },
    });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'Merchant' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows uploader access when uploadedBy is a string', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'User',
      entityId: 'other',
      uploadedBy: 'u1',
    });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'Merchant' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows user to access own document entity', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'User',
      entityId: 'u1',
      uploadedBy: { id: 'uploader' },
    });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'Merchant' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows truckOwner access to shipment document via truckOwner field', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'Shipment',
      entityId: 's1',
      uploadedBy: { id: 'uploader' },
    });
    Shipment.findById.mockResolvedValue({ truckOwner: { toString: () => 'u1' } });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'TruckOwner' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when download file missing on disk', async () => {
    Document.findById.mockResolvedValue({ _id: 'd1', filePath: 'missing.pdf' });
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const req = { params: { id: 'd1' }, user: { id: 'u1' } };
    const next = jest.fn();

    controller.downloadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid entity type lookup', async () => {
    const req = { params: { entityType: 'Bad', entityId: 's1' } };
    const next = jest.fn();

    controller.getDocumentsByEntity(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('returns documents for valid entity', async () => {
    Shipment.findById.mockResolvedValue({ _id: 's1' });
    documentService.getDocumentsByEntity.mockResolvedValue([{ id: 'doc1' }]);
    const res = makeRes();
    const next = jest.fn();

    controller.getDocumentsByEntity(
      { params: { entityType: 'Shipment', entityId: 's1' } },
      res,
      next
    );
    await flushPromises();

    if (next.mock.calls.length) {
      throw next.mock.calls[0][0];
    }
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects documents lookup with invalid entity id', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    const next = jest.fn();

    controller.getDocumentsByEntity(
      { params: { entityType: 'Shipment', entityId: 'bad' } },
      makeRes(),
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('blocks verify when user lacks permission', async () => {
    const req = { params: { id: 'd1' }, body: {}, user: { id: 'u1', role: 'Merchant' } };
    const next = jest.fn();

    controller.verifyDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('fails download when document not found', async () => {
    Document.findById.mockResolvedValue(null);

    const req = { params: { id: 'missing' }, user: { id: 'u1' } };
    const next = jest.fn();

    controller.downloadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('verifies shipment document and updates shipment records', async () => {
    documentService.verifyDocument.mockResolvedValue({
      _id: 'doc1',
      entityType: 'Shipment',
      entityId: 's1',
      documentType: DocumentType.SHIPPING_INVOICE,
    });
    Shipment.updateOne.mockResolvedValue({});

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: { notes: 'ok' }, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(Shipment.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('verifies truck document and marks verification status', async () => {
    const docId = { toString: () => 'doc1' };
    documentService.verifyDocument.mockResolvedValue({
      _id: docId,
      entityType: 'Truck',
      entityId: 't1',
      documentType: DocumentType.INSURANCE_CERTIFICATE,
    });

    const truck = {
      documents: [
        { documentId: docId, required: true, verified: false },
      ],
      insuranceInfo: { documentId: docId, verified: false },
      registrationInfo: {},
      technicalInspection: {},
      save: jest.fn(),
    };
    Truck.findById.mockResolvedValue(truck);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.verificationStatus).toBe('VERIFIED');
    expect(truck.save).toHaveBeenCalled();
  });

  it('verifies driver license document for user', async () => {
    const docId = { toString: () => 'doc1' };
    documentService.verifyDocument.mockResolvedValue({
      _id: docId,
      entityType: 'User',
      entityId: 'u1',
      documentType: DocumentType.DRIVER_LICENSE,
    });

    const user = {
      role: 'Driver',
      documents: [{ documentId: docId, verified: false }],
      driverLicense: { documentId: docId, verified: false },
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(user);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(user.driverLicense.verified).toBe(true);
    expect(user.verificationStatus).toBe('VERIFIED');
    expect(user.save).toHaveBeenCalled();
  });

  it('verifies application document and updates application records', async () => {
    documentService.verifyDocument.mockResolvedValue({
      _id: 'doc1',
      entityType: 'Application',
      entityId: 'a1',
      documentType: 'TYPE',
    });
    Application.updateOne.mockResolvedValue({});

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(Application.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('verifies user document without driver license update', async () => {
    const docId = { toString: () => 'doc1' };
    documentService.verifyDocument.mockResolvedValue({
      _id: docId,
      entityType: 'User',
      entityId: 'u1',
      documentType: 'OTHER',
    });

    const user = {
      role: 'Merchant',
      documents: [{ documentId: docId, verified: false }],
      driverLicense: { documentId: docId, verified: false },
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(user);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(user.driverLicense.verified).toBe(false);
    expect(user.save).toHaveBeenCalled();
  });

  it('updates shipment document references when metadata changes', async () => {
    documentService.updateDocumentMetadata.mockResolvedValue({
      _id: 'doc1',
      entityType: 'Shipment',
      entityId: 's1',
      name: 'Updated',
      documentType: 'TYPE',
    });

    const res = makeRes();
    controller.updateDocument(
      { params: { id: 'doc1' }, body: { name: 'Updated', documentType: 'TYPE' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(Shipment.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updates truck document references', async () => {
    documentService.updateDocumentMetadata.mockResolvedValue({
      _id: 'doc1',
      entityType: 'Truck',
      entityId: 't1',
      name: 'Updated',
      documentType: 'TYPE',
    });

    const res = makeRes();
    controller.updateDocument(
      { params: { id: 'doc1' }, body: { name: 'Updated', documentType: 'TYPE' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(Truck.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updates user document references', async () => {
    documentService.updateDocumentMetadata.mockResolvedValue({
      _id: 'doc1',
      entityType: 'User',
      entityId: 'u1',
      name: 'Updated',
      documentType: 'TYPE',
    });

    const res = makeRes();
    controller.updateDocument(
      { params: { id: 'doc1' }, body: { name: 'Updated' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(User.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updates user document type references', async () => {
    documentService.updateDocumentMetadata.mockResolvedValue({
      _id: 'doc1',
      entityType: 'User',
      entityId: 'u1',
      name: 'Updated',
      documentType: 'TYPE',
    });

    const res = makeRes();
    controller.updateDocument(
      { params: { id: 'doc1' }, body: { documentType: 'TYPE' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(User.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('skips entity update when no name or type provided', async () => {
    documentService.updateDocumentMetadata.mockResolvedValue({
      _id: 'doc1',
      entityType: 'Shipment',
      entityId: 's1',
    });

    const res = makeRes();
    controller.updateDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(Shipment.updateOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes truck document and clears references', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc1',
      name: 'Doc',
      filePath: 'file.pdf',
      entityType: 'Truck',
      entityId: 't1',
    });
    documentService.deleteDocument.mockResolvedValue({ success: true });

    const truck = {
      documents: [{ documentId: 'doc1' }],
      insuranceInfo: { documentId: 'doc1' },
      registrationInfo: { documentId: 'doc1' },
      technicalInspection: { documentId: 'doc1' },
      save: jest.fn(),
    };
    Truck.findById.mockResolvedValue(truck);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const res = makeRes();
    controller.deleteDocument(
      { params: { id: 'doc1' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('rejects deletion when document not found', async () => {
    Document.findById.mockResolvedValue(null);
    const next = jest.fn();

    controller.deleteDocument({ params: { id: 'missing' }, user: { id: 'u1' } }, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('deletes application document and clears references', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc1',
      name: 'Doc',
      filePath: 'file.pdf',
      entityType: 'Application',
      entityId: 'a1',
    });
    documentService.deleteDocument.mockResolvedValue({ success: true });

    const app = {
      documents: [{ documentId: 'doc1' }],
      save: jest.fn(),
    };
    Application.findById.mockResolvedValue(app);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    const res = makeRes();
    controller.deleteDocument(
      { params: { id: 'doc1' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(app.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('downloads document when file exists', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc1',
      filePath: 'exists.pdf',
    });
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    documentService.getDocumentFile.mockResolvedValue({
      metadata: { mimeType: 'application/pdf', originalName: 'exists.pdf', size: 10 },
      file: Buffer.from('data'),
    });

    const res = makeRes();
    controller.downloadDocument({ params: { id: 'doc1' }, user: { id: 'u1' } }, res, jest.fn());
    await flushPromises();

    expect(res.set).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });

  it('rejects upload when Truck model is not initialized', async () => {
    const originalFind = Truck.findById;
    Truck.findById = null;

    const req = {
      body: { entityType: 'Truck', entityId: 't1', documentType: 'TYPE', name: 'Doc' },
      file: { originalname: 'file.pdf', mimetype: 'application/pdf', size: 1, path: 'file.pdf' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
    Truck.findById = originalFind;
  });

  it('rejects upload when User entity is missing', async () => {
    User.findById.mockResolvedValue(null);
    const req = {
      body: { entityType: 'User', entityId: 'u2', documentType: 'TYPE', name: 'Doc' },
      file: { originalname: 'file.pdf', mimetype: 'application/pdf', size: 1, path: 'file.pdf' },
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadDocument(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('allows merchant to access shipment document', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'Shipment',
      entityId: 's1',
      uploadedBy: { id: 'uploader' },
    });
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'Merchant' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows owner to access application document', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'Application',
      entityId: 'a1',
      uploadedBy: { id: 'uploader' },
    });
    Application.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' } });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'TruckOwner' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows truck owner to access truck document', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'Truck',
      entityId: 't1',
      uploadedBy: { id: 'uploader' },
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' } });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'TruckOwner' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('downloads document when filePath starts with a slash', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc1',
      filePath: '/docs/exists.pdf',
    });
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    documentService.getDocumentFile.mockResolvedValue({
      metadata: { mimeType: 'application/pdf', originalName: 'exists.pdf', size: 10 },
      file: Buffer.from('data'),
    });

    const res = makeRes();
    controller.downloadDocument({ params: { id: 'doc1' }, user: { id: 'u1' } }, res, jest.fn());
    await flushPromises();

    expect(res.set).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });

  it('deletes shipment document and removes references', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc1',
      name: 'Doc',
      filePath: 'file.pdf',
      entityType: 'Shipment',
      entityId: 's1',
    });
    documentService.deleteDocument.mockResolvedValue({ success: true });
    const shipment = {
      documents: [{ documentId: 'doc1' }],
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const res = makeRes();
    controller.deleteDocument(
      { params: { id: 'doc1' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(shipment.documents).toHaveLength(0);
    expect(shipment.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes user document and clears driver license reference', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc1',
      name: 'Doc',
      filePath: 'file.pdf',
      entityType: 'User',
      entityId: 'u1',
    });
    documentService.deleteDocument.mockResolvedValue({ success: true });
    const user = {
      documents: [{ documentId: 'doc1' }],
      driverLicense: { documentId: 'doc1' },
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(user);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const res = makeRes();
    controller.deleteDocument(
      { params: { id: 'doc1' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(user.driverLicense.documentId).toBeNull();
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updates application document references when name and type change', async () => {
    documentService.updateDocumentMetadata.mockResolvedValue({
      _id: 'doc1',
      entityType: 'Application',
      entityId: 'a1',
      name: 'Updated',
      documentType: 'TYPE',
    });

    const res = makeRes();
    controller.updateDocument(
      { params: { id: 'doc1' }, body: { name: 'Updated', documentType: 'TYPE' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(Application.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('verifies truck registration document and updates truck', async () => {
    const docId = { toString: () => 'doc1' };
    documentService.verifyDocument.mockResolvedValue({
      _id: docId,
      entityType: 'Truck',
      entityId: 't1',
      documentType: DocumentType.VEHICLE_REGISTRATION,
    });

    const truck = {
      documents: [
        { documentId: docId, required: true, verified: false },
      ],
      registrationInfo: { documentId: docId, verified: false },
      insuranceInfo: {},
      technicalInspection: {},
      save: jest.fn(),
    };
    Truck.findById.mockResolvedValue(truck);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.registrationInfo.verified).toBe(true);
    expect(truck.verificationStatus).toBe('VERIFIED');
    expect(truck.save).toHaveBeenCalled();
  });

  it('verifies truck technical inspection document and updates truck', async () => {
    const docId = { toString: () => 'doc1' };
    documentService.verifyDocument.mockResolvedValue({
      _id: docId,
      entityType: 'Truck',
      entityId: 't1',
      documentType: DocumentType.TECHNICAL_INSPECTION,
    });

    const truck = {
      documents: [{ documentId: docId, required: true, verified: false }],
      technicalInspection: { documentId: docId, verified: false },
      registrationInfo: {},
      insuranceInfo: {},
      save: jest.fn(),
    };
    Truck.findById.mockResolvedValue(truck);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc1' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.technicalInspection.verified).toBe(true);
    expect(truck.verificationStatus).toBe('VERIFIED');
    expect(truck.save).toHaveBeenCalled();
  });

  it('rejects upload multiple when file metadata is missing', async () => {
    Shipment.findById.mockResolvedValue({ addDocument: jest.fn() });

    const req = {
      body: { entityType: 'Shipment', entityId: 's1' },
      files: [
        {
          originalname: 'doc1',
          mimetype: 'application/pdf',
          size: 1,
          relativePath: 'shipments/s1/doc1.pdf',
        },
      ],
      user: { id: 'u1' },
    };
    const next = jest.fn();

    controller.uploadMultipleDocuments(req, makeRes(), next);
    await flushPromises();

    expect(next).toHaveBeenCalled();
  });

  it('allows owner access to application documents via ownerId', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'Application',
      entityId: 'a1',
      uploadedBy: { id: 'uploader' },
    });
    Application.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' } });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'TruckOwner' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('allows truck owner access to truck documents', async () => {
    documentService.getDocumentById.mockResolvedValue({
      entityType: 'Truck',
      entityId: 't1',
      uploadedBy: { id: 'uploader' },
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'u1' } });

    const res = makeRes();
    controller.getDocument(
      { params: { id: 'd1' }, user: { id: 'u1', role: 'TruckOwner' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes documents even when related entities are missing', async () => {
    const entityTypes = ['Shipment', 'Application', 'Truck', 'User'];
    documentService.deleteDocument.mockResolvedValue({ success: true });
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    for (const type of entityTypes) {
      Document.findById.mockResolvedValue({
        _id: 'doc1',
        name: 'Doc',
        filePath: 'file.pdf',
        entityType: type,
        entityId: 'e1',
      });

      Shipment.findById.mockResolvedValue(null);
      Application.findById.mockResolvedValue(null);
      Truck.findById.mockResolvedValue(null);
      User.findById.mockResolvedValue(null);

      const res = makeRes();
      controller.deleteDocument(
        { params: { id: 'doc1' }, user: { id: 'u1' } },
        res,
        jest.fn()
      );
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith({ success: true });
    }

    fs.existsSync.mockRestore();
  });

  it('deletes truck documents when specific references are absent', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc2',
      name: 'Doc',
      filePath: 'file.pdf',
      entityType: 'Truck',
      entityId: 't2',
    });
    documentService.deleteDocument.mockResolvedValue({ success: true });

    const truck = {
      documents: [{ documentId: 'doc2' }],
      save: jest.fn(),
    };
    Truck.findById.mockResolvedValue(truck);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const res = makeRes();
    controller.deleteDocument(
      { params: { id: 'doc2' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.save).toHaveBeenCalled();
    fs.existsSync.mockRestore();
  });

  it('deletes user documents when driver license reference does not match', async () => {
    Document.findById.mockResolvedValue({
      _id: 'doc3',
      name: 'Doc',
      filePath: 'file.pdf',
      entityType: 'User',
      entityId: 'u2',
    });
    documentService.deleteDocument.mockResolvedValue({ success: true });

    const user = {
      documents: [{ documentId: 'doc3' }],
      driverLicense: { documentId: 'other' },
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(user);
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const res = makeRes();
    controller.deleteDocument(
      { params: { id: 'doc3' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(user.save).toHaveBeenCalled();
    fs.existsSync.mockRestore();
  });

  it('verifies truck documents and updates verification status', async () => {
    documentService.verifyDocument.mockResolvedValue({
      _id: 'doc4',
      entityType: 'Truck',
      entityId: 't3',
      documentType: 'INSURANCE_CERTIFICATE',
    });

    const truck = {
      documents: [
        { documentId: 'doc4', required: true, verified: true },
        { documentId: 'doc5', required: true, verified: true },
      ],
      insuranceInfo: { documentId: 'doc4', verified: false },
      registrationInfo: {},
      technicalInspection: {},
      save: jest.fn(),
    };
    Truck.findById.mockResolvedValue(truck);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc4' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(truck.insuranceInfo.verified).toBe(true);
    expect(truck.verificationStatus).toBe('VERIFIED');
  });

  it('verifies user documents and updates driver license info', async () => {
    documentService.verifyDocument.mockResolvedValue({
      _id: 'doc6',
      entityType: 'User',
      entityId: 'u3',
      documentType: 'DRIVER_LICENSE',
    });

    const user = {
      role: 'Driver',
      documents: [{ documentId: 'doc6', verified: false }],
      driverLicense: { verified: false },
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(user);

    const res = makeRes();
    controller.verifyDocument(
      { params: { id: 'doc6' }, body: {}, user: { id: 'admin', role: 'Admin' } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(user.driverLicense.verified).toBe(true);
    expect(user.verificationStatus).toBe('VERIFIED');
  });

  it('updates entity document references when name and type change', async () => {
    const entities = [
      { entityType: 'Shipment', updateOne: Shipment.updateOne },
      { entityType: 'Application', updateOne: Application.updateOne },
      { entityType: 'Truck', updateOne: Truck.updateOne },
      { entityType: 'User', updateOne: User.updateOne },
    ];

    for (const entity of entities) {
      documentService.updateDocumentMetadata.mockResolvedValue({
        _id: 'doc7',
        name: 'Updated',
        documentType: 'TYPE',
        entityType: entity.entityType,
        entityId: 'e2',
      });

      const res = makeRes();
      controller.updateDocument(
        {
          params: { id: 'doc7' },
          body: { name: 'Updated', documentType: 'TYPE' },
          user: { id: 'u1' },
        },
        res,
        jest.fn()
      );
      await flushPromises();

      expect(entity.updateOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    }
  });
});
