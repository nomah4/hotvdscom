import styled from 'styled-components';
import { tariffs } from '../../data/tariffs';
import { useTranslation } from '../../i18n/LanguageContext';
import { media } from '../../theme/breakpoints';

const Wrap = styled.div`
  margin-top: 40px;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 640px;
  border-collapse: separate;
  border-spacing: 0;
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};

  ${media.laptop`
    text-align: center;

    &:first-child {
      text-align: left;
    }
  `}
`;

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[100]};
  font-size: ${({ theme }) => theme.fontSizes.small};

  ${media.laptop`
    text-align: center;

    &:first-child {
      text-align: left;
    }
  `}
`;

const TariffName = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Check = styled.span<{ $on: boolean }>`
  color: ${({ theme, $on }) => ($on ? theme.colors.mint[600] : theme.colors.neutral[300])};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export function TariffComparisonTable() {
  const t = useTranslation('pricing');

  return (
    <Wrap>
      <Table>
        <thead>
          <tr>
            <Th>{t.features.title}</Th>
            {tariffs.map((tariff) => (
              <Th key={tariff.id}>
                <TariffName>{tariff.name}</TariffName>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.features.items.map((feature) => (
            <tr key={feature.name}>
              <Td>{feature.name}</Td>
              {feature.tiers.map((on, i) => (
                <Td key={tariffs[i].id}>
                  <Check $on={on}>{on ? '✓' : '—'}</Check>
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrap>
  );
}
