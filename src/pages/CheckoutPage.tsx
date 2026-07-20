import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';
import { findByPackageCode, useTariffs } from '../api/catalogue';
import { useCheckout } from '../api/useCheckout';

const Panel = styled.div`
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const PlanName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const SpecList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const TotalRow = styled(Row)`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const TotalAmount = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const TermsLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const StatusMessage = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

// Mirrors TariffCard: currency comes from the catalogue, never a hardcoded
// symbol, since the catalogue is not limited to one currency.
function formatPrice(amount: number, currency: string, lang: string): string {
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * The step between choosing a plan and paying for it.
 *
 * Nothing is charged and no invoice exists until Confirm is pressed here — the
 * plan cards only navigate. The plan and its price are read back from the
 * catalogue using the package_code in the query string rather than passed in, so
 * a shared or hand-edited link can change which plan is shown but never what it
 * costs.
 */
export function CheckoutPage() {
  const t = useTranslation('pricing');
  const { lang } = useLang();
  const location = useLocation();
  const [params] = useSearchParams();
  const packageCode = params.get('package') ?? '';

  const { isAuthenticated, user, login, isLoading: authLoading } = useAuth();
  const { tariffs, isLoading, error } = useTariffs();
  const { confirm, isSubmitting, error: checkoutError } = useCheckout();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const match = findByPackageCode(tariffs, packageCode);
  const backToPricing = (
    <Button as={Link} to={localizePath(lang, routePaths.pricing)} $variant="secondary">
      {t.checkout.backToPricing}
    </Button>
  );

  if (isLoading || authLoading) {
    return (
      <Section $background="secondary">
        <PageContainer>
          <StatusMessage>{t.comparison.loading}</StatusMessage>
        </PageContainer>
      </Section>
    );
  }

  if (error || !match) {
    return (
      <Section $background="secondary">
        <PageContainer>
          <Panel>
            <Title>{error ? t.checkout.confirmTitle : t.checkout.planNotFoundTitle}</Title>
            <Note>{error ? t.comparison.error : t.checkout.planNotFoundBody}</Note>
            <Actions>{backToPricing}</Actions>
          </Panel>
        </PageContainer>
      </Section>
    );
  }

  const { tariff, period } = match;
  // The charged amount for the term actually being bought. Deliberately not the
  // per-month figure the plan cards show for an annual plan — this is the number
  // the customer is agreeing to hand over.
  const total = period === 'annual' ? tariff.priceYearly : tariff.priceMonthly;
  const email = user?.profile?.email;

  return (
    <Section $background="secondary">
      <PageContainer>
        <Panel>
          <Title>{t.checkout.confirmTitle}</Title>
          <Card>
            <PlanName>{tariff.name}</PlanName>
            <SpecList>
              <li>{tariff.cpu} vCPU</li>
              <li>{tariff.ram} {lang === 'ru' ? 'ГБ RAM' : 'GB RAM'}</li>
              <li>{tariff.ssd} {lang === 'ru' ? 'ГБ NVMe' : 'GB NVMe'}</li>
              <li>{tariff.traffic} {lang === 'ru' ? 'трафика' : 'traffic'}</li>
            </SpecList>
            <Divider />
            <Row>
              <span>{t.checkout.billingCycleLabel}</span>
              <span>{period === 'annual' ? t.billingToggle.yearly : t.billingToggle.monthly}</span>
            </Row>
            {isAuthenticated && email && (
              <Row>
                <span>{t.checkout.billedToLabel}</span>
                <span>{email}</span>
              </Row>
            )}
            <Divider />
            <TotalRow>
              <span>{t.checkout.totalLabel}</span>
              <TotalAmount>{formatPrice(total, tariff.currency, lang)}</TotalAmount>
            </TotalRow>
          </Card>

          <Note>{period === 'annual' ? t.checkout.renewalNoteAnnual : t.checkout.renewalNoteMonthly}</Note>

          {isAuthenticated ? (
            <>
              <TermsLabel>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  {t.checkout.termsPrefix}{' '}
                  <Link to={localizePath(lang, routePaths.terms)} target="_blank" rel="noreferrer">
                    {t.checkout.termsLink}
                  </Link>
                </span>
              </TermsLabel>
              {checkoutError && <ErrorText>{t.checkout.failed}</ErrorText>}
              <Actions>
                <Button
                  type="button"
                  $fullWidth
                  disabled={!termsAccepted || isSubmitting}
                  onClick={() => void confirm(tariff, period)}
                >
                  {isSubmitting ? t.checkout.starting : t.checkout.proceedToPayment}
                </Button>
                {backToPricing}
              </Actions>
            </>
          ) : (
            <Actions>
              {/* Returning here rather than to the pricing page is the whole
                  point of this being a route: the chosen plan survives the round
                  trip to ZITADEL, so there is nothing to pick again. */}
              <Button
                type="button"
                $fullWidth
                onClick={() => void login(`${location.pathname}${location.search}`)}
              >
                {t.checkout.signInToContinue}
              </Button>
              {backToPricing}
            </Actions>
          )}
        </Panel>
      </PageContainer>
    </Section>
  );
}
