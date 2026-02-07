const { Document } = require('../../src/models/Document');

describe('Document model methods', () => {
  it('verifies document with notes', async () => {
    const doc = new Document({
      name: 'Doc',
      filePath: 'path',
      documentType: 'OTHER',
      uploadedBy: '000000000000000000000001',
      entityType: 'Shipment',
      entityId: '000000000000000000000002',
    });
    doc.save = jest.fn().mockResolvedValue(doc);

    await doc.verify('000000000000000000000003', 'ok');

    expect(doc.isVerified).toBe(true);
    expect(doc.verificationNotes).toBe('ok');
    expect(doc.verifiedBy.toString()).toBe('000000000000000000000003');
  });

  it('verifies document without notes', async () => {
    const doc = new Document({
      name: 'Doc',
      filePath: 'path',
      documentType: 'OTHER',
      uploadedBy: '000000000000000000000001',
      entityType: 'Shipment',
      entityId: '000000000000000000000002',
    });
    doc.save = jest.fn().mockResolvedValue(doc);

    await doc.verify('000000000000000000000003');

    expect(doc.isVerified).toBe(true);
    expect(doc.verificationNotes).toBeUndefined();
  });

  it('deactivates document', async () => {
    const doc = new Document({
      name: 'Doc',
      filePath: 'path',
      documentType: 'OTHER',
      uploadedBy: '000000000000000000000001',
      entityType: 'Shipment',
      entityId: '000000000000000000000002',
    });
    doc.save = jest.fn().mockResolvedValue(doc);

    await doc.deactivate();

    expect(doc.isActive).toBe(false);
  });
});
