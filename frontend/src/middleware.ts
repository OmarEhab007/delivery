import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Role-based route access (used client-side in dashboard layout)
// Keeping this for reference - actual role checking done client-side
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _roleRoutes: Record<string, string[]> = {
  Admin: ['/admin'],
  Merchant: ['/merchant'],
  TruckOwner: ['/truck-owner'],
  Driver: ['/driver'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (optional; main auth lives client-side)
  const token = request.cookies.get('accessToken')?.value;

  // If has token and trying to access login/register, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/merchant/dashboard', request.url));
  }

  // Note: Role-based access is handled client-side since we need to decode the JWT
  // Server middleware can't reliably decode JWT without importing crypto libs

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)',
  ],
};
