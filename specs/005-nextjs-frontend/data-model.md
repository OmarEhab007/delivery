# Data Model: Next.js Frontend

**Feature**: 005-nextjs-frontend | **Date**: 2026-02-04

This document defines the TypeScript types that mirror the backend MongoDB models and API responses.

## Core Entities

### User

```typescript
type UserRole = 'Admin' | 'Merchant' | 'TruckOwner' | 'Driver';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type DriverStatus = 'ACTIVE' | 'OFF_DUTY' | 'ON_BREAK' | 'INACTIVE';
type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface User {
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

type AdminPermission =
  | 'FULL_ACCESS'
  | 'USER_MANAGEMENT'
  | 'SHIPMENT_MANAGEMENT'
  | 'TRUCK_MANAGEMENT'
  | 'APPLICATION_MANAGEMENT';

interface DriverLicense {
  documentId?: string;
  issueDate?: string;
  expiryDate?: string;
  issuedBy?: string;
  verified: boolean;
  verificationDate?: string;
}
```

### Shipment

```typescript
type ShipmentStatus =
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

type PricingType = 'BIDDING' | 'FIXED_PRICE';
type ApprovalState = 'PENDING' | 'APPROVED' | 'REJECTED';
type ComplianceStatus = 'PENDING' | 'READY';

interface Shipment {
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

interface Location {
  address: string;
  coordinates?: { lat: number; lng: number };
  country?: string;
}

interface CargoDetails {
  description: string;
  weight: number;
  volume?: number;
  category?: string;
  hazardous: boolean;
  specialInstructions?: string;
}

interface FixedPriceDetails {
  amount: number;
  currency: string;
  autoAssign: boolean;
  requirements?: {
    minTruckCapacity?: number;
    requiredFeatures?: string[];
    maxDeliveryDays?: number;
  };
}

interface ShipmentApproval {
  state: ApprovalState;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface Compliance {
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

type SaberStatus = 'NOT_APPLICABLE' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface ComplianceDocuments {
  commercialInvoiceDocumentId?: string;
  packingListDocumentId?: string;
  billOfLadingDocumentId?: string;
  waybillDocumentId?: string;
  certificateOfOriginDocumentId?: string;
  insuranceDocumentId?: string;
}

interface TimelineEntry {
  _id: string;
  status: ShipmentStatus | 'ISSUE_REPORTED';
  note?: string;
  documents: TimelineDocument[];
  location?: GeoPoint;
  createdAt: string;
}

interface TrackingPoint {
  location: GeoPoint;
  timestamp: string;
  source: 'DRIVER' | 'SYSTEM' | 'IMPORT';
}

interface DeliveryProof {
  type: 'PHOTO' | 'SIGNATURE' | 'DOCUMENT' | 'OTHER';
  filePath: string;
  fileName: string;
  mimeType?: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

interface ShipmentIssue {
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

type IssueType =
  | 'DELIVERY_FAILED'
  | 'ACCIDENT'
  | 'CARGO_DAMAGED'
  | 'VEHICLE_BREAKDOWN'
  | 'TRAFFIC'
  | 'WEATHER'
  | 'OTHER';

interface PaymentDetails {
  amount?: number;
  currency: string;
  paymentReceiptUrl?: string;
  paymentVerified: boolean;
  paymentDate?: string;
  paymentReceiptDocumentId?: string;
}

interface Recipient {
  name?: string;
  signature?: string; // Base64
}
```

### Application (Bid)

```typescript
type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

interface Application {
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

interface BidDetails {
  price: number;
  currency: string;
  notes?: string;
  validUntil?: string;
}

interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: string;
  note?: string;
  changedBy?: string;
}
```

### Truck

```typescript
type TruckStatus = 'AVAILABLE' | 'IN_SERVICE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE';
type InspectionStatus = 'PASSED' | 'PENDING' | 'FAILED' | 'EXPIRED';

interface Truck {
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

interface MaintenanceRecord {
  _id: string;
  type: 'REGULAR' | 'REPAIR' | 'EMERGENCY';
  description?: string;
  cost?: number;
  date: string;
  odometer?: number;
  documentId?: string;
}

interface InsuranceInfo {
  provider?: string;
  policyNumber?: string;
  expiryDate?: string;
  documentId?: string;
  verified: boolean;
}

interface RegistrationInfo {
  issuedBy?: string;
  registrationNumber?: string;
  expiryDate?: string;
  documentId?: string;
  verified: boolean;
}

interface TechnicalInspection {
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  status: InspectionStatus;
  documentId?: string;
  verified: boolean;
}
```

### Document

```typescript
type DocumentType =
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

type EntityType = 'Shipment' | 'Application' | 'Truck' | 'User';

interface Document {
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

// Embedded document reference (used in other entities)
interface EmbeddedDocument {
  documentId: string;
  name: string;
  documentType: DocumentType;
  required?: boolean;
  verified?: boolean;
  uploadDate?: string;
}

interface RequiredDocument {
  name: string;
  documentType: DocumentType;
  description?: string;
  isProvided: boolean;
}
```

## Common Types

```typescript
interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  address?: string;
  timestamp?: string;
}

// API Pagination
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Response
interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// API Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

## State Types (Frontend-Only)

```typescript
// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Theme Store
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Notification Store
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// Real-time Tracking
interface TrackingState {
  activeShipmentId: string | null;
  location: GeoPoint | null;
  connected: boolean;
  lastUpdated: string | null;
}
```

## Entity Relationships

```
User (Merchant)
  └── Shipment (1:N)
        ├── Application (1:N) ──── User (TruckOwner)
        │     ├── Truck
        │     └── User (Driver)
        ├── Document (1:N)
        └── Timeline (embedded)

User (TruckOwner)
  ├── Truck (1:N)
  │     └── Document (1:N)
  └── User (Driver) (1:N)
        └── Document (1:N)
```

## Validation Rules (Zod Schemas)

Key validation rules to implement client-side:

| Entity | Field | Rule |
|--------|-------|------|
| User | email | Valid email format |
| User | password | Min 6 characters |
| User | phone | Required |
| Shipment | origin.address | Min 5 characters |
| Shipment | cargoDetails.weight | Positive number |
| Application | bidDetails.price | Positive number |
| Truck | plateNumber | Unique, required |
| Truck | capacity | Positive number |
| Document | documentType | Must be valid enum |

## Status Transitions

### Shipment Status Flow

```
PENDING_APPROVAL → REQUESTED (approved)
                 → REJECTED (rejected)

REQUESTED → CONFIRMED (bid accepted)
          → CANCELLED (merchant cancels)

CONFIRMED → ASSIGNED (driver assigned)

ASSIGNED → LOADING (driver starts)

LOADING → IN_TRANSIT (pickup complete)

IN_TRANSIT → AT_BORDER (international)
           → UNLOADING (arrived)
           → DELAYED (issue reported)

UNLOADING → DELIVERED (delivery confirmed)

DELIVERED → COMPLETED (fully closed)
```

### Application Status Flow

```
PENDING → ACCEPTED (merchant accepts)
        → REJECTED (merchant rejects / other accepted)
        → CANCELLED (owner cancels)
```
