import styled from 'styled-components';
import { PageContainer } from '../components/layout/PageContainer';
import { Section } from '../components/layout/Section';
import { PageIntro } from '../components/content/PageIntro';
import { PlaceholderSections } from '../components/content/PlaceholderSections';
import { FaqAccordionItem } from '../components/ui/FaqAccordionItem';
import { useTranslation } from '../i18n/LanguageContext';
import { usePageMeta } from '../i18n/usePageMeta';

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const GroupTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.h5};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const FaqList = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

/**
 * The knowledge base, built from answers the site already gives.
 *
 * The FAQ entries come from the home and pricing namespaces rather than a copy
 * of their own: those answers are already published on / and /pricing, so
 * gathering them here invents no new claim and cannot drift from what the rest
 * of the site says. Everything a knowledge base would additionally need — actual
 * guides — is named and marked missing.
 */
export function KnowledgeBasePage() {
  const t = useTranslation('docs');
  const home = useTranslation('home');
  const pricing = useTranslation('pricing');

  usePageMeta(t.knowledgeBase.meta.title, t.knowledgeBase.meta.description);

  const faq = [...home.faq.items, ...pricing.faq.items];

  return (
    <Section $background="primary">
      <PageContainer>
        <Wrap>
          <PageIntro title={t.knowledgeBase.title} lead={t.knowledgeBase.intro} />

          <div>
            <GroupTitle>{t.knowledgeBase.faqTitle}</GroupTitle>
            <FaqList>
              {faq.map((item) => (
                <FaqAccordionItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </FaqList>
          </div>

          <div>
            <GroupTitle>{t.knowledgeBase.sectionsTitle}</GroupTitle>
            <PlaceholderSections sections={t.knowledgeBase.sections} />
          </div>
        </Wrap>
      </PageContainer>
    </Section>
  );
}
