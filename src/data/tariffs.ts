export type BillingPeriod = 'monthly' | 'annual';

export interface Tariff {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  ssd: number;
  traffic: string;
  priceMonthly: number;
  priceYearly: number;
  /** ISO 4217 code the prices are denominated in (e.g. "RUB"). Drives how
   * TariffCard formats the number — never hardcode a currency symbol. */
  currency: string;
  /** Catalogue identifiers this plan was built from. Carried through rather than
   * reconstructed from `id`, so checkout charges exactly the package the price on
   * screen came from — a naming change in the catalogue must not silently make
   * the storefront request a package that does not exist. */
  packageCode: Record<BillingPeriod, string>;
  highlighted?: boolean;
}

// Ranges/rates for the interactive configurator (PricingSlider) only — it does
// NOT read the `tariffs` list below. Kept as a client-side estimate; the actual
// chargeable price for any real purchase always comes from the Billing catalogue
// (see src/api/catalogue.ts), never from this calculation.
export const pricePerUnit = {
  cpu: 5,
  ramGb: 2,
  ssdGb: 0.1,
};

export const cpuRange = { min: 1, max: 16, step: 1 };
export const ramRange = { min: 2, max: 64, step: 2 };
export const ssdRange = { min: 10, max: 640, step: 10 };
