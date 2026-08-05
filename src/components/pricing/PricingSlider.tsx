import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../ui/Button';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { cpuRange, ramRange, ssdRange } from '../../data/tariffs';
import { datacenters } from '../../data/datacenters';
import { media } from '../../theme/breakpoints';
import { useConfigurableVds } from '../../api/catalogue';
import { createQuote } from '../../api/checkout';
import type { CustomVdsConfiguration } from '../../api/checkout';
import { useCustomOrderIntent } from '../../api/useCheckout';
import { DEFAULT_CURRENCY } from '../../api/config';
import { formatMoneyMinor } from '../../utils/money';

const Card = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  padding: 32px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  box-shadow: ${({ theme }) => theme.shadows.md};

  ${media.laptop`
    grid-template-columns: 1fr 280px;
  `}
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FieldLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const FieldValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.accent[600]};
`;

const Range = styled.input`
  width: 100%;
  accent-color: ${({ theme }) => theme.colors.accent[500]};
`;

const SelectRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${media.tablet`
    grid-template-columns: 1fr 1fr;
  `}
`;

const Select = styled.select`
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

const SelectLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const PriceCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 28px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.indigo[900]};
  color: ${({ theme }) => theme.colors.neutral[0]};
  text-align: center;
`;

const PriceLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[200]};
`;

const PriceValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  min-height: 48px;
  display: inline-flex;
  align-items: center;
`;

const PeriodToggle = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.indigo[800]};
  border: 1px solid ${({ theme }) => theme.colors.indigo[700]};
`;

const PeriodOption = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $active }) => ($active ? theme.colors.indigo[900] : theme.colors.indigo[200])};
  background: ${({ theme, $active }) => ($active ? theme.colors.neutral[0] : 'transparent')};
`;

const PriceStatus = styled.span<{ $tone?: 'error' }>`
  min-height: 18px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.colors.semantic.error : theme.colors.indigo[200])};
`;

const fallbackOsOptions = [
  { value: 'ubuntu-26.04', label: 'Ubuntu 26.04' },
  { value: 'ubuntu-24.04', label: 'Ubuntu 24.04' },
  { value: 'debian-13', label: 'Debian 13' },
  { value: 'debian-12', label: 'Debian 12' },
  { value: 'centos-stream-9', label: 'CentOS Stream 9' },
  { value: 'windows-2022', label: 'Windows Server 2022' },
];

function rangeFromSchema(
  dimension: { min?: number; max?: number; step?: number } | undefined,
  fallback: { min: number; max: number; step: number },
) {
  return {
    min: dimension?.min ?? fallback.min,
    max: dimension?.max ?? fallback.max,
    step: dimension?.step ?? fallback.step,
  };
}

function optionList(
  uiOptions: Array<{ value: string; label: string }> | undefined,
  allowed: string[] | undefined,
  fallback: Array<{ value: string; label: string }>,
) {
  const source = uiOptions?.length ? uiOptions : fallback;
  const allowedSet = new Set(allowed ?? source.map((item) => item.value));
  return source.filter((item) => allowedSet.has(item.value));
}

interface PricingSliderProps {
  currency?: string;
}

