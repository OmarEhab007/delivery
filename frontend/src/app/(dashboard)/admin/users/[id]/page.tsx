'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Truck,
  Package,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAdminUser, useAdminUpdateUser, useAdminDeleteUser } from '@/hooks/use-admin';

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

const roleLabels: Record<string, string> = {
  Admin: 'مدير النظام',
  Merchant: 'تاجر',
  TruckOwner: 'مالك شاحنة',
  Driver: 'سائق',
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useAdminUser(id);
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();

  const user = data?.data;

  const handleToggleActive = () => {
    if (user) {
      updateUser.mutate({
        id: user._id,
        data: { active: !user.active },
      });
    }
  };

  const handleDelete = () => {
    deleteUser.mutate(id, {
      onSuccess: () => {
        router.push('/admin/users');
      },
    });
  };

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">المستخدم غير موجود</h2>
        <p className="text-muted-foreground mt-2">لم يتم العثور على المستخدم المطلوب</p>
        <Button asChild className="mt-4">
          <Link href="/admin/users">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/users">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{roleLabels[user.role] || user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleActive}>
            {user.active ? (
              <>
                <UserX className="ml-2 h-4 w-4" />
                تعطيل الحساب
              </>
            ) : (
              <>
                <UserCheck className="ml-2 h-4 w-4" />
                تفعيل الحساب
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف هذا المستخدم نهائياً ولا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              معلومات المستخدم
              <Badge className={user.active ? 'bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-300' : ''} variant={user.active ? 'default' : 'destructive'}>
                {user.active ? 'مفعل' : 'معطل'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium">{user.email}</p>
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
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الدور</p>
                  <p className="font-medium">{roleLabels[user.role] || user.role}</p>
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
            </div>

            {user.companyAddress && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">عنوان الشركة</p>
                    <p className="font-medium">{user.companyAddress}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.role === 'Merchant' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">الشحنات</span>
                  </div>
                  <span className="font-semibold">--</span>
                </div>
              </>
            )}

            {user.role === 'TruckOwner' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">الشاحنات</span>
                  </div>
                  <span className="font-semibold">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">العروض المقدمة</span>
                  </div>
                  <span className="font-semibold">--</span>
                </div>
              </>
            )}

            {user.role === 'Driver' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">التسليمات</span>
                  </div>
                  <span className="font-semibold">--</span>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">تاريخ التسجيل</span>
              <span className="text-sm">{formatDate(user.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific sections */}
      {user.role === 'TruckOwner' && (
        <Card>
          <CardHeader>
            <CardTitle>الأسطول</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              عرض شاحنات وسائقين مالك الشاحنة هذا
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/admin/trucks?owner=${user._id}`}>
                عرض الشاحنات
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {user.role === 'Merchant' && (
        <Card>
          <CardHeader>
            <CardTitle>الشحنات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              عرض شحنات هذا التاجر
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/admin/shipments?merchant=${user._id}`}>
                عرض الشحنات
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
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

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
