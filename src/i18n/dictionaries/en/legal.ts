import type { legal as ruLegal } from '../ru/legal';
import type { DeepWiden } from '../../deepWiden';

// Scaffold only — see src/pages/TermsPage.tsx. The Russian file is the one that
// matters commercially (the customers and the statutes are Russian); this side
// exists so the EN route is not blank.
const TODO = '__TEXT_FROM_VICTOR__';

export const legal = {
  meta: {
    title: 'Terms of Service — hotvds',
    description: 'Terms under which hotvds.com provides its services.',
  },
  terms: {
    title: 'Terms of Service',
    draftWarning:
      'Draft. The legal text has not been reviewed and is not in force — the sections below are Victor’s to complete.',
    sections: [
      { heading: 'Parties and offer (оферта)', placeholder: TODO },
      { heading: 'Description of the service', placeholder: TODO },
      { heading: 'Pricing and billing cycle', placeholder: TODO },
      { heading: 'Payment and fiscal receipts (54-ФЗ)', placeholder: TODO },
      { heading: 'Renewal and cancellation', placeholder: TODO },
      { heading: 'Refunds', placeholder: TODO },
      { heading: 'Service level (SLA)', placeholder: TODO },
      { heading: 'Acceptable use', placeholder: TODO },
      { heading: 'Personal data (152-ФЗ)', placeholder: TODO },
      { heading: 'Liability', placeholder: TODO },
      { heading: 'Changes to these terms', placeholder: TODO },
      { heading: 'Company details and contact', placeholder: TODO },
    ],
  },
} as const satisfies DeepWiden<typeof ruLegal>;
