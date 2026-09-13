import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { TelegramCard } from './TelegramCard';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-1' }),
}));

// The card's own hook decides whether anything renders at all; the plain
// functions are what the connect/poll/disconnect handlers call directly.
vi.mock('../../api/telegram', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/telegram')>()),
  useTelegramLink: vi.fn(),
  createTelegramLinkToken: vi.fn(),
  fetchTelegramLink: vi.fn(),
  unlinkTelegram: vi.fn(),
}));

const { useTelegramLink, createTelegramLinkToken, fetchTelegramLink, unlinkTelegram } =
  await import('../../api/telegram');

const t = dictionaries.ru.dashboard.telegram;

function mockLink(overrides: Partial<import('../../api/telegram').TelegramLink> = {}) {
  return {
    enabled: true,
    bot_username: 'hotvds_bot',
    linked: false,
    telegram_username: null,
    linked_at: null,
    ...overrides,
  };
}

function mockUseTelegramLink(overrides: Partial<ReturnType<typeof useTelegramLink>> = {}) {
  vi.mocked(useTelegramLink).mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('TelegramCard', () => {
  /**
   * Billing answers 404 to every Telegram route while an operator has the
   * feature off, and `useTelegramLink` reads that as `data: null` — same
   * contract as `useBalance`. A card that renders anyway (even an empty
   * shell) would be a promise this install does not keep.
   */
  it('renders nothing while the hook has no link (feature off)', () => {
    mockUseTelegramLink({ data: null, isLoading: false, error: null });

    const { container } = renderWithProviders(<TelegramCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing during the first load, before the feature state is known', () => {
    mockUseTelegramLink({ data: null, isLoading: true, error: null });

    const { container } = renderWithProviders(<TelegramCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('fails closed: a real fetch error shows one line, not a crash', () => {
    mockUseTelegramLink({ data: null, isLoading: false, error: 'telegram_failed' });

    renderWithProviders(<TelegramCard />);

    expect(screen.getByText(t.error)).toBeInTheDocument();
  });

  describe('not linked', () => {
    it('offers to connect', () => {
      mockUseTelegramLink({ data: mockLink(), isLoading: false, error: null });

      expect(() => renderWithProviders(<TelegramCard />)).not.toThrow();
      expect(screen.getByRole('button', { name: t.notLinked.connect })).toBeInTheDocument();
      expect(screen.getByText(t.notLinked.body)).toBeInTheDocument();
    });

    /**
     * Linking finishes outside the site — the customer presses Start in
     * Telegram, and Billing's webhook records it. The only way this page can
     * find out is by asking `GET /telegram/link` again, so the button must
     * open the deep link AND start polling, not just one of the two.
     */
    it('opens the deep link and polls until linked', async () => {
      vi.useFakeTimers();
      const refetch = vi.fn();
      mockUseTelegramLink({ data: mockLink(), isLoading: false, error: null, refetch });
      vi.mocked(createTelegramLinkToken).mockResolvedValue({
        deep_link: 'https://t.me/hotvds_bot?start=abc',
        token: 'abc',
        expires_at: '2026-09-13T00:10:00Z',
      });
      const openSpy = vi.fn();
      vi.stubGlobal('open', openSpy);
      vi.mocked(fetchTelegramLink)
        .mockResolvedValueOnce(mockLink({ linked: false }))
        .mockResolvedValueOnce(mockLink({ linked: true, telegram_username: 'ivan' }));

      renderWithProviders(<TelegramCard />);

      fireEvent.click(screen.getByRole('button', { name: t.notLinked.connect }));

      // `advanceTimersByTimeAsync` also drains the microtask queue, which is
      // what lets `createTelegramLinkToken`'s promise (and the state updates
      // after it) settle under fake timers — `waitFor`/`findBy*` poll with a
      // real `setInterval` internally and would simply hang here.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(openSpy).toHaveBeenCalledWith('https://t.me/hotvds_bot?start=abc', '_blank', 'noopener');
      expect(screen.getByText(t.notLinked.waiting)).toBeInTheDocument();
      // Rendered for phones/popup blockers, alongside the new tab.
      expect(screen.getByRole('link', { name: t.notLinked.openLink })).toHaveAttribute(
        'href',
        'https://t.me/hotvds_bot?start=abc',
      );

      // First poll tick: still not linked.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(fetchTelegramLink).toHaveBeenCalledTimes(1);
      expect(screen.getByText(t.notLinked.waiting)).toBeInTheDocument();

      // Second poll tick: linked.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(fetchTelegramLink).toHaveBeenCalledTimes(2);
      expect(screen.getByText(t.linked.connectedAs.replace('{username}', 'ivan'))).toBeInTheDocument();
      expect(refetch).toHaveBeenCalled();
    });

    it('offers "try again" once the 3-minute wait runs out', async () => {
      vi.useFakeTimers();
      mockUseTelegramLink({ data: mockLink(), isLoading: false, error: null });
      vi.mocked(createTelegramLinkToken).mockResolvedValue({
        deep_link: 'https://t.me/hotvds_bot?start=abc',
        token: 'abc',
        expires_at: '2026-09-13T00:10:00Z',
      });
      vi.stubGlobal('open', vi.fn());
      vi.mocked(fetchTelegramLink).mockResolvedValue(mockLink({ linked: false }));

      renderWithProviders(<TelegramCard />);
      fireEvent.click(screen.getByRole('button', { name: t.notLinked.connect }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText(t.notLinked.waiting)).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 1000);
      });

      expect(screen.getByText(t.notLinked.timedOut)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t.notLinked.tryAgain })).toBeInTheDocument();
    });

    it('shows an error when starting the connection fails', async () => {
      mockUseTelegramLink({ data: mockLink(), isLoading: false, error: null });
      vi.mocked(createTelegramLinkToken).mockRejectedValue(new Error('boom: no'));

      renderWithProviders(<TelegramCard />);
      fireEvent.click(screen.getByRole('button', { name: t.notLinked.connect }));

      expect(await screen.findByText(t.notLinked.failed)).toBeInTheDocument();
    });
  });

  describe('linked', () => {
    it('shows who is connected', () => {
      mockUseTelegramLink({
        data: mockLink({ linked: true, telegram_username: 'ivan' }),
        isLoading: false,
        error: null,
      });

      renderWithProviders(<TelegramCard />);

      expect(screen.getByText(t.linked.connectedAs.replace('{username}', 'ivan'))).toBeInTheDocument();
    });

    it('falls back to a plain "connected" with no username', () => {
      mockUseTelegramLink({
        data: mockLink({ linked: true, telegram_username: null }),
        isLoading: false,
        error: null,
      });

      renderWithProviders(<TelegramCard />);

      expect(screen.getByText(t.linked.connectedNoUsername)).toBeInTheDocument();
    });

    // The operator, not the customer, decides which events fire — so the
    // card offers no per-event controls at all, even though Billing still
    // sends an `events` map on the link object.
    it('offers no per-event checkboxes', () => {
      mockUseTelegramLink({
        data: mockLink({
          linked: true,
          telegram_username: 'ivan',
          // Billing may still send this map; the card must ignore it.
          events: { subscription_expiring_soon: true },
        }),
        isLoading: false,
        error: null,
      });

      renderWithProviders(<TelegramCard />);

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });

    describe('disconnect', () => {
      it('takes two presses', async () => {
        const refetch = vi.fn();
        mockUseTelegramLink({
          data: mockLink({ linked: true, telegram_username: 'ivan' }),
          isLoading: false,
          error: null,
          refetch,
        });
        vi.mocked(unlinkTelegram).mockResolvedValue(undefined);

        renderWithProviders(<TelegramCard />);

        fireEvent.click(screen.getByRole('button', { name: t.linked.disconnect }));
        expect(unlinkTelegram).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: t.linked.disconnectConfirm }));

        await waitFor(() => expect(unlinkTelegram).toHaveBeenCalledWith('token-1'));
        await waitFor(() => expect(refetch).toHaveBeenCalled());
      });

      it('can be backed out of', () => {
        mockUseTelegramLink({
          data: mockLink({ linked: true, telegram_username: 'ivan' }),
          isLoading: false,
          error: null,
        });

        renderWithProviders(<TelegramCard />);

        fireEvent.click(screen.getByRole('button', { name: t.linked.disconnect }));
        fireEvent.click(screen.getByRole('button', { name: t.linked.disconnectCancel }));

        expect(unlinkTelegram).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: t.linked.disconnectConfirm })).toBeNull();
      });

      it('shows an error and stays linked when disconnecting fails', async () => {
        mockUseTelegramLink({
          data: mockLink({ linked: true, telegram_username: 'ivan' }),
          isLoading: false,
          error: null,
        });
        vi.mocked(unlinkTelegram).mockRejectedValue(new Error('boom: no'));

        renderWithProviders(<TelegramCard />);
        fireEvent.click(screen.getByRole('button', { name: t.linked.disconnect }));
        fireEvent.click(screen.getByRole('button', { name: t.linked.disconnectConfirm }));

        expect(await screen.findByText(t.linked.disconnectFailed)).toBeInTheDocument();
        expect(screen.getByText(t.linked.connectedAs.replace('{username}', 'ivan'))).toBeInTheDocument();
      });
    });
  });
});
