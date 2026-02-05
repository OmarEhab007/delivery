# Research: Next.js Frontend Application

**Feature**: 005-nextjs-frontend | **Date**: 2026-02-04

## Research Questions Resolved

### 1. Next.js 14 App Router Best Practices

**Decision**: Use App Router with Server Components by default, Client Components only when needed

**Rationale**:
- Server Components reduce client bundle size
- Better SEO with server-side rendering
- Streaming enables progressive loading
- Metadata API for dynamic titles/descriptions

**Patterns to Apply**:
- `layout.tsx` for shared UI (navigation, providers)
- `loading.tsx` for Suspense boundaries
- `error.tsx` for error handling per route segment
- Route groups `(auth)`, `(dashboard)` for organization without URL impact
- Parallel routes `@modal` for slide-over panels (bid details, document preview)

**Alternatives Considered**:
- Pages Router: Rejected - App Router is production-ready and offers better DX
- Remix: Rejected - Next.js has larger ecosystem, better Vercel integration options

### 2. shadcn/ui Integration with Custom Design System

**Decision**: Install shadcn/ui base components, override with Figma design tokens

**Rationale**:
- Components are copied to project (full control)
- Tailwind-based (easy to customize)
- Accessible by default (Radix UI primitives)
- No vendor lock-in

**Implementation Approach**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input form table dialog sheet
```

**Customization Strategy**:
1. Define CSS variables in `globals.css` matching Figma tokens
2. Update `tailwind.config.ts` to use CSS variables
3. Modify component variants in `components/ui/`

**Key Components Needed**:
- Button (primary, secondary, ghost, destructive)
- Card (for dashboard cards, shipment cards)
- Form components (Input, Select, Checkbox, RadioGroup)
- DataTable (with sorting, filtering, pagination)
- Dialog/Sheet (for modals and sidepanels)
- Tabs (for portal navigation)
- Badge (for status indicators)
- Skeleton (for loading states)

### 3. Authentication with Next.js Middleware

**Decision**: JWT in httpOnly cookies, middleware for route protection, Zustand for client state

**Rationale**:
- httpOnly cookies prevent XSS token theft
- Middleware runs on edge, fast route protection
- Zustand lightweight for UI state only (not token storage)

**Implementation Pattern**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based routing
  const userRole = decodeToken(token)?.role;
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') && userRole !== 'Admin') {
    return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, request.url));
  }
  // ... similar for other roles
}
```

**Token Refresh Strategy**:
- Access token: 15 minutes
- Refresh token: 7 days (rotated on use)
- Silent refresh via API route before expiration

### 4. Real-Time Tracking Integration

**Decision**: Socket.io-client with custom React hook

**Rationale**:
- Backend already uses Socket.io
- Proven reliability for real-time features
- Built-in reconnection handling

**Implementation Pattern**:
```typescript
// hooks/useTrackingSocket.ts
export function useTrackingSocket(shipmentId: string) {
  const [location, setLocation] = useState<Location | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: { token: getAccessToken() }
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on(`shipment:${shipmentId}:location`, setLocation);

    return () => socket.disconnect();
  }, [shipmentId]);

  return { location, connected };
}
```

**Connection Status UI**:
- Green indicator: Connected, receiving updates
- Yellow indicator: Reconnecting
- Red indicator: Disconnected, showing last known location

### 5. Map Library Selection

**Decision**: Leaflet with React-Leaflet

**Rationale**:
- Open source, no API key needed
- Lightweight (40KB gzipped)
- Extensive plugin ecosystem
- SSR compatible with dynamic imports

**Implementation Notes**:
```typescript
// Dynamic import to avoid SSR issues
const Map = dynamic(() => import('@/components/maps/TrackingMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />
});
```

**Tile Provider**: OpenStreetMap (free, no API key)
```typescript
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; OpenStreetMap contributors'
/>
```

**Alternatives Considered**:
- Google Maps: Rejected (cost, complexity)
- Mapbox: Rejected (requires API key, usage limits)
- MapLibre: Good alternative but smaller ecosystem

