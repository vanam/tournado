import * as React from 'react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useModalStack } from '../hooks/useModalStack';

function shouldIgnoreEnterTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'button' || tag === 'a') return true;
  if (tag === 'input') {
    const type = (target.getAttribute('type') ?? '').toLowerCase();
    return type === 'button' || type === 'submit' || type === 'reset';
  }
  return tag === 'select';
}

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  children: ReactNode;
}

export const CustomDialog = ({
  open,
  onOpenChange,
  onPrimaryAction,
  primaryActionDisabled,
  children,
}: Readonly<CustomDialogProps>): React.JSX.Element => {
  const { isTopModal } = useModalStack();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (!isTopModal() || event.isComposing) return;

      if (event.key === 'Escape') {
        onOpenChange(false);
        return;
      }

      if (event.key === 'Enter' && onPrimaryAction && !primaryActionDisabled) {
        if (shouldIgnoreEnterTarget(event.target)) return;
        event.preventDefault();
        onPrimaryAction();
      }
    }

    if (!open) return;

    window.addEventListener('keydown', onKeyDown);
    return (): void => { window.removeEventListener('keydown', onKeyDown); };
  }, [open, isTopModal, onOpenChange, onPrimaryAction, primaryActionDisabled]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};
