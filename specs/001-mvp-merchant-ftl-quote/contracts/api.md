# API Contracts: MVP Merchant FTL Quote Flow

## Merchant Shipments

- `POST /api/shipments` - Create shipment request (FTL, quote-only)
- `GET /api/shipments` - List merchant shipments
- `GET /api/shipments/:id` - Get shipment details

## Quotes

- `POST /api/shipments/:id/quotes` - Submit quote (carrier/truck owner)
- `POST /api/shipments/:id/quotes/:quoteId/accept` - Merchant accepts quote

## Compliance & Broker

- `POST /api/shipments/:id/broker` - Admin assigns broker-of-record
- `POST /api/shipments/:id/compliance/acid-proof` - Upload ACID proof
- `POST /api/shipments/:id/compliance/documents` - Upload compliance documents
- `POST /api/shipments/:id/compliance/insurance` - Upload insurance proof (if required)
- `GET /api/shipments/:id/compliance` - View compliance status

## Tracking

- `GET /api/shipments/:id/tracking` - Get latest tracking update + ETA
- `GET /api/shipments/:id/tracking/history` - Get tracking history

## Payments

- `POST /api/shipments/:id/payment-proof` - Upload payment proof
- `GET /api/shipments/:id/payment-proof` - View payment proof status

## POD

- `POST /api/shipments/:id/pod` - Upload proof of delivery
