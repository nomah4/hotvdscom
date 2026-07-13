import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../ui/Button';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { pricePerUnit, cpuRange, ramRange, ssdRange } from '../../data/tariffs';
import { datacenters } from '../../data/datacenters';
import { media } from '../../theme/breakpoints';

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
`;

const osOptions = ['Ubuntu 26.04', 'Ubuntu 24.04', 'Debian 13', 'Debian 12', 'CentOS Stream 9', 'Windows Server 2022'];

export function PricingSlider() {
  const t = useTranslation('pricing');
  const tc = useTranslation('common');
  const { lang } = useLang();
  const [cpu, setCpu] = useState(4);
  const [ram, setRam] = useState(8);
  const [ssd, setSsd] = useState(80);

  const price = useMemo(
    () => cpu * pricePerUnit.cpu + ram * pricePerUnit.ramGb + ssd * pricePerUnit.ssdGb,
    [cpu, ram, ssd],
  );

  return (
    <Card>
      <Controls>
        <Field>
          <FieldLabel>
            {t.configurator.cpuLabel} <FieldValue>{cpu}</FieldValue>
          </FieldLabel>
          <Range
            type="range"
            min={cpuRange.min}
            max={cpuRange.max}
            step={cpuRange.step}
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
            min={ramRange.min}
            max={ramRange.max}
            step={ramRange.step}
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
            min={ssdRange.min}
            max={ssdRange.max}
            step={ssdRange.step}
            value={ssd}
            onChange={(e) => setSsd(Number(e.target.value))}
          />
        </Field>
        <SelectRow>
          <SelectLabel>
            {t.configurator.osLabel}
            <Select defaultValue={osOptions[0]}>
              {osOptions.map((os) => (
                <option key={os}>{os}</option>
              ))}
            </Select>
          </SelectLabel>
          <SelectLabel>
            {t.configurator.datacenterLabel}
            <Select defaultValue={datacenters.find((dc) => dc.status === 'live')?.id}>
              {datacenters.map((dc) => {
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
        <PriceLabel>{t.configurator.priceLabel}</PriceLabel>
        <PriceValue>${price.toFixed(2)}</PriceValue>
        <Button $fullWidth>{t.configurator.cta}</Button>
      </PriceCard>
    </Card>
  );
}
