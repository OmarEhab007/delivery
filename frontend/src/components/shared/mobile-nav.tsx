'use client';

/**
 * Mobile Responsive Navigation
 * Task: T150 - Create mobile responsive navigation
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Home,
  Package,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useCurrentUser, useLogout } from '@/hooks/use-user';
import type { UserRole } from '@/types/api';

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

interface MobileNavProps {
  className?: string;
}

// =============================================================================
// NAVIGATION CONFIG
// =============================================================================

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'Merchant':
      return [
        { title: 'الرئيسية', href: '/merchant/dashboard', icon: Home },
        { title: 'الشحنات', href: '/merchant/shipments', icon: Package },
        { title: 'التحليلات', href: '/merchant/analytics', icon: FileText },
        { title: 'الإعدادات', href: '/merchant/settings', icon: Settings },
      ];

    case 'TruckOwner':
      return [
        { title: 'الرئيسية', href: '/truck-owner/dashboard', icon: Home },
        { title: 'الشحنات المتاحة', href: '/truck-owner/shipments', icon: Package },
        { title: 'طلباتي', href: '/truck-owner/applications', icon: FileText },
        { title: 'المسندة', href: '/truck-owner/assigned', icon: Truck },
        {
          title: 'إدارة الأسطول',
          icon: Truck,
          children: [
            { title: 'الشاحنات', href: '/truck-owner/fleet', icon: Truck },
            { title: 'السائقين', href: '/truck-owner/fleet/drivers', icon: Users },
          ],
        },
        { title: 'الإعدادات', href: '/truck-owner/settings', icon: Settings },
      ];

    case 'Driver':
      return [
        { title: 'الرئيسية', href: '/driver/dashboard', icon: Home },
        { title: 'الشحنات', href: '/driver/shipments', icon: Package },
        { title: 'تسجيل الحضور', href: '/driver/checkin', icon: FileText },
        { title: 'السجل', href: '/driver/history', icon: FileText },
        { title: 'الملف الشخصي', href: '/driver/profile', icon: User },
        { title: 'الإعدادات', href: '/driver/settings', icon: Settings },
      ];

    case 'Admin':
      return [
        { title: 'الرئيسية', href: '/admin/dashboard', icon: Home },
        { title: 'المستخدمون', href: '/admin/users', icon: Users },
        { title: 'الشحنات', href: '/admin/shipments', icon: Package },
        { title: 'الشاحنات', href: '/admin/trucks', icon: Truck },
        { title: 'الطلبات', href: '/admin/applications', icon: FileText },
        { title: 'الموافقات', href: '/admin/approvals', icon: FileText },
        { title: 'المستندات', href: '/admin/documents', icon: FileText },
        { title: 'التحليلات', href: '/admin/analytics', icon: FileText },
        { title: 'الإعدادات', href: '/admin/settings', icon: Settings },
      ];

    default:
      return [];
  }
};

// =============================================================================
// NAV ITEM COMPONENT
// =============================================================================

interface NavItemProps {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}

function MobileNavItem({ item, pathname, onNavigate }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = item.href ? pathname === item.href : false;
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors',
              'hover:bg-accent text-foreground'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mr-6 mt-1 space-y-1 border-r pr-4">
            {item.children?.map((child) => (
              <MobileNavItem
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={onNavigate}
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent text-foreground'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{item.title}</span>
      </div>
      {item.badge && item.badge > 0 && (
        <Badge variant={isActive ? 'secondary' : 'default'} className="text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

// =============================================================================
// MOBILE NAV COMPONENT
// =============================================================================

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  // Close nav on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = user?.role ? getNavItems(user.role) : [];
  const settingsHref = user?.role
    ? `/${user.role.toLowerCase().replace('owner', '-owner')}/settings`
    : '/settings';

  const handleLogout = async () => {
    await logout.mutateAsync();
    setIsOpen(false);
  };

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'Merchant':
        return 'تاجر';
      case 'TruckOwner':
        return 'مالك شاحنة';
      case 'Driver':
        return 'سائق';
      case 'Admin':
        return 'مسؤول';
      default:
        return '';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('md:hidden', className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">فتح القائمة</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-right">القائمة</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-6">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{getRoleLabel(user.role)}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Navigation Items */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.href || item.title}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </nav>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-1">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
                <span>الإشعارات</span>
              </Link>
              <Link
                href={settingsHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent"
              >
                <Settings className="h-5 w-5" />
                <span>الإعدادات</span>
              </Link>
            </div>
          </div>
        </ScrollArea>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// BOTTOM NAV COMPONENT (FOR MOBILE)
// =============================================================================

interface BottomNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
