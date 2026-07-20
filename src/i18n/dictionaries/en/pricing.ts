import type { pricing as ruPricing } from '../ru/pricing';
import type { DeepWiden } from '../../deepWiden';

export const pricing = {
  meta: {
    title: 'VDS Pricing from $10/mo & Configurator — hotvds',
    description:
      'Build a custom VDS or pick a ready-made plan. NVMe storage, DDoS protection, IPv6. Save 15% with yearly billing.',
  },
  hero: {
    title: 'Pricing & configurator',
    subtitle: 'Build a server for your task or pick a ready-made plan',
  },
  configurator: {
    title: 'Build your VDS',
    cpuLabel: 'CPU (cores)',
    ramLabel: 'RAM (GB)',
    ssdLabel: 'NVMe storage (GB)',
    osLabel: 'Operating system',
    datacenterLabel: 'Data center',
    priceLabel: 'Price per month',
    cta: 'Order',
  },
  billingToggle: {
    monthly: 'Monthly',
    yearly: 'Yearly (−15%)',
  },
  comparison: {
    title: 'Ready-made plans',
    subtitle: 'Five configurations for every scale',
    popularBadge: 'Popular',
    loading: 'Loading plans…',
    error: "Couldn't load plans — please try again shortly.",
  },
  checkout: {
    starting: 'Opening payment…',
    failed: "Couldn't start the payment — please try again.",
    checking: 'Checking payment status…',
    paidTitle: 'Payment received',
    paidBody: "Thank you! We're preparing your server — details will arrive by email.",
    pendingTitle: 'Awaiting confirmation',
    pendingBody: 'The payment is still being processed. This page will update on its own.',
    failedTitle: 'Payment did not go through',
    failedBody: "You haven't been charged. You can try again from any plan.",
    backToPricing: 'Back to pricing',
    toDashboard: 'Go to dashboard',
  },
  features: {
    title: "What's included in every plan",
    items: [
      { name: 'Daily backups', tiers: [false, true, true, true, true] },
      { name: 'DDoS protection', tiers: [true, true, true, true, true] },
      { name: 'IPv6', tiers: [true, true, true, true, true] },
      { name: 'Priority support', tiers: [false, false, true, true, true] },
      { name: 'Dedicated IP', tiers: [false, true, true, true, true] },
    ],
  },
  faq: {
    title: 'Billing questions',
    items: [
      { question: 'Can I pay with a foreign card?', answer: 'Yes, we accept international Visa and Mastercard.' },
      { question: "What happens if my balance runs out?", answer: "We'll notify you 3 days ahead and only pause the server after a written notice." },
      { question: 'Do you offer refunds?', answer: 'Yes, within 7 days of your first payment on any plan.' },
    ],
  },
} as const satisfies DeepWiden<typeof ruPricing>;
