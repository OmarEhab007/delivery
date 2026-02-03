<!--
Sync Impact Report:
- Version change: N/A -> 1.0.0
- Modified principles: N/A (initial constitution)
- Added sections: Core Principles, Compliance & Regulatory Requirements, Development Workflow & Quality Gates, Governance
- Removed sections: None
- Templates requiring updates:
  - OK .specify/templates/plan-template.md (checked, aligned)
  - OK .specify/templates/spec-template.md (checked, aligned)
  - OK .specify/templates/tasks-template.md (checked, aligned)
- Deferred items: None
-->

# Delivery App Constitution

## Core Principles

### Compliance-First Logistics

Every cross-border shipment MUST satisfy mandatory compliance gates before dispatch.
Required proofs include ACID/ACI status, broker-of-record assignment, and mandatory
trade documents. Compliance data MUST be stored and auditable.

### Secure, Role-Based Access

All actions MUST respect least-privilege RBAC. Document access MUST be enforced by
ownership or role. Sensitive data MUST be masked in logs and never exposed via
unauthenticated routes.

### Traceable State Transitions

Shipment, document, and payment states MUST be explicit, validated, and recorded
with timestamps. State changes MUST be auditable and must not bypass required
workflow checks.

### Reliability and Observability

Core workflows MUST emit structured logs and metrics. Tracking and notification
failures MUST be visible and recoverable. Health and readiness checks MUST be
available for production operations.

### MVP Scope Discipline

MVP delivery is merchant-first, FTL-only, and quote-request only. Features outside
this scope MUST be deferred to later phases unless explicitly approved.

## Compliance & Regulatory Requirements

- ACID (ACI) proof is REQUIRED for Egypt export workflows; shipments without proof
  MUST be blocked from dispatch.
- Broker-of-record assignment is REQUIRED for customs clearance activities.
- Mandatory documents include commercial invoice, packing list, bill of lading / waybill,
  and certificate of origin when GAFTA benefits are selected.
- SABER (Saudi) status is tracked but does NOT block dispatch for MVP.
- Insurance requirement is governed by Incoterms: only enforced when the selected
  Incoterm requires coverage.

## Development Workflow & Quality Gates

- Each feature MUST have spec, plan, and tasks artifacts under specs/.
- Spec quality checklists MUST be completed before planning.
- Implementation MUST follow the approved plan and task breakdown.
- Security and compliance checks MUST be included in QA before production release.

## Governance

- This constitution supersedes other development guidance.
- Amendments require documentation, version bumping, and re-validation of specs.
- Compliance to this constitution MUST be checked during planning and review.

**Version**: 1.0.0 | **Ratified**: 2026-02-03 | **Last Amended**: 2026-02-03
