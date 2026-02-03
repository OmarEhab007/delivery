# Data Model: Truck Owner and Driver Portals

## Entities

### Application/Bid (existing)
- Use existing Application model for bidding status and history.

### Driver Assignment (existing fields on Shipment)
- `assignedDriverId`
- `assignedTruckId`
- `assignedAt`

### Driver Status (existing User fields)
- `availabilityStatus`
- `currentLocation`
- `lastCheckIn`

### Milestone (Shipment timeline)
- Status updates with optional location and notes.

## Relationships

- Truck owner submits bids for shipments.
- Driver assignment ties shipment to a driver and truck.
- Driver updates create timeline entries and tracking updates.
