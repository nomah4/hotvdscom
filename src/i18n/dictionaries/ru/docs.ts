// Документация, которой пока нет: публичный API и база знаний.
//
// Про API особенно: src/api/* — это бэкенд самой витрины (каталог, счета,
// ZITADEL), а не продукт, который мы продаём клиенту. Описывать его как
// публичный API нельзя — получится документация на интерфейс, которым никому
// нельзя пользоваться и который мы вправе сломать в любой момент.
const TODO = '__ТЕКСТ_ОТ_VICTOR__';

export const docs = {
  api: {
    meta: {
      title: 'API — hotvds',
      description: 'Программный интерфейс hotvds.com.',
    },
    title: 'API',
    intro: 'Публичного API пока нет. Здесь будет его описание, когда он появится.',
    sections: [
      { heading: 'Аутентификация', placeholder: TODO },
      { heading: 'Управление серверами', placeholder: TODO },
      { heading: 'Биллинг и счета', placeholder: TODO },
      { heading: 'Ограничения по частоте запросов', placeholder: TODO },
      { heading: 'Примеры и клиентские библиотеки', placeholder: TODO },
    ],
  },
  knowledgeBase: {
    meta: {
      title: 'База знаний — hotvds',
      description: 'Ответы на частые вопросы о VDS-хостинге hotvds.com.',
    },
    title: 'База знаний',
    intro: 'Пока здесь собраны ответы, которые уже есть на сайте. Полноценные руководства готовятся.',
    faqTitle: 'Частые вопросы',
    sectionsTitle: 'Руководства в работе',
    sections: [
      { heading: 'Первые шаги после заказа', placeholder: TODO },
      { heading: 'Подключение по SSH', placeholder: TODO },
      { heading: 'Сеть и DNS', placeholder: TODO },
      { heading: 'Оплата и документы', placeholder: TODO },
    ],
  },
} as const;
