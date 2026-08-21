import { describe, expect, it } from 'vitest';
import { splitDashboardSubscriptions } from './DashboardPage';
import type { Subscription, SubscriptionStatus } from '../api/subscriptions';

function subscription(status: SubscriptionStatus): Subscription {
  return {
    subscription_id: 'sub_' + status,
    status,
    package_code: 'VDS_PRO_MONTHLY',
    scope_type: 'project',
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: '2026-02-01T00:00:00Z',
    provisioning_status: 'succeeded',
    auto_renew: false,
  };
}

describe('splitDashboardSubscriptions', () => {
  it('keeps live services in My servers', () => {
    const rows: Subscription[] = [
      subscription('active'),
      subscription('pending_activation'),
      subscription('past_due'),
    ];

    expect(splitDashboardSubscriptions(rows)).toEqual({ active: rows, history: [] });
  });

  /**
   * Истёкшая услуга остаётся на виду, потому что её оплачивают. Свёрнутая
   * «История» — последнее место, где станут искать кнопку «Оплатить», а
   * спрятать туда услугу, которая ждёт денег, значит спрятать сам счёт.
   */
  it('keeps an expired service in My servers, where it can be paid for', () => {
    const expired = subscription('expired');

    expect(splitDashboardSubscriptions([expired])).toEqual({ active: [expired], history: [] });
  });

  it('keeps revoked and cancelled services in History', () => {
    const rows: Subscription[] = [subscription('revoked'), subscription('cancelled')];

    expect(splitDashboardSubscriptions(rows)).toEqual({ active: [], history: rows });
  });
});
