'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const highlights = [
  {
    title: 'تسعير وعروض أسرع',
    description: 'قارن العروض وابدأ الشحن خلال دقائق بدل أيام.',
    icon: Zap,
  },
  {
    title: 'تتبع لحظي موثوق',
    description: 'خريطة حية وتنبيهات عند كل مرحلة من الرحلة.',
    icon: MapPin,
  },
  {
    title: 'مستندات جاهزة دائمًا',
    description: 'رفع وتوثيق المستندات بسهولة مع سجل مراجعة كامل.',
    icon: FileText,
  },
  {
    title: 'أمان وصلاحيات دقيقة',
    description: 'أدوار واضحة لكل مستخدم مع حماية متعددة الطبقات.',
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: 'أنشئ طلب الشحن',
    description: 'أدخل بيانات الشحنة والمسار ومتطلبات النقل.',
    icon: Truck,
  },
  {
    title: 'استلم العروض',
    description: 'شاهد العروض الموثوقة واختر الأنسب.',
    icon: CheckCircle2,
  },
  {
    title: 'تابع حتى التسليم',
    description: 'احصل على تحديثات دقيقة حتى وصول الشحنة.',
    icon: Clock,
  },
];

export default function HomePage() {
  return (
    <div className="brand-theme brand-hero relative min-h-screen overflow-hidden">
      <div className="pointer-events-none brand-glow -left-28 top-8 h-64 w-64 bg-primary/18" />
      <div className="pointer-events-none brand-glow -right-24 top-24 h-72 w-72 bg-secondary/18" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/18 via-transparent to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-foreground/90 to-transparent opacity-80" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-10 md:py-14">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/logo.png" alt="Almarine" width={56} height={56} priority />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">اللوجستي</p>
              <p className="text-xs text-secondary/90">Almarine Logistics</p>
            </div>
          </Link>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/80 px-4 py-2 text-xs font-semibold text-secondary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              منصة تشغيل الشحنات الذكية
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              منصة واحدة لإدارة الشحنات
              <span className="block text-primary">من الطلب حتى التسليم</span>
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              لا حاجة لاختيار بوابة. سجّل الدخول مرة واحدة وسيتم توجيهك تلقائياً
              حسب دورك، مع تجربة متكاملة للتجار وأصحاب الشاحنات والسائقين والإدارة.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/login">
                  ابدأ الآن
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-8"
              >
                <Link href="/login">تجربة مباشرة</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                تسجيل سريع خلال دقائق
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                تنبيهات حالة الشحنة
              </div>
            </div>
          </div>

          <Card className="border-border/60 bg-surface/90 shadow-[0_24px_60px_rgba(30,38,51,0.18)] backdrop-blur">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary/80">الشحنة الحالية</p>
                  <p className="text-lg font-semibold text-foreground">#ALM-2048</p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                  قيد النقل
                </span>
              </div>
              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">ميناء جدة</p>
                    <p className="text-xs text-muted-foreground">استلام الشحنة</p>
                  </div>
                </div>
                <div className="ms-1 h-6 border-r border-dashed border-border" />
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">ميناء الدمام</p>
                    <p className="text-xs text-muted-foreground">تسليم الشحنة</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">العروض المستلمة</p>
                  <p className="text-2xl font-semibold text-foreground">12</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">زمن الوصول</p>
                  <p className="text-2xl font-semibold text-foreground">36h</p>
                </div>
              </div>
              <Button asChild className="w-full rounded-full">
                <Link href="/login">الانتقال للوحة التحكم</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <Card
              key={item.title}
              className="group border-border/60 bg-surface/90 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="space-y-3 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/20">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-border/60 bg-surface/90 p-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold">
                  {index + 1}
                </span>
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-secondary/90">{step.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(140deg,_hsl(var(--primary)_/_0.18),_hsl(var(--muted)_/_0.85))] px-6 py-6 md:px-8">
          <div className="pointer-events-none absolute -left-16 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-6 h-44 w-44 rounded-full bg-secondary/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-3 py-1 text-xs font-medium text-secondary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                دخول موحّد لكل الأدوار
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground md:text-xl">جاهز للانطلاق؟</p>
                <p className="text-sm text-secondary/90 md:text-base">
                  سجّل الدخول مرة واحدة وسيتم توجيهك تلقائياً حسب دورك.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  تجربة دخول سلسة
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  صلاحيات دقيقة وآمنة
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/login">
                  تسجيل الدخول
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="rounded-full border border-border/60 bg-surface/70 px-4 py-2 text-xs text-secondary/90">
                تسجيل سريع خلال دقائق
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
