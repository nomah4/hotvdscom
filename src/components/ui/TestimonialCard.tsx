import styled from 'styled-components';

const Card = styled.figure`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.background.secondary};
  height: 100%;
`;

const Quote = styled.blockquote`
  font-size: 1.0625rem;
  line-height: ${({ theme }) => theme.lineHeights.body};
  color: ${({ theme }) => theme.colors.neutral[900]};

  &::before {
    content: '“';
    color: ${({ theme }) => theme.colors.accent[500]};
  }

  &::after {
    content: '”';
    color: ${({ theme }) => theme.colors.accent[500]};
  }
`;

const Author = styled.figcaption`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[600]};
`;

const Role = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

export function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
  return (
    <Card>
      <Quote>{quote}</Quote>
      <Author>
        <Name>{author}</Name>
        <Role>{role}</Role>
      </Author>
    </Card>
  );
}
