import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="brand-theme brand-hero relative min-h-screen overflow-hidden">
      <div className="pointer-events-none brand-glow -left-24 top-10 h-56 w-56 bg-primary/16" />
      <div className="pointer-events-none brand-glow -right-20 top-32 h-64 w-64 bg-secondary/18" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/22 via-transparent to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-foreground/90 to-transparent opacity-70" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image src="/brand/logo.png" alt="Almarine" width={140} height={140} priority />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">اللوجستي</h1>
          <p className="mt-2 text-sm text-secondary">
            منصة موثوقة تربط التجار وأصحاب الشاحنات والسائقين
          </p>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
