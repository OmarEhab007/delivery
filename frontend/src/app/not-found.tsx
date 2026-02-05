/**
 * 404 Not Found Page
 * Task: T145 [P] - Create 404 not found page
 */

import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-bold text-primary mb-2">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4">الصفحة غير موجودة</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              الصفحة الرئيسية
            </Link>
          </Button>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-3">روابط قد تساعدك:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="link" size="sm" asChild>
              <Link href="/merchant/dashboard">لوحة التاجر</Link>
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link href="/truck-owner/dashboard">لوحة مالك الشاحنة</Link>
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link href="/driver/dashboard">لوحة السائق</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
