'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { AccessDenied } from '@/components/shared/access-denied';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SocketProvider } from '@/lib/providers/socket-provider';
import { CommandPalette } from '@/components/shared/command-palette';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import type { UserRole } from '@/types/api';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Map URL paths to allowed roles
const pathRoleMap: Record<string, UserRole[]> = {
  '/admin': ['Admin'],
  '/merchant': ['Merchant', 'Admin'],
  '/truck-owner': ['TruckOwner', 'Admin'],
  '/driver': ['Driver', 'Admin'],
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    init();
  }, [initializeAuth]);

  // Register Cmd/Ctrl+K keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isLoading, isAuthenticated, router, pathname]);

  // Show loading while checking auth
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingPage message="جارٍ التحميل..." />
      </div>
    );
  }

  // If not authenticated, show nothing (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check role-based access
  const currentPath = '/' + pathname.split('/')[1]; // Get first segment like /admin, /merchant
  const allowedRoles = pathRoleMap[currentPath];

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <AccessDenied
          message={`هذه الصفحة متاحة فقط لأدوار: ${allowedRoles.join(' أو ')}`}
          redirectPath={`/${user.role.toLowerCase().replace('owner', '-owner')}/dashboard`}
        />
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar role={user.role} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar role={user.role} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
          <ErrorBoundary>
            <main className="flex-1 overflow-auto bg-background p-4 md:p-6">{children}</main>
          </ErrorBoundary>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </SocketProvider>
  );
}
