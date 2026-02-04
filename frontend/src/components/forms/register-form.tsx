'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');
  const roleParam = searchParams.get('role');

  useEffect(() => {
    if (roleParam === 'merchant') {
      setValue('role', 'Merchant');
    }
    if (roleParam === 'truck-owner') {
      setValue('role', 'TruckOwner');
    }
  }, [roleParam, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      toast.success('تم إرسال طلب التسجيل', {
        description: 'طلبك قيد المراجعة وسيتم إشعارك عند الموافقة.',
      });
      router.push('/login');
    } catch (error) {
      toast.error('تعذر إنشاء الحساب', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
      });
    }
  };

  return (
    <Card className="rounded-3xl border-border/70 bg-white/95 shadow-[0_20px_40px_rgba(59,36,24,0.15)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-foreground">إنشاء حساب جديد</CardTitle>
        <CardDescription className="text-sm text-secondary/90">
          أدخل بياناتك للبدء في استخدام المنصة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              placeholder="أدخل الاسم الكامل"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="أدخل رقم الهاتف"
              {...register('phone')}
              disabled={isLoading}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="أنشئ كلمة مرور قوية"
                {...register('password')}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">نوع الحساب</Label>
            <Select
              onValueChange={(value) => setValue('role', value as 'Merchant' | 'TruckOwner')}
              value={selectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر دورك" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Merchant">تاجر / عميل</SelectItem>
                <SelectItem value="TruckOwner">مالك شاحنة</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>

          {selectedRole === 'TruckOwner' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">اسم الشركة</Label>
                <Input
                  id="companyName"
                  placeholder="أدخل اسم الشركة"
                  {...register('companyName')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">عنوان الشركة</Label>
                <Input
                  id="companyAddress"
                  placeholder="أدخل عنوان الشركة"
                  {...register('companyAddress')}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ إنشاء الحساب...
              </>
            ) : (
              'إنشاء الحساب'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
          <Link href="/login" className="font-medium text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;
