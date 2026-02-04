'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { toast } from 'sonner';

const roleRedirectMap: Record<string, string> = {
  Admin: '/admin/dashboard',
  Merchant: '/merchant/dashboard',
  TruckOwner: '/truck-owner/dashboard',
  Driver: '/driver/dashboard',
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const roleParam = searchParams.get('role');
  const redirectParam = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      const user = useAuthStore.getState().user;
      toast.success('تم تسجيل الدخول بنجاح', {
        description: `مرحبًا بعودتك يا ${user?.name ?? ''}`.trim(),
      });
      const fallbackPath = roleRedirectMap[user?.role || 'Merchant'] || '/merchant/dashboard';
      router.push(redirectParam ? decodeURIComponent(redirectParam) : fallbackPath);
    } catch (error) {
      toast.error('تعذر تسجيل الدخول', {
        description: error instanceof Error ? error.message : 'يرجى التحقق من البيانات',
      });
    }
  };

  return (
    <Card className="rounded-3xl border-border/70 bg-white/95 shadow-[0_20px_40px_rgba(59,36,24,0.15)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-foreground">تسجيل الدخول</CardTitle>
        <CardDescription className="text-sm text-secondary/90">
          أدخل بياناتك للوصول إلى حسابك {roleParam ? 'والبدء بدورك المحدد' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="ادخل كلمة المرور"
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جارٍ تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">ليس لديك حساب؟ </span>
          <Link href="/register" className="font-medium text-primary hover:underline">
            أنشئ حسابًا جديدًا
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
