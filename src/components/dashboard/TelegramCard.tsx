import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  createTelegramLinkToken,
  fetchTelegramLink,
  unlinkTelegram,
  useTelegramLink,
  type TelegramLink,
} from '../../api/telegram';
import { Button } from '../ui/Button';

// Polling cadence and budget for "customer just left to press Start in
// Telegram". Both are spec'd, not tuned here: 3s is often enough to feel live
// without hammering Billing, and 3 minutes is long enough for someone to
// switch apps and come back without leaving the card spinning forever.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

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

const ConnectedLine = styled.p`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.mint[700]};
`;

const DeepLinkNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};

  a {
    color: ${({ theme }) => theme.colors.indigo[600]};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

// Quiet on purpose: disconnecting is reversible (the customer can just
// reconnect), unlike deleting a server, so it does not need the same visual
// weight as SubscriptionListItem's delete button — a link-button is enough.
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
 * "Telegram notifications" dashboard card.
 *
 * Self-contained, like `useBalance`'s callers: it reads its own hook and
 * renders nothing at all when Billing has the feature off, so `DashboardPage`
 * mounts it unconditionally. The one thing the storefront can never learn
 * from a button press is whether the customer actually linked their account —
 * that happens inside Telegram, recorded by Billing's own webhook — so the
 * "waiting" state exists to poll for it rather than assume it.
 */
export function TelegramCard() {
  const t = useTranslation('dashboard').telegram;
  const { accessToken } = useAuth();
  const { data, isLoading, error, refetch } = useTelegramLink();

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Set the moment a poll tick sees `linked: true`. Kept apart from `data`
  // (the hook's own state) so the card can switch to the linked view the
  // instant polling succeeds, without waiting for the hook's next effect run.
  const [polledLink, setPolledLink] = useState<TelegramLink | null>(null);

  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling result wins over the hook's own state the moment it arrives — see
  // the `polledLink` declaration above for why the two are kept apart.
  // Declared here, ahead of every handler below, so nothing in this file can
  // read it before it exists.
  const effectiveLink = polledLink ?? data;

  function stopPolling() {
    if (pollIntervalRef.current !== null) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current !== null) clearTimeout(pollTimeoutRef.current);
    pollIntervalRef.current = null;
    pollTimeoutRef.current = null;
    setWaiting(false);
  }

  // Never leave a timer running past the card's own lifetime.
  useEffect(() => stopPolling, []);

  const startConnect = async () => {
    if (!accessToken || connecting) return;
    setConnecting(true);
    setConnectError(null);
    setTimedOut(false);
    try {
      const { deep_link } = await createTelegramLinkToken(accessToken);
      // Phones and popup blockers alike get the plain link rendered under the
      // button; the new tab is the fast path when it is not blocked.
      window.open(deep_link, '_blank', 'noopener');
      setDeepLink(deep_link);
      setPolledLink(null);
      setWaiting(true);

      const poll = () => {
        fetchTelegramLink(accessToken)
          .then((result) => {
            if (result?.linked) {
              setPolledLink(result);
              stopPolling();
              // Keeps the hook's own state current for the rest of the
              // dashboard's lifetime, not just this one card render.
              refetch();
            }
          })
          .catch(() => {
            // A network hiccup mid-wait is not the same as giving up — the
            // next tick tries again, and only the 3-minute budget ends the wait.
          });
      };
      pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
      pollTimeoutRef.current = setTimeout(() => {
        stopPolling();
        setTimedOut(true);
      }, POLL_TIMEOUT_MS);
    } catch (err) {
      setConnectError(err instanceof Error ? errorCode(err.message) : 'failed');
    } finally {
      setConnecting(false);
    }
  };

  const retryConnect = () => {
    setTimedOut(false);
    setDeepLink(null);
    void startConnect();
  };

  const disconnect = async () => {
    if (!accessToken) return;
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      await unlinkTelegram(accessToken);
      setConfirmingDisconnect(false);
      setPolledLink(null);
      setDeepLink(null);
      setTimedOut(false);
      refetch();
    } catch {
      setDisconnectError(t.linked.disconnectFailed);
    } finally {
      setDisconnecting(false);
    }
  };

  // Nothing to show before the first fetch settles: showing a card that might
  // vanish a moment later is worse than a one-render delay.
  if (isLoading && effectiveLink === null && !error) return null;

  // Real failure — the 404 that means "feature off" never reaches `error`.
  // Fails closed: one quiet line, no crash, the rest of the dashboard is
  // untouched.
  if (error && effectiveLink === null) {
    return (
      <Card>
        <CardTitle>{t.title}</CardTitle>
        <ErrorText>{t.error}</ErrorText>
      </Card>
    );
  }

  // Feature off on this install — Billing answered 404. Render nothing at all,
  // not even the title: an empty card would be a promise this install does not
  // keep.
  if (effectiveLink === null) return null;

  if (!effectiveLink.linked) {
    return (
      <Card>
        <CardTitle>{t.title}</CardTitle>
        <Note>{t.notLinked.body}</Note>
        {timedOut ? (
          <>
            <Note>{t.notLinked.timedOut}</Note>
            <div>
              <Button type="button" $size="sm" onClick={retryConnect}>
                {t.notLinked.tryAgain}
              </Button>
            </div>
          </>
        ) : waiting ? (
          <>
            <Note>{t.notLinked.waiting}</Note>
            {deepLink && (
              <DeepLinkNote>
                <a href={deepLink} target="_blank" rel="noopener noreferrer">
                  {t.notLinked.openLink}
                </a>
              </DeepLinkNote>
            )}
          </>
        ) : (
          <div>
            <Button type="button" $size="sm" disabled={connecting} onClick={() => void startConnect()}>
              {t.notLinked.connect}
            </Button>
          </div>
        )}
        {connectError && <ErrorText>{t.notLinked.failed}</ErrorText>}
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{t.title}</CardTitle>
      <ConnectedLine>
        {effectiveLink.telegram_username
          ? t.linked.connectedAs.replace('{username}', effectiveLink.telegram_username)
          : t.linked.connectedNoUsername}
      </ConnectedLine>
      <Actions>
        {confirmingDisconnect ? (
          <>
            <QuietButton type="button" disabled={disconnecting} onClick={() => void disconnect()}>
              {t.linked.disconnectConfirm}
            </QuietButton>
            <QuietButton
              type="button"
              disabled={disconnecting}
              onClick={() => setConfirmingDisconnect(false)}
            >
              {t.linked.disconnectCancel}
            </QuietButton>
          </>
        ) : (
          <QuietButton type="button" onClick={() => setConfirmingDisconnect(true)}>
            {t.linked.disconnect}
          </QuietButton>
        )}
      </Actions>
      {disconnectError && <ErrorText>{disconnectError}</ErrorText>}
    </Card>
  );
}
