// Четыре страницы об одном юрлице. Вместе, потому что заполнять их будет один
// человек за один заход, и разъезжаться им нечем.
//
// Ничего из этого нельзя выдумать: реквизиты, адрес, телефон, история и условия
// партнёрской программы — это обязательства, а не копирайтинг. Правдоподобный
// текст здесь хуже пустого места, потому что читается как согласованный
// (та же логика, что в src/pages/TermsPage.tsx).
const TODO = '__ТЕКСТ_ОТ_VICTOR__';

export const company = {
  about: {
    meta: {
      title: 'О нас — hotvds',
      description: 'Кто стоит за hotvds.com.',
    },
    title: 'О нас',
    intro: 'Здесь будет рассказ о компании и её реквизиты.',
    sections: [
      { heading: 'Юридическое лицо и реквизиты', placeholder: TODO },
      { heading: 'История', placeholder: TODO },
      { heading: 'Команда', placeholder: TODO },
      { heading: 'Где мы находимся', placeholder: TODO },
    ],
  },
  blog: {
    meta: {
      title: 'Блог — hotvds',
      description: 'Записи команды hotvds.com.',
    },
    title: 'Блог',
    // Утверждение проверяемое и точное: публикаций действительно нет. Это лучше
    // и честнее, чем витрина с выдуманными заголовками статей.
    empty: 'Публикаций пока нет. Когда появится первая, она будет здесь.',
    sections: [
      { heading: 'О чём будем писать', placeholder: TODO },
      { heading: 'Кто ведёт блог', placeholder: TODO },
    ],
  },
  partners: {
    meta: {
      title: 'Партнёрам — hotvds',
      description: 'Партнёрская программа hotvds.com.',
    },
    title: 'Партнёрам',
    intro: 'Условия партнёрства ещё готовятся.',
    sections: [
      { heading: 'Условия участия', placeholder: TODO },
      { heading: 'Вознаграждение', placeholder: TODO },
      { heading: 'Как подключиться', placeholder: TODO },
      { heading: 'Реферальные ссылки и отчётность', placeholder: TODO },
    ],
  },
  contacts: {
    meta: {
      title: 'Контакты — hotvds',
      description: 'Как связаться с hotvds.com.',
    },
    title: 'Контакты',
    intro: 'Каналы связи и реквизиты компании.',
    sections: [
      { heading: 'Электронная почта', placeholder: TODO },
      { heading: 'Телефон', placeholder: TODO },
      { heading: 'Юридический адрес', placeholder: TODO },
      { heading: 'Реквизиты', placeholder: TODO },
      { heading: 'Часы работы поддержки', placeholder: TODO },
    ],
  },
} as const;
