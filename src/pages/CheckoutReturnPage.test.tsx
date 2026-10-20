import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token', isLoading: false }),
}));

vi.mock('../api/checkout', () => ({
  fetchInvoice: vi.fn(),
}));

const { fetchInvoice } = await import('../api/checkout');
const { rememberPendingInvoice } = await import('../api/useCheckout');
const { CheckoutReturnPage } = await import('./CheckoutReturnPage');
const { renderWithProviders } = await import('../test/renderWithProviders');
const { dictionaries } = await import('../i18n/dictionaries');

const t = dictionaries.en.pricing.checkout;

describe('CheckoutReturnPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('explains the restart after a paid upgrade', async () => {
    rememberPendingInvoice('inv-1', 'upgrade:sub-1:2-16-40');
    vi.mocked(fetchInvoice).mockResolvedValue({ status: 'paid' } as never);
    renderWithProviders(<CheckoutReturnPage />, { lang: 'en' });

    await waitFor(() => expect(screen.getByText(t.upgradePaidBody)).toBeInTheDocument());
    expect(screen.queryByText(t.paidBody)).not.toBeInTheDocument();
  });

  it('sends a failed upgrade back to the dashboard, not to pricing', async () => {
    rememberPendingInvoice('inv-1', 'upgrade:sub-1:2-16-40');
    vi.mocked(fetchInvoice).mockResolvedValue({ status: 'expired' } as never);
    renderWithProviders(<CheckoutReturnPage />, { lang: 'en' });

    const link = await screen.findByRole('link', { name: t.backToDashboard });
    expect(link).toHaveAttribute('href', '/en/dashboard');
    expect(screen.queryByText(t.backToPricing)).not.toBeInTheDocument();
    expect(screen.getByText(t.upgradeFailedBody)).toBeInTheDocument();
    expect(screen.queryByText(t.failedBody)).not.toBeInTheDocument();
  });

  it('keeps the purchase copy for a renewal', async () => {
    rememberPendingInvoice('inv-1', 'renewal:sub-1');
    vi.mocked(fetchInvoice).mockResolvedValue({ status: 'paid' } as never);
    renderWithProviders(<CheckoutReturnPage />, { lang: 'en' });

    await waitFor(() => expect(screen.getByText(t.paidBody)).toBeInTheDocument());
  });

  it('keeps Back to pricing for a failed purchase', async () => {
    rememberPendingInvoice('inv-1', 'PLAN:monthly');
    vi.mocked(fetchInvoice).mockResolvedValue({ status: 'expired' } as never);
    renderWithProviders(<CheckoutReturnPage />, { lang: 'en' });

    expect(await screen.findByRole('link', { name: t.backToPricing })).toBeInTheDocument();
    expect(screen.getByText(t.failedBody)).toBeInTheDocument();
  });
});
