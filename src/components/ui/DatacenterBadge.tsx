import styled from 'styled-components';
import { useLang, useTranslation } from '../../i18n/LanguageContext';
import type { Datacenter } from '../../data/datacenters';

const Wrap = styled.div<{ $comingSoon?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $comingSoon }) => ($comingSoon ? theme.colors.neutral[100] : theme.colors.background.primary)};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  box-shadow: ${({ theme, $comingSoon }) => ($comingSoon ? 'none' : theme.shadows.sm)};
  opacity: ${({ $comingSoon }) => ($comingSoon ? 0.65 : 1)};
`;

const Flag = styled.span<{ $comingSoon?: boolean }>`
  font-size: 1.25rem;
  filter: ${({ $comingSoon }) => ($comingSoon ? 'grayscale(1)' : 'none')};
`;

const City = styled.span<{ $comingSoon?: boolean }>`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $comingSoon }) => ($comingSoon ? theme.colors.neutral[600] : theme.colors.indigo[900])};
`;

const Country = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const StatusPill = styled.span<{ $live?: boolean }>`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $live }) => ($live ? theme.colors.mint[100] : theme.colors.neutral[200])};
  color: ${({ theme, $live }) => ($live ? theme.colors.mint[700] : theme.colors.neutral[600])};
  white-space: nowrap;
`;

interface DatacenterBadgeProps {
  datacenter: Datacenter;
}

export function DatacenterBadge({ datacenter }: DatacenterBadgeProps) {
  const t = useTranslation('common');
  const { lang } = useLang();
  const comingSoon = datacenter.status === 'comingSoon';
  const city = lang === 'ru' ? datacenter.city : datacenter.cityEn;
  const country = lang === 'ru' ? datacenter.country : datacenter.countryEn;

  return (
    <Wrap $comingSoon={comingSoon}>
      <Flag $comingSoon={comingSoon}>{datacenter.flag}</Flag>
      <City $comingSoon={comingSoon}>{city}</City>
      <Country>· {country}</Country>
      <StatusPill $live={!comingSoon}>
        {comingSoon ? t.datacenterStatus.comingSoon : t.datacenterStatus.live}
      </StatusPill>
    </Wrap>
  );
}
