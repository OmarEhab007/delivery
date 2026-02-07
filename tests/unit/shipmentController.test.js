jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../src/models/Shipment', () => ({
  Shipment: {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  ShipmentStatus: {
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    REQUESTED: 'REQUESTED',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    DELIVERED: 'DELIVERED',
    IN_TRANSIT: 'IN_TRANSIT',
    LOADING: 'LOADING',
    UNLOADING: 'UNLOADING',
  },
  ShipmentApprovalState: {
    PENDING: 'PENDING',
  },
}));

jest.mock('../../src/models/Truck', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/Document', () => {
  const Document = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = 'doc-id';
    }
    this.save = jest.fn().mockResolvedValue(this);
  });
  return {
    Document,
    DocumentType: {
      COMMERCIAL_INVOICE: 'COMMERCIAL_INVOICE',
      SHIPPING_INVOICE: 'SHIPPING_INVOICE',
      PACKING_LIST: 'PACKING_LIST',
      BILL_OF_LADING: 'BILL_OF_LADING',
      WAYBILL: 'WAYBILL',
      CERTIFICATE_OF_ORIGIN: 'CERTIFICATE_OF_ORIGIN',
      ACID_PROOF: 'ACID_PROOF',
      INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
      PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
    },
  };
});

jest.mock('../../src/utils/metricScheduler', () => ({
  updateShipmentStatusMetrics: jest.fn(),
}));

jest.mock('../../src/services/tracking/trackingService', () => ({
  getShipmentTracking: jest.fn(),
  getShipmentTrackingHistory: jest.fn(),
  calculateETA: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
}));

const { validationResult } = require('express-validator');
const { Shipment, ShipmentStatus } = require('../../src/models/Shipment');
const Truck = require('../../src/models/Truck');
const { Document, DocumentType } = require('../../src/models/Document');
const metricScheduler = require('../../src/utils/metricScheduler');
const trackingService = require('../../src/services/tracking/trackingService');
const controller = require('../../src/controllers/shipment/shipmentController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeQuery = (result) => {
  const query = Promise.resolve(result);
  query.populate = jest.fn().mockReturnValue(query);
  query.skip = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.sort = jest.fn().mockReturnValue(query);
  return query;
};

