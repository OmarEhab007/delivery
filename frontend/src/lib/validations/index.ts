/**
 * Zod Validation Schemas
 */

import { z } from 'zod';

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب ألا تقل عن 6 أحرف'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب ألا يقل عن حرفين'),
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب ألا تقل عن 6 أحرف'),
  phone: z.string().min(8, 'يرجى إدخال رقم هاتف صحيح'),
  role: z.enum(['Merchant', 'TruckOwner'], { message: 'يرجى اختيار نوع الحساب' }),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// =============================================================================
// SHIPMENT SCHEMAS
// =============================================================================

export const locationSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  country: z.string().optional(),
});

export const cargoDetailsSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  weight: z.number().positive('Weight must be a positive number'),
  volume: z.number().positive().optional(),
  category: z.string().optional(),
  hazardous: z.boolean().default(false),
  specialInstructions: z.string().optional(),
});

export const fixedPriceDetailsSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().default('USD'),
  autoAssign: z.boolean().default(false),
  requirements: z
    .object({
      minTruckCapacity: z.number().positive().optional(),
      requiredFeatures: z.array(z.string()).optional(),
      maxDeliveryDays: z.number().positive().optional(),
    })
    .optional(),
});

export const createShipmentSchema = z.object({
  pricingType: z.enum(['BIDDING', 'FIXED_PRICE']),
  incoterm: z.string().optional(),
  fixedPriceDetails: fixedPriceDetailsSchema.optional(),
  origin: locationSchema,
  destination: locationSchema,
  cargoDetails: cargoDetailsSchema,
  estimatedPickupDate: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
});

export type CreateShipmentFormData = z.infer<typeof createShipmentSchema>;

// =============================================================================
// APPLICATION (BID) SCHEMAS
// =============================================================================

export const bidDetailsSchema = z.object({
  price: z.number().positive('Price must be a positive number'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

export const createApplicationSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment is required'),
  assignedTruckId: z.string().min(1, 'Truck is required'),
  driverId: z.string().min(1, 'Driver is required'),
  bidDetails: bidDetailsSchema,
});

export type CreateApplicationFormData = z.infer<typeof createApplicationSchema>;

// =============================================================================
// TRUCK SCHEMAS
// =============================================================================

export const createTruckSchema = z.object({
  plateNumber: z.string().min(2, 'Plate number is required'),
  model: z.string().min(2, 'Model is required'),
  capacity: z.number().positive('Capacity must be a positive number'),
  year: z
    .number()
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  dimensions: z
    .object({
      length: z.number().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
  features: z.array(z.string()).default([]),
});

export type CreateTruckFormData = z.infer<typeof createTruckSchema>;

// =============================================================================
// DRIVER SCHEMAS
// =============================================================================

export const createDriverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  licenseNumber: z.string().min(5, 'License number must be at least 5 characters'),
});

export type CreateDriverFormData = z.infer<typeof createDriverSchema>;

export const driverCheckInSchema = z.object({
  truckId: z.string().min(1, 'Truck is required'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  truckCondition: z.string().optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  odometer: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type DriverCheckInFormData = z.infer<typeof driverCheckInSchema>;

// =============================================================================
// DELIVERY SCHEMAS
// =============================================================================

export const startDeliverySchema = z.object({
  startOdometer: z.number().positive('Odometer reading must be a positive number'),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export type StartDeliveryFormData = z.infer<typeof startDeliverySchema>;

export const completeDeliverySchema = z.object({
  endOdometer: z.number().positive('Odometer reading must be a positive number'),
  recipient: z.object({
    name: z.string().min(2, 'Recipient name is required'),
    signature: z.string().optional(),
  }),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export type CompleteDeliveryFormData = z.infer<typeof completeDeliverySchema>;

export const reportIssueSchema = z.object({
  type: z.enum([
    'DELIVERY_FAILED',
    'ACCIDENT',
    'CARGO_DAMAGED',
    'VEHICLE_BREAKDOWN',
    'TRAFFIC',
    'WEATHER',
    'OTHER',
  ]),
  description: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export type ReportIssueFormData = z.infer<typeof reportIssueSchema>;

// =============================================================================
// DOCUMENT SCHEMAS
// =============================================================================

export const uploadDocumentSchema = z.object({
  name: z.string().min(2, 'Document name is required'),
  description: z.string().optional(),
  documentType: z.enum([
    'COMMERCIAL_INVOICE',
    'PACKING_LIST',
    'SHIPPING_INVOICE',
    'BILL_OF_LADING',
    'WAYBILL',
    'CERTIFICATE_OF_ORIGIN',
    'ACID_PROOF',
    'CUSTOMS_DECLARATION',
    'PROOF_OF_DELIVERY',
    'DRIVER_LICENSE',
    'VEHICLE_REGISTRATION',
    'INSURANCE_CERTIFICATE',
    'HAZARDOUS_MATERIALS_CERT',
    'PAYMENT_RECEIPT',
    'REGISTRATION',
    'OTHER',
  ]),
  entityType: z.enum(['Shipment', 'Application', 'Truck', 'User']),
  entityId: z.string().min(1, 'Entity ID is required'),
  expiryDate: z.string().optional(),
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

// =============================================================================
// MAINTENANCE SCHEMAS
// =============================================================================

export const recordMaintenanceSchema = z.object({
  type: z.enum(['REGULAR', 'REPAIR', 'EMERGENCY']),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  date: z.string().optional(),
  odometer: z.number().positive().optional(),
});

export type RecordMaintenanceFormData = z.infer<typeof recordMaintenanceSchema>;

// =============================================================================
// INSURANCE & REGISTRATION SCHEMAS
// =============================================================================

export const updateInsuranceSchema = z.object({
  provider: z.string().min(2, 'Provider is required'),
  policyNumber: z.string().min(2, 'Policy number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

export type UpdateInsuranceFormData = z.infer<typeof updateInsuranceSchema>;

export const updateRegistrationSchema = z.object({
  issuedBy: z.string().min(2, 'Issued by is required'),
  registrationNumber: z.string().min(2, 'Registration number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

export type UpdateRegistrationFormData = z.infer<typeof updateRegistrationSchema>;

// =============================================================================
// BROKER SCHEMAS
// =============================================================================

export const brokerFormSchema = z.object({
  name: z.string().min(2, 'Broker name is required'),
  licenseNumber: z.string().min(2, 'License number is required'),
  countriesServed: z.array(z.string()).default([]),
  contacts: z.object({
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
  }).default({ email: '', phone: '' }),
  notes: z.string().optional(),
});

export type BrokerFormData = z.infer<typeof brokerFormSchema>;

// =============================================================================
// AUTOMATION RULE SCHEMAS
// =============================================================================

export const automationRuleFormSchema = z.object({
  name: z.string().min(2, 'Rule name is required'),
  triggerType: z.enum(['delay', 'missing-update'], { message: 'Select a trigger type' }),
  threshold: z.number().positive('Threshold must be a positive number'),
  thresholdUnit: z.literal('hours'),
  action: z.enum(['notify', 'escalate'], { message: 'Select an action' }),
});

export type AutomationRuleFormData = z.infer<typeof automationRuleFormSchema>;

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

export const webhookFormSchema = z.object({
  endpointUrl: z.string().url('Must be a valid URL'),
  eventTypes: z.array(z.string()).min(1, 'Select at least one event type'),
});

export type WebhookFormData = z.infer<typeof webhookFormSchema>;
