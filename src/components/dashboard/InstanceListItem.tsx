import styled from 'styled-components';
import type { VdsInstance } from '../../data/instances';
import { datacenters } from '../../data/datacenters';
import { StatusDot } from '../ui/StatusDot';
import { SpecBadge } from '../ui/SpecBadge';
import { Button } from '../ui/Button';
import { UsageMiniChart } from './UsageMiniChart';
import { useLang, useTranslation } from '../../i18n/LanguageContext';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const NameCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
  max-width: 220px;
`;

const Name = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Region = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const SpecsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const UptimeCell = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
  white-space: nowrap;
`;

const ChartCell = styled.div`
  margin-left: auto;
`;

interface InstanceListItemProps {
  instance: VdsInstance;
}

export function InstanceListItem({ instance }: InstanceListItemProps) {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const dc = datacenters.find((d) => d.id === instance.datacenterId);
  const dcCity = dc ? (lang === 'ru' ? dc.city : dc.cityEn) : '';

  return (
    <Row>
      <NameCell>
        <Name>{instance.name}</Name>
        <Region>
          {dc?.flag} {dcCity}
        </Region>
      </NameCell>
      <StatusDot status={instance.status} label={t.instances.statusLabels[instance.status]} />
      <UptimeCell>{instance.uptime}% uptime</UptimeCell>
      <SpecsCell>
        <SpecBadge label="CPU" value={`${instance.cpu} vCPU`} />
        <SpecBadge label="RAM" value={`${instance.ram} GB`} />
      </SpecsCell>
      <ChartCell>
        <UsageMiniChart data={instance.usageTrend} />
      </ChartCell>
      <Button $variant="ghost" $size="sm">
        {t.instances.manage}
      </Button>
    </Row>
  );
}
