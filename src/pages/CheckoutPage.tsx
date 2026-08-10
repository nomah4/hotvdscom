import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { TermsModal } from '../components/legal/TermsModal';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';
import { findByPackageCode, useTariffs } from '../api/catalogue';
import { createQuote } from '../api/checkout';
import type { CustomVdsConfiguration, Quote } from '../api/checkout';
import { customVdsIntentKey, useCheckout } from '../api/useCheckout';
import { normalizeCurrency } from '../api/config';
import { datacenters } from '../data/datacenters';
import { displayPrice } from '../utils/money';

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

// The receipt address is a field rather than a Row: it is the one thing on this
// page the customer can change, and it needs to look like it.
const EmailField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const EmailInput = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral[900]};
  font-size: ${({ theme }) => theme.fontSizes.body};

  &:disabled {
    background: ${({ theme }) => theme.colors.neutral[100]};
  }
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

// Stacks the RUB total (primary, what's charged) above the informational USD
// figure and keeps both right-aligned against `TotalRow`'s label.
const TotalAmountBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

// Same muted treatment as `Note` below — this is informational, not the charge.
const TotalSecondary = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const TermsRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const TermsCheckbox = styled.input`
  margin-top: 2px;
  cursor: pointer;
`;

const TermsAcceptLabel = styled.label`
  cursor: pointer;
`;

