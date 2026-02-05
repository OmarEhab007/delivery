/**
 * API Types for Next.js Frontend
 * Feature: 005-nextjs-frontend
 *
 * These types define the contract between frontend and backend API.
 * Generated from backend model analysis.
 */

// =============================================================================
// AUTH API
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'Merchant' | 'TruckOwner';
  // TruckOwner specific
  companyName?: string;
  companyAddress?: string;
}

export interface RegisterResponse {
  success: true;
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    approvalStatus: ApprovalStatus;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: true;
  accessToken: string;
  refreshToken: string;
}

// =============================================================================
// USER API
// =============================================================================

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
}

export interface UpdateDriverStatusRequest {
  status: DriverStatus;
  reason?: string;
}

export interface UpdateDriverLocationRequest {
  lat: number;
  lng: number;
  address?: string;
}

export interface DriverCheckInRequest {
  truckId: string;
  location: { lat: number; lng: number };
  truckCondition?: string;
  fuelLevel?: number;
  odometer?: number;
  notes?: string;
}

// =============================================================================
// SHIPMENT API
// =============================================================================

export interface CreateShipmentRequest {
  pricingType: PricingType;
  incoterm?: string;

  // Fixed price specific
  fixedPriceDetails?: {
    amount: number;
    currency?: string;
    autoAssign?: boolean;
    requirements?: {
      minTruckCapacity?: number;
      requiredFeatures?: string[];
      maxDeliveryDays?: number;
    };
  };

  origin: {
    address: string;
    coordinates?: { lat: number; lng: number };
    country?: string;
  };

  destination: {
    address: string;
    coordinates?: { lat: number; lng: number };
    country?: string;
  };

  cargoDetails: {
    description: string;
    weight: number;
    volume?: number;
    category?: string;
    hazardous?: boolean;
    specialInstructions?: string;
  };

  estimatedPickupDate?: string;
  estimatedDeliveryDate?: string;
}

export interface GetShipmentsParams {
  page?: number;
  limit?: number;
  status?: ShipmentStatus | ShipmentStatus[];
  pricingType?: PricingType;
  merchantId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'estimatedPickupDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateShipmentStatusRequest {
  status: ShipmentStatus;
  note?: string;
  location?: { lat: number; lng: number; address?: string };
}

export interface ApproveShipmentRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface AssignShipmentRequest {
  truckId: string;
  driverId: string;
}

export interface StartDeliveryRequest {
  startOdometer: number;
  location?: { lat: number; lng: number };
}

export interface CompleteDeliveryRequest {
  endOdometer: number;
  recipient: {
    name: string;
    signature?: string; // Base64
  };
  location?: { lat: number; lng: number };
}

export interface ReportIssueRequest {
  type: IssueType;
  description?: string;
  location?: { lat: number; lng: number };
}

export interface UpdateComplianceRequest {
  acidNumber?: string;
  brokerId?: string;
  gaftaRequested?: boolean;
  insuranceRequired?: boolean;
}

export interface UpdateTrackingRequest {
  lat: number;
  lng: number;
  address?: string;
}

// =============================================================================
// APPLICATION (BID) API
// =============================================================================

export interface CreateApplicationRequest {
  shipmentId: string;
  assignedTruckId: string;
  driverId: string;
  bidDetails: {
    price: number;
    currency?: string;
    notes?: string;
    validUntil?: string;
  };
}

export interface GetApplicationsParams {
  page?: number;
  limit?: number;
  shipmentId?: string;
  ownerId?: string;
  status?: ApplicationStatus | ApplicationStatus[];
}

export interface UpdateApplicationRequest {
  bidDetails?: {
    price?: number;
    notes?: string;
    validUntil?: string;
  };
}

export interface AcceptApplicationRequest {
  // No body needed - action is in the endpoint
}

export interface RejectApplicationRequest {
  reason?: string;
}

// =============================================================================
// TRUCK API
// =============================================================================

export interface CreateTruckRequest {
  plateNumber: string;
  model: string;
  capacity: number;
  year: number;
  dimensions?: { length?: number; width?: number; height?: number };
  features?: string[];
}

export interface GetTrucksParams {
  page?: number;
  limit?: number;
  ownerId?: string;
  status?: TruckStatus;
  available?: boolean;
  search?: string;
}

export interface UpdateTruckRequest {
  model?: string;
  capacity?: number;
  status?: TruckStatus;
  dimensions?: { length?: number; width?: number; height?: number };
  features?: string[];
}

