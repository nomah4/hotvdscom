import styled from 'styled-components';
import { Link } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { PageIntro } from '../components/content/PageIntro';
import { Button } from '../components/ui/Button';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { localizePath, routePaths } from '../i18n/paths';
import { usePageMeta } from '../i18n/usePageMeta';

const Wrap = styled.div`
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
`;

/**
 * Not found, in the visitor's own language.
 *
 * Registered as a splat inside the MarketingLayout block, so a mistyped
 * /ru/datacentres lands here with the header and footer intact instead of being
 * bounced to /en by the global catch-all — which silently threw away both the
 * bad address and the visitor's language. React Router ranks by specificity, so
 * this never outranks a real route.
 *
 * It deliberately does not print the address that was requested: reflecting the
 * visitor's own string into the page buys nothing and is one more thing to
 * escape. The footer underneath already links everything the site has.
 *
 * Note this is a soft 404 — nginx answers 200 with the SPA shell for any path,
 * so crawlers are not told the page is missing. Fixing that is server-side work,
 * outside this repo.
 */
export function NotFoundPage() {
  const t = useTranslation('common');
  const { lang } = useLang();

  usePageMeta(t.notFound.meta.title, t.notFound.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.notFound.title} lead={t.notFound.body} />
          <Button as={Link} to={localizePath(lang, routePaths.home)}>
            {t.notFound.backHome}
          </Button>
        </Wrap>
      </PageContainer>
    </Section>
  );
}
