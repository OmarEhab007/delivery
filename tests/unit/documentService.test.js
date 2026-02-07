const mockS3 = {
  upload: jest.fn(),
  getObject: jest.fn(),
  deleteObject: jest.fn(),
  listObjectsV2: jest.fn(),
  getSignedUrl: jest.fn(),
};

jest.mock(
  'aws-sdk',
  () => ({
    S3: jest.fn(() => mockS3),
  }),
  { virtual: true }
);

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const logger = require('../../src/utils/logger');

const resetMocks = () => {
  Object.values(mockS3).forEach((fn) => fn.mockReset());
  logger.info.mockClear();
  logger.error.mockClear();
  process.env.AWS_S3_BUCKET = 'test-bucket';
};

describe('documentService', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('uploads documents and returns metadata', async () => {
    const { uploadDocument } = require('../../src/services/document/documentService');
    mockS3.upload.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://s3.test/doc',
        Key: 'shipments/s1/invoice/file.pdf',
      }),
    });

    const result = await uploadDocument(
      Buffer.from('data'),
      'file.pdf',
      'application/pdf',
      'INVOICE',
      's1',
      'u1'
    );

    expect(mockS3.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'test-bucket',
        Key: expect.stringContaining('shipments/s1/invoice/'),
        ContentType: 'application/pdf',
        Metadata: {
          'shipment-id': 's1',
          'document-type': 'INVOICE',
          'uploaded-by': 'u1',
        },
      })
    );
    expect(result).toMatchObject({
      filename: 'file.pdf',
      key: 'shipments/s1/invoice/file.pdf',
      url: 'https://s3.test/doc',
      contentType: 'application/pdf',
      documentType: 'INVOICE',
      shipmentId: 's1',
      uploadedBy: 'u1',
    });
  });

  it('rethrows errors when upload fails', async () => {
    const { uploadDocument } = require('../../src/services/document/documentService');
    mockS3.upload.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('upload failed')),
    });

    await expect(
      uploadDocument(Buffer.from('data'), 'file.pdf', 'application/pdf', 'INVOICE', 's1', 'u1')
    ).rejects.toThrow('upload failed');
  });

  it('retrieves documents from S3', async () => {
    const { getDocument } = require('../../src/services/document/documentService');
    const lastModified = new Date();
    mockS3.getObject.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('data'),
        ContentType: 'application/pdf',
        Metadata: { foo: 'bar' },
        LastModified: lastModified,
      }),
    });

    const result = await getDocument('key');

    expect(result).toEqual({
      data: Buffer.from('data'),
      contentType: 'application/pdf',
      metadata: { foo: 'bar' },
      lastModified,
    });
  });

  it('rethrows errors when getDocument fails', async () => {
    const { getDocument } = require('../../src/services/document/documentService');
    mockS3.getObject.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('get failed')),
    });

    await expect(getDocument('key')).rejects.toThrow('get failed');
  });

  it('generates presigned URLs', () => {
    const { getPresignedUrl } = require('../../src/services/document/documentService');
    mockS3.getSignedUrl.mockReturnValue('signed-url');

    const url = getPresignedUrl('key', 120);

    expect(url).toBe('signed-url');
    expect(mockS3.getSignedUrl).toHaveBeenCalledWith(
      'getObject',
      expect.objectContaining({ Key: 'key', Expires: 120 })
    );
  });

  it('deletes documents from S3', async () => {
    const { deleteDocument } = require('../../src/services/document/documentService');
    mockS3.deleteObject.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ ok: true }),
    });

    const result = await deleteDocument('key');

    expect(result).toEqual({ ok: true });
  });

  it('lists shipment documents with presigned urls', async () => {
    const { listShipmentDocuments } = require('../../src/services/document/documentService');
    const lastModified = new Date();

    mockS3.listObjectsV2.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: [{ Key: 'shipments/s1/doc.pdf', Size: 10, LastModified: lastModified }],
      }),
    });
    mockS3.getSignedUrl.mockReturnValue('signed-url');

    const result = await listShipmentDocuments('s1');

    expect(result).toEqual([
      { key: 'shipments/s1/doc.pdf', size: 10, lastModified, url: 'signed-url' },
    ]);
  });

  it('validates document metadata', () => {
    const { validateDocument } = require('../../src/services/document/documentService');

    expect(validateDocument('file.pdf', 'application/pdf', 1024, 'INVOICE')).toBe(true);
    expect(validateDocument('file.pdf', 'application/pdf', 1024, 'INVALID')).toBe(false);
    expect(validateDocument('file.pdf', 'application/pdf', 20 * 1024 * 1024, 'INVOICE')).toBe(
      false
    );
    expect(validateDocument('file.pdf', 'text/plain', 1024, 'INVOICE')).toBe(false);
  });
});
