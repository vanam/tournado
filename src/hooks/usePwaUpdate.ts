import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { showToast } from '../utils/toastUtils';
import { useTranslation } from '../i18n/useTranslation';
import { SW_UPDATE_INTERVAL_MS } from '../constants';

let registered = false;

export function usePwaUpdate(): void {
  const { t } = useTranslation();

  useEffect(() => {
    if (registered) return; // Prevent multiple registrations in development mode with React Strict Mode
    registered = true;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        showToast({
          message: t('toast.newVersion'),
          action: { label: t('toast.reload'), onClick: (): void => { void updateSW(true); } },
          dismissLabel: t('toast.dismiss'),
          duration: Infinity,
        });
      },
      onRegistered(registration) {
        if (registration) {
          setInterval(() => {
            void registration.update();
          }, SW_UPDATE_INTERVAL_MS);
        }
      },
    });
  }, [t]);
}
