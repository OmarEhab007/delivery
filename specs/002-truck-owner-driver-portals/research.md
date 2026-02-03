# Research: Truck Owner and Driver Portals

**Date**: 2026-02-03

## Decisions

### Carrier Portal Scope
- **Decision**: Provide web-based truck owner and driver views in the existing
  client application.
- **Rationale**: Reuse current frontend stack and authentication.
- **Alternatives considered**: Separate mobile driver app in MVP.

### Driver Tracking Updates
- **Decision**: Use existing tracking update pipeline and Socket.io broadcasts.
- **Rationale**: Tracking service already exists; complete wiring in backend.
- **Alternatives considered**: Polling-only tracking without sockets.

### POD and Issue Reporting
- **Decision**: Use existing document upload pipeline for POD and issue photos.
- **Rationale**: Existing document service supports entity-linked uploads.
- **Alternatives considered**: External file store integration in MVP.
