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

const Empty = styled.p`
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

/**
 * The blog, with no posts in it.
 *
 * Deliberately not a post engine: there is nothing to publish yet, and a listing
 * of invented articles would be the most convincing lie on the site. What this
 * page states — that there are no posts — is simply true, and stops the footer
 * link from leading nowhere. The engine is worth building the day there is a
 * first real piece to put in it, not before.
 */
export function BlogPage() {
  const t = useTranslation('company');

  usePageMeta(t.blog.meta.title, t.blog.meta.description);

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.blog.title} />
          <Empty>{t.blog.empty}</Empty>
          <PlaceholderSections sections={t.blog.sections} />
        </Wrap>
      </PageContainer>
    </Section>
  );
}
