// Scaffold only — see src/pages/TermsPage.tsx. The placeholders are meant to be
// replaced wholesale by Victor with reviewed legal text; they are not a draft to
// be edited into shape by us.
const TODO = '__ТЕКСТ_ОТ_VICTOR__';

export const legal = {
  meta: {
    title: 'Условия обслуживания — hotvds',
    description: 'Условия оказания услуг hotvds.com.',
  },
  terms: {
    title: 'Условия обслуживания',
    draftWarning:
      'Черновик. Юридический текст ещё не согласован и не имеет силы — разделы ниже заполняет Victor.',
    sections: [
      { heading: 'Стороны и оферта', placeholder: TODO },
      { heading: 'Описание услуги', placeholder: TODO },
      { heading: 'Тарифы и расчётный период', placeholder: TODO },
      { heading: 'Оплата и фискальные чеки (54-ФЗ)', placeholder: TODO },
      { heading: 'Продление и отказ от услуги', placeholder: TODO },
      { heading: 'Возврат средств', placeholder: TODO },
      { heading: 'Уровень обслуживания (SLA)', placeholder: TODO },
      { heading: 'Допустимое использование', placeholder: TODO },
      { heading: 'Персональные данные (152-ФЗ)', placeholder: TODO },
      { heading: 'Ответственность сторон', placeholder: TODO },
      { heading: 'Изменение условий', placeholder: TODO },
      { heading: 'Реквизиты и контакты', placeholder: TODO },
    ],
  },
} as const;
