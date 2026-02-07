jest.mock('../../src/models/Application', () => ({
  Application: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
  },
  ApplicationStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
  },
}));

const { Application, ApplicationStatus } = require('../../src/models/Application');
const controller = require('../../src/controllers/admin/adminApplicationController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

describe('adminApplicationController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets all applications with filters', async () => {
    Application.find.mockReturnValue(makeQuery([{ id: 'a1' }]));
    Application.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getAllApplications(
      {
        query: { status: 'PENDING', ownerId: 'o1', startDate: '2024-01-01', endDate: '2024-01-31' },
      },
      res,
      jest.fn()
    );

    const query = Application.find.mock.calls[0][0];
    expect(query.status).toBe('PENDING');
    expect(query.ownerId).toBe('o1');
    expect(query.createdAt.$gte).toBeInstanceOf(Date);
    expect(query.createdAt.$lte).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns error when application not found', async () => {
    Application.findById.mockReturnValue(makeQuery(null));
    const next = jest.fn();

    await controller.getApplicationById({ params: { id: 'a1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns application by id', async () => {
    Application.findById.mockReturnValue(makeQuery({ id: 'a1' }));
    const res = makeRes();

    await controller.getApplicationById({ params: { id: 'a1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects status updates without status or invalid status', async () => {
    const next = jest.fn();

    await controller.updateApplicationStatus(
      { params: { id: 'a1' }, body: {}, user: { _id: 'admin' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();

    const nextInvalid = jest.fn();
    await controller.updateApplicationStatus(
      { params: { id: 'a1' }, body: { status: 'BAD' }, user: { _id: 'admin' } },
      makeRes(),
      nextInvalid
    );
    expect(nextInvalid).toHaveBeenCalled();
  });

  it('updates application status and history', async () => {
    const application = { statusHistory: [], save: jest.fn() };
    Application.findById.mockResolvedValue(application);
    const res = makeRes();

    await controller.updateApplicationStatus(
      { params: { id: 'a1' }, body: { status: ApplicationStatus.ACCEPTED, adminNotes: 'ok' }, user: { _id: 'admin' } },
      res,
      jest.fn()
    );

    expect(application.status).toBe(ApplicationStatus.ACCEPTED);
    expect(application.statusHistory).toHaveLength(1);
    expect(application.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects status update when application missing', async () => {
    Application.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateApplicationStatus(
      { params: { id: 'a1' }, body: { status: ApplicationStatus.ACCEPTED }, user: { _id: 'admin' } },
      makeRes(),
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('deletes application', async () => {
    const application = { deleteOne: jest.fn() };
    Application.findById.mockResolvedValue(application);
    const res = makeRes();

    await controller.deleteApplication({ params: { id: 'a1' } }, res, jest.fn());
    expect(application.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects delete when application missing', async () => {
    Application.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.deleteApplication({ params: { id: 'a1' } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns application stats', async () => {
    Application.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(4);
    Application.find.mockReturnValue(makeQuery([{ id: 'a1' }]));
    const res = makeRes();

    await controller.getApplicationStats({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
