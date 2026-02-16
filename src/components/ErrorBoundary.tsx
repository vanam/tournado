/* eslint-disable sonarjs/function-return-type */
import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';

interface ErrorBoundaryProps {
  readonly fallback?: ReactNode;
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  readonly error: Error | null;
}

const ErrorFallback = ({ error }: ErrorFallbackProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12 px-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl p-8 max-w-md mx-auto">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
          {t('error.title')}
        </h2>
        <p className="text-[var(--color-muted)] mb-4">
          {t('error.message')}
        </p>
        {error && (
          <p className="text-xs text-[var(--color-muted)] mb-6 font-mono bg-[var(--color-bg)] p-3 rounded-lg overflow-auto max-h-32">
            {error.message}
          </p>
        )}
        <Link
          to="/"
          className="inline-block bg-[var(--color-primary)] text-[var(--color-surface)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          {t('error.backHome')}
        </Link>
      </div>
    </div>
  );
}
