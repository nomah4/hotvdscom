import styled from 'styled-components';
import { Link } from 'react-router-dom';
import type { Tariff } from '../../data/tariffs';
import { Button } from './Button';
import { Badge } from './Badge';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import { orderPath } from '../../i18n/paths';

const Card = styled.div<{ $highlighted?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme, $highlighted }) => ($highlighted ? theme.colors.indigo[900] : theme.colors.background.primary)};
  color: ${({ theme, $highlighted }) => ($highlighted ? theme.colors.neutral[0] : theme.colors.neutral[900])};
  border: 1px solid ${({ theme, $highlighted }) => ($highlighted ? 'transparent' : theme.colors.neutral[200])};
  box-shadow: ${({ theme, $highlighted }) => ($highlighted ? theme.shadows.lg : theme.shadows.sm)};
  position: relative;
`;

const BadgeSlot = styled.div`
  position: absolute;
  top: -14px;
  left: 28px;
`;

const Name = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: inherit;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const Price = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

const Period = styled.span<{ $highlighted?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme, $highlighted }) => ($highlighted ? theme.colors.indigo[200] : theme.colors.neutral[600])};
`;

const SpecList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SpecItem = styled.li<{ $highlighted?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme, $highlighted }) => ($highlighted ? theme.colors.indigo[100] : theme.colors.neutral[700])};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.mint[500]};
    flex-shrink: 0;
  }
`;

interface TariffCardProps {
  tariff: Tariff;
}

export function TariffCard({ tariff }: TariffCardProps) {
  const t = useTranslation('pricing');
  const { lang } = useLang();

  return (
    <Card $highlighted={tariff.highlighted}>
      {tariff.highlighted && (
        <BadgeSlot>
          <Badge $tone="accent">{t.comparison.popularBadge}</Badge>
        </BadgeSlot>
      )}
      <Name>{tariff.name}</Name>
      <PriceRow>
        <Price>${tariff.priceMonthly.toFixed(2)}</Price>
        <Period $highlighted={tariff.highlighted}>{lang === 'ru' ? '/мес' : '/mo'}</Period>
      </PriceRow>
      <SpecList>
        <SpecItem $highlighted={tariff.highlighted}>{tariff.cpu} vCPU</SpecItem>
        <SpecItem $highlighted={tariff.highlighted}>{tariff.ram} {lang === 'ru' ? 'ГБ RAM' : 'GB RAM'}</SpecItem>
        <SpecItem $highlighted={tariff.highlighted}>{tariff.ssd} {lang === 'ru' ? 'ГБ NVMe' : 'GB NVMe'}</SpecItem>
        <SpecItem $highlighted={tariff.highlighted}>{tariff.traffic} {lang === 'ru' ? 'трафика' : 'traffic'}</SpecItem>
      </SpecList>
      <Button as={Link} to={orderPath(lang)} $variant={tariff.highlighted ? 'primary' : 'secondary'} $fullWidth>
        {t.configurator.cta}
      </Button>
    </Card>
  );
}
