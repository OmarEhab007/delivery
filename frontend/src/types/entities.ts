/**
 * Entity Types for Next.js Frontend
 * Feature: 005-nextjs-frontend
 *
 * These types mirror the backend MongoDB models.
 */

import type {
  UserRole,
  ApprovalStatus,
  DriverStatus,
  VerificationStatus,
  ShipmentStatus,
  PricingType,
  ApplicationStatus,
  TruckStatus,
  IssueType,
  DocumentType,
  EntityType,
} from './api';

// =============================================================================
// USER
// =============================================================================

export type AdminPermission =
  | 'FULL_ACCESS'
  | 'USER_MANAGEMENT'
  | 'SHIPMENT_MANAGEMENT'
  | 'TRUCK_MANAGEMENT'
  | 'APPLICATION_MANAGEMENT';

export interface DriverLicense {
  documentId?: string;
  issueDate?: string;
  expiryDate?: string;
  issuedBy?: string;
  verified: boolean;
  verificationDate?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  // Admin fields
  adminPermissions?: AdminPermission[];

  // TruckOwner fields
  companyName?: string;
  companyAddress?: string;

  // Driver fields
  ownerId?: string;
  licenseNumber?: string;
  driverLicense?: DriverLicense;
  isAvailable?: boolean;
  driverStatus?: DriverStatus;
  currentLocation?: GeoPoint;

  // Document management
  documents?: UserDocument[];
  verificationStatus?: VerificationStatus;
}

export interface UserDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
  required?: boolean;
  verified?: boolean;
  uploadDate?: string;
}

// =============================================================================
// SHIPMENT
// =============================================================================

export type ApprovalState = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ComplianceStatus = 'PENDING' | 'READY';
export type SaberStatus = 'NOT_APPLICABLE' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Location {
  address: string;
  coordinates?: { lat: number; lng: number };
  country?: string;
}

export interface CargoDetails {
  description: string;
  weight: number;
  volume?: number;
  category?: string;
  hazardous: boolean;
  specialInstructions?: string;
}

export interface FixedPriceDetails {
  amount: number;
  currency: string;
  autoAssign: boolean;
  requirements?: {
    minTruckCapacity?: number;
    requiredFeatures?: string[];
    maxDeliveryDays?: number;
  };
}

export interface ShipmentApproval {
  state: ApprovalState;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface ComplianceDocuments {
  commercialInvoiceDocumentId?: string;
  packingListDocumentId?: string;
  billOfLadingDocumentId?: string;
  waybillDocumentId?: string;
  certificateOfOriginDocumentId?: string;
  insuranceDocumentId?: string;
}

export interface Compliance {
  status: ComplianceStatus;
  acidNumber?: string;
  aciProofDocumentId?: string;
  brokerId?: string;
  documents: ComplianceDocuments;
  gaftaRequested: boolean;
  insuranceRequired: boolean;
  saberStatus: SaberStatus;
  completedAt?: string;
}

export interface TimelineDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
}

export interface TimelineEntry {
  _id: string;
  status: ShipmentStatus | 'ISSUE_REPORTED';
  note?: string;
  documents: TimelineDocument[];
  location?: GeoPoint;
  createdAt: string;
}

export interface TrackingPoint {
  location: GeoPoint;
  timestamp: string;
  source: 'DRIVER' | 'SYSTEM' | 'IMPORT';
}

export interface DeliveryProof {
  type: 'PHOTO' | 'SIGNATURE' | 'DOCUMENT' | 'OTHER';
  filePath: string;
  fileName: string;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

export interface ShipmentIssue {
  _id: string;
  type: IssueType;
  description?: string;
  reportedBy: string;
  reportedAt: string;
  location?: GeoPoint;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  resolution?: {
    description: string;
    resolvedBy: string;
    resolvedAt: string;
  };
}

export interface PaymentDetails {
  amount?: number;
  currency: string;
  paymentReceiptUrl?: string;
  paymentVerified: boolean;
  paymentDate?: string;
  paymentReceiptDocumentId?: string;
}

export interface Recipient {
  name?: string;
  signature?: string; // Base64
}

export interface ShipmentDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
  required?: boolean;
  verified?: boolean;
  uploadDate?: string;
}

export interface Shipment {
  _id: string;
  merchantId: string;
  merchant?: User; // Populated

  // Pricing
  pricingType: PricingType;
  fixedPriceDetails?: FixedPriceDetails;

  // Locations
  origin: Location;
  destination: Location;

  // Cargo
  cargoDetails: CargoDetails;
  incoterm?: string;

  // Status
  status: ShipmentStatus;
  approval: ShipmentApproval;
  compliance: Compliance;