describe('shipmentController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    Document.mockImplementation(function (data) {
      Object.assign(this, data);
      if (!this._id) {
        this._id = 'doc-id';
      }
      this.save = jest.fn().mockResolvedValue(this);
    });
  });

  it('returns validation errors on create', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.createShipment({ body: {}, user: { id: 'u1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates shipment with default pricing type', async () => {
    Shipment.create.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await controller.createShipment(
      { body: { origin: 'A', destination: 'B' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(Shipment.create).toHaveBeenCalledWith(
      expect.objectContaining({ pricingType: 'BIDDING', status: ShipmentStatus.PENDING_APPROVAL })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates shipment without overriding pricing type', async () => {
    Shipment.create.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await controller.createShipment(
      { body: { origin: 'A', destination: 'B', pricingType: 'FIXED' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(Shipment.create).toHaveBeenCalledWith(
      expect.objectContaining({ pricingType: 'FIXED' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('handles metric update errors on create', async () => {
    Shipment.create.mockResolvedValue({ _id: 's1' });
    metricScheduler.updateShipmentStatusMetrics.mockImplementation(() => {
      throw new Error('metrics');
    });
    const res = makeRes();

    await controller.createShipment(
      { body: { origin: 'A', destination: 'B' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns error when shipment not found', async () => {
    Shipment.findById.mockReturnValue(makeQuery(null));
    const next = jest.fn();

    await controller.getShipment({ params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks merchant access to other shipments', async () => {
    Shipment.findById.mockReturnValue(
      makeQuery({ merchantId: { toString: () => 'other' }, assignedTruckId: 't1', assignedDriverId: { toString: () => 'd1' } })
    );
    const next = jest.fn();

    await controller.getShipment({ params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks truck owner access when truck is not owned', async () => {
    Shipment.findById.mockReturnValue(
      makeQuery({ merchantId: { toString: () => 'u1' }, assignedTruckId: 't1', assignedDriverId: { toString: () => 'd1' } })
    );
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.getShipment({ params: { id: 's1' }, user: { role: 'TruckOwner', id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks driver access when not assigned', async () => {
    Shipment.findById.mockReturnValue(
      makeQuery({ merchantId: { toString: () => 'u1' }, assignedTruckId: 't1', assignedDriverId: { toString: () => 'd1' } })
    );
    const next = jest.fn();

    await controller.getShipment({ params: { id: 's1' }, user: { role: 'Driver', id: 'u2' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('updates shipment with allowed fields', async () => {
    const shipment = { merchantId: { toString: () => 'u1' }, status: ShipmentStatus.PENDING_APPROVAL };
    Shipment.findById.mockResolvedValue(shipment);
    Shipment.findByIdAndUpdate.mockResolvedValue({ _id: 's1' });
    const res = makeRes();

    await controller.updateShipment({ params: { id: 's1' }, body: { notes: 'n' }, user: { id: 'u1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns validation errors on update', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.updateShipment(
      { params: { id: 's1' }, body: {}, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects update when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateShipment(
      { params: { id: 's1' }, body: {}, user: { id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects update when merchant does not own shipment', async () => {
    const shipment = { merchantId: { toString: () => 'other' }, status: ShipmentStatus.REQUESTED };
    Shipment.findById.mockResolvedValue(shipment);
    const next = jest.fn();

    await controller.updateShipment(
      { params: { id: 's1' }, body: {}, user: { id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects shipment update when status is invalid', async () => {
    const shipment = { merchantId: { toString: () => 'u1' }, status: 'DELIVERED' };
    Shipment.findById.mockResolvedValue(shipment);
    const next = jest.fn();

    await controller.updateShipment({ params: { id: 's1' }, body: {}, user: { id: 'u1' } }, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('cancels shipment and adds timeline', async () => {
    const shipment = {
      merchantId: { toString: () => 'u1' },
      status: ShipmentStatus.REQUESTED,
      addTimelineEntry: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.cancelShipment({ params: { id: 's1' }, body: {}, user: { id: 'u1' } }, res, jest.fn());

    expect(shipment.addTimelineEntry).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects cancellation when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.cancelShipment(
      { params: { id: 's1' }, body: {}, user: { id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects cancellation when shipment does not belong to merchant', async () => {
    Shipment.findById.mockResolvedValue({
      merchantId: { toString: () => 'other' },
      status: ShipmentStatus.REQUESTED,
    });
    const next = jest.fn();

    await controller.cancelShipment(
      { params: { id: 's1' }, body: {}, user: { id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects cancellation for invalid status', async () => {
    Shipment.findById.mockResolvedValue({
      merchantId: { toString: () => 'u1' },
      status: ShipmentStatus.DELIVERED,
    });
    const next = jest.fn();

    await controller.cancelShipment(
      { params: { id: 's1' }, body: {}, user: { id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('updates compliance details and sets insurance requirement', async () => {
    const shipment = {
      merchantId: { toString: () => 'u1' },
      compliance: {},
      refreshComplianceStatus: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.updateComplianceDetails(
      { params: { id: 's1' }, body: { incoterm: 'CIF', acidNumber: 'ACID' }, user: { role: 'Merchant', id: 'u1' } },
      res,
      jest.fn()
    );

    expect(shipment.compliance.insuranceRequired).toBe(true);
    expect(shipment.save).toHaveBeenCalled();
  });

  it('rejects compliance update when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.updateComplianceDetails(
      { params: { id: 's1' }, body: { incoterm: 'CIF' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance update when merchant does not own shipment', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.updateComplianceDetails(
      { params: { id: 's1' }, body: { incoterm: 'CIF' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('sets saber status when provided', async () => {
    const shipment = {
      merchantId: { toString: () => 'u1' },
      compliance: {},
      refreshComplianceStatus: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.updateComplianceDetails(
      { params: { id: 's1' }, body: { saberStatus: 'PENDING' }, user: { role: 'Merchant', id: 'u1' } },
      res,
      jest.fn()
    );

    expect(shipment.compliance.saberStatus).toBe('PENDING');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sets gafta request and returns missing certificate', async () => {
    const shipment = {
      merchantId: { toString: () => 'u1' },
      compliance: undefined,
      refreshComplianceStatus: jest.fn(),
      isComplianceReady: jest.fn(() => false),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.updateComplianceDetails(
      {
        params: { id: 's1' },
        body: { gaftaRequested: true, incoterm: 'FOB' },
        user: { role: 'Merchant', id: 'u1' },
      },
      res,
      jest.fn()
    );

    expect(shipment.compliance.gaftaRequested).toBe(true);
    expect(shipment.compliance.insuranceRequired).toBe(false);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns compliance summary with all documents present', async () => {
    const shipment = {
      merchantId: { toString: () => 'u1' },
      compliance: {
        acidNumber: 'ACID',
        aciProofDocumentId: 'doc1',
        brokerId: 'broker',
        gaftaRequested: false,
        insuranceRequired: false,
        documents: {
          commercialInvoiceDocumentId: 'doc2',
          packingListDocumentId: 'doc3',
          billOfLadingDocumentId: 'doc4',
          waybillDocumentId: 'doc5',
          certificateOfOriginDocumentId: 'doc6',
          insuranceDocumentId: 'doc7',
        },
      },
      isComplianceReady: jest.fn(() => true),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.getComplianceStatus(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects compliance status when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.getComplianceStatus(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance status when merchant does not own shipment', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.getComplianceStatus(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance upload when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.uploadComplianceDocument(
      { params: { id: 's1' }, body: {}, user: { id: 'u1', role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance upload when merchant does not own shipment', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.uploadComplianceDocument(
      { params: { id: 's1' }, body: {}, user: { id: 'u1', role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance upload without file', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });
    const next = jest.fn();

    await controller.uploadComplianceDocument(
      { params: { id: 's1' }, body: {}, user: { id: 'u1', role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance upload with invalid type', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });
    const next = jest.fn();

    await controller.uploadComplianceDocument(
      {
        params: { id: 's1' },
        body: { documentType: 'BAD' },
        file: { mimetype: 'application/pdf', originalname: 'file.pdf', size: 1, path: 'file.pdf' },
        user: { id: 'u1', role: 'Merchant' },
      },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects compliance upload with invalid mime type', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });
    const next = jest.fn();

    await controller.uploadComplianceDocument(
      {
        params: { id: 's1' },
        body: { documentType: DocumentType.PACKING_LIST },
        file: { mimetype: 'text/plain', originalname: 'file.txt', size: 1, path: 'file.txt' },
        user: { id: 'u1', role: 'Merchant' },
      },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('uploads compliance document and maps acid proof', async () => {
    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'u1' },
      compliance: {},
      addDocument: jest.fn(),
      isComplianceReady: jest.fn(() => true),
      refreshComplianceStatus: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();
    const next = jest.fn();

    await controller.uploadComplianceDocument(
      {
        params: { id: 's1' },
        body: { documentType: DocumentType.ACID_PROOF },
        file: { mimetype: 'application/pdf', originalname: 'file.pdf', size: 1, path: `${process.cwd()}/uploads/file.pdf` },
        user: { id: 'u1', role: 'Merchant' },
      },
      res,
      next
    );

    if (next.mock.calls.length) {
      throw next.mock.calls[0][0];
    }
    expect(shipment.compliance.aciProofDocumentId).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads compliance document using relative path', async () => {
    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'u1' },
      compliance: {},
      addDocument: jest.fn(),
      isComplianceReady: jest.fn(() => true),
      refreshComplianceStatus: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.uploadComplianceDocument(
      {
        params: { id: 's1' },
        body: { documentType: DocumentType.PACKING_LIST },
        file: {
          mimetype: 'application/pdf',
          originalname: 'file.pdf',
          size: 1,
          relativePath: 'shipments/s1/file.pdf',
          path: 'uploads/file.pdf',
        },
        user: { id: 'u1', role: 'Merchant' },
      },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads payment proof and sets amount', async () => {
    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'u1' },
      paymentDetails: {},
      addDocument: jest.fn(),
      save: jest.fn(),
      addTimelineEntry: jest.fn(),
      status: ShipmentStatus.REQUESTED,
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();
    const next = jest.fn();

    await controller.uploadPaymentProof(
      {
        params: { id: 's1' },
        body: { amount: '200', currency: 'USD' },
        file: { mimetype: 'application/pdf', originalname: 'file.pdf', size: 1, path: `${process.cwd()}/uploads/file.pdf` },
        user: { id: 'u1', role: 'Merchant' },
      },
      res,
      next
    );

    if (next.mock.calls.length) {
      throw next.mock.calls[0][0];
    }
    expect(shipment.paymentDetails.amount).toBe(200);
    expect(shipment.paymentDetails.currency).toBe('USD');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uploads payment proof without amount or currency', async () => {
    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'u1' },
      paymentDetails: null,
      addDocument: jest.fn(),
      save: jest.fn(),
      addTimelineEntry: jest.fn(),
      status: ShipmentStatus.REQUESTED,
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.uploadPaymentProof(
      {
        params: { id: 's1' },
        body: { amount: '' },
        file: {
          mimetype: 'application/pdf',
          originalname: 'file.pdf',
          size: 1,
          relativePath: 'shipments/s1/file.pdf',
          path: 'uploads/file.pdf',
        },
        user: { id: 'u1', role: 'Merchant' },
      },
      res,
      jest.fn()
    );

    expect(shipment.paymentDetails.amount).toBeUndefined();
    expect(shipment.paymentDetails.currency).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns paginated shipments for merchant', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    Shipment.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.getMyShipments(
      { query: { page: '2', limit: '5' }, user: { id: 'u1' } },
      res,
      jest.fn()
    );

    expect(Shipment.find).toHaveBeenCalledWith({ merchantId: 'u1', active: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('searches shipments with filters', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    Shipment.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.searchShipments(
      {
        query: {
          status: ShipmentStatus.REQUESTED,
          origin: 'US',
          destination: 'CA',
          fromDate: '2024-01-01',
          toDate: '2024-02-01',
          page: '1',
          limit: '10',
        },
        user: { id: 'u1' },
      },
      res,
      jest.fn()
    );

    const query = Shipment.find.mock.calls[0][0];
    expect(query).toMatchObject({
      merchantId: 'u1',
      active: true,
      status: ShipmentStatus.REQUESTED,
      'origin.country': 'US',
      'destination.country': 'CA',
    });
    expect(query.createdAt.$gte).toBeInstanceOf(Date);
    expect(query.createdAt.$lte).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('searches shipments with only toDate filter', async () => {
    Shipment.find.mockReturnValue(makeQuery([{ id: 's1' }]));
    Shipment.countDocuments.mockResolvedValue(1);
    const res = makeRes();

    await controller.searchShipments(
      {
        query: { toDate: '2024-02-01' },
        user: { id: 'u1' },
      },
      res,
      jest.fn()
    );

    const query = Shipment.find.mock.calls[0][0];
    expect(query.createdAt.$lte).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns validation errors on timeline entry', async () => {
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'err' }] });
    const res = makeRes();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: {}, user: { role: 'Merchant' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns error when shipment not found for timeline entry', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: { status: ShipmentStatus.CONFIRMED }, user: { role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('blocks timeline updates for pending approval shipments', async () => {
    Shipment.findById.mockResolvedValue({ status: ShipmentStatus.PENDING_APPROVAL });
    const next = jest.fn();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: { status: ShipmentStatus.CONFIRMED }, user: { role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('blocks timeline updates for truck owners without access', async () => {
    Shipment.findById.mockResolvedValue({
      status: ShipmentStatus.REQUESTED,
      assignedTruckId: 't1',
      assignedDriverId: { toString: () => 'd1' },
    });
    Truck.findById.mockResolvedValue({ ownerId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: { status: ShipmentStatus.CONFIRMED }, user: { role: 'TruckOwner', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('blocks timeline updates for drivers without access', async () => {
    Shipment.findById.mockResolvedValue({
      status: ShipmentStatus.REQUESTED,
      assignedTruckId: 't1',
      assignedDriverId: { toString: () => 'd1' },
    });
    const next = jest.fn();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: { status: ShipmentStatus.CONFIRMED }, user: { role: 'Driver', id: 'other' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('adds timeline entry and sets actual delivery date', async () => {
    const shipment = {
      status: ShipmentStatus.IN_TRANSIT,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: { status: ShipmentStatus.DELIVERED }, user: { role: 'Merchant' } },
      res,
      jest.fn()
    );

    expect(shipment.actualDeliveryDate).toBeInstanceOf(Date);
    expect(shipment.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sets actual pickup date on transit status', async () => {
    const shipment = {
      status: ShipmentStatus.CONFIRMED,
      addTimelineEntry: jest.fn(),
      save: jest.fn(),
      actualPickupDate: null,
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.addTimelineEntry(
      { params: { id: 's1' }, body: { status: ShipmentStatus.IN_TRANSIT }, user: { role: 'Merchant' } },
      res,
      jest.fn()
    );

    expect(shipment.actualPickupDate).toBeInstanceOf(Date);
    expect(shipment.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns tracking info even when ETA calculation fails', async () => {
    Shipment.findById.mockResolvedValue({
      merchantId: { toString: () => 'u1' },
      currentLocation: { timestamp: 'now' },
      status: ShipmentStatus.REQUESTED,
    });
    trackingService.calculateETA.mockRejectedValue(new Error('eta fail'));
    const res = makeRes();

    await controller.getTracking(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns tracking history for merchant shipments', async () => {
    Shipment.findById.mockResolvedValue({
      merchantId: { toString: () => 'u1' },
      trackingHistory: [{ id: 1 }],
    });
    const res = makeRes();

    await controller.getTrackingHistory(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('maps shipping invoice to compliance documents', async () => {
    const shipment = {
      _id: 's1',
      merchantId: { toString: () => 'u1' },
      compliance: {},
      addDocument: jest.fn(),
      isComplianceReady: jest.fn(() => true),
      refreshComplianceStatus: jest.fn(),
      save: jest.fn(),
    };
    Shipment.findById.mockResolvedValue(shipment);
    const res = makeRes();

    await controller.uploadComplianceDocument(
      {
        params: { id: 's1' },
        body: { documentType: DocumentType.SHIPPING_INVOICE },
        file: { mimetype: 'application/pdf', originalname: 'file.pdf', size: 1, path: `${process.cwd()}/uploads/file.pdf` },
        user: { id: 'u1', role: 'Merchant' },
      },
      res,
      jest.fn()
    );

    expect(shipment.compliance.documents.commercialInvoiceDocumentId).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects payment proof uploads with invalid file types', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });
    const next = jest.fn();

    await controller.uploadPaymentProof(
      {
        params: { id: 's1' },
        body: { amount: 'not-number' },
        file: { mimetype: 'text/plain', originalname: 'file.txt', size: 1, path: 'file.txt' },
        user: { id: 'u1', role: 'Merchant' },
      },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects payment proof when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.uploadPaymentProof(
      {
        params: { id: 's1' },
        body: {},
        file: { mimetype: 'application/pdf', originalname: 'file.pdf', size: 1, path: 'file.pdf' },
        user: { id: 'u1', role: 'Merchant' },
      },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects payment proof when merchant does not own shipment', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.uploadPaymentProof(
      {
        params: { id: 's1' },
        body: {},
        file: { mimetype: 'application/pdf', originalname: 'file.pdf', size: 1, path: 'file.pdf' },
        user: { id: 'u1', role: 'Merchant' },
      },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects payment proof when no file provided', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });
    const next = jest.fn();

    await controller.uploadPaymentProof(
      { params: { id: 's1' }, body: {}, user: { id: 'u1', role: 'Merchant' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects tracking info when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.getTracking(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects tracking info when merchant does not own shipment', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.getTracking(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects tracking history when shipment not found', async () => {
    Shipment.findById.mockResolvedValue(null);
    const next = jest.fn();

    await controller.getTrackingHistory(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('rejects tracking history when merchant does not own shipment', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'other' } });
    const next = jest.fn();

    await controller.getTrackingHistory(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      makeRes(),
      next
    );

    expect(next).toHaveBeenCalled();
  });

  it('returns empty tracking history when none present', async () => {
    Shipment.findById.mockResolvedValue({ merchantId: { toString: () => 'u1' } });
    const res = makeRes();

    await controller.getTrackingHistory(
      { params: { id: 's1' }, user: { role: 'Merchant', id: 'u1' } },
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.trackingHistory).toEqual([]);
  });
});
