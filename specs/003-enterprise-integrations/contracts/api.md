# API Contracts: Enterprise Integrations and Automation

## Integrations

- `POST /api/integrations/credentials` - Create API credential
- `GET /api/integrations/credentials` - List API credentials
- `POST /api/integrations/webhooks` - Register webhook
- `GET /api/integrations/webhooks` - List webhooks

## External Shipment API

- `POST /api/integrations/shipments` - Create shipment via API
- `GET /api/integrations/shipments/:id` - Retrieve shipment status

## Analytics

- `GET /api/reports/kpis` - Retrieve KPI summary
- `GET /api/reports/lanes` - Retrieve lane performance

## Automation

- `POST /api/automation/rules` - Create rule
- `GET /api/automation/rules` - List rules
- `PATCH /api/automation/rules/:id` - Update rule
