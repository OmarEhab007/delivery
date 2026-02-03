# Data Model: Enterprise Integrations and Automation

## Entities

### IntegrationCredential
- `name`
- `apiKeyHash`
- `scopes`
- `createdBy`
- `active`

### WebhookSubscription
- `endpointUrl`
- `eventTypes`
- `secret`
- `status`
- `lastDeliveredAt`

### WebhookDelivery
- `subscriptionId`
- `eventType`
- `payload`
- `status`
- `attemptCount`

### AnalyticsReport
- `tenantId`
- `periodStart`
- `periodEnd`
- `kpis` (on-time %, avg transit time, delay rate)

### AutomationRule
- `tenantId`
- `triggerType` (delay, missing-update)
- `threshold`
- `action` (notify, escalate)
- `active`

## Relationships

- One tenant has many credentials, webhooks, and rules.
- Deliveries link to webhook subscriptions for audit.
