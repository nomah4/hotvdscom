import { cpuRange, ramRange, ssdRange } from '../../data/tariffs';

export interface DimensionRange {
  min: number;
  max: number;
  step: number;
}

export interface ResourceRanges {
  cpu: DimensionRange;
  ram_gb: DimensionRange;
  ssd_gb: DimensionRange;
}

/** Пределы из схемы пакета; чего в схеме нет, берётся из запасных значений витрины. */
export function rangeFromSchema(
  dimension: { min?: number; max?: number; step?: number } | undefined,
  fallback: DimensionRange,
): DimensionRange {
  return {
    min: dimension?.min ?? fallback.min,
    max: dimension?.max ?? fallback.max,
    step: dimension?.step ?? fallback.step,
  };
}

export function resourceRangesFromSchema(
  dimensions:
    | Partial<Record<'cpu' | 'ram_gb' | 'ssd_gb', { min?: number; max?: number; step?: number }>>
    | undefined,
): ResourceRanges {
  return {
    cpu: rangeFromSchema(dimensions?.cpu, cpuRange),
    ram_gb: rangeFromSchema(dimensions?.ram_gb, ramRange),
    ssd_gb: rangeFromSchema(dimensions?.ssd_gb, ssdRange),
  };
}
