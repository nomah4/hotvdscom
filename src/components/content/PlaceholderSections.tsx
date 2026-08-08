import styled from 'styled-components';

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Heading = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

// Mono and muted on purpose: a placeholder must not be mistakable for copy that
// has been written and approved.
const Placeholder = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export interface PlaceholderSection {
  heading: string;
  placeholder: string;
}

interface PlaceholderSectionsProps {
  sections: readonly PlaceholderSection[];
  /**
   * Heading level. Defaults to h3 so the list nests correctly under a page's h1
   * or a modal's h2; pass 'h2' where the sections are the page's own top-level
   * structure rather than a block inside it.
   */
  headingAs?: 'h2' | 'h3';
}

/**
 * A list of section headings whose text does not exist yet.
 *
 * Extracted from TermsContent once several pages needed the same thing: real
 * structure, with each missing piece named and visibly marked as missing. The
 * headings tell whoever fills them in what belongs where, and the mono
 * placeholder keeps a reader from mistaking an empty page for a finished one.
 *
 * The draft banner deliberately did NOT come along — it is calibrated to a
 * legally binding document and stays in TermsContent.
 */
export function PlaceholderSections({ sections, headingAs = 'h3' }: PlaceholderSectionsProps) {
  return (
    <Wrap>
      {sections.map((section) => (
        <Block key={section.heading}>
          <Heading as={headingAs}>{section.heading}</Heading>
          <Placeholder>{section.placeholder}</Placeholder>
        </Block>
      ))}
    </Wrap>
  );
}
