import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/utils/shadcnUtils';

interface FieldGroupLabelProps {
  children: ReactNode;
  className?: string;
}

export const FieldGroupLabel = ({ children, className }: FieldGroupLabelProps): ReactElement => (
  <p className={cn('text-sm font-medium text-[var(--color-text)] mb-1', className)}>
    {children}
  </p>
);
