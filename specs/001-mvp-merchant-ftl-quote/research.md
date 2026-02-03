# Research: MVP Merchant FTL Quote Flow

**Date**: 2026-02-03

## Decisions

### Maps Provider

- **Decision**: Use Google Maps for ETA and routing.
- **Rationale**: Selected by product decision; broad coverage for Egypt and GCC.
- **Alternatives considered**: HERE, Mapbox.

### Payment Workflow

- **Decision**: Merchant uploads payment proof (PDF/image) for direct-to-carrier
  payments; no payment gateway integration in MVP.
- **Rationale**: Matches MVP scope and reduces integration complexity.
- **Alternatives considered**: Paymob/PayTabs gateway, escrow workflows.

### Customs/Broker Integration

- **Decision**: Store ACID/ACI proof and assign broker-of-record; no direct CargoX
  submission in MVP.
- **Rationale**: Requires licensed brokers; MVP keeps platform as coordinator.
- **Alternatives considered**: Direct CargoX integration.

### Compliance Gating

- **Decision**: Block dispatch if ACID proof or required documents are missing.
- **Rationale**: Egypt export compliance requirement.
- **Alternatives considered**: Soft warnings only.

### Saudi SABER

- **Decision**: Track SABER status but do not block dispatch in MVP.
- **Rationale**: Avoids blocking operations while still capturing required data.
- **Alternatives considered**: Hard gate for Saudi shipments.
