'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ClipboardList,
  CheckSquare,
  MapPin,
  User,
  History,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserRole } from '@/types/api';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navigationByRole: Record<UserRole, NavItem[]> = {
  Admin: [
    { title: 'لوحة التحكم', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'المستخدمون', href: '/admin/users', icon: Users },
    { title: 'الشحنات', href: '/admin/shipments', icon: Package },
    { title: 'الطلبات', href: '/admin/applications', icon: ClipboardList },
    { title: 'الشاحنات', href: '/admin/trucks', icon: Truck },
    { title: 'الموافقات', href: '/admin/approvals', icon: CheckSquare },
    { title: 'المستندات', href: '/admin/documents', icon: FileText },
    { title: 'التحليلات', href: '/admin/analytics', icon: BarChart3 },
    { title: 'الإعدادات', href: '/admin/settings', icon: Settings },
  ],
  Merchant: [
    { title: 'لوحة التحكم', href: '/merchant/dashboard', icon: LayoutDashboard },
    { title: 'الشحنات', href: '/merchant/shipments', icon: Package },
    { title: 'التحليلات', href: '/merchant/analytics', icon: BarChart3 },
    { title: 'الإعدادات', href: '/merchant/settings', icon: Settings },
  ],
  TruckOwner: [
    { title: 'لوحة التحكم', href: '/truck-owner/dashboard', icon: LayoutDashboard },
    { title: 'الشحنات المتاحة', href: '/truck-owner/shipments', icon: Package },
    { title: 'الطلبات', href: '/truck-owner/applications', icon: ClipboardList },
    { title: 'الشحنات المسندة', href: '/truck-owner/assigned', icon: MapPin },
    { title: 'الأسطول', href: '/truck-owner/fleet', icon: Truck },
    { title: 'الإعدادات', href: '/truck-owner/settings', icon: Settings },
  ],
  Driver: [
    { title: 'لوحة التحكم', href: '/driver/dashboard', icon: LayoutDashboard },
    { title: 'شحناتي', href: '/driver/shipments', icon: Package },
    { title: 'تسجيل الدخول/الخروج', href: '/driver/checkin', icon: CheckSquare },
    { title: 'السجل', href: '/driver/history', icon: History },
    { title: 'الملف الشخصي', href: '/driver/profile', icon: User },
    { title: 'الإعدادات', href: '/driver/settings', icon: Settings },
  ],
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = navigationByRole[role] || [];

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r bg-sidebar/95 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link
            href={`/${role.toLowerCase().replace('owner', '-owner')}/dashboard`}
            className="flex items-center gap-2"
          >
            <Truck className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-wide">اللوجستي</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground">
            {role.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
