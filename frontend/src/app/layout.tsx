import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://allogisti.com'),
  title: {
    default: 'اللوجستي - منصة الشحن الذكية',
    template: '%s | اللوجستي',
  },
  description:
    'منصة شحن تربط التجار بأصحاب الشاحنات والسائقين لتنسيق الشحنات وتتبعها بسهولة. احصل على أفضل عروض الشحن وتتبع شحناتك في الوقت الفعلي.',
  keywords: ['شحن', 'لوجستيات', 'الشاحنات', 'التجار', 'نقل', 'شحن دولي', 'تتبع الشحنات', 'نقل البضائع'],
  authors: [{ name: 'Almarine' }],
  creator: 'Almarine',
  publisher: 'Almarine',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://allogisti.com',
    siteName: 'اللوجستي',
    title: 'اللوجستي - منصة الشحن الذكية',
    description: 'منصة شحن تربط التجار بأصحاب الشاحنات والسائقين لتنسيق الشحنات وتتبعها بسهولة.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'اللوجستي - منصة الشحن الذكية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'اللوجستي - منصة الشحن الذكية',
    description: 'منصة شحن تربط التجار بأصحاب الشاحنات والسائقين لتنسيق الشحنات وتتبعها بسهولة.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
