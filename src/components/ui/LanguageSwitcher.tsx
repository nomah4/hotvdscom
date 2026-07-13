import styled from 'styled-components';
import { useLang, useTranslation } from '../../i18n/LanguageContext';

const Wrap = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.neutral[100]};
`;

const Option = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $active }) => ($active ? theme.colors.neutral[0] : theme.colors.neutral[600])};
  background: ${({ theme, $active }) => ($active ? theme.colors.indigo[600] : 'transparent')};
  transition: background 0.15s ease, color 0.15s ease;
`;

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const t = useTranslation('common');

  return (
    <Wrap role="group" aria-label="Language">
      <Option type="button" $active={lang === 'ru'} onClick={() => setLang('ru')}>
        {t.langSwitcher.ru}
      </Option>
      <Option type="button" $active={lang === 'en'} onClick={() => setLang('en')}>
        {t.langSwitcher.en}
      </Option>
    </Wrap>
  );
}
