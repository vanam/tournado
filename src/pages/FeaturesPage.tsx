import { type ReactElement, useEffect, Fragment } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link, useLocation } from 'react-router-dom';
import { useAnalytics } from '@/utils/analytics';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/Table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

type Feature = {
  key: string;
  experimental?: boolean;
};

type Section = {
  titleKey: string;
  features: Feature[];
};

const SECTIONS: Section[] = [
  {
    titleKey: 'features.section1',
    features: [
      { key: 'format.SINGLE_ELIM' },
      { key: 'format.DOUBLE_ELIM' },
      { key: 'format.ROUND_ROBIN' },
      { key: 'format.GROUPS_TO_BRACKET' },
      { key: 'format.SWISS' },
    ],
  },
  {
    titleKey: 'features.section2',
    features: [{ key: 'create.singles' }, { key: 'create.doubles' }],
  },
  {
    titleKey: 'features.section3',
    features: [
      { key: 'features.playerLibrary' },
      { key: 'features.playerGroups' },
      { key: 'features.playerDetail' },
    ],
  },
  {
    titleKey: 'features.section4',
    features: [{ key: 'features.scoringSets' }, { key: 'features.scoringPoints' }],
  },
  {
    titleKey: 'features.section5',
    features: [
      { key: 'features.fullscreen' },
      { key: 'features.tabSync' },
      { key: 'features.offlineMode' },
      { key: 'features.installApp' },
      { key: 'features.dataPortability', experimental: true },
    ],
  },
];

export const FeaturesPage = (): ReactElement => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tracker } = useAnalytics();

  useEffect(() => {
    tracker.trackPageView({});
  }, [location, tracker]);

  usePageTitle(t('features.title'));

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('features.title')}
      </h1>

      <div className="mt-6">
        <Table>
          <TableBody>
            {SECTIONS.map(section => (
              <Fragment key={section.titleKey}>
                <TableRow>
                  <TableHead
                    colSpan={2}
                    className="py-2.5 pr-2 text-left text-sm font-semibold text-[var(--color-muted)] bg-[var(--color-soft)]"
                  >
                    {t(section.titleKey)}
                  </TableHead>
                </TableRow>
                {section.features.map(feature => (
                  <TableRow key={feature.key}>
                    <TableCell className="py-2.5 pr-3 text-sm text-[var(--color-text)]">
                      {t(feature.key)}
                      {feature.experimental === true && (
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          {t('data.experimentalBadge')}
                        </span>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="ml-1.5 inline-flex align-middle text-[var(--color-muted)] hover:text-[var(--color-text)] focus:outline-none">
                            <Info size={14} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top">
                          {t(`${feature.key}.info`)}
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="py-2.5 text-center align-middle">
                      <Check className="inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            <TableRow>
              <TableCell />
              <TableCell className="pt-4 text-center">
                <Button asChild>
                  <Link to="/create">{t('home.newTournament')}</Link>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