export interface AssignDriverToTruckRequest {
  driverId: string;
}

export interface RecordMaintenanceRequest {
  type: 'REGULAR' | 'REPAIR' | 'EMERGENCY';
  description?: string;
  cost?: number;
  date?: string;
  odometer?: number;
}

export interface UpdateInsuranceRequest {
  provider: string;
  policyNumber: string;
  expiryDate: string;
}

export interface UpdateRegistrationRequest {
  issuedBy: string;
  registrationNumber: string;
  expiryDate: string;
}

// =============================================================================
// DOCUMENT API
// =============================================================================

export interface UploadDocumentRequest {
  document: File;
  name: string;
  description?: string;
  documentType: DocumentType;
  entityType: EntityType;
  entityId: string;
  expiryDate?: string;
}

export interface GetDocumentsParams {
  page?: number;
  limit?: number;
  entityType?: EntityType;
  entityId?: string;
  documentType?: DocumentType;
  isVerified?: boolean;
}

export interface VerifyDocumentRequest {
  verified: boolean;
  notes?: string;
}

// =============================================================================
// ADMIN API
// =============================================================================

export interface GetDashboardStatsResponse {
  success: true;
  data: {
    users: {
      total: number;
      byRole: Record<UserRole, number>;
      pendingApproval: number;
    };
    shipments: {
      total: number;
      byStatus: Record<ShipmentStatus, number>;
      thisWeek: number;
      thisMonth: number;
    };
    applications: {
      total: number;
      pending: number;
      thisWeek: number;
    };
    trucks: {
      total: number;
      available: number;
      inService: number;
    };
    documents: {
      pendingVerification: number;
    };
  };
}

export interface ApproveUserRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface GetPendingApprovalsParams {
  page?: number;
  limit?: number;
  type?: 'users' | 'shipments' | 'documents';
}

// =============================================================================
// ANALYTICS / REPORTING API
// =============================================================================

export interface GetMerchantKPIsParams {
  startDate?: string;
  endDate?: string;
}

export interface MerchantKPIsResponse {
  success: true;
  data: {
    totalShipments: number;
    completedShipments: number;
    averageDeliveryTime: number; // hours
    onTimeDeliveryRate: number; // percentage
    totalSpend: number;
    lanePerformance: Array<{
      origin: string;
      destination: string;
      shipmentCount: number;
      averageCost: number;
      averageTime: number;
    }>;
  };
}

export interface GetTruckOwnerAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export interface TruckOwnerAnalyticsResponse {
  success: true;
  data: {
    totalBids: number;
    acceptedBids: number;
    acceptanceRate: number;
    totalRevenue: number;
    fleetUtilization: number; // percentage
    truckPerformance: Array<{
      truckId: string;
      plateNumber: string;
      shipmentsCompleted: number;
      revenue: number;
      utilizationRate: number;
    }>;
  };
}

// =============================================================================
// SHARED TYPES
// =============================================================================

export type UserRole = 'Admin' | 'Merchant' | 'TruckOwner' | 'Driver';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DriverStatus = 'ACTIVE' | 'OFF_DUTY' | 'ON_BREAK' | 'INACTIVE';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ShipmentStatus =
  | 'PENDING_APPROVAL'
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'LOADING'
  | 'IN_TRANSIT'
  | 'UNLOADING'
  | 'AT_BORDER'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DELAYED'
  | 'REJECTED';

export type PricingType = 'BIDDING' | 'FIXED_PRICE';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type TruckStatus = 'AVAILABLE' | 'IN_SERVICE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE';

export type IssueType =
  | 'DELIVERY_FAILED'
  | 'ACCIDENT'
  | 'CARGO_DAMAGED'
  | 'VEHICLE_BREAKDOWN'
  | 'TRAFFIC'
  | 'WEATHER'
  | 'OTHER';

export type DocumentType =
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'SHIPPING_INVOICE'
  | 'BILL_OF_LADING'
  | 'WAYBILL'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'ACID_PROOF'
  | 'CUSTOMS_DECLARATION'
  | 'PROOF_OF_DELIVERY'
  | 'DRIVER_LICENSE'
  | 'VEHICLE_REGISTRATION'
  | 'INSURANCE_CERTIFICATE'
  | 'HAZARDOUS_MATERIALS_CERT'
  | 'PAYMENT_RECEIPT'
  | 'REGISTRATION'
  | 'OTHER';

export type EntityType = 'Shipment' | 'Application' | 'Truck' | 'User';

// =============================================================================
// GENERIC RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
