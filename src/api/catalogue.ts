import { useEffect, useState } from 'react';
import type { Tariff } from '../data/tariffs';
import { BILLING_API_BASE, DEFAULT_CURRENCY, PROJECT_CODE, TENANT_ID, toApiError } from './config';

interface ApiPrice {
  currency: string;
  amount_minor: number;
}

interface ApiPackageMetadata {
  cpu?: number;
  ram_gb?: number;
  ssd_gb?: number;
  traffic?: string;
}

interface ApiPackage {
  package_code: string;
  display_name: string;
  billing_period: 'monthly' | 'annual' | 'none';
  metadata: ApiPackageMetadata;
  prices: ApiPrice[];
}

interface ApiPackagesResponse {
  packages: ApiPackage[];
}

// Fixed presentation order + which plan gets the "popular" badge. The API has
// no notion of either (order_by is alphabetical on package_code, which is why
// the raw response comes back Basic/Business/Pro/Start/Ultra) — this is
// storefront-only styling, not billing data.
const TIER_ORDER = ['START', 'BASIC', 'PRO', 'BUSINESS', 'ULTRA'] as const;
const HIGHLIGHTED_SLUG = 'PRO';

const PACKAGE_CODE_RE = /^VDS_([A-Z]+)_(MONTHLY|ANNUAL)$/;

function titleCase(slug: string): string {
  return slug.charAt(0) + slug.slice(1).toLowerCase();
}

// Reads the anonymous catalogue endpoint (Billing PUBLIC_CATALOGUE_ENABLED), so
// visitors see prices before signing in.
async function fetchPublicPackages(currency: string): Promise<ApiPackage[]> {
  const url = new URL(`${BILLING_API_BASE}/api/v1/public/packages`);
  url.searchParams.set('tenant_id', TENANT_ID);
  url.searchParams.set('project_code', PROJECT_CODE);
  url.searchParams.set('currency', currency);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw await toApiError(response, 'Could not load the catalogue');
  }
  const data = (await response.json()) as ApiPackagesResponse;
  return data.packages;
}

/**
 * Pairs each plan's MONTHLY/ANNUAL rows into one storefront Tariff, in a fixed
 * tier order. A plan missing either period is dropped rather than shown with a
 * blank price — the catalogue is expected to always seed both.
 *
 * Amount conversion assumes a 2-decimal currency (true for RUB, USD, EUR — the
 * only ones this install is likely to use); would need adjusting for a
 * zero-decimal currency like JPY.
 */
export function groupIntoTariffs(packages: ApiPackage[]): Tariff[] {
  const bySlug = new Map<string, { monthly?: ApiPackage; annual?: ApiPackage }>();

  for (const pkg of packages) {
    const match = PACKAGE_CODE_RE.exec(pkg.package_code);
    if (!match) continue;
    const [, slug, period] = match;
    const entry = bySlug.get(slug) ?? {};
    if (period === 'MONTHLY') entry.monthly = pkg;
    else entry.annual = pkg;
    bySlug.set(slug, entry);
  }

  const tariffs: Tariff[] = [];
  for (const slug of TIER_ORDER) {
    const entry = bySlug.get(slug);
    const monthlyPrice = entry?.monthly?.prices[0];
    const annualPrice = entry?.annual?.prices[0];
    if (!monthlyPrice || !annualPrice) continue;

    const meta = entry.monthly!.metadata;
    tariffs.push({
      id: slug.toLowerCase(),
      name: titleCase(slug),
      cpu: meta.cpu ?? 0,
      ram: meta.ram_gb ?? 0,
      ssd: meta.ssd_gb ?? 0,
      traffic: meta.traffic ?? '',
      priceMonthly: monthlyPrice.amount_minor / 100,
      priceYearly: annualPrice.amount_minor / 100,
      currency: monthlyPrice.currency,
      packageCode: {
        monthly: entry.monthly!.package_code,
        annual: entry.annual!.package_code,
      },
      highlighted: slug === HIGHLIGHTED_SLUG,
    });
  }
  return tariffs;
}

interface UseTariffsResult {
  tariffs: Tariff[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Live plan list for the storefront. No cache/dedup layer — each caller fetches
 * independently; add one only if duplicate requests turn out to matter.
 */
export function useTariffs(currency = DEFAULT_CURRENCY): UseTariffsResult {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    fetchPublicPackages(currency)
      .then((packages) => {
        if (active) setTariffs(groupIntoTariffs(packages));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load pricing');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currency]);

  return { tariffs, isLoading, error };
}
