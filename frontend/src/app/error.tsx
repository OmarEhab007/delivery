'use client';

/**
 * Global Error Page
 * Task: T146 [P] - Create global error page
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">حدث خطأ غير متوقع</CardTitle>
            <CardDescription className="text-base">
              نعتذر عن هذا الخطأ. فريقنا التقني تم إعلامه وسيعمل على حله في أقرب وقت.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Details (Development Only) */}
            {isDev && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">تفاصيل الخطأ (وضع التطوير)</span>
                </div>
                <pre className="text-xs overflow-auto max-h-40 p-2 bg-background rounded">
                  {error.message}
                  {error.stack && (
                    <>
                      {'\n\n'}
                      {error.stack}
                    </>
                  )}
                </pre>
                {error.digest && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Error Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={reset} variant="outline" className="flex-1">
                <RefreshCw className="ml-2 h-4 w-4" />
                إعادة المحاولة
              </Button>
              <Button onClick={handleGoHome} className="flex-1">
                <Home className="ml-2 h-4 w-4" />
                الصفحة الرئيسية
              </Button>
            </div>

            {/* Support Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
              </p>
              <p className="text-sm font-medium mt-1">support@delivery-app.com</p>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
