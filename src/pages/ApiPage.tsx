import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { PageIntro } from '../components/content/PageIntro';
import { PlaceholderSections } from '../components/content/PlaceholderSections';
import { useTranslation } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

/**
 * Scaffold for a public API that does not exist.
 *
 * Do NOT fill this in from src/api/* — that is this storefront's own backend
 * (catalogue, invoices, ZITADEL), an internal detail we change whenever it
 * suits us. Documenting it here would publish an interface customers may not
 * use and we would break without notice. A public API is a product decision
 * first and a page second.
 */
export function ApiPage() {
  const t = useTranslation('docs');

  usePageMeta(t.api.meta.title, t.api.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.api.title} lead={t.api.intro} />
          <PlaceholderSections sections={t.api.sections} />
        </Wrap>
      </PageContainer>
    </Section>
  );
}
