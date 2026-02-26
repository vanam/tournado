import { type ReactElement, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAnalytics } from '../utils/analytics';
import { TabBar } from '../components/common/TabBar';
import { SingleElimTab } from './formats/SingleElimTab';
import { DoubleElimTab } from './formats/DoubleElimTab';
import { RoundRobinTab } from './formats/RoundRobinTab';
import { GroupsTab } from './formats/GroupsTab';
import { SwissTab } from './formats/SwissTab';

type FormatTab = 'SINGLE_ELIM' | 'DOUBLE_ELIM' | 'ROUND_ROBIN' | 'GROUPS_TO_BRACKET' | 'SWISS';

const VALID_TABS: readonly FormatTab[] = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'GROUPS_TO_BRACKET', 'SWISS'];
const DEFAULT_TAB: FormatTab = 'SINGLE_ELIM';

export const FormatsPage = (): ReactElement => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tracker } = useAnalytics();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    tracker.trackPageView({});
  }, [location, tracker]);

  usePageTitle(t('formats.title'));

  const tabParam = searchParams.get('tab') as FormatTab | null;
  const activeTab: FormatTab =
    tabParam !== null && (VALID_TABS as readonly string[]).includes(tabParam) ? tabParam : DEFAULT_TAB;

  const handleTabChange = (tab: FormatTab): void => {
    setSearchParams({ tab }, { replace: true });
  };

  const tabs: { id: FormatTab; label: string }[] = [
    { id: 'SINGLE_ELIM', label: t('format.SINGLE_ELIM') },
    { id: 'DOUBLE_ELIM', label: t('format.DOUBLE_ELIM') },
    { id: 'ROUND_ROBIN', label: t('format.ROUND_ROBIN') },
    { id: 'GROUPS_TO_BRACKET', label: t('format.GROUPS_TO_BRACKET') },
    { id: 'SWISS', label: t('format.SWISS') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
        {t('formats.title')}
      </h1>

      <TabBar tabs={tabs} activeId={activeTab} onChange={handleTabChange} />

      {activeTab === 'SINGLE_ELIM' && <SingleElimTab />}
      {activeTab === 'DOUBLE_ELIM' && <DoubleElimTab />}
      {activeTab === 'ROUND_ROBIN' && <RoundRobinTab />}
      {activeTab === 'GROUPS_TO_BRACKET' && <GroupsTab />}
      {activeTab === 'SWISS' && <SwissTab />}
    </div>
  );
};
