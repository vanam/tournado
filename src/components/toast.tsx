import { type ReactElement } from 'react';
import { Toaster } from 'sonner';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  action?: ToastAction;
  dismissLabel?: string;
  duration?: number;
}

export const ToastContainer = (): ReactElement => {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        },
      }}
    />
  );
};
