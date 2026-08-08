import { useState } from 'react';
import styled from 'styled-components';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { TariffCard } from '../components/ui/TariffCard';
import { PricingSlider } from '../components/pricing/PricingSlider';
import { useTranslation } from '../i18n/LanguageContext';
import { useTariffs } from '../api/catalogue';
import { useOrderIntent } from '../api/useCheckout';
import { DEFAULT_CURRENCY } from '../api/config';
import type { BillingPeriod } from '../data/tariffs';
import { media } from '../theme/breakpoints';

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const GroupTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h5};
  color: ${({ theme }) => theme.colors.indigo[900]};
  margin-bottom: 16px;
`;

const Toggle = styled.div`
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const ToggleOption = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $active }) => ($active ? theme.colors.neutral[0] : theme.colors.neutral[700])};
  background: ${({ theme, $active }) => ($active ? theme.colors.indigo[900] : 'transparent')};
`;

const TariffGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${media.tablet`
    grid-template-columns: repeat(2, 1fr);
  `}

  ${media.laptop`
    grid-template-columns: repeat(3, 1fr);
  `}
`;

const StatusMessage = styled.p<{ $tone?: 'error' }>`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.colors.semantic.error : theme.colors.neutral[600])};
`;

/**
 * Ordering another server without leaving the account.
 *
 * Buys nothing itself: both the plan cards and the configurator hand off through
 * the same `useOrderIntent` / `useCustomOrderIntent` that the public pricing page
 * uses, landing on the shared /checkout confirmation. That is deliberate — the
 * money path stays single, so terms acceptance, quoting and the gateway hand-off
 * cannot drift between "bought from the site" and "bought from the account".
 *
 * PricingSlider is reused whole rather than reimplemented; it already carries the
 * quoting, the price display and the order intent, and knows nothing about which
 * page hosts it.
 *
 * No currency toggle here, unlike /pricing: STOREFRONT_CURRENCIES has one entry,
 * and a control with a single option is furniture.
 */
export function NewServerPage() {
  const t = useTranslation('dashboard');
  const tp = useTranslation('pricing');
  const [yearly, setYearly] = useState(false);
  const { tariffs, isLoading, error } = useTariffs(DEFAULT_CURRENCY);
  const order = useOrderIntent();
  const period: BillingPeriod = yearly ? 'annual' : 'monthly';

  return (
    <DashboardShell>
      <Head>
        <Title>{t.newServer.title}</Title>
        <Subtitle>{t.newServer.subtitle}</Subtitle>
      </Head>

      <div>
        <GroupTitle>{t.newServer.plansTitle}</GroupTitle>
        <Toggle role="group">
          <ToggleOption type="button" $active={!yearly} onClick={() => setYearly(false)}>
            {tp.billingToggle.monthly}
          </ToggleOption>
          <ToggleOption type="button" $active={yearly} onClick={() => setYearly(true)}>
            {tp.billingToggle.yearly}
          </ToggleOption>
        </Toggle>

        {isLoading && <StatusMessage>{tp.comparison.loading}</StatusMessage>}
        {error && <StatusMessage $tone="error">{tp.comparison.error}</StatusMessage>}
        {!isLoading && !error && (
          <TariffGrid>
            {tariffs.map((tariff) => (
              <TariffCard
                key={tariff.id}
                // The card always shows a per-month figure; only which package
                // Order buys changes, and `period` carries that.
                tariff={yearly ? { ...tariff, priceMonthly: tariff.priceYearly / 12 } : tariff}
                period={period}
                onOrder={order}
              />
            ))}
          </TariffGrid>
        )}
      </div>

      <div>
        <GroupTitle>{t.newServer.configuratorTitle}</GroupTitle>
        <PricingSlider currency={DEFAULT_CURRENCY} />
      </div>
    </DashboardShell>
  );
}
