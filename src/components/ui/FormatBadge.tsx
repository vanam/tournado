import type { ReactElement } from 'react';
import { Format } from '../../types';
import { Badge } from './Badge';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from './badgeVariants';
import { useTranslation } from '../../i18n/useTranslation';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const FORMAT_VARIANT: Record<Format, BadgeVariant> = {
  [Format.SINGLE_ELIM]: 'rose',
  [Format.DOUBLE_ELIM]: 'orange',
  [Format.ROUND_ROBIN]: 'blue',
  [Format.GROUPS_TO_BRACKET]: 'purple',
  [Format.SWISS]: 'emerald',
};

interface FormatBadgeProps {
  format: Format;
  className?: string;
}

export const FormatBadge = ({ format, className }: FormatBadgeProps): ReactElement => {
  const { t } = useTranslation();
  return (
    <Badge variant={FORMAT_VARIANT[format]} className={className}>
      {t(`format.${format}`)}
    </Badge>
  );
};
