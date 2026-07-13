export interface Tariff {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  ssd: number;
  traffic: string;
  priceMonthly: number;
  priceYearly: number;
  highlighted?: boolean;
}

// Base config 1 vCPU / 2 GB RAM / 10 GB NVMe = $10/mo
export const pricePerUnit = {
  cpu: 5,
  ramGb: 2,
  ssdGb: 0.1,
};

export const cpuRange = { min: 1, max: 16, step: 1 };
export const ramRange = { min: 2, max: 64, step: 2 };
export const ssdRange = { min: 10, max: 640, step: 10 };

const YEARLY_DISCOUNT = 0.15;

function calcMonthlyPrice(cpu: number, ram: number, ssd: number) {
  return cpu * pricePerUnit.cpu + ram * pricePerUnit.ramGb + ssd * pricePerUnit.ssdGb;
}

// Preset tariffs are derived from the same per-unit rates as the configurator,
// so the "ready-made plans" grid can never drift from the calculator.
const tariffSpecs: Array<Omit<Tariff, 'priceMonthly' | 'priceYearly'>> = [
  { id: 'start', name: 'Start', cpu: 1, ram: 2, ssd: 20, traffic: '1 ТБ' },
  { id: 'basic', name: 'Basic', cpu: 2, ram: 4, ssd: 40, traffic: '2 ТБ' },
  { id: 'pro', name: 'Pro', cpu: 4, ram: 8, ssd: 80, traffic: '4 ТБ', highlighted: true },
  { id: 'business', name: 'Business', cpu: 6, ram: 16, ssd: 160, traffic: '8 ТБ' },
  { id: 'ultra', name: 'Ultra', cpu: 8, ram: 32, ssd: 320, traffic: 'безлимит' },
];

export const tariffs: Tariff[] = tariffSpecs.map((spec) => {
  const priceMonthly = Math.round(calcMonthlyPrice(spec.cpu, spec.ram, spec.ssd) * 100) / 100;
  const priceYearly = Math.round(priceMonthly * 12 * (1 - YEARLY_DISCOUNT) * 100) / 100;
  return { ...spec, priceMonthly, priceYearly };
});