// A button, not a link, because it opens a dialog rather than going anywhere.
// Styled to read as a link so it still looks like the terms are there to be read.
const TermsTrigger = styled.button`
  background: none;
  padding: 0;
  font: inherit;
  color: ${({ theme }) => theme.colors.indigo[900]};
  text-decoration: underline;
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

const CUSTOM_PACKAGE_CODE_RE = /^VDS_CUSTOM_(MONTHLY|ANNUAL)$/;

function customPeriodFromPackageCode(packageCode: string): 'monthly' | 'annual' | null {
  const match = CUSTOM_PACKAGE_CODE_RE.exec(packageCode);
  if (!match) return null;
  return match[1] === 'ANNUAL' ? 'annual' : 'monthly';
}

function positiveIntParam(params: URLSearchParams, key: string): number | null {
  const value = Number(params.get(key));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function customConfigurationFromParams(params: URLSearchParams): CustomVdsConfiguration | null {
  const cpu = positiveIntParam(params, 'cpu');
  const ram = positiveIntParam(params, 'ram_gb');
  const ssd = positiveIntParam(params, 'ssd_gb');
  const os = params.get('os') ?? '';
  const datacenter = params.get('datacenter') ?? '';
  if (!cpu || !ram || !ssd || !os || !datacenter) return null;
  return { cpu, ram_gb: ram, ssd_gb: ssd, os, datacenter };
}

function osDisplayName(value: string): string {
  return value
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
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
  const checkoutCurrency = normalizeCurrency(params.get('currency'));
  const customPeriod = customPeriodFromPackageCode(packageCode);

  const { isAuthenticated, user, login, isLoading: authLoading } = useAuth();
  const { tariffs, isLoading, error } = useTariffs(checkoutCurrency);
  const { confirm, confirmQuote, isSubmitting, error: checkoutError } = useCheckout();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  // Receipt address: prefilled from the account, editable, not persisted. A
  // customer may need the receipt to reach accounting rather than themselves.
  // Safe to edit — identity comes from the token subject, which Billing checks
  // itself, so this can only redirect a receipt.
  const [receiptEmail, setReceiptEmail] = useState('');

  // Seed the receipt address from the verified profile once the session settles,
  // which can happen after this page first renders. Kept up here with the other
  // hooks: below the early returns it would run conditionally, which is not
  // allowed and which lint catches. `current || profileEmail` means a value the
  // customer has typed is never overwritten by a later profile update.
  const profileEmail = user?.profile?.email;
  useEffect(() => {
    if (profileEmail) setReceiptEmail((current) => current || profileEmail);
  }, [profileEmail]);

  const customConfiguration = useMemo(
    () => (customPeriod ? customConfigurationFromParams(params) : null),
    [customPeriod, params],
  );
  const match = findByPackageCode(tariffs, packageCode);
  const backToPricing = (
    <Button as={Link} to={localizePath(lang, routePaths.pricing)} $variant="secondary">
      {t.checkout.backToPricing}
    </Button>
  );

  useEffect(() => {
    if (!customPeriod || !customConfiguration) {
      setQuote(null);
      setQuoteLoading(false);
      setQuoteError(null);
      return;
    }

    let active = true;
    setQuoteLoading(true);
    setQuoteError(null);
    createQuote({ packageCode, configuration: customConfiguration, currency: checkoutCurrency })
      .then((nextQuote) => {
        if (active) setQuote(nextQuote);
      })
      .catch((err: unknown) => {
        if (active) {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : 'quote_failed');
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customPeriod, customConfiguration, packageCode, checkoutCurrency]);

  if (authLoading || (!customPeriod && isLoading) || (customPeriod && quoteLoading && !quote)) {
    return (
      <Section $background="secondary">
        <PageContainer>
          <StatusMessage>{customPeriod ? t.checkout.pricingQuoteLoading : t.comparison.loading}</StatusMessage>
        </PageContainer>
      </Section>
    );
  }

  if ((!customPeriod && (error || !match)) || (customPeriod && (!customConfiguration || quoteError || !quote))) {
    return (
      <Section $background="secondary">
        <PageContainer>
          <Panel>
            <Title>{error || quoteError ? t.checkout.confirmTitle : t.checkout.planNotFoundTitle}</Title>
            <Note>{error ? t.comparison.error : quoteError ? t.checkout.pricingQuoteFailed : t.checkout.planNotFoundBody}</Note>
            <Actions>{backToPricing}</Actions>
          </Panel>
        </PageContainer>
      </Section>
    );
  }

  const period = customPeriod ?? match!.period;
  const total = customPeriod ? quote!.amount_minor / 100 : period === 'annual' ? match!.tariff.priceYearly : match!.tariff.priceMonthly;
  const currency = customPeriod ? quote!.currency : match!.tariff.currency;
  // Money is about to move here — RUB (what actually gets charged, and what
  // the receipt states) leads. `total` is major units, `displayPrice` wants minor.
  const price = displayPrice(Math.round(total * 100), currency, lang, 'charge');
  const planName = customPeriod ? t.checkout.customPlanName : match!.tariff.name;
  const dc = customConfiguration ? datacenters.find((item) => item.id === customConfiguration.datacenter) : null;
  const datacenterName = dc ? (lang === 'ru' ? dc.city : dc.cityEn) : customConfiguration?.datacenter;
  const specItems = customPeriod && customConfiguration
    ? [
        `${customConfiguration.cpu} vCPU`,
        `${customConfiguration.ram_gb} ${lang === 'ru' ? 'ГБ RAM' : 'GB RAM'}`,
        `${customConfiguration.ssd_gb} ${lang === 'ru' ? 'ГБ NVMe' : 'GB NVMe'}`,
        osDisplayName(customConfiguration.os),
        datacenterName,
      ]
    : [
        `${match!.tariff.cpu} vCPU`,
        `${match!.tariff.ram} ${lang === 'ru' ? 'ГБ RAM' : 'GB RAM'}`,
        `${match!.tariff.ssd} ${lang === 'ru' ? 'ГБ NVMe' : 'GB NVMe'}`,
        `${match!.tariff.traffic} ${lang === 'ru' ? 'трафика' : 'traffic'}`,
      ];
  const trimmedReceiptEmail = receiptEmail.trim();
  const receiptEmailLooksValid =
    trimmedReceiptEmail.includes('@') && !trimmedReceiptEmail.includes(' ');

  return (
    <Section $background="secondary">
      <PageContainer>
        <Panel>
          <Title>{t.checkout.confirmTitle}</Title>
          <Card>
            <PlanName>{planName}</PlanName>
            <SpecList>
              {specItems.map((item) => item && <li key={item}>{item}</li>)}
            </SpecList>
            <Divider />
            <Row>
              <span>{t.checkout.billingCycleLabel}</span>
              <span>{period === 'annual' ? t.billingToggle.yearly : t.billingToggle.monthly}</span>
            </Row>
            {isAuthenticated && (
              <EmailField>
                {t.checkout.billedToLabel}
                <EmailInput
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={receiptEmail}
                  disabled={isSubmitting}
                  onChange={(event) => setReceiptEmail(event.target.value)}
                />
              </EmailField>
            )}
            <Divider />
            <TotalRow>
              <span>{t.checkout.totalLabel}</span>
              <TotalAmountBlock>
                <TotalAmount>{price.primary}</TotalAmount>
                {price.secondary && <TotalSecondary>{price.secondary}</TotalSecondary>}
              </TotalAmountBlock>
            </TotalRow>
          </Card>

          <Note>{period === 'annual' ? t.checkout.renewalNoteAnnual : t.checkout.renewalNoteMonthly}</Note>

          {isAuthenticated ? (
            <>
              {/* The checkbox and the terms trigger are deliberately siblings rather
                  than both wrapped in one <label>: a click anywhere inside a label
                  toggles its control, so a customer opening the terms to read them
                  would have silently accepted them at the same time. */}
              <TermsRow>
                <TermsCheckbox
                  id="accept-terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  <TermsAcceptLabel htmlFor="accept-terms">{t.checkout.termsPrefix}</TermsAcceptLabel>{' '}
                  <TermsTrigger type="button" onClick={() => setTermsOpen(true)}>
                    {t.checkout.termsLink}
                  </TermsTrigger>
                </span>
              </TermsRow>
              {checkoutError && <ErrorText>{t.checkout.failed}</ErrorText>}
              <Actions>
                <Button
                  type="button"
                  $fullWidth
                  disabled={!termsAccepted || isSubmitting || !receiptEmailLooksValid}
                  onClick={() => {
                    if (customPeriod) {
                      void confirmQuote(
                        quote!,
                        customVdsIntentKey(packageCode, quote!.configuration, quote!.currency),
                        trimmedReceiptEmail,
                      );
                    } else {
                      void confirm(match!.tariff, period, trimmedReceiptEmail);
                    }
                  }}
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
      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </Section>
  );
}
