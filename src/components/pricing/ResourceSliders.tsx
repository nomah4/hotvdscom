import styled from 'styled-components';
import type { UpgradeResources } from '../../api/checkout';
import type { ResourceRanges } from './resourceRanges';

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const FieldValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.accent[600]};
`;

const Current = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const Range = styled.input`
  width: 100%;
  accent-color: ${({ theme }) => theme.colors.accent[500]};
`;

interface ResourceSlidersProps {
  value: UpgradeResources;
  /** Нижняя граница каждого ползунка — то, что уже есть у сервера: уменьшать нельзя. */
  floor: UpgradeResources;
  ranges: ResourceRanges;
  labels: { cpu: string; ram_gb: string; ssd_gb: string };
  /** Подпись «сейчас N» под названием; получает текущее значение. */
  nowLabel: (current: number) => string;
  disabled?: boolean;
  onChange: (next: UpgradeResources) => void;
}

const FIELDS = ['cpu', 'ram_gb', 'ssd_gb'] as const;

/**
 * Три ползунка ресурсов с нижней границей.
 *
 * Для апгрейда, где минимум каждого ползунка — текущее значение сервера. Верхний
 * предел не ниже нижнего: у старой машины значение может быть выше нынешнего
 * максимума схемы, и тогда ползунок должен стоять на месте, а не прятать её
 * реальные цифры.
 */
export function ResourceSliders({
  value,
  floor,
  ranges,
  labels,
  nowLabel,
  disabled = false,
  onChange,
}: ResourceSlidersProps) {
  return (
    <>
      {FIELDS.map((key) => {
        const range = ranges[key];
        const min = floor[key];
        const max = Math.max(range.max, min);
        return (
          <Field key={key}>
            <FieldLabel>
              <span>
                {labels[key]} <Current>({nowLabel(floor[key])})</Current>
              </span>
              <FieldValue>{value[key]}</FieldValue>
            </FieldLabel>
            <Range
              type="range"
              aria-label={labels[key]}
              min={min}
              max={max}
              step={range.step}
              value={value[key]}
              disabled={disabled || max === min}
              onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })}
            />
          </Field>
        );
      })}
    </>
  );
}
