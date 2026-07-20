export const common = {
  brand: 'hotvds',
  nav: {
    home: 'Главная',
    pricing: 'Тарифы',
    product: 'GPU-серверы',
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
    tagline: 'Мощный VDS-хостинг с честным аптаймом.',
    columns: {
      product: {
        title: 'Продукт',
        links: ['Тарифы', 'GPU-серверы', 'Дата-центры', 'API'],
      },
      company: {
        title: 'Компания',
        links: ['О нас', 'Блог', 'Партнёрам', 'Контакты'],
      },
      support: {
        title: 'Поддержка',
        links: ['База знаний', 'Статус сервиса', 'Связаться с нами'],
      },
    },
    copyright: '© {year} hotvds.com — дизайн-прототип.',
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
