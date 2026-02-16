import type { ReactElement } from 'react';
import { CustomDialog } from './CustomDialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps): ReactElement => {
  return (
    <CustomDialog open={true} onOpenChange={(open) => { if (!open) onCancel(); }} onPrimaryAction={onConfirm}>
      <DialogContent className="z-150">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="accent" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