export function PricingSlider({ currency = DEFAULT_CURRENCY }: PricingSliderProps) {
  const t = useTranslation('pricing');
  const tc = useTranslation('common');
  const { lang } = useLang();
  const { customPackage, isLoading, error } = useConfigurableVds(currency);
  const orderCustom = useCustomOrderIntent();
  const [cpu, setCpu] = useState(4);
  const [ram, setRam] = useState(8);
  const [ssd, setSsd] = useState(80);
  const [os, setOs] = useState('ubuntu-24.04');
  const [datacenter, setDatacenter] = useState('ams');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [quoteMinor, setQuoteMinor] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const cpuConfig = rangeFromSchema(customPackage?.schema.dimensions?.cpu, cpuRange);
  const ramConfig = rangeFromSchema(customPackage?.schema.dimensions?.ram_gb, ramRange);
  const ssdConfig = rangeFromSchema(customPackage?.schema.dimensions?.ssd_gb, ssdRange);
  const packageCode = customPackage?.packageCode[period] ?? '';

  const osOptions = useMemo(
    () => optionList(customPackage?.uiSchema.options?.os, customPackage?.schema.options?.os?.allowed, fallbackOsOptions),
    [customPackage],
  );
  const datacenterOptions = useMemo(() => {
    const allowed = customPackage?.schema.options?.datacenter?.allowed;
    const allowedSet = new Set(allowed ?? datacenters.filter((dc) => dc.status === 'live').map((dc) => dc.id));
    return datacenters.filter((dc) => allowedSet.has(dc.id));
  }, [customPackage]);

  useEffect(() => {
    if (osOptions.length && !osOptions.some((item) => item.value === os)) {
      setOs(osOptions[0].value);
    }
  }, [os, osOptions]);

  useEffect(() => {
    if (datacenterOptions.length && !datacenterOptions.some((dc) => dc.id === datacenter)) {
      setDatacenter(datacenterOptions[0].id);
    }
  }, [datacenter, datacenterOptions]);

  const configuration: CustomVdsConfiguration = useMemo(
    () => ({ cpu, ram_gb: ram, ssd_gb: ssd, os, datacenter }),
    [cpu, ram, ssd, os, datacenter],
  );

  useEffect(() => {
    if (!packageCode || !customPackage) {
      setQuoteMinor(null);
      setQuoteLoading(false);
      setQuoteError(null);
      return;
    }

    let active = true;
    setQuoteLoading(true);
    setQuoteError(null);
    const timer = window.setTimeout(() => {
      createQuote({ packageCode, configuration, currency: customPackage.currency })
        .then((quote) => {
          if (active) setQuoteMinor(quote.amount_minor);
        })
        .catch((err: unknown) => {
          if (active) {
            setQuoteMinor(null);
            setQuoteError(err instanceof Error ? err.message : 'quote_failed');
          }
        })
        .finally(() => {
          if (active) setQuoteLoading(false);
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [packageCode, customPackage, configuration]);

  const priceText = quoteMinor === null
    ? '—'
    : formatMoneyMinor(quoteMinor, customPackage?.currency ?? currency, lang);
  const canOrder = Boolean(packageCode && quoteMinor !== null && !quoteLoading && !quoteError);

  return (
    <Card>
      <Controls>
        <Field>
          <FieldLabel>
            {t.configurator.cpuLabel} <FieldValue>{cpu}</FieldValue>
          </FieldLabel>
          <Range
            type="range"
            min={cpuConfig.min}
            max={cpuConfig.max}
            step={cpuConfig.step}
            value={cpu}
            onChange={(e) => setCpu(Number(e.target.value))}
          />
        </Field>
        <Field>
          <FieldLabel>
            {t.configurator.ramLabel} <FieldValue>{ram}</FieldValue>
          </FieldLabel>
          <Range
            type="range"
            min={ramConfig.min}
            max={ramConfig.max}
            step={ramConfig.step}
            value={ram}
            onChange={(e) => setRam(Number(e.target.value))}
          />
        </Field>
        <Field>
          <FieldLabel>
            {t.configurator.ssdLabel} <FieldValue>{ssd}</FieldValue>
          </FieldLabel>
          <Range
            type="range"
            min={ssdConfig.min}
            max={ssdConfig.max}
            step={ssdConfig.step}
            value={ssd}
            onChange={(e) => setSsd(Number(e.target.value))}
          />
        </Field>
        <SelectRow>
          <SelectLabel>
            {t.configurator.osLabel}
            <Select value={os} onChange={(event) => setOs(event.target.value)}>
              {osOptions.map((os) => (
                <option key={os.value} value={os.value}>{os.label}</option>
              ))}
            </Select>
          </SelectLabel>
          <SelectLabel>
            {t.configurator.datacenterLabel}
            <Select value={datacenter} onChange={(event) => setDatacenter(event.target.value)}>
              {datacenterOptions.map((dc) => {
                const city = lang === 'ru' ? dc.city : dc.cityEn;
                const comingSoon = dc.status === 'comingSoon';
                return (
                  <option key={dc.id} value={dc.id} disabled={comingSoon}>
                    {dc.flag} {city}
                    {comingSoon ? ` — ${tc.datacenterStatus.comingSoon}` : ''}
                  </option>
                );
              })}
            </Select>
          </SelectLabel>
        </SelectRow>
      </Controls>
      <PriceCard>
        <PeriodToggle role="group">
          <PeriodOption type="button" $active={period === 'monthly'} onClick={() => setPeriod('monthly')}>
            {t.billingToggle.monthly}
          </PeriodOption>
          <PeriodOption
            type="button"
            $active={period === 'annual'}
            disabled={!customPackage?.packageCode.annual}
            onClick={() => setPeriod('annual')}
          >
            {t.billingToggle.yearly}
          </PeriodOption>
        </PeriodToggle>
        <PriceLabel>{period === 'annual' ? t.configurator.priceLabelAnnual : t.configurator.priceLabel}</PriceLabel>
        <PriceValue>{isLoading || quoteLoading ? t.configurator.loadingPrice : priceText}</PriceValue>
        <PriceStatus $tone={error || quoteError ? 'error' : undefined}>
          {error || (!isLoading && !customPackage) ? t.configurator.priceUnavailable : quoteError ? t.configurator.priceUnavailable : ''}
        </PriceStatus>
        <Button
          type="button"
          $fullWidth
          disabled={!canOrder}
          onClick={() => {
            if (packageCode && customPackage) orderCustom(packageCode, configuration, customPackage.currency);
          }}
        >
          {t.configurator.cta}
        </Button>
      </PriceCard>
    </Card>
  );
}
