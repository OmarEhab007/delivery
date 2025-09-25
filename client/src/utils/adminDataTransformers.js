export const normalizeShipment = (shipment) => {
  if (!shipment) {
    return shipment;
  }

  const origin = shipment.origin || shipment.pickupLocation || {};
  const destination = shipment.destination || shipment.deliveryLocation || {};
  const cargoDetails = shipment.cargoDetails || shipment.cargo || {};
  const status = (shipment.status || '').toString().toUpperCase();

  return {
    ...shipment,
    origin,
    destination,
    cargoDetails,
    status,
    merchantName: shipment.merchantId?.name || shipment.merchantName || 'N/A',
    weight: cargoDetails.weight ?? shipment.weight ?? null,
    volume: cargoDetails.volume ?? shipment.volume ?? null,
    pricingType: shipment.pricingType || shipment.priceType || 'BIDDING',
    timeline: shipment.timeline || shipment.timelineEntries || [],
    approvalState: shipment.approval?.state || shipment.approvalState || 'PENDING',
    approvalReviewedBy: shipment.approval?.reviewedBy,
    approvalReviewedAt: shipment.approval?.reviewedAt,
  };
};

const truckStatusAliases = {
  AVAILABLE: 'AVAILABLE',
  Available: 'AVAILABLE',
  available: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  Unavailable: 'UNAVAILABLE',
  unavailable: 'UNAVAILABLE',
  IN_SERVICE: 'IN_SERVICE',
  InService: 'IN_SERVICE',
  inService: 'IN_SERVICE',
  'IN SERVICE': 'IN_SERVICE',
  IN_MAINTENANCE: 'IN_MAINTENANCE',
  InMaintenance: 'IN_MAINTENANCE',
  inMaintenance: 'IN_MAINTENANCE',
  INMAINTENANCE: 'IN_MAINTENANCE',
  'IN MAINTENANCE': 'IN_MAINTENANCE',
  ON_ROUTE: 'ON_ROUTE',
  OnRoute: 'ON_ROUTE',
  onRoute: 'ON_ROUTE',
  ONROUTE: 'ON_ROUTE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  OutOfService: 'OUT_OF_SERVICE',
  outOfService: 'OUT_OF_SERVICE',
  INACTIVE: 'INACTIVE',
};

export const normalizeTruckStatus = (status) => {
  if (!status) {
    return 'UNKNOWN';
  }
  const alias = truckStatusAliases[status];
  if (alias) {
    return alias;
  }
  return status.toString().toUpperCase().replace(/[-\s]/g, '_');
};

export const normalizeTruck = (truck) => {
  if (!truck) {
    return truck;
  }

  const plateNumber =
    truck.plateNumber ||
    truck.licensePlate ||
    truck.registrationNumber ||
    truck.registrationInfo?.registrationNumber ||
    'N/A';

  const truckType = truck.truckType || truck.type || truck.vehicleType || 'Unknown';
  const status = normalizeTruckStatus(truck.status);
  const owner = truck.ownerId || truck.owner || {};
  const driver = truck.driverId || truck.driver || {};

  return {
    ...truck,
    plateNumber,
    truckType,
    status,
    ownerName: owner?.name || truck.ownerName || 'Unassigned',
    ownerEmail: owner?.email || truck.ownerEmail || null,
    driverName: driver?.name || truck.driverName || null,
    driverEmail: driver?.email || truck.driverEmail || null,
  };
};

const applicationStatusAliases = {
  APPROVED: 'ACCEPTED',
  approved: 'ACCEPTED',
  Accepted: 'ACCEPTED',
  ACCEPTED: 'ACCEPTED',
  rejected: 'REJECTED',
  Rejected: 'REJECTED',
  REJECTED: 'REJECTED',
  cancelled: 'CANCELLED',
  Cancelled: 'CANCELLED',
  CANCELLED: 'CANCELLED',
  pending: 'PENDING',
  Pending: 'PENDING',
  PENDING: 'PENDING',
};

export const normalizeApplicationStatus = (status) => {
  if (!status) {
    return 'PENDING';
  }
  return applicationStatusAliases[status] || status.toString().toUpperCase();
};

export const normalizeApplication = (application) => {
  if (!application) {
    return application;
  }

  const owner = application.ownerId || application.truckOwnerId || {};
  const truck = application.assignedTruckId || application.truck || {};
  const driver = application.driverId || {};
  const shipment = application.shipmentId || {};
  const bidDetails = application.bidDetails || {};
  const status = normalizeApplicationStatus(application.status);

  return {
    ...application,
    owner,
    truck,
    driver,
    shipment,
    bidDetails,
    status,
    ownerName: owner?.name || application.name || 'N/A',
    ownerEmail: owner?.email || application.email || 'N/A',
    ownerPhone: owner?.phone || application.phone || 'N/A',
    truckPlate: truck?.plateNumber || truck?.licensePlate || truck?.registrationNumber || 'N/A',
    driverName: driver?.name || application.driverName || 'N/A',
    driverPhone: driver?.phone || application.driverPhone || 'N/A',
    shipmentCode: shipment?.code || shipment?._id || application.shipmentCode || 'N/A',
    bidPrice: bidDetails?.price ?? null,
    bidCurrency: bidDetails?.currency || 'USD',
  };
};

export const normalizeRegistrationRequest = (request) => {
  if (!request) {
    return request;
  }

  const state = (request.state || '').toString().toUpperCase();
  const submittedBy = request.submittedBy || {};

  return {
    ...request,
    state,
    submittedBy,
    submittedByName: submittedBy.name || '—',
    submittedByEmail: submittedBy.email || '—',
    submittedByRole: submittedBy.role || '—',
    roleLabel: request.role || '—',
    payload: request.payload || {},
  };
};

export const genericTextMatch = (candidate, term) => {
  if (!term) {
    return true;
  }
  const value = candidate ?? '';
  if (value === null || value === undefined) {
    return false;
  }
  return value.toString().toLowerCase().includes(term.toLowerCase());
};
