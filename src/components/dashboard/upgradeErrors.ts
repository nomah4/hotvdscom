import type { useTranslation } from '../../i18n/LanguageContext';

export type UpgradeText = ReturnType<typeof useTranslation<'dashboard'>>['upgrade'];

/**
 * Код отказа биллинга — в фразу, которую может исполнить клиент.
 *
 * Принимает и `код: сообщение` из `toApiError`, и голый код из хука
 * (`upgrade_open_differs`). Незнакомое — общая фраза, а не сырой текст сервера.
 */
export function upgradeErrorMessage(raw: string, text: UpgradeText): string {
  const code = raw.split(':')[0].trim();
  switch (code) {
    case 'provisioning_not_ready':
      return text.errors.notReady;
    case 'renewal_in_progress':
      return text.errors.renewalInProgress;
    case 'upgrade_in_progress':
      return text.errors.upgradeInProgress;
    case 'upgrade_open_differs':
      return text.errors.openDiffers;
    case 'subscription_not_active':
    case 'package_not_configurable':
      return text.errors.notActive;
    case 'not_an_upgrade':
    case 'downgrade_not_supported':
      return text.errors.notAnUpgrade;
    case 'configuration_out_of_range':
    case 'configuration_step_mismatch':
      return text.errors.outOfRange;
    default:
      return text.errors.generic;
  }
}
