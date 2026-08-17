export const common = {
  brand: 'hotvds',
  nav: {
    home: 'Главная',
    pricing: 'Тарифы',
    dashboard: 'Личный кабинет',
  },
  buttons: {
    order: 'Заказать VDS',
    login: 'Войти',
    logout: 'Выйти',
    seeAll: 'Все тарифы',
    seePricing: 'Смотреть тарифы',
  },
  footer: {
    tagline: 'Мощный VDS-хостинг.',
    // Keyed, not positional: Footer.tsx pairs each key with a route, so a label
    // without a destination is a compile error instead of a link that silently
    // borrows its neighbour's page. Keep the key order identical to en/common.ts —
    // it is the display order, and the parity test sorts keys and cannot see it.
    columns: {
      product: {
        title: 'Продукт',
        links: {
          pricing: 'Тарифы',
          datacenters: 'Дата-центры',
          api: 'API',
        },
      },
      company: {
        title: 'Компания',
        links: {
          about: 'О нас',
          blog: 'Блог',
          partners: 'Партнёрам',
          contacts: 'Контакты',
          terms: 'Условия обслуживания',
        },
      },
      support: {
        title: 'Поддержка',
        links: {
          knowledgeBase: 'База знаний',
          status: 'Статус сервиса',
          contactUs: 'Связаться с нами',
        },
      },
    },
    copyright: '© {year} hotvds.com',
  },
  notFound: {
    meta: {
      title: 'Страница не найдена — hotvds',
      description: 'Такой страницы на hotvds.com нет.',
    },
    title: 'Страница не найдена',
    // Deliberately does not echo the address that was requested: reflecting the
    // visitor's own string into the page buys nothing and is one more thing to
    // escape. The footer below already lists everything the site has.
    body: 'Возможно, в адресе опечатка, или страница переехала. Ссылки на всё, что у нас есть, — в футере ниже.',
    backHome: 'На главную',
  },
  auth: {
    signInRequired: 'Требуется вход',
    // Names the identity provider on purpose: the sign-in page lives on
    // webtalk.one, and an unannounced jump to another domain looks like phishing.
    signInHint: 'Войдите через webtalk.one, чтобы открыть личный кабинет.',
    signingIn: 'Входим…',
  },
  langSwitcher: {
    ru: 'RU',
    en: 'EN',
  },
  datacenterStatus: {
    live: 'Работает',
    comingSoon: 'Скоро открытие',
  },
} as const;
