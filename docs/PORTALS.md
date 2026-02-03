# Carrier & Driver Portals

This guide summarizes the Truck Owner (carrier) and Driver portal flows added in Phase 2.

## Access

- Truck Owner portal: `client` route `/truck-owner`
- Driver portal: `client` route `/driver`

After login, users are routed to their portal based on role.

## Truck Owner Portal

### Available Loads

- View shipments open for bidding.
- Submit a bid with:
  - Truck
  - Driver
  - Bid price and currency
  - Optional notes and valid-until date

**API**

- `GET /api/truck-owner/shipments/available`
- `POST /api/applications`

### My Applications

- Track submitted bids and their status.

**API**

- `GET /api/applications`

### Active Loads

- View accepted shipments.
- Assign a driver and (optionally) a different truck.

**API**

- `GET /api/truck-owner/shipments`
- `PATCH /api/truck-owner/shipments/:shipmentId/assign`
- Alias: `POST /api/shipments/:shipmentId/assign-driver`

## Driver Portal

### Assigned Shipments

- View active shipments assigned to the driver.

**API**

- `GET /api/driver/shipments/assigned`

### Status Updates

- Update shipment status with optional notes and location.

**API**

- `PATCH /api/driver/shipments/:shipmentId/status`

### Location Updates

- Update the driver location and (optionally) a shipment location by sending `shipmentId`.

**API**

- `PATCH /api/driver/location`

### Proof of Delivery

- Upload POD (photo or PDF).

**API**

- `POST /api/driver/shipments/:shipmentId/proof`
- Alias: `POST /api/driver/shipments/:shipmentId/pod`

### Issue Reporting

- Report delivery issues such as delays or breakdowns.

**API**

- `POST /api/driver/shipments/:shipmentId/issues`
