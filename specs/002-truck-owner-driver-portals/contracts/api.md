# API Contracts: Truck Owner and Driver Portals

## Truck Owner

- `GET /api/shipments/available` - List shipments open for bids
- `POST /api/applications` - Submit bid
- `GET /api/applications` - List owner applications
- `POST /api/shipments/:id/assign-driver` - Assign driver to shipment

## Driver

- `PATCH /api/driver/location` - Update driver location
- `PATCH /api/driver/shipments/:shipmentId/status` - Update shipment status
- `POST /api/driver/shipments/:shipmentId/pod` - Upload proof of delivery
- `POST /api/driver/shipments/:shipmentId/issues` - Report issue
