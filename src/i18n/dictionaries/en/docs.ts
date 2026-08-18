import type { docs as ruDocs } from '../ru/docs';
import type { DeepWiden } from '../../deepWiden';

// See ru/docs.ts — the Russian file is the shape authority.
const TODO = '__TEXT_FROM_VICTOR__';

export const docs = {
  api: {
    meta: {
      title: 'API — hotvds',
      description: 'The hotvds.com programmatic interface.',
    },
    title: 'API',
    intro: 'There is no public API yet. Its documentation will live here once there is one.',
    sections: [
      { heading: 'Authentication', placeholder: TODO },
      { heading: 'Managing servers', placeholder: TODO },
      { heading: 'Billing and invoices', placeholder: TODO },
      { heading: 'Rate limits', placeholder: TODO },
      { heading: 'Examples and client libraries', placeholder: TODO },
    ],
  },
  knowledgeBase: {
    meta: {
      title: 'Knowledge Base — hotvds',
      description: 'Answers to common questions about hotvds.com VDS hosting.',
    },
    title: 'Knowledge Base',
    intro: 'For now this collects the answers already published on the site. Full guides are being written.',
    faqTitle: 'Frequently asked',
    sectionsTitle: 'Guides in progress',
    sections: [
      { heading: 'First steps after ordering', placeholder: TODO },
      { heading: 'Connecting over SSH', placeholder: TODO },
      { heading: 'Backups', placeholder: TODO },
      { heading: 'Networking and DNS', placeholder: TODO },
      { heading: 'Payment and documents', placeholder: TODO },
    ],
  },
} as const satisfies DeepWiden<typeof ruDocs>;
