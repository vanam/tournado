import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from './errorBoundary';

vi.mock('../i18n/useTranslation', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => {
      const translations: Record<string, string> = {
        'error.title': 'Something went wrong',
        'error.message': 'An unexpected error occurred.',
        'error.backHome': 'Back to Home',
      };
      return translations[key] ?? key;
    },
  }),
}));

const ThrowError = ({ shouldThrow }: { readonly shouldThrow: boolean }): null => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
}

const originalError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    vi.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('renders fallback UI when an error is thrown', () => {
    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </HashRouter>,
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('An unexpected error occurred.')).toBeDefined();
    expect(screen.getByText('Back to Home')).toBeDefined();
  });

  it('displays error message when available', () => {
    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </HashRouter>,
    );

    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback')).toBeDefined();
  });

  it('renders link to home page', () => {
    render(
      <HashRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </HashRouter>,
    );

    const link = screen.getByRole('link', { name: 'Back to Home' });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('#/');
  });
});
