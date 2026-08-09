import styled from 'styled-components';
import { Link } from 'react-router';
import { DashboardShell } from '../components/dashboard/DashboardShell';
import { Button } from '../components/ui/Button';
import { ChatWidget } from '../support/ChatWidget';
import { isChatConfigured, openChat } from '../support/chatwoot';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h4};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Notice = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.semantic.warning};
`;

const NoticeTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h6};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const NoticeBody = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const GroupTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h5};
  color: ${({ theme }) => theme.colors.indigo[900]};
  margin-bottom: 12px;
`;

const Tips = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 20px;
  list-style: disc;
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

/**
 * Technical support inside the account.
 *
 * The conversation itself lives in Chatwoot, on its own machine — this page is
 * the entrance and the place that says what to include. Two states, and the
 * difference matters: with chat configured it opens the widget; without, it says
 * so and points at the contact details rather than showing a dead button.
 *
 * Someone opening this page usually has something broken right now. "Coming
 * soon" would be the least useful thing to tell them, so the unconfigured state
 * carries a route to a human instead.
 *
 * The chat is deliberately anonymous for the moment. Identifying the signed-in
 * customer needs an HMAC signature Chatwoot will validate, the key cannot be in
 * the browser, and this storefront has no backend to sign it — see
 * src/support/chatwoot.ts.
 */
export function SupportPage() {
  const t = useTranslation('dashboard');
  const { lang } = useLang();
  const configured = isChatConfigured();

  return (
    <DashboardShell>
      <ChatWidget source="dashboard" />

      <Head>
        <Title>{t.support.title}</Title>
        <Subtitle>{t.support.subtitle}</Subtitle>
      </Head>

      {configured ? (
        <div>
          <Button type="button" onClick={openChat}>
            {t.support.openChat}
          </Button>
        </div>
      ) : (
        <Notice>
          <NoticeTitle>{t.support.unavailableTitle}</NoticeTitle>
          <NoticeBody>{t.support.unavailableBody}</NoticeBody>
          <div>
            <Button as={Link} to={localizePath(lang, routePaths.contacts)} $variant="secondary" $size="sm">
              {t.sidebar.support}
            </Button>
          </div>
        </Notice>
      )}

      <div>
        <GroupTitle>{t.support.tipsTitle}</GroupTitle>
        <Tips>
          {t.support.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </Tips>
      </div>
    </DashboardShell>
  );
}
