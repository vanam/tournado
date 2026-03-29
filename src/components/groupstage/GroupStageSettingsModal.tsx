import { useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { CustomDialog } from '../CustomDialog';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { BracketType } from '../../types';
import type { Group } from '../../types';

interface GroupStageSettingsModalProps {
  open: boolean;
  groups: Group[];
  initialQualifiers: number[];
  initialBracketType: BracketType;
  onSave: (qualifiers: number[], bracketType: BracketType) => void;
  onClose: () => void;
}

export const GroupStageSettingsModal = ({
  open,
  groups,
  initialQualifiers,
  initialBracketType,
  onSave,
  onClose,
}: GroupStageSettingsModalProps): ReactElement => {
  const { t } = useTranslation();
  const [qualifiers, setQualifiers] = useState(initialQualifiers);
  const [bracketType, setBracketType] = useState(initialBracketType);

  const isSaveDisabled = qualifiers.some((q) => Number.isNaN(q) || q < 0);

  function handleSave(): void {
    if (isSaveDisabled) return;
    onSave(qualifiers, bracketType);
    onClose();
  }

  function handleQualifierChange(index: number, value: string): void {
    const parsed = Number.parseInt(value, 10);
    setQualifiers((prev) => {
      const next = [...prev];
      next[index] = parsed;
      return next;
    });
  }

  return (
    <CustomDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }} onPrimaryAction={handleSave}>
      <DialogContent className="z-150 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('groupStage.settingsTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text)]">{t('create.qualifiersLabel')}</p>
            {groups.map((group, index) => (
              <div key={group.id} className="flex items-center gap-3">
                <label
                  htmlFor={`qualifier-${group.id}`}
                  className="text-sm text-[var(--color-muted)] w-24 shrink-0"
                >
                  {t('groupStage.groupTitle', { label: group.name })}
                </label>
                <input
                  id={`qualifier-${group.id}`}
                  type="number"
                  min="0"
                  value={Number.isNaN(qualifiers[index] ?? Number.NaN) ? '' : (qualifiers[index] ?? '')}
                  onChange={(e) => { handleQualifierChange(index, e.target.value); }}
                  className="w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text)]">{t('create.bracketTypeLabel')}</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(BracketType).map((bt) => (
                <label
                  key={bt}
                  className={`flex-1 text-center px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    bracketType === bt
                      ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="bracketType"
                    value={bt}
                    checked={bracketType === bt}
                    onChange={() => { setBracketType(bt); }}
                    className="sr-only"
                  />
                  {t(bt === BracketType.SINGLE_ELIM ? 'create.bracketTypeSingle' : 'create.bracketTypeDouble')}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="primary-ghost" onClick={onClose}>
            {t('score.cancel')}
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={isSaveDisabled}>
            {t('score.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
