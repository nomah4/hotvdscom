import type { company as ruCompany } from '../ru/company';
import type { DeepWiden } from '../../deepWiden';

// See ru/company.ts — the Russian file is the shape authority, and the one that
// matters commercially.
const TODO = '__TEXT_FROM_VICTOR__';

export const company = {
  about: {
    meta: {
      title: 'About — hotvds',
      description: 'Who is behind hotvds.com.',
    },
    title: 'About',
    intro: 'The company story and its registration details go here.',
    sections: [
      { heading: 'Legal entity and registration details', placeholder: TODO },
      { heading: 'History', placeholder: TODO },
      { heading: 'Team', placeholder: TODO },
      { heading: 'Where we are', placeholder: TODO },
    ],
  },
  blog: {
    meta: {
      title: 'Blog — hotvds',
      description: 'Posts from the hotvds.com team.',
    },
    title: 'Blog',
    empty: 'No posts yet. The first one will appear here.',
    sections: [
      { heading: 'What we plan to write about', placeholder: TODO },
      { heading: 'Who writes here', placeholder: TODO },
    ],
  },
  partners: {
    meta: {
      title: 'Partners — hotvds',
      description: 'The hotvds.com partner programme.',
    },
    title: 'Partners',
    intro: 'Partnership terms are still being prepared.',
    sections: [
      { heading: 'Who can join', placeholder: TODO },
      { heading: 'Commission', placeholder: TODO },
      { heading: 'How to sign up', placeholder: TODO },
      { heading: 'Referral links and reporting', placeholder: TODO },
    ],
  },
  contacts: {
    meta: {
      title: 'Contact — hotvds',
      description: 'How to reach hotvds.com.',
    },
    title: 'Contact',
    intro: 'Ways to reach us, and the company details.',
    sections: [
      { heading: 'Email', placeholder: TODO },
      { heading: 'Phone', placeholder: TODO },
      { heading: 'Registered address', placeholder: TODO },
      { heading: 'Company details', placeholder: TODO },
      { heading: 'Support hours', placeholder: TODO },
    ],
  },
} as const satisfies DeepWiden<typeof ruCompany>;
