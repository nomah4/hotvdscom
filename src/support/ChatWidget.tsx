import { useEffect } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { loadChat, setChatSource, type ChatSource } from './chatwoot';

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
 *
 * `source` tags the conversation with the surface it started from, so an agent
 * can tell a pre-sales question from an existing customer's problem before
 * reading a word. It is not identity — see setChatSource.
 */
export function ChatWidget({ source }: { source: ChatSource }) {
  const { lang } = useLang();

  useEffect(() => {
    loadChat(lang);
    setChatSource(source);
  }, [lang, source]);

  return null;
}
