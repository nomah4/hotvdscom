import { useState } from 'react';
import styled from 'styled-components';

const Item = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const QuestionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 20px 0;
  text-align: left;
  background: none;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.0625rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.indigo[900]};
`;

const Icon = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent[50]};
  color: ${({ theme }) => theme.colors.accent[500]};
  transform: rotate(${({ $open }) => ($open ? '45deg' : '0deg')});
  transition: transform 0.2s ease;
  font-size: 1rem;
`;

const Answer = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => ($open ? '240px' : '0')};
  overflow: hidden;
  transition: max-height 0.25s ease;
`;

const AnswerText = styled.p`
  padding-bottom: 20px;
  color: ${({ theme }) => theme.colors.neutral[700]};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

interface FaqAccordionItemProps {
  question: string;
  answer: string;
}

export function FaqAccordionItem({ question, answer }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Item>
      <QuestionButton type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {question}
        <Icon $open={open}>+</Icon>
      </QuestionButton>
      <Answer $open={open}>
        <AnswerText>{answer}</AnswerText>
      </Answer>
    </Item>
  );
}
