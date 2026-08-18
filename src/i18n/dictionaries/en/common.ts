import type { common as ruCommon } from '../ru/common';
import type { DeepWiden } from '../../deepWiden';

export const common = {
  brand: 'hotvds',
  nav: {
    home: 'Home',
    pricing: 'Pricing',
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
    // Key order must match ru/common.ts — see the note there.
    columns: {
      product: {
        title: 'Product',
        links: {
          pricing: 'Pricing',
          datacenters: 'Data Centers',
          api: 'API',
        },
      },
      company: {
        title: 'Company',
        links: {
          about: 'About',
          blog: 'Blog',
          partners: 'Partners',
          contacts: 'Contact',
          terms: 'Terms of Service',
        },
      },
      support: {
        title: 'Support',
        links: {
          knowledgeBase: 'Knowledge Base',
          status: 'Service Status',
          contactUs: 'Contact Us',
        },
      },
    },
    copyright: '© {year} hotvds.com',
  },
  notFound: {
    meta: {
      title: 'Page not found — hotvds',
      description: 'No such page on hotvds.com.',
    },
    title: 'Page not found',
    body: 'The address may have a typo, or the page has moved. Everything the site does have is linked in the footer below.',
    backHome: 'Back to home',
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
