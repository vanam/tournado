import { useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { CustomDialog } from './CustomDialog';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { parseBulkInput } from '../utils/importUtils';

interface ImportPlayersModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (players: Array<{ name: string; elo?: number }>) => void;
  existingNames: string[];
}

interface ParseError {
  line: number;
  msg: string;
}

export const ImportPlayersModal = ({
  open,
  onClose,
  onImport,
  existingNames,
}: ImportPlayersModalProps): ReactElement => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<ParseError[]>([]);

  function handleImport(): void {
    const { parsed, errors: parseErrors } = parseBulkInput(text, existingNames);
    const newErrors: ParseError[] = parseErrors.map((e) => ({ line: e.line, msg: t(e.msgKey) }));

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    if (parsed.length === 0) {
      setErrors([{ line: 0, msg: t('players.importErrorNone') }]);
      return;
    }

    setErrors([]);
    setText('');
    onImport(parsed);
    onClose();
  }

  function handleClose(): void {
    setText('');
    setErrors([]);
    onClose();
  }

  return (
    <CustomDialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }} onPrimaryAction={handleImport}>
      <DialogContent className="z-150 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('players.importTitle')}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">{t('players.importDesc')}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <textarea
            className="w-full min-h-[160px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            placeholder={t('players.importPlaceholder')}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setErrors([]);
            }}
          />
          {errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {errors.map((err) => (
                <li key={`${err.line}-${err.msg}`} className="text-sm text-[var(--color-accent)]">
                  {err.line > 0
                    ? t('players.importError', { n: String(err.line), msg: err.msg })
                    : err.msg}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="primary-ghost" onClick={handleClose}>
            {t('players.importCancel')}
          </Button>
          <Button variant="secondary" onClick={handleImport}>
            {t('players.importConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
