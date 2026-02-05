'use client';

import {
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Building,
  Truck,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/types/entities';

interface UserDetailCardProps {
  user: User | null;
  isLoading?: boolean;
  showStats?: boolean;
}

const roleLabels: Record<string, string> = {
  Admin: 'مدير النظام',
  Merchant: 'تاجر',
  TruckOwner: 'مالك شاحنة',
  Driver: 'سائق',
};

const roleIcons: Record<string, React.ElementType> = {
  Admin: Shield,
  Merchant: Building,
  TruckOwner: Truck,
  Driver: Package,
};

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function UserDetailCard({
  user,
  isLoading = false,
  showStats = true,
}: UserDetailCardProps) {
  if (isLoading) {
    return <UserDetailCardSkeleton />;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">لم يتم العثور على بيانات المستخدم</p>
        </CardContent>
      </Card>
    );
  }

  const RoleIcon = roleIcons[user.role] || Shield;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RoleIcon className="h-5 w-5" />
            معلومات المستخدم
          </CardTitle>
          <Badge
            className={user.active ? 'bg-green-500/10 text-green-600' : ''}
            variant={user.active ? 'default' : 'destructive'}
          >
            {user.active ? 'مفعل' : 'معطل'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-semibold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">
                {roleLabels[user.role] || user.role}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
              <p className="font-medium">{user.phone || '--'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          {user.companyAddress && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm text-muted-foreground">عنوان الشركة</p>
                <p className="font-medium truncate">{user.companyAddress}</p>
              </div>
            </div>
          )}
        </div>

        {showStats && (
          <>
            <Separator />

            {/* Role-specific stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">إحصائيات</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {user.role === 'Merchant' && (
                  <>
                    <StatItem label="الشحنات" value="--" />
                    <StatItem label="النشطة" value="--" />
                    <StatItem label="المكتملة" value="--" />
                  </>
                )}
                {user.role === 'TruckOwner' && (
                  <>
                    <StatItem label="الشاحنات" value="--" />
                    <StatItem label="السائقين" value="--" />
                    <StatItem label="العروض" value="--" />
                  </>
                )}
                {user.role === 'Driver' && (
                  <>
                    <StatItem label="التسليمات" value="--" />
                    <StatItem label="المسافة" value="-- كم" />
                    <StatItem label="التقييم" value="--" />
                  </>
                )}
                {user.role === 'Admin' && (
                  <p className="text-sm text-muted-foreground col-span-3">
                    مدير النظام - صلاحيات كاملة
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Registration date */}
        <div className="pt-2 text-xs text-muted-foreground">
          تاريخ التسجيل: {formatDate(user.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function UserDetailCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default UserDetailCard;
