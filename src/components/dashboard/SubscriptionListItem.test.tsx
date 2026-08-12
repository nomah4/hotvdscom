import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SubscriptionListItem } from './SubscriptionListItem';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';
import type { Subscription } from '../../api/subscriptions';
import {
  deleteServer,
  fetchServerCredentials,
  rebootServer,
  requestServerConsole,
  restoreServer,
  setServerPower,
} from '../../api/subscriptions';

// renderWithProviders deliberately omits AuthProvider — it would construct an
// oidc UserManager and touch session storage on mount.
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-1' }),
}));

// The controls are the point of these tests, not the transport underneath them.
vi.mock('../../api/subscriptions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/subscriptions')>()),
  setServerPower: vi.fn().mockResolvedValue({}),
  rebootServer: vi.fn().mockResolvedValue({}),
  deleteServer: vi.fn().mockResolvedValue({}),
  restoreServer: vi.fn().mockResolvedValue({}),
  fetchServerCredentials: vi.fn().mockResolvedValue({}),
  requestServerConsole: vi.fn().mockResolvedValue({
    url: 'https://console.hotvds.com/c/ticket-1',
    expires_at: '2026-08-12T00:01:00Z',
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(setServerPower).mockResolvedValue({});
  vi.mocked(rebootServer).mockResolvedValue({});
  vi.mocked(deleteServer).mockResolvedValue({});
  vi.mocked(restoreServer).mockResolvedValue({});
  vi.mocked(fetchServerCredentials).mockResolvedValue({});
  vi.mocked(requestServerConsole).mockResolvedValue({
    url: 'https://console.hotvds.com/c/ticket-1',
    expires_at: '2026-08-12T00:01:00Z',
  });
});

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

  describe('rename', () => {
    it('shows no pencil while Billing does not support renaming', () => {
      // Карандаш включается наличием onRename, а его передают только когда в
      // ответе есть ключ display_name. Иначе каждое нажатие было бы ошибкой.
      renderWithProviders(<SubscriptionListItem subscription={subscription()} />);

      expect(screen.queryByRole('button', { name: t.rename.label })).toBeNull();
    });

    it('offers the pencil once it does', () => {
      renderWithProviders(
        <SubscriptionListItem subscription={subscription()} onRename={vi.fn()} />,
      );

      expect(screen.getByRole('button', { name: t.rename.label })).toBeInTheDocument();
    });

    it('shows the customer name and keeps the plan underneath', () => {
      renderWithProviders(
        <SubscriptionListItem
          subscription={subscription({ display_name: 'prod-api-01' })}
          onRename={vi.fn()}
        />,
      );

      expect(screen.getByText('prod-api-01')).toBeInTheDocument();
      expect(screen.getByText('VDS_PRO_MONTHLY')).toBeInTheDocument();
    });

    it('saves what was typed', async () => {
      const onRename = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <SubscriptionListItem subscription={subscription()} onRename={onRename} />,
      );

      fireEvent.click(screen.getByRole('button', { name: t.rename.label }));
      const box = screen.getByRole('textbox', { name: t.rename.label });
      fireEvent.change(box, { target: { value: '  prod-api-01  ' } });
      fireEvent.keyDown(box, { key: 'Enter' });

      await waitFor(() =>
        expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ subscription_id: 'sub_1' }), 'prod-api-01'),
      );
    });

    it('does not show a name the server never accepted', async () => {
      /**
       * Без оптимистичного обновления намеренно. Имя, оставшееся на экране
       * после неудачного сохранения, — это заголовок, которого у сервера нет, и
       * клиент потом ищет сервер по имени, которого никто не сохранял.
       */
      const onRename = vi.fn().mockRejectedValue(new Error('invalid_display_name: no'));
      renderWithProviders(
        <SubscriptionListItem subscription={subscription()} onRename={onRename} />,
      );

      fireEvent.click(screen.getByRole('button', { name: t.rename.label }));
      const box = screen.getByRole('textbox', { name: t.rename.label });
      fireEvent.change(box, { target: { value: 'не сохранится' } });
      fireEvent.keyDown(box, { key: 'Enter' });

      // Отказ должен быть виден: молчание оставило бы клиента с открытым полем
      // и без объяснения, а промис — необработанным.
      expect(await screen.findByText(t.rename.failed)).toBeInTheDocument();
      expect(screen.queryByText('не сохранится')).toBeNull();
    });

    it('escape leaves the name alone', () => {
      const onRename = vi.fn();
      renderWithProviders(
        <SubscriptionListItem subscription={subscription()} onRename={onRename} />,
      );

      fireEvent.click(screen.getByRole('button', { name: t.rename.label }));
      fireEvent.keyDown(screen.getByRole('textbox', { name: t.rename.label }), { key: 'Escape' });

      expect(onRename).not.toHaveBeenCalled();
    });
  });

  it('shows the service id, because a customer name is not unique', () => {
    // Две машины можно назвать одинаково — это личная метка. Когда клиент
    // пишет «prod-api-01 не отвечает», найти сервер поддержка может только по
    // идентификатору.
    renderWithProviders(
      <SubscriptionListItem subscription={subscription({ subscription_id: '6e776df2-8849-4a81' })} />,
    );

    expect(screen.getByText(new RegExp(`${t.serviceId}: 6e776df2`))).toBeInTheDocument();
  });

  describe('controls', () => {
    const withServer = (overrides: Partial<NonNullable<Subscription['server']>> = {}) =>
      subscription({
        provisioning_status: 'succeeded',
        server: { state: 'active', power_intent: 'on', running: true, ...overrides },
      });

    it('offers nothing to press until the machine exists', () => {
      // Buttons that can only fail are worse than an explanation.
      renderWithProviders(<SubscriptionListItem subscription={subscription({ server: null })} />);

      expect(screen.getByText(t.controls.noServer)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: new RegExp(t.controls.reboot) })).toBeNull();
    });

    it('treats a destroyed machine as no machine', () => {
      // Buttons over something that exists on no hypervisor would all fail.
      // Billing stops sending these, but the card must not rely on that.
      renderWithProviders(<SubscriptionListItem subscription={withServer({ state: 'deleted' })} />);

      expect(screen.getByText(t.controls.noServer)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: new RegExp(t.controls.reboot) })).toBeNull();
    });

    it('offers to stop a machine the customer wants running', () => {
      renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

      expect(screen.getByRole('button', { name: new RegExp(t.controls.powerOff) })).toBeInTheDocument();
    });

    it('offers to start one they have turned off', () => {
      renderWithProviders(
        <SubscriptionListItem subscription={withServer({ power_intent: 'off', running: false })} />,
      );

      expect(screen.getByRole('button', { name: new RegExp(t.controls.powerOn) })).toBeInTheDocument();
    });

    it('reads the wish, not the machine, when the two disagree', () => {
      /**
       * A suspended service leaves the machine down while the customer's wish
       * is still "on". Offering "Power on" there would be a button that cannot
       * work — the service, not the wish, is what is holding it down.
       */
      renderWithProviders(
        <SubscriptionListItem
          subscription={withServer({
            state: 'suspended',
            power_intent: 'on',
            running: false,
            machine: { status: 'stopped' },
          })}
        />,
      );

      expect(screen.getByRole('button', { name: new RegExp(t.controls.powerOff) })).toBeInTheDocument();
    });

    it('sends the customer to the engine when reboot is pressed', async () => {
      renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

      fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.reboot) }));

      await waitFor(() => expect(rebootServer).toHaveBeenCalledWith('token-1', 'sub_1'));
    });

    it('re-reads the list once an action lands', async () => {
      // The card cannot know the new power state on its own, and a stale card
      // after a successful press is how a customer presses again.
      const onServerChanged = vi.fn();
      renderWithProviders(
        <SubscriptionListItem subscription={withServer()} onServerChanged={onServerChanged} />,
      );

      fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.reboot) }));

      await waitFor(() => expect(onServerChanged).toHaveBeenCalled());
    });

    it('asks the power endpoint for the opposite of the current wish', async () => {
      renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

      fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.powerOff) }));

      await waitFor(() => expect(setServerPower).toHaveBeenCalledWith('token-1', 'sub_1', 'off'));
    });

    it('says plainly that an action failed', async () => {
      vi.mocked(rebootServer).mockRejectedValueOnce(new Error('server_is_being_deleted: no'));
      renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

      fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.reboot) }));

      expect(await screen.findByText(t.controls.failed)).toBeInTheDocument();
    });

    describe('deletion', () => {
      it('takes two presses', async () => {
        /**
         * The only action on this card the customer cannot take back on their
         * own. An accidental click and a deliberate one should not cost the
         * same.
         */
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: t.controls.delete }));
        expect(deleteServer).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: t.controls.deleteConfirm }));
        await waitFor(() => expect(deleteServer).toHaveBeenCalledWith('token-1', 'sub_1'));
      });

      it('can be backed out of', () => {
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: t.controls.delete }));
        fireEvent.click(screen.getByRole('button', { name: t.controls.deleteCancel }));

        expect(deleteServer).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: t.controls.deleteConfirm })).toBeNull();
      });

      it('offers only the way back once the machine is marked', () => {
        // Every other button would be asking a half-deleted machine to work.
        renderWithProviders(
          <SubscriptionListItem subscription={withServer({ state: 'pending_deletion' })} />,
        );

        expect(screen.getByRole('button', { name: new RegExp(t.controls.restore) })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: new RegExp(t.controls.reboot) })).toBeNull();
        expect(screen.getByText(t.controls.pendingDeletion)).toBeInTheDocument();
      });

      it('restores when asked', async () => {
        renderWithProviders(
          <SubscriptionListItem subscription={withServer({ state: 'pending_deletion' })} />,
        );

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.restore) }));

        await waitFor(() => expect(restoreServer).toHaveBeenCalledWith('token-1', 'sub_1'));
      });
    });

    /**
     * Консоль обходит и пароль, и SSH-ключи, а ссылка на неё одноразовая и
     * живёт минуту. Поэтому проверяется не «открылось», а то, как именно
     * открывается: вкладка заранее, `noopener`, и внятный отказ вместо
     * молчания, когда вкладку не дали.
     */
    describe('console', () => {
      // Подменённый `window.open` иначе остаётся у соседних тестов в файле.
      afterEach(() => vi.unstubAllGlobals());

      function stubWindowOpen(result: Window | null) {
        const tab = result as unknown as { location: { href: string }; close: () => void } | null;
        const open = vi.fn().mockReturnValue(tab);
        vi.stubGlobal('open', open);
        return open;
      }

      function fakeTab() {
        return { location: { href: '' }, close: vi.fn() } as unknown as Window;
      }

      it('asks for a link and sends the new tab to it', async () => {
        const tab = fakeTab();
        stubWindowOpen(tab);
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.console) }));

        await waitFor(() => expect(requestServerConsole).toHaveBeenCalledWith('token-1', 'sub_1'));
        await waitFor(() =>
          expect(tab.location.href).toBe('https://console.hotvds.com/c/ticket-1'),
        );
      });

      it('opens the tab before awaiting, and without an opener', async () => {
        // После `await` браузер уже не считает открытие следствием нажатия и
        // гасит его; `noopener` не даёт консоли добраться до вкладки кабинета.
        const open = stubWindowOpen(fakeTab());
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.console) }));

        expect(open).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');
        await waitFor(() => expect(requestServerConsole).toHaveBeenCalled());
      });

      it('says what is wrong when the browser blocks the tab', async () => {
        // Ссылка одноразовая — показать её текстом нельзя, остаётся объяснить.
        stubWindowOpen(null);
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.console) }));

        expect(await screen.findByText(t.controls.popupBlocked)).toBeInTheDocument();
      });

      it('closes the empty tab when no link comes back', async () => {
        const tab = fakeTab();
        stubWindowOpen(tab);
        vi.mocked(requestServerConsole).mockRejectedValue(new Error('not_found: no machine'));
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.console) }));

        await waitFor(() => expect(tab.close).toHaveBeenCalled());
        expect(await screen.findByText(t.controls.failed)).toBeInTheDocument();
      });

      it('names the limit rather than inviting another press', async () => {
        stubWindowOpen(fakeTab());
        vi.mocked(requestServerConsole).mockRejectedValue(
          new Error('console_rate_limited: too many'),
        );
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.console) }));

        expect(await screen.findByText(t.controls.consoleRateLimited)).toBeInTheDocument();
      });

      it('is not offered for a machine on its way out', () => {
        renderWithProviders(
          <SubscriptionListItem subscription={withServer({ state: 'pending_deletion' })} />,
        );

        expect(screen.queryByRole('button', { name: new RegExp(t.controls.console) })).toBeNull();
      });
    });

    describe('credentials', () => {
      it('keeps the password off the card until asked', () => {
        // A dashboard left open on a screen should not be a password on a screen.
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        expect(screen.queryByText(/hunter2/)).toBeNull();
      });

      it('reveals it on request', async () => {
        vi.mocked(fetchServerCredentials).mockResolvedValueOnce({
          username: 'root',
          password: 'hunter2',
        });
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.showPassword) }));

        expect(await screen.findByText(/hunter2/)).toBeInTheDocument();
      });

      it('treats an imported machine without one as an answer, not a fault', async () => {
        /**
         * Machines adopted from the hypervisor were built by hand and the
         * engine never held their password. An error here would tell the
         * customer something is broken when nothing is.
         */
        vi.mocked(fetchServerCredentials).mockRejectedValueOnce(
          new Error('no_credentials: nothing stored'),
        );
        renderWithProviders(<SubscriptionListItem subscription={withServer()} />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(t.controls.showPassword) }));

        expect(await screen.findByText(t.controls.noPassword)).toBeInTheDocument();
        expect(screen.queryByText(t.controls.failed)).toBeNull();
      });
    });

    describe('the "no data yet" note', () => {
      it('explains an empty table before the engine has polled', () => {
        // `status: 'unknown'` is "not asked yet", not a machine state.
        renderWithProviders(
          <SubscriptionListItem
            subscription={withServer({ machine: { status: 'unknown', cpu_load: null } })}
          />,
        );

        expect(screen.getByText(t.telemetry.note)).toBeInTheDocument();
      });

      it('gets out of the way once figures arrive', () => {
        /**
         * It used to render unconditionally, so once telemetry started flowing
         * the card showed "running / 0%" with "no data yet" underneath —
         * contradicting the line above it.
         */
        renderWithProviders(
          <SubscriptionListItem
            subscription={withServer({ machine: { status: 'running', cpu_load: 0 } })}
          />,
        );

        expect(screen.queryByText(t.telemetry.note)).toBeNull();
      });

      it('treats a zero reading as a reading', () => {
        // 0% load is a measurement, not a missing one — and it is the value an
        // idle machine reports, so it is the common case, not the edge one.
        renderWithProviders(
          <SubscriptionListItem
            subscription={withServer({ machine: { status: 'running', cpu_load: 0 } })}
          />,
        );

        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });

    describe('network', () => {
      it('shows throughput in both directions', () => {
        renderWithProviders(
          <SubscriptionListItem
            subscription={withServer({
              machine: { status: 'running', rx_bps: 12_400_000, tx_bps: 400_000 },
            })}
          />,
        );

        expect(screen.getByText(/12/)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(t.telemetry.mbits))).toBeInTheDocument();
      });

      it('treats an idle machine as measured, not unmeasured', () => {
        // Zero is a reading. `0 || dash` would have hidden it, and an idle
        // server is the common case, not the edge one.
        renderWithProviders(
          <SubscriptionListItem
            subscription={withServer({ machine: { status: 'running', rx_bps: 0, tx_bps: 0 } })}
          />,
        );

        expect(screen.getByText(new RegExp(t.telemetry.mbits))).toBeInTheDocument();
      });

      it('keeps the dash when the engine has no rate to give', () => {
        // First sample, or a reboot that reset the guest's counters.
        renderWithProviders(
          <SubscriptionListItem
            subscription={withServer({ machine: { status: 'running', rx_bps: null, tx_bps: null } })}
          />,
        );

        const line = screen.getByText(new RegExp(`^${t.telemetry.network}:`));
        expect(line.textContent).toContain(t.telemetry.noData);
      });
    });

    it('never shows a telemetry figure, only dashes', () => {
      renderWithProviders(<SubscriptionListItem subscription={subscription()} />);

      // With no server block there is nothing to report. An invented load or
      // address is a lie about the customer's own machine, so the card shows
      // dashes rather than plausible figures.
      expect(screen.queryByText(/\d+([.,]\d+)?\s*(%|Мбит|Mbps|GB\/s)/)).toBeNull();
    });

    /**
     * The IP is the one telemetry line with a real source behind it — the
     * provisioning engine, relayed by Billing. It appears only when Billing
     * actually sends it; the dash has to survive until then, because a blank or
     * a guessed address reads as a fact about the customer's machine.
     */
    it('shows the address once Billing relays it', () => {
      renderWithProviders(
        <SubscriptionListItem
          subscription={subscription({
            server: { public_ip: '167.179.34.101', state: 'active', running: true },
          })}
        />,
      );

      expect(screen.getByText('167.179.34.101')).toBeInTheDocument();
    });

    it('keeps the dash while Billing sends no server block', () => {
      renderWithProviders(<SubscriptionListItem subscription={subscription({ server: null })} />);

      const ipLine = screen.getByText(new RegExp(`^${t.telemetry.ip}:`));
      expect(ipLine.textContent).toContain(t.telemetry.noData);
    });
  });
  describe('price', () => {
  const t2 = dictionaries.ru.dashboard.subscriptions;

  it('shows what the plan costs next to how often it is charged', () => {
    // "Ежемесячно" on its own is half an answer to "how much am I paying".
    renderWithProviders(
      <SubscriptionListItem
        subscription={subscription({
          package_code: 'VDS_PRO_MONTHLY',
          price: { amount_minor: 180000, currency: 'RUB', billing_period: 'monthly' },
        })}
      />,
    );

    expect(screen.getByText(new RegExp(t2.term.monthly))).toHaveTextContent('1');
  });

  it('shows the term alone when Billing cannot price the plan', () => {
    // A plan withdrawn from the catalogue has no price to show, and inventing
    // one would be a claim about the customer's money.
    renderWithProviders(
      <SubscriptionListItem subscription={subscription({ package_code: 'VDS_PRO_MONTHLY' })} />,
    );

    expect(screen.getByText(t2.term.monthly)).toBeInTheDocument();
  });
});
});
