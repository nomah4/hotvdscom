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
 * Scaffold for the About page.
 *
 * Who the company legally is — its registered name, its details, where it is —
 * is a matter of public record that we do not hold, and a founding story is
 * Victor's to tell. An invented one would read as fact to every visitor, so the
 * page ships with its structure and named gaps instead. Same reasoning as
 * TermsPage.
 */
export function AboutPage() {
  const t = useTranslation('company');

  usePageMeta(t.about.meta.title, t.about.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.about.title} lead={t.about.intro} />
          <PlaceholderSections sections={t.about.sections} />
        </Wrap>
      </PageContainer>
    </Section>
  );
}
