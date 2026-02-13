import { useEffect, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';

const modalStack: symbol[] = [];

function pushModal(id: symbol): void {
  modalStack.push(id);
}

function removeModal(id: symbol): void {
  const index = modalStack.lastIndexOf(id);
  if (index !== -1) {
    modalStack.splice(index, 1);
  }
}

function isTopModal(id: symbol): boolean {
  return modalStack.at(-1) === id;
}

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

interface ModalShellProps {
  children: ReactNode;
  onClose?: () => void;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  disableClose?: boolean;
  zIndexClass?: string;
}

export const ModalShell = ({
  children,
  onClose,
  onPrimaryAction,
  primaryActionDisabled = false,
  disableClose = false,
  zIndexClass = 'z-50',
}: ModalShellProps): ReactElement => {
  const modalId = useRef<symbol>(Symbol('modal'));

  useEffect(() => {
    const currentId = modalId.current;
    pushModal(currentId);
    return (): void => { removeModal(currentId); };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (!isTopModal(modalId.current)) return;
      if (event.isComposing) return;
      if (event.key === 'Escape') {
        if (!onClose || disableClose) return;
        onClose();
        return;
      }
      if (event.key !== 'Enter') return;
      if (!onPrimaryAction || primaryActionDisabled) return;
      if (shouldIgnoreEnterTarget(event.target)) return;
      event.preventDefault();
      onPrimaryAction();
    }

    window.addEventListener('keydown', onKeyDown);
    return (): void => { window.removeEventListener('keydown', onKeyDown); };
  }, [disableClose, onClose, onPrimaryAction, primaryActionDisabled]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className={`fixed inset-0 bg-[var(--color-overlay)] backdrop-blur-[2px] flex items-center justify-center ${zIndexClass}`}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onClick={e => {
        if (e.target !== e.currentTarget) return;
        if (!onClose || disableClose) return;
        if (!isTopModal(modalId.current)) return;
        onClose();
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        onClick={event => { event.stopPropagation(); }}
        role="document"
      >{children}</div>
    </div>
  );
}
