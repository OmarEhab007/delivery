# Implementation Plan: MVP Merchant FTL Quote Flow

**Branch**: `001-mvp-merchant-ftl-quote` | **Date**: 2026-02-03 | **Spec**: specs/001-mvp-merchant-ftl-quote/spec.md
**Input**: Feature specification from `/specs/001-mvp-merchant-ftl-quote/spec.md`

## Summary

Deliver the merchant-first MVP for FTL quote requests, compliance gating with
broker-of-record assignment, live tracking with ETA, and payment proof uploads.
Work spans backend workflow and a merchant web portal.

## Technical Context

**Language/Version**: Node.js 18 (backend), React 18 (merchant portal)  
**Primary Dependencies**: Express, Mongoose, Socket.io (backend); React (frontend)  
**Storage**: MongoDB + local file storage for documents/uploads  
**Testing**: Jest + Supertest (backend); frontend tests deferred in MVP  
**Target Platform**: Web (merchant portal + API)  
**Project Type**: web (backend + frontend)  
**Performance Goals**: p95 API response < 300ms for core reads; tracking updates
broadcast within 10 seconds  
**Constraints**: Compliance gating, RBAC, immutable shipment history  
**Scale/Scope**: MVP pilot up to 1,000 shipments/month, 200 concurrent users

## Constitution Check

- Compliance-first logistics enforced via checklist and broker assignment. (PASS)
- Secure, role-based access enforced for merchant/admin/broker workflows. (PASS)
- Traceable state transitions for shipments, docs, and payments. (PASS)
- Reliability and observability preserved (logs + metrics). (PASS)
- MVP scope discipline (FTL-only, quote-only, merchant-first). (PASS)

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-merchant-ftl-quote/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── controllers/
├── models/
├── routes/
├── services/
└── utils/

client/
├── src/
│   ├── pages/
│   ├── components/
│   └── api/
```

**Structure Decision**: Use existing backend `src/` and admin portal
`client/` structure; add merchant pages under `client/src/pages` or
introduce a `client/src/merchant` area to isolate merchant UI.

## Complexity Tracking

No constitution violations.
