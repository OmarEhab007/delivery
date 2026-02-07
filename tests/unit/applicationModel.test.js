const { Application, ApplicationStatus } = require('../../src/models/Application');

describe('Application model methods', () => {
  const baseFields = {
    shipmentId: '000000000000000000000001',
    ownerId: '000000000000000000000002',
    assignedTruckId: '000000000000000000000003',
    driverId: '000000000000000000000004',
    bidDetails: { price: 100 },
  };

  it('accepts application and adds status history', async () => {
    const app = new Application({ ...baseFields });
    app.save = jest.fn().mockResolvedValue(app);

    await app.accept('000000000000000000000005');

    expect(app.status).toBe(ApplicationStatus.ACCEPTED);
    expect(app.statusHistory[0].status).toBe(ApplicationStatus.ACCEPTED);
  });

  it('rejects application with reason', async () => {
    const app = new Application({ ...baseFields });
    app.save = jest.fn().mockResolvedValue(app);

    await app.reject('not eligible', '000000000000000000000006');

    expect(app.status).toBe(ApplicationStatus.REJECTED);
    expect(app.rejectionReason).toBe('not eligible');
  });

  it('cancels application', async () => {
    const app = new Application({ ...baseFields });
    app.save = jest.fn().mockResolvedValue(app);

    await app.cancel('000000000000000000000007');

    expect(app.status).toBe(ApplicationStatus.CANCELLED);
    expect(app.statusHistory[0].status).toBe(ApplicationStatus.CANCELLED);
  });

  it('adds document and marks required document as provided', async () => {
    const app = new Application({
      ...baseFields,
      requiredDocuments: [{ documentType: 'DOC', isProvided: false }],
    });
    app.save = jest.fn().mockResolvedValue(app);

    const docId = new (require('mongoose').Types.ObjectId)();
    const doc = { _id: docId, name: 'Doc', documentType: 'DOC' };
    await app.addDocument(doc);

    expect(app.documents).toHaveLength(1);
    expect(app.requiredDocuments[0].isProvided).toBe(true);
  });

  it('skips adding duplicate documents', async () => {
    const docId = new (require('mongoose').Types.ObjectId)();
    const app = new Application({
      ...baseFields,
      documents: [{ documentId: docId }],
    });
    app.save = jest.fn().mockResolvedValue(app);

    const doc = { _id: docId, name: 'Doc', documentType: 'DOC' };
    const result = await app.addDocument(doc);

    expect(result).toBe(app);
    expect(app.documents).toHaveLength(1);
  });

  it('rejects other applications via static method', async () => {
    const updateSpy = jest.spyOn(Application, 'updateMany').mockResolvedValue({ modifiedCount: 2 });

    await Application.rejectOthers('s1', 'a1', 'u1');

    expect(updateSpy).toHaveBeenCalledWith(
      {
        shipmentId: 's1',
        _id: { $ne: 'a1' },
        status: ApplicationStatus.PENDING,
      },
      expect.objectContaining({ status: ApplicationStatus.REJECTED })
    );
  });
});
