'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Truck, User, ShieldCheck, UserCog } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const roles = [
  {
    title: 'تاجر أو عميل',
    description:
      'اطلب شحنتك من أي مكان، وابدأ رحلة الشحن بثقة ووضوح كامل في المتابعة.',
    icon: User,
    href: '/login?role=merchant',
  },
  {
    title: 'مالك الشاحنة',
    description: 'قدّم عروضك على الشحنات المتاحة، وادِر أسطولك وسائقيك بسهولة.',
    icon: Truck,
    href: '/login?role=truck-owner',
  },
  {
    title: 'السائق',
    description: 'تابع الشحنات المسندة إليك، وشارك تحديثات الحالة والموقع لحظة بلحظة.',
    icon: UserCog,
    href: '/login?role=driver',
  },
  {
    title: 'المدير',
    description: 'تحكم كامل في المستخدمين والشحنات والتقارير مع صلاحيات إدارية شاملة.',
    icon: ShieldCheck,
    href: '/login?role=admin',
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,133,0,0.15),_transparent_45%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/20 via-transparent to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-[#2B1407] to-transparent opacity-90" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-6 py-12">
        <div className="flex w-full flex-col items-center gap-6 text-center">
          <div className="relative flex items-center justify-center">
            <Image
              src="/brand/logo.png"
              alt="Almarine"
              width={220}
              height={220}
              priority
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-secondary">منصة الشحن واللوجستيات</p>
            <h1 className="text-3xl font-semibold text-foreground md:text-4xl">من أنت؟</h1>
            <p className="text-base text-secondary/90">اختر بوابتك للبدء بسرعة وأمان.</p>
          </div>
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Link key={role.title} href={role.href} className="group">
              <Card className="border-border/70 bg-white/90 shadow-[0_10px_30px_rgba(59,36,24,0.12)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/50">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <role.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">{role.title}</h2>
                    <p className="text-sm text-secondary/90">{role.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex w-full flex-col items-start gap-2 rounded-3xl border border-border/60 bg-[linear-gradient(135deg,rgba(251,133,0,0.2),rgba(241,214,178,0.6))] px-6 py-5 text-sm text-foreground md:flex-row md:items-center md:justify-between">
          <span>ابدأ الآن وابقَ على اطلاع دائم بحالة شحناتك.</span>
          <span className="font-semibold text-primary">Almarine Logistics</span>
        </div>
      </main>
    </div>
  );
}
