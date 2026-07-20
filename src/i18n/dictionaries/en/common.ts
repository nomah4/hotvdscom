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
        links: ['About', 'Blog', 'Partners', 'Contact', 'Terms of Service'],
      },
      support: {
        title: 'Support',
        links: ['Knowledge Base', 'Service Status', 'Contact Us'],
      },
    },
    copyright: '© {year} hotvds.com — design prototype.',
  },
  auth: {
    signInRequired: 'Sign in required',
    signInHint: 'Sign in with webtalk.one to open your dashboard.',
    signingIn: 'Signing you in…',
  },
  langSwitcher: {
    ru: 'RU',
    en: 'EN',
  },
  datacenterStatus: {
    live: 'Live',
    comingSoon: 'Launching soon',
  },
} as const satisfies DeepWiden<typeof ruCommon>;
