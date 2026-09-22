import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SshKeysCard } from './SshKeysCard';
import { renderWithProviders } from '../../test/renderWithProviders';
import { dictionaries } from '../../i18n/dictionaries';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-1' }),
}));

vi.mock('../../api/sshKeys', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/sshKeys')>()),
  useSshKeys: vi.fn(),
  addSshKey: vi.fn(),
  deleteSshKey: vi.fn(),
}));

const { useSshKeys, addSshKey, deleteSshKey } = await import('../../api/sshKeys');

const t = dictionaries.ru.dashboard.sshKeys;

const KEY = {
  id: 'k-1',
  name: 'Laptop',
  key_type: 'ssh-ed25519',
  fingerprint: 'SHA256:abc',
  public_key: 'ssh-ed25519 AAAA laptop',
  created_at: '2026-09-22T05:00:00+00:00',
};

function mockKeys(keys = [KEY], extra: Partial<ReturnType<typeof useSshKeys>> = {}) {
  const refetch = vi.fn();
  vi.mocked(useSshKeys).mockReturnValue({
    data: { keys, max_keys: 10 },
    isLoading: false,
    error: null,
    refetch,
    ...extra,
  });
  return refetch;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SshKeysCard', () => {
  it('lists keys by name and fingerprint', () => {
    mockKeys();
    renderWithProviders(<SshKeysCard />);
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText(/SHA256:abc/)).toBeInTheDocument();
  });

  it('says plainly that existing servers do not get new keys', () => {
    mockKeys([]);
    renderWithProviders(<SshKeysCard />);
    expect(screen.getByText(t.empty)).toBeInTheDocument();
    expect(screen.getByText(t.existingNote)).toBeInTheDocument();
  });

  it('adds a key and reloads the list', async () => {
    const refetch = mockKeys([]);
    vi.mocked(addSshKey).mockResolvedValue(KEY);
    renderWithProviders(<SshKeysCard />);

    fireEvent.click(screen.getByRole('button', { name: t.add }));
    fireEvent.change(screen.getByPlaceholderText(t.keyPlaceholder), {
      target: { value: 'ssh-ed25519 AAAA laptop' },
    });
    fireEvent.click(screen.getByRole('button', { name: t.save }));

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(addSshKey).toHaveBeenCalledWith('token-1', '', 'ssh-ed25519 AAAA laptop');
  });

  it('turns a pasted private key into a warning, not a generic error', async () => {
    mockKeys([]);
    vi.mocked(addSshKey).mockRejectedValue(new Error('ssh_key_is_private: This is a private key'));
    renderWithProviders(<SshKeysCard />);

    fireEvent.click(screen.getByRole('button', { name: t.add }));
    fireEvent.change(screen.getByPlaceholderText(t.keyPlaceholder), {
      target: { value: '-----BEGIN OPENSSH PRIVATE KEY-----' },
    });
    fireEvent.click(screen.getByRole('button', { name: t.save }));

    expect(await screen.findByText(t.errors.ssh_key_is_private)).toBeInTheDocument();
  });

  it('asks before deleting', async () => {
    const refetch = mockKeys();
    vi.mocked(deleteSshKey).mockResolvedValue();
    renderWithProviders(<SshKeysCard />);

    fireEvent.click(screen.getByRole('button', { name: t.delete }));
    expect(deleteSshKey).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: t.deleteConfirm }));

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(deleteSshKey).toHaveBeenCalledWith('token-1', 'k-1');
  });

  it('hides the add button at the limit', () => {
    mockKeys(Array.from({ length: 10 }, (_, i) => ({ ...KEY, id: `k-${i}` })));
    renderWithProviders(<SshKeysCard />);
    expect(screen.queryByRole('button', { name: t.add })).not.toBeInTheDocument();
    expect(screen.getByText(t.limitReached.replace('{max}', '10'))).toBeInTheDocument();
  });

  it('shows one quiet line when loading fails', () => {
    mockKeys([], { data: null, error: 'boom' });
    renderWithProviders(<SshKeysCard />);
    expect(screen.getByText(t.error)).toBeInTheDocument();
  });
});
