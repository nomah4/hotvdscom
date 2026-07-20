import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Section } from '../components/layout/Section';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TariffCard } from '../components/ui/TariffCard';
import { DatacenterBadge } from '../components/ui/DatacenterBadge';
import { TestimonialCard } from '../components/ui/TestimonialCard';
import { LogoStrip } from '../components/ui/LogoStrip';
import { FaqAccordionItem } from '../components/ui/FaqAccordionItem';
import { useLang, useTranslation } from '../i18n/LanguageContext';
import { localizePath, orderPath, routePaths } from '../i18n/paths';
import { usePageMeta } from '../i18n/usePageMeta';
import { useTariffs } from '../api/catalogue';
import { datacenters } from '../data/datacenters';
import { media } from '../theme/breakpoints';

const Hero = styled.div`
  position: relative;
  overflow: hidden;
  padding-block: 64px;

  ${media.laptop`
    padding-block: 96px;
  `}
`;

const HeroGlow = styled.div`
  position: absolute;
  top: -20%;
  right: -10%;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, ${({ theme }) => theme.colors.accent[100]} 0%, transparent 70%);
  filter: blur(20px);
  pointer-events: none;
`;

const HeroInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 28px;
  position: relative;

  ${media.laptop`
    align-items: flex-start;
    text-align: left;
    max-width: 640px;
  `}
`;

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h1};
  line-height: ${({ theme }) => theme.lineHeights.h1};
`;

const HeroSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
  max-width: 560px;
`;

const HeroActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  ${media.mobile`
    flex-direction: row;
    width: auto;
  `}
`;

const HeroTrust = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 48px;

  ${media.tablet`
    grid-template-columns: repeat(2, 1fr);
  `}

  ${media.laptop`
    grid-template-columns: repeat(4, 1fr);
  `}
`;

const ValueCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const ValueIcon = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.mint[100]};
  color: ${({ theme }) => theme.colors.mint[700]};
  font-size: 1.25rem;
`;

const ValueTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.h4};
`;

const ValueText = styled.p`
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const TariffGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 48px;

  ${media.tablet`
    grid-template-columns: repeat(3, 1fr);
  `}
`;

const CenterLink = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
`;

const DatacenterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
`;

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 48px;

  ${media.tablet`
    grid-template-columns: repeat(3, 1fr);
  `}
`;

const LogoStripWrap = styled.div`
  margin-top: 48px;
`;

const FaqList = styled.div`
  max-width: 720px;
  margin: 40px auto 0;
`;

const CtaBanner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
  color: ${({ theme }) => theme.colors.neutral[0]};
`;

const CtaTitle = styled.h2`
  color: ${({ theme }) => theme.colors.neutral[0]};
  font-size: ${({ theme }) => theme.fontSizes.h2};
`;

const CtaSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.accent[50]};
  font-size: 1.0625rem;
`;

const icons = ['⚡', '🛡️', '💬', '🚀'];

export function HomePage() {
  const t = useTranslation('home');
  const { lang } = useLang();
  const pricingPath = localizePath(lang, routePaths.pricing);

  usePageMeta(t.meta.title, t.meta.description);

  const { tariffs } = useTariffs();
  const teaserTariffs = tariffs.filter((tariff) => ['start', 'pro', 'business'].includes(tariff.id));

  return (
    <>
      <Section $background="tertiary">
        <PageContainer>
          <Hero>
            <HeroGlow />
            <HeroInner>
              <Badge $tone="accent">{t.hero.eyebrow}</Badge>
              <HeroTitle>{t.hero.title}</HeroTitle>
              <HeroSubtitle>{t.hero.subtitle}</HeroSubtitle>
              <HeroActions>
                <Button as={Link} to={orderPath(lang)} $size="lg" $fullWidth>
                  {t.hero.ctaPrimary}
                </Button>
                <Button as={Link} to={pricingPath} $variant="secondary" $size="lg" $fullWidth>
                  {t.hero.ctaSecondary}
                </Button>
              </HeroActions>
              <HeroTrust>
                <Badge $tone="mint">{t.hero.trustBadge}</Badge>
                <Badge $tone="indigo">{t.hero.trustNote}</Badge>
                <Badge $tone="accent">{t.hero.trustPrice}</Badge>
              </HeroTrust>
            </HeroInner>
          </Hero>
        </PageContainer>
      </Section>

      <Section $background="primary">
        <PageContainer>
          <SectionHeading title={t.valueProps.title} subtitle={t.valueProps.subtitle} />
          <Grid>
            {t.valueProps.items.map((item, i) => (
              <ValueCard key={item.title}>
                <ValueIcon>{icons[i]}</ValueIcon>
                <ValueTitle>{item.title}</ValueTitle>
                <ValueText>{item.text}</ValueText>
              </ValueCard>
            ))}
          </Grid>
        </PageContainer>
      </Section>

      <Section $background="secondary">
        <PageContainer>
          <SectionHeading title={t.tariffTeaser.title} subtitle={t.tariffTeaser.subtitle} />
          <TariffGrid>
            {teaserTariffs.map((tariff) => (
              <TariffCard key={tariff.id} tariff={tariff} />
            ))}
          </TariffGrid>
          <CenterLink>
            <Button as={Link} to={pricingPath} $variant="ghost">
              {t.tariffTeaser.linkLabel} →
            </Button>
          </CenterLink>
        </PageContainer>
      </Section>

      <Section $background="primary">
        <PageContainer>
          <SectionHeading title={t.datacenters.title} subtitle={t.datacenters.subtitle} />
          <DatacenterRow>
            {datacenters.map((dc) => (
              <DatacenterBadge key={dc.id} datacenter={dc} />
            ))}
          </DatacenterRow>
        </PageContainer>
      </Section>

      <Section $background="secondary">
        <PageContainer>
          <SectionHeading title={t.testimonials.title} subtitle={t.testimonials.subtitle} />
          <TestimonialGrid>
            {t.testimonials.items.map((item) => (
              <TestimonialCard key={item.author} quote={item.quote} author={item.author} role={item.role} />
            ))}
          </TestimonialGrid>
          <LogoStripWrap>
            <LogoStrip />
          </LogoStripWrap>
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

      <Section $background="accent">
        <PageContainer>
          <CtaBanner>
            <CtaTitle>{t.finalCta.title}</CtaTitle>
            <CtaSubtitle>{t.finalCta.subtitle}</CtaSubtitle>
            <Button as={Link} to={orderPath(lang)} $variant="secondary" $size="lg" style={{ background: '#fff' }}>
              {t.finalCta.cta}
            </Button>
          </CtaBanner>
        </PageContainer>
      </Section>
    </>
  );
}
