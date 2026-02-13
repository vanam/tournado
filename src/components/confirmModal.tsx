import type { ReactElement } from 'react';
import { ModalShell } from './modalShell';

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
    <ModalShell onClose={onCancel} onPrimaryAction={onConfirm} zIndexClass="z-150">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-text)] mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="bg-[var(--color-accent)] text-[var(--color-surface)] px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