### 6. Form Handling Strategy

**Decision**: React Hook Form + Zod

**Rationale**:
- React Hook Form: Minimal re-renders, excellent performance
- Zod: TypeScript-first validation, runtime type checking
- Integration: `@hookform/resolvers/zod` for seamless validation

**Schema Pattern**:
```typescript
// schemas/shipment.ts
export const createShipmentSchema = z.object({
  pricingType: z.enum(['BIDDING', 'FIXED_PRICE']),
  origin: z.object({
    address: z.string().min(5, 'Address required'),
    country: z.string().min(2),
  }),
  destination: z.object({
    address: z.string().min(5),
    country: z.string().min(2),
  }),
  cargoDetails: z.object({
    description: z.string().min(10),
    weight: z.number().positive(),
    hazardous: z.boolean().default(false),
  }),
  estimatedPickupDate: z.date(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
```

### 7. Data Fetching with Tanstack Query

**Decision**: Tanstack Query v5 for server state management

**Rationale**:
- Automatic caching and refetching
- Optimistic updates support
- Infinite scroll built-in
- DevTools for debugging

**Query Key Convention**:
```typescript
// Hierarchical keys for cache invalidation
['shipments']                    // All shipments
['shipments', 'list', { status, page }]  // Filtered list
['shipments', 'detail', shipmentId]      // Single shipment
['applications', 'shipment', shipmentId] // Applications for shipment
```

**Mutation Pattern**:
```typescript
const createShipment = useMutation({
  mutationFn: (data: CreateShipmentInput) => api.shipments.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
    toast.success('Shipment created');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

### 8. File Upload Handling

**Decision**: Native fetch with FormData, progress via XMLHttpRequest

**Rationale**:
- Backend uses multer (standard multipart handling)
- Progress events needed for UX
- Chunked upload not required (10MB limit)

**Implementation Pattern**:
```typescript
// hooks/useFileUpload.ts
export function useFileUpload() {
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, entityType: string, entityId: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        setProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.onload = () => resolve(JSON.parse(xhr.response));
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('POST', '/api/documents/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
      xhr.send(formData);
    });
  };

  return { upload, progress };
}
```

### 9. Responsive Design Approach

**Decision**: Mobile-first with Tailwind breakpoints

**Breakpoint Strategy**:
```typescript
// tailwind.config.ts
screens: {
  'sm': '640px',   // Tablet portrait
  'md': '768px',   // Tablet landscape
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
}
```

**Layout Patterns**:
- Dashboard sidebar: Hidden on mobile, hamburger menu
- Data tables: Card view on mobile, table on desktop
- Forms: Single column on mobile, multi-column on desktop

### 10. Theme Implementation (Dark Mode)

**Decision**: CSS variables with class-based switching, persisted to localStorage

**Implementation**:
```css
/* globals.css */
:root {
  --background: 246 246 246;
  --surface: 255 255 255;
  --text-primary: 54 54 54;
}

.dark {
  --background: 26 26 26;
  --surface: 45 45 45;
  --text-primary: 229 229 229;
}
```

**Theme Store**:
```typescript
// stores/theme.ts
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((s) => ({
        theme: s.theme === 'light' ? 'dark' : 'light'
      })),
    }),
    { name: 'theme-storage' }
  )
);
```

## Technology Stack Summary

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | shadcn/ui | latest |
| State (Client) | Zustand | 4.x |
| State (Server) | Tanstack Query | 5.x |
| Forms | React Hook Form + Zod | 7.x + 3.x |
| Maps | React-Leaflet | 4.x |
| Real-time | Socket.io-client | 4.x |
| Testing | Jest + RTL + Playwright | 29.x |
| Icons | Lucide React | latest |

## Open Items for Implementation

1. **Almarine Figma Design**: Extract additional design tokens when rate limit resets
2. **API Response Types**: Generate from OpenAPI spec if available, otherwise manual definition
3. **E2E Test Scenarios**: Define critical user flows for Playwright tests
4. **Accessibility Audit**: Plan WCAG 2.1 AA compliance checks
