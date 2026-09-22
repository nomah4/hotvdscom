import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { addSshKey, deleteSshKey, useSshKeys } from '../../api/sshKeys';
import { Button } from '../ui/Button';

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const KeyList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const KeyRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  flex-wrap: wrap;
`;

const KeyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const KeyName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.neutral[900]};
  overflow-wrap: anywhere;
`;

const Fingerprint = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
  overflow-wrap: anywhere;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const fieldStyles = `
  padding: 10px 12px;
  font-size: inherit;
`;

const Input = styled.input`
  ${fieldStyles}
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const KeyInput = styled.textarea`
  ${fieldStyles}
  min-height: 88px;
  resize: vertical;
  font-family: ${({ theme }) => theme.fonts.mono};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

// Same quiet link-button as TelegramCard's disconnect: deleting a key from
// the profile touches no server, so it does not need a loud button.
const QuietButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[500]};
  text-decoration: underline;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.semantic.error};
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

/** Billing's error code out of the `code: message` envelope `toApiError` builds. */
function errorCode(message: string): string {
  return message.split(':')[0].trim();
}

/**
 * "SSH keys" dashboard card: the customer's public keys, added to every new
 * server. Self-contained like TelegramCard — it reads its own hook, so
 * DashboardPage mounts it unconditionally.
 */
export function SshKeysCard() {
  const t = useTranslation('dashboard').sshKeys;
  const { accessToken } = useAuth();
  const { data, isLoading, error, refetch } = useSshKeys();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);

  if (isLoading && data === null && !error) return null;

  if (error || data === null) {
    return (
      <Card>
        <CardTitle>{t.title}</CardTitle>
        <ErrorText>{t.error}</ErrorText>
      </Card>
    );
  }

  const atLimit = data.keys.length >= data.max_keys;

  const closeForm = () => {
    setFormOpen(false);
    setName('');
    setPublicKey('');
    setAddError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || saving) return;
    setSaving(true);
    setAddError(null);
    try {
      await addSshKey(accessToken, name.trim(), publicKey);
      closeForm();
      refetch();
    } catch (err) {
      const code = err instanceof Error ? errorCode(err.message) : 'failed';
      setAddError(code in t.errors ? code : 'failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    setDeletingId(id);
    setDeleteError(false);
    try {
      await deleteSshKey(accessToken, id);
      setConfirmingId(null);
      refetch();
    } catch {
      setDeleteError(true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardTitle>{t.title}</CardTitle>
      <Note>{t.body}</Note>

      {data.keys.length === 0 ? (
        <Note>{t.empty}</Note>
      ) : (
        <KeyList>
          {data.keys.map((key) => (
            <KeyRow key={key.id}>
              <KeyInfo>
                <KeyName>{key.name}</KeyName>
                <Fingerprint>
                  {key.key_type} · {key.fingerprint}
                </Fingerprint>
              </KeyInfo>
              <Actions>
                {confirmingId === key.id ? (
                  <>
                    <QuietButton
                      type="button"
                      disabled={deletingId === key.id}
                      onClick={() => void remove(key.id)}
                    >
                      {t.deleteConfirm}
                    </QuietButton>
                    <QuietButton
                      type="button"
                      disabled={deletingId === key.id}
                      onClick={() => setConfirmingId(null)}
                    >
                      {t.cancel}
                    </QuietButton>
                  </>
                ) : (
                  <QuietButton type="button" onClick={() => setConfirmingId(key.id)}>
                    {t.delete}
                  </QuietButton>
                )}
              </Actions>
            </KeyRow>
          ))}
        </KeyList>
      )}
      {deleteError && <ErrorText>{t.deleteFailed}</ErrorText>}

      {formOpen ? (
        <Form onSubmit={(event) => void submit(event)}>
          <Label>
            {t.nameLabel}
            <Input
              value={name}
              maxLength={64}
              placeholder={t.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
            />
          </Label>
          <Label>
            {t.keyLabel}
            <KeyInput
              value={publicKey}
              required
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={t.keyPlaceholder}
              onChange={(event) => setPublicKey(event.target.value)}
            />
          </Label>
          {addError && <ErrorText>{t.errors[addError as keyof typeof t.errors]}</ErrorText>}
          <Actions>
            <Button type="submit" $size="sm" disabled={saving || !publicKey.trim()}>
              {t.save}
            </Button>
            <QuietButton type="button" disabled={saving} onClick={closeForm}>
              {t.cancel}
            </QuietButton>
          </Actions>
        </Form>
      ) : atLimit ? (
        <Note>{t.limitReached.replace('{max}', String(data.max_keys))}</Note>
      ) : (
        <div>
          <Button type="button" $size="sm" onClick={() => setFormOpen(true)}>
            {t.add}
          </Button>
        </div>
      )}

      <Note>{t.existingNote}</Note>
    </Card>
  );
}
