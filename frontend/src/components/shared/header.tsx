'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { ConnectionStatusDot } from './connection-status';
import { NotificationBell } from './notification-bell';
import { NotificationDropdown } from './notification-dropdown';
import { useAuthStore } from '@/stores/auth-store';
import { useSocket } from '@/lib/providers/socket-provider';
import { useNotificationSocket } from '@/hooks/use-notifications';
import { toast } from 'sonner';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { connectionStatus } = useSocket();
  useNotificationSocket(); // Initialize notification socket listener
  const rolePath = user?.role ? user.role.toLowerCase().replace('owner', '-owner') : null;
  const settingsHref = rolePath ? `/${rolePath}/settings` : '/settings';
  const profileHref = user?.role === 'Driver' ? '/driver/profile' : settingsHref;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
    } catch {
      toast.error('تعذر تسجيل الخروج');
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search placeholder - can be expanded later */}
      <div className="hidden flex-1 md:block" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ConnectionStatusDot status={connectionStatus} size="sm" className="mr-1" />
        <ThemeToggle />

        {/* Notifications */}
        <NotificationDropdown
          trigger={<NotificationBell />}
        />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/70 bg-background/95 p-2 shadow-xl">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || 'مستخدم'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(profileHref)}>
              <User className="ml-2 h-4 w-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(settingsHref)}>
              <Settings className="ml-2 h-4 w-4" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
