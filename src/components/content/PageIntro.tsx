import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Lead = styled.p`
  font-size: 1.0625rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

interface PageIntroProps {
  title: string;
  lead?: string;
}

/**
 * The h1 and opening line of a content page.
 *
 * SectionHeading renders an h2 and is built for sections *within* a page, so the
 * content routes cannot use it for their own title without leaving the page
 * headingless. This is that missing piece, shared so ten pages do not each grow
 * their own slightly different h1.
 */
export function PageIntro({ title, lead }: PageIntroProps) {
  return (
    <Wrap>
      <Title>{title}</Title>
      {lead && <Lead>{lead}</Lead>}
    </Wrap>
  );
}
