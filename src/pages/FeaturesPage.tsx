import { type ReactElement, useEffect, Fragment } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { Link, useLocation } from 'react-router-dom';
import { useAnalytics } from '@/utils/analytics';
import { Button } from '@/components/ui/Button';
import { Check, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/Table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

type Section = {
  titleKey: string;
  features: string[];
};

const SECTIONS: Section[] = [
  {
    titleKey: 'features.section1',
    features: [
      'format.SINGLE_ELIM',
      'format.DOUBLE_ELIM',
      'format.ROUND_ROBIN',
      'format.GROUPS_TO_BRACKET',
      'format.SWISS',
    ],
  },
  {
    titleKey: 'features.section2',
    features: ['create.singles', 'create.doubles'],
  },
  {
    titleKey: 'features.section3',
    features: ['features.playerLibrary', 'features.playerGroups', 'features.playerDetail'],
  },
  {
    titleKey: 'features.section4',
    features: ['features.scoringSets', 'features.scoringPoints'],
  },
  {
    titleKey: 'features.section5',
    features: ['features.fullscreen', 'features.tabSync', 'features.offlineMode', 'features.installApp'],
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
                {section.features.map(featureKey => (
                  <TableRow key={featureKey}>
                    <TableCell className="py-2.5 pr-3 text-sm text-[var(--color-text)]">
                      {t(featureKey)}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="ml-1.5 inline-flex align-middle text-[var(--color-muted)] hover:text-[var(--color-text)] focus:outline-none">
                            <Info size={14} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top">
                          {t(`${featureKey}.info`)}
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
