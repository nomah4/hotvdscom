import styled from 'styled-components';

/**
 * Светлая заливка, а не тёмная.
 *
 * Три чипа подряд на каждой карточке — это три тёмных блока в ряд, и на списке
 * из пяти серверов они перетягивают внимание на себя, хотя несут справочные
 * цифры, а не действие. Светлый фон с рамкой оставляет их читаемыми и возвращает
 * вес туда, где он нужен: статусу и кнопкам.
 */
const Wrap = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.indigo[50]};
  border: 1px solid ${({ theme }) => theme.colors.indigo[100]};
  color: ${({ theme }) => theme.colors.indigo[900]};
  white-space: nowrap;
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  /* Подпись тише значения: «CPU» повторяется на каждой карточке, а «2 vCPU» — нет. */
  color: ${({ theme }) => theme.colors.indigo[400]};
`;

const Value = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.specMono};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

interface SpecBadgeProps {
  label: string;
  value: string;
}

export function SpecBadge({ label, value }: SpecBadgeProps) {
  return (
    <Wrap>
      <Label>{label}</Label>
      <Value>{value}</Value>
    </Wrap>
  );
}
