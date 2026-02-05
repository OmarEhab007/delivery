# Quickstart: Next.js Frontend Portals

## Prerequisites

- Node.js 18+
- Backend running locally (default: `http://localhost:3000`)

## Setup

```bash
cd frontend
npm install
```

## Environment Variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Run Dev Server

```bash
npm run dev
```

Expected dev URL: `http://localhost:3001` (aligns with backend CORS defaults).

## Notes

- Ensure CSRF token is fetched from `GET /api/auth/csrf-token` and sent via `X-CSRF-Token` for mutating requests.
- Access/refresh tokens are returned in JSON; persist them in client storage per security policy.
