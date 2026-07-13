import type { common as ruCommon } from '../ru/common';
import type { DeepWiden } from '../../deepWiden';

export const common = {
  brand: 'hotvds',
  nav: {
    home: 'Home',
    pricing: 'Pricing',
    product: 'GPU Servers',
    dashboard: 'Dashboard',
  },
  buttons: {
    order: 'Order a VDS',
    login: 'Log in',
    logout: 'Log out',
    seeAll: 'All plans',
    seePricing: 'View pricing',
  },
  footer: {
    tagline: 'Powerful VDS hosting with an honest uptime.',
    columns: {
      product: {
        title: 'Product',
        links: ['Pricing', 'GPU Servers', 'Data Centers', 'API'],
      },
      company: {
        title: 'Company',
        links: ['About', 'Blog', 'Partners', 'Contact'],
      },
      support: {
        title: 'Support',
        links: ['Knowledge Base', 'Service Status', 'Contact Us'],
      },
    },
    copyright: '© {year} hotvds.com — design prototype.',
  },
  langSwitcher: {
    ru: 'RU',
    en: 'EN',
  },
  datacenterStatus: {
    live: 'Primary',
    comingSoon: 'Launching soon',
  },
} as const satisfies DeepWiden<typeof ruCommon>;
