import { toast } from 'sonner';
import type { ToastOptions } from '../components/Toast';

export const showToast = (options: ToastOptions): void => {
  const action = options.action ? {
    label: options.action.label,
    onClick: options.action.onClick,
  } : undefined;

  if (options.duration === undefined) {
    toast(options.message, { action });
  } else {
    toast(options.message, { duration: options.duration, action });
  }
};