  // Assignments
  selectedApplicationId?: string;
  assignedTruckId?: string;
  assignedDriverId?: string;
  assignedTruck?: Truck; // Populated
  assignedDriver?: User; // Populated

  // Tracking
  currentLocation?: GeoPoint;
  trackingHistory: TrackingPoint[];
  timeline: TimelineEntry[];

  // Delivery
  startOdometer?: number;
  endOdometer?: number;
  distanceTraveled?: number;
  recipient?: Recipient;
  deliveryProofs: DeliveryProof[];
  issues: ShipmentIssue[];

  // Dates
  estimatedPickupDate?: string;
  estimatedDeliveryDate?: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;

  // Payment
  paymentDetails?: PaymentDetails;

  // Documents
  documents: ShipmentDocument[];

  // Metadata
  active: boolean;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  applications?: Application[];
}

// =============================================================================
// APPLICATION (BID)
// =============================================================================

export interface BidDetails {
  price: number;
  currency: string;
  notes?: string;
  validUntil?: string;
}

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: string;
  note?: string;
  changedBy?: string;
}

export interface ApplicationDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
  required?: boolean;
  verified?: boolean;
  uploadDate?: string;
}

export interface Application {
  _id: string;
  shipmentId: string;
  shipment?: Shipment; // Populated

  ownerId: string;
  owner?: User; // Populated

  assignedTruckId: string;
  assignedTruck?: Truck; // Populated

  driverId: string;
  driver?: User; // Populated

  status: ApplicationStatus;
  bidDetails: BidDetails;

  documents: ApplicationDocument[];
  statusHistory: StatusHistoryEntry[];

  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TRUCK
// =============================================================================

export type InspectionStatus = 'PASSED' | 'PENDING' | 'FAILED' | 'EXPIRED';

export interface MaintenanceRecord {
  _id: string;
  type: 'REGULAR' | 'REPAIR' | 'EMERGENCY';
  description?: string;
  cost?: number;
  date: string;
  odometer?: number;
  documentId?: string;
}

export interface InsuranceInfo {
  provider?: string;
  policyNumber?: string;
  expiryDate?: string;
  documentId?: string;
  verified: boolean;
}

export interface RegistrationInfo {
  issuedBy?: string;
  registrationNumber?: string;
  expiryDate?: string;
  documentId?: string;
  verified: boolean;
}

export interface TechnicalInspection {
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  status: InspectionStatus;
  documentId?: string;
  verified: boolean;
}

export interface TruckDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
  required?: boolean;
  verified?: boolean;
  uploadDate?: string;
}

export interface Truck {
  _id: string;
  ownerId: string;
  owner?: User; // Populated

  driverId?: string;
  driver?: User; // Populated

  plateNumber: string;
  model: string;
  capacity: number; // tons
  year: number;

  available: boolean;
  status: TruckStatus;

  currentFuelLevel: number; // 0-100
  odometer: number;

  // Maintenance
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceHistory: MaintenanceRecord[];

  // Check-in/out
  lastCheckin?: string;
  lastCheckout?: string;

  // Documentation
  insuranceInfo: InsuranceInfo;
  registrationInfo: RegistrationInfo;
  technicalInspection: TechnicalInspection;

  dimensions?: { length?: number; width?: number; height?: number };
  features: string[];
  photos: string[];

  documents: TruckDocument[];
  verificationStatus: VerificationStatus;

  active: boolean;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  currentShipment?: Shipment;
}

// =============================================================================
// DOCUMENT
// =============================================================================

export interface Document {
  _id: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  fileExtension?: string;
  originalName?: string;

  documentType: DocumentType;
  uploadedBy: string;
  uploader?: User; // Populated

  entityType: EntityType;
  entityId: string;

  isVerified: boolean;
  verifiedBy?: string;
  verifier?: User; // Populated
  verificationDate?: string;
  verificationNotes?: string;

  expiryDate?: string;
  metadata?: Record<string, string>;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  address?: string;
  timestamp?: string;
}

export interface EmbeddedDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
  required?: boolean;
  verified?: boolean;
  uploadDate?: string;
}

export interface RequiredDocument {
  name: string;
  documentType: DocumentType;
  description?: string;
  isProvided: boolean;
}

// =============================================================================
// PENDING APPROVALS
// =============================================================================

export interface PendingApprovals {
  users: User[];
  shipments: Shipment[];
  documents: Document[];
}

// Re-export API types for convenience
export type {
  UserRole,
  ApprovalStatus,
  DriverStatus,
  VerificationStatus,
  ShipmentStatus,
  PricingType,
  ApplicationStatus,
  TruckStatus,
  IssueType,
  DocumentType,
  EntityType,
} from './api';
