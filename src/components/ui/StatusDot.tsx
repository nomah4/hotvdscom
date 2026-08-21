import styled from 'styled-components';
import type { InstanceStatus } from '../../data/instances';

/**
 * Тона на один больше, чем состояний машины.
 *
 * `critical` не принадлежит `InstanceStatus`: тот описывает мок-данные витрины
 * статуса, где «всё плохо» значит «узел лежит». Здесь же красным горит услуга,
 * за которую не заплачено, — это не поломка, а счёт, и живёт это понятие в
 * кабинете, а не в справочнике машин.
 */
export type StatusTone = InstanceStatus | 'critical';

// Единственный тон, который красит и подпись тоже. Серая точка у слова
// «Истёк» сообщала ровно то же, что и у слова «Остановлен», хотя в первом
// случае от клиента ждут денег, а во втором — ничего.
const Wrap = styled.span<{ $status: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme, $status }) => ($status === 'critical' ? theme.colors.semantic.error : 'inherit')};
`;

const Dot = styled.span<{ $status: StatusTone }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $status }) =>
    $status === 'online'
      ? theme.colors.mint[500]
      : $status === 'critical'
        ? theme.colors.semantic.error
        : $status === 'degraded'
          ? theme.colors.semantic.warning
          : theme.colors.neutral[400]};
  box-shadow: ${({ $status }) => ($status === 'online' ? '0 0 0 4px rgba(34, 196, 134, 0.15)' : 'none')};
`;

interface StatusDotProps {
  status: StatusTone;
  label: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <Wrap $status={status}>
      <Dot $status={status} aria-hidden />
      {label}
    </Wrap>
  );
}
