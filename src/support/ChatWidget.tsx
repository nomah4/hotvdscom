import { useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { loadChat } from './chatwoot';

/**
 * Mounts the Chatwoot widget for the surface it is rendered on.
 *
 * Renders nothing itself — the widget injects its own bubble. Mounted where chat
 * belongs (the marketing pages, the account) rather than globally, so it stays
 * off the checkout and payment-return screens: a chat bubble that overlaps the
 * confirm button while someone is deciding to pay is worse than no chat.
 *
 * Does nothing at all while Chatwoot is unconfigured, so an unconfigured build
 * loads no third-party script.
 */
export function ChatWidget() {
  const { lang } = useLang();

  useEffect(() => {
    loadChat(lang);
  }, [lang]);

  return null;
}
