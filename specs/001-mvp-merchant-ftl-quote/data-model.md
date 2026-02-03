# Data Model: MVP Merchant FTL Quote Flow

## Entities

### Shipment (existing)

Add compliance and payment-related fields to the existing shipment model.

- `pricingType`: fixed to request-quote for MVP
- `status`: include Quote Requested, Quote Accepted, Ready to Dispatch
- `incoterm`: determines insurance requirement
- `compliance`: embedded checklist object

### ComplianceChecklist (embedded)

- `acidNumber`
- `aciProofDocumentId`
- `brokerId`
- `documents`: invoice, packing list, bill of lading/waybill, certificate of origin
- `gaftaRequested` (boolean)
- `insuranceRequired` (boolean)
- `insuranceDocumentId`
- `saberStatus` (optional for Saudi)
- `completedAt`

### Broker

- `name`
- `licenseNumber`
- `countriesServed`
- `contacts` (phone/email)
- `status` (active/inactive)

### Quote

- `shipmentId`
- `carrierId`
- `amount`
- `currency`
- `expiresAt`
- `status` (submitted/accepted/rejected/expired)

### TrackingUpdate

- `shipmentId`
- `lat`, `lng`
- `timestamp`
- `source` (driver/system)

### PaymentProof

- `shipmentId`
- `documentId`
- `submittedBy`
- `submittedAt`
- `status` (submitted/verified/rejected)

## Relationships

- Shipment has one active Quote (selected) and many submitted quotes.
- Shipment references Broker via compliance checklist.
- Shipment references Document records for compliance and payment proofs.
