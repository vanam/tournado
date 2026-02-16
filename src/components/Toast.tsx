import { type ReactElement } from 'react';
import { Toaster } from 'sonner';

export type { ToastAction, ToastOptions } from '../types';

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
