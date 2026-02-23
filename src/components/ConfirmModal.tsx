import type { ReactElement } from 'react';
import { AlertTriangle } from 'lucide-react';
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--color-accent)] shrink-0" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="primary-ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="secondary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
