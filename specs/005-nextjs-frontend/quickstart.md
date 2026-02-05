# Quickstart Guide: Next.js Frontend

**Feature**: 005-nextjs-frontend | **Date**: 2026-02-04

## Prerequisites

- Node.js 20.x LTS
- npm 10.x or pnpm 8.x
- Backend API running at `http://localhost:3000`
- MongoDB instance (used by backend)

## Project Setup

### 1. Create Next.js Project

```bash
# From repository root
cd /Users/omar/Developer/delivery

# Create Next.js app in frontend directory
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Prompts to answer**:
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **Yes** → `@/*`

### 2. Install Dependencies

```bash
cd frontend

# Core dependencies
npm install @tanstack/react-query@5 zustand socket.io-client zod react-hook-form @hookform/resolvers

# UI dependencies (shadcn prerequisites)
npm install class-variance-authority clsx tailwind-merge lucide-react

# Map dependencies
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Date handling
npm install date-fns

# Dev dependencies
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
npm install -D playwright @playwright/test
```

### 3. Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Configuration choices**:
- Style: **Default**
- Base color: **Neutral** (we'll customize)
- CSS variables: **Yes**
- tailwind.config.js location: **tailwind.config.ts**
- components.json location: **./components.json**
- Global CSS file: **src/styles/globals.css**
- React Server Components: **Yes**
- Components alias: **@/components**
- Utils alias: **@/lib/utils**

### 4. Add shadcn/ui Components

```bash
# Essential components
npx shadcn-ui@latest add button card input label form select checkbox radio-group switch
npx shadcn-ui@latest add dialog sheet tabs badge skeleton avatar
npx shadcn-ui@latest add table dropdown-menu popover toast sonner
npx shadcn-ui@latest add separator scroll-area
```

### 5. Configure Tailwind Theme

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Figma Design System
        primary: {
          DEFAULT: '#E57F00',
          light: '#FDA058',
          bright: '#FB8500',
        },
        secondary: '#90735A',
        dark: '#2F0F01',
        cream: '#F1D6B2',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // ... other shadcn defaults
      },
      borderRadius: {
        'card': '48px',
        'button': '25px',
        'input': '5px',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 6. Configure CSS Variables

Update `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 96.5%; /* #F6F6F6 */
    --foreground: 0 0% 21%; /* #363636 */
    --surface: 0 0% 100%; /* #FFFFFF */

    --card: 0 0% 100%;
    --card-foreground: 0 0% 21%;

    --muted: 30 27% 72%; /* #F1D6B2 */
    --muted-foreground: 0 0% 71%; /* #B5B5B5 */

    --primary: 32 100% 45%; /* #E57F00 */
    --primary-foreground: 0 0% 100%;

    --secondary: 26 27% 46%; /* #90735A */
    --secondary-foreground: 0 0% 100%;

    --accent: 32 100% 49%; /* #FB8500 */
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 32 100% 45%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 10%; /* #1A1A1A */
    --foreground: 0 0% 90%; /* #E5E5E5 */
    --surface: 0 0% 18%; /* #2D2D2D */

    --card: 0 0% 18%;
    --card-foreground: 0 0% 90%;

    --muted: 0 0% 25%;
    --muted-foreground: 0 0% 65%;

    --primary: 32 100% 45%;
    --primary-foreground: 0 0% 100%;

    --secondary: 30 27% 72%;
    --secondary-foreground: 0 0% 10%;

    --accent: 32 100% 49%;
    --accent-foreground: 0 0% 100%;

    --border: 0 0% 25%;
    --input: 0 0% 25%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### 7. Create Environment Configuration

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Map Configuration (optional, for custom tiles)
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### 8. Update Package Scripts

Update `frontend/package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 9. Update Root Package.json

Add to root `package.json` scripts:

```json
{
  "scripts": {
    "frontend": "cd frontend && npm run dev",
    "frontend:build": "cd frontend && npm run build",
    "frontend:install": "cd frontend && npm install",
    "dev:all": "concurrently \"npm run dev\" \"npm run frontend\""
  }
}
```

## Project Structure

After setup, create this directory structure:

```bash
mkdir -p frontend/src/{app/{(auth),\(dashboard\)/{admin,merchant,truck-owner,driver}},components/{ui,forms,tables,maps,shared},hooks,lib/{api,auth,utils},stores,types,styles}
```

Expected structure:

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── admin/
│   │   │   ├── merchant/
│   │   │   ├── truck-owner/
│   │   │   └── driver/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/           # shadcn components (auto-generated)
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── maps/
│   │   └── shared/
│   ├── hooks/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   └── utils/
│   ├── stores/
│   ├── types/
│   └── styles/
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── ...config files
```

## Verification

### Run Development Server

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run frontend

# Or run both concurrently
npm run dev:all
```

### Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api-docs

### Health Check

Visit `http://localhost:3001` - should see Next.js welcome page.

Visit `http://localhost:3000/health` - should see backend health status.

## Next Steps

1. Copy TypeScript types from `specs/005-nextjs-frontend/contracts/api-types.ts` to `frontend/src/types/`
2. Implement API client in `frontend/src/lib/api/`
3. Create auth provider and middleware
4. Build first portal (recommend starting with Login → Merchant Dashboard)
5. Run `/speckit.tasks` to generate implementation tasks

## Common Issues

### CORS Errors

Backend already has CORS configured. If issues persist, verify:
- Frontend running on port 3001
- `NEXT_PUBLIC_API_URL` set correctly
- Backend `cors` middleware allows origin

### SSR Issues with Leaflet

Leaflet requires `window` object. Use dynamic import:

```typescript
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/maps/TrackingMap'), {
  ssr: false,
});
```

### Cookie Authentication

For httpOnly cookies to work in development:
- Both frontend and backend should use same domain (localhost)
- Set `credentials: 'include'` in fetch requests
- Backend should set `sameSite: 'lax'` for cookies

## Reference Links

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Tanstack Query](https://tanstack.com/query/latest)
- [React-Leaflet](https://react-leaflet.js.org)
