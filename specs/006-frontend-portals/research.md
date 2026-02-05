# Research: Next.js Frontend Portals

## Scope

Summarize technical constraints and backend integration points for the Next.js 14 frontend.

## Findings

### Backend API Base

- Express routes are mounted at `/api` (not `/api/v1`).
- Auth endpoints return access + refresh tokens in JSON, not cookies.
- CSRF middleware exposes `GET /api/auth/csrf-token` and expects `X-CSRF-Token` on state-changing requests.

### Auth & Token Lifecycle

- Access token is short-lived (15 minutes by default).
- Refresh token rotation occurs on `POST /api/auth/refresh`.
- Logout revokes refresh token via `POST /api/auth/logout`.

### CORS Defaults

- Development CORS expects `http://localhost:3001` as the frontend origin.

### Existing Role Portals (Docs)

- Truck Owner and Driver portal endpoints are documented in `docs/PORTALS.md`.
- Admin endpoints are documented in `docs/admin-api.md` and general API references in `docs/API_DOCUMENTATION.md`.

### Visual Identity (Figma)

- Figma file provided: https://www.figma.com/design/E6mdcPTHAMIn3FQiDJcuOK/Almarine
- Access tokens (colors, typography, components) are required from a public share or exported assets.
- Pending: design tokens or screenshots to align UI precisely.

## Open Questions

- Confirm preferred storage for tokens (localStorage vs. cookie-based proxy) given API responses.
- Confirm role routing strategy when user role changes mid-session (e.g., deactivated user).
- Provide exported design tokens or screenshots from Figma for accurate theming.
