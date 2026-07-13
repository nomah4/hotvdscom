import { useState } from 'react';
import styled from 'styled-components';
import { Section } from '../components/layout/Section';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { TariffCard } from '../components/ui/TariffCard';
import { FaqAccordionItem } from '../components/ui/FaqAccordionItem';
import { PricingSlider } from '../components/pricing/PricingSlider';
import { TariffComparisonTable } from '../components/pricing/TariffComparisonTable';
import { useTranslation } from '../i18n/LanguageContext';
import { tariffs } from '../data/tariffs';
import { media } from '../theme/breakpoints';

const Hero = styled.div`
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h2};
`;

const HeroSubtitle = styled.p`
  font-size: 1.0625rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const ToggleRow = styled.div`
  display: flex;
  justify-content: center;
  margin: 32px 0 0;
`;

const Toggle = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.neutral[100]};
`;

const ToggleOption = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $active }) => ($active ? theme.colors.neutral[0] : theme.colors.neutral[600])};
  background: ${({ theme, $active }) => ($active ? theme.colors.indigo[600] : 'transparent')};
`;

const TariffGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 40px;

  ${media.tablet`
    grid-template-columns: repeat(2, 1fr);
  `}

  ${media.laptop`
    grid-template-columns: repeat(5, 1fr);
  `}
`;

const FaqList = styled.div`
  max-width: 720px;
  margin: 40px auto 0;
`;

export function PricingPage() {
  const t = useTranslation('pricing');
  const [yearly, setYearly] = useState(false);

  return (
    <>
      <Section $background="tertiary">
        <PageContainer>
          <Hero>
            <HeroTitle>{t.hero.title}</HeroTitle>
            <HeroSubtitle>{t.hero.subtitle}</HeroSubtitle>
          </Hero>
        </PageContainer>
      </Section>

      <Section $background="primary">
        <PageContainer>
          <SectionHeading title={t.configurator.title} />
          <div style={{ marginTop: 32 }}>
            <PricingSlider />
          </div>
        </PageContainer>
      </Section>

      <Section $background="secondary">
        <PageContainer>
          <SectionHeading title={t.comparison.title} subtitle={t.comparison.subtitle} />
          <ToggleRow>
            <Toggle role="group">
              <ToggleOption type="button" $active={!yearly} onClick={() => setYearly(false)}>
                {t.billingToggle.monthly}
              </ToggleOption>
              <ToggleOption type="button" $active={yearly} onClick={() => setYearly(true)}>
                {t.billingToggle.yearly}
              </ToggleOption>
            </Toggle>
          </ToggleRow>
          <TariffGrid>
            {tariffs.map((tariff) => (
              <TariffCard
                key={tariff.id}
                tariff={yearly ? { ...tariff, priceMonthly: tariff.priceYearly / 12 } : tariff}
              />
            ))}
          </TariffGrid>
          <TariffComparisonTable />
        </PageContainer>
      </Section>

      <Section $background="primary">
        <PageContainer>
          <SectionHeading title={t.faq.title} />
          <FaqList>
            {t.faq.items.map((item) => (
              <FaqAccordionItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </FaqList>
        </PageContainer>
      </Section>
    </>
  );
}
