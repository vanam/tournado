import type { ReactElement } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PlayerMoveButtonsProps {
  index: number;
  total: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const PlayerMoveButtons = ({
  index,
  total,
  onMoveUp,
  onMoveDown,
}: PlayerMoveButtonsProps): ReactElement => (
  <>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => { onMoveUp(index); }}
      disabled={index === 0}
      className="h-auto px-1.5 py-0.5 text-[var(--color-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)]"
    >
      <ChevronUp className="h-3.5 w-3.5" />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => { onMoveDown(index); }}
      disabled={index === total - 1}
      className="h-auto px-1.5 py-0.5 text-[var(--color-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)]"
    >
      <ChevronDown className="h-3.5 w-3.5" />
    </Button>
  </>
);
