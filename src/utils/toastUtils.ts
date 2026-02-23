import { toast } from 'sonner';
import type { ToastOptions } from '../components/Toast';

export const showToast = (options: ToastOptions): void => {
  const action = options.action ? {
    label: options.action.label,
    onClick: options.action.onClick,
  } : undefined;

  const toastOpts = {
    ...(options.id !== undefined && { id: options.id }),
    ...(options.duration !== undefined && { duration: options.duration }),
    ...(action && { action }),
  };

  toast(options.message, toastOpts);
};