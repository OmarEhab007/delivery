/**
 * Unit tests for ErrorBoundary component
 * T019 - Error boundary catches errors, renders Arabic fallback UI, reset works
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/shared/error-boundary';

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>المحتوى يعمل</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>المحتوى يعمل</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('المحتوى يعمل')).toBeInTheDocument();
  });

  it('catches thrown errors and renders Arabic fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show Arabic error title
    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
    // Should show Arabic retry button
    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
    // Should show Arabic home button
    expect(screen.getByText('الصفحة الرئيسية')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('reset button clears error state and attempts to re-render children', () => {
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>المحتوى يعمل</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();

    // Stop throwing before clicking reset
    shouldThrow = false;

    // Click reset / retry button
    fireEvent.click(screen.getByText('إعادة المحاولة'));

    // Should show children again
    expect(screen.getByText('المحتوى يعمل')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>خطأ مخصص</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('خطأ مخصص')).toBeInTheDocument();
  });
});
