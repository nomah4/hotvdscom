import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SubscriptionListItem } from './SubscriptionListItem';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import type { Subscription } from '../../api/subscriptions';

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    subscription_id: 'sub_1',
    status: 'active',
    package_code: 'VDS_PRO_MONTHLY',
    scope_type: 'project',
    valid_from: '2026-08-01T00:00:00Z',
    valid_until: '2026-09-08T00:00:00Z',
    provisioning_status: 'pending',
    auto_renew: false,
    configuration: null,
    ...overrides,
  };
}

const t = dictionaries.ru.dashboard.subscriptions;

describe('SubscriptionListItem', () => {
  /**
   * The valid-until chip is the only way to start a renewal, so it carries the
   * whole money path: it must fire, must advertise itself, and must disappear as
   * a control the moment Billing would refuse.
   */
  describe('renewal', () => {
    it('renews when the valid-until chip is clicked', () => {
      const onRenew = vi.fn();
      renderWithProviders(<SubscriptionListItem subscription={subscription()} onRenew={onRenew} />);

      fireEvent.click(screen.getByRole('button', { name: new RegExp(t.validUntil) }));

      expect(onRenew).toHaveBeenCalledTimes(1);
    });

    it('tells the customer the date is clickable', () => {
      renderWithProviders(<SubscriptionListItem subscription={subscription()} onRenew={vi.fn()} />);

      // A hover-only affordance nobody can guess is worse than none.
      expect(screen.getByRole('button', { name: new RegExp(t.validUntil) })).toHaveAttribute(
        'title',
        t.renewHint,
      );
    });

    it('offers neither entrance once the subscription is not active', () => {
      // Billing answers subscription_not_renewable for every other state, so a
      // renew affordance here would be a promise the server breaks.
      renderWithProviders(
        <SubscriptionListItem subscription={subscription({ status: 'expired' })} onRenew={vi.fn()} />,
      );

      // The chip is the only renew control, so "not on offer" means it stops
      // being a button — while still showing the date as plain text.
      expect(screen.queryByRole('button', { name: new RegExp(t.validUntil) })).toBeNull();
      expect(screen.getByText(new RegExp(t.validUntil))).toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('reports that nothing happened rather than a success it did not achieve', () => {
      renderWithProviders(<SubscriptionListItem subscription={subscription()} />);

      fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.reboot) }));

      // A customer who believes a reboot happened waits for a server that never
      // went down. Until provisioning exists, the only honest answer is this.
      expect(screen.getByText(t.controls.unavailable)).toBeInTheDocument();
    });

    it('offers to start a server that is not running', () => {
      renderWithProviders(<SubscriptionListItem subscription={subscription()} />);

      expect(screen.getByRole('button', { name: new RegExp(t.controls.powerOn) })).toBeInTheDocument();
    });

    it('offers to stop one that is', () => {
      renderWithProviders(
        <SubscriptionListItem subscription={subscription({ provisioning_status: 'succeeded' })} />,
      );

      expect(screen.getByRole('button', { name: new RegExp(t.controls.powerOff) })).toBeInTheDocument();
    });

    it('never shows a telemetry figure, only dashes', () => {
      renderWithProviders(<SubscriptionListItem subscription={subscription()} />);

      // Invented load or an invented address is a lie about the customer's own
      // machine. Nothing here has a source yet.
      expect(screen.queryByText(/\d+([.,]\d+)?\s*(%|Мбит|Mbps|GB\/s)/)).toBeNull();
    });
  });
});
