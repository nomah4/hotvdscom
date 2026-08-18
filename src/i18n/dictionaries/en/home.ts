import type { home as ruHome } from '../ru/home';
import type { DeepWiden } from '../../deepWiden';

export const home = {
  meta: {
    title: 'hotvds — NVMe VDS Hosting',
    description:
      'Powerful NVMe VDS from $10/mo: 99.98% uptime, DDoS protection, and 24/7 support. Your server deploys automatically after payment.',
  },
  hero: {
    eyebrow: 'A new generation of VDS',
    title: 'NVMe VDS hosting',
    subtitle:
      'Powerful NVMe-backed servers with a real 99.98% uptime and support that actually answers. Spin up your project today — zero paperwork.',
    ctaPrimary: 'Launch a server',
    ctaSecondary: 'View pricing',
    trustBadge: '99.98% uptime',
    trustNote: 'automatic setup',
    trustPrice: 'from $10/mo',
  },
  valueProps: {
    title: 'Why hotvds',
    subtitle: 'Everything you need for a calm production run',
    items: [
      { title: 'NVMe speed', text: 'NVMe disks with plenty of headroom in IOPS for databases and high-load projects.' },
      { title: 'DDoS protection', text: 'Network-level filtering keeps your server reachable at all times.' },
      { title: '24/7 support', text: 'Real engineers respond in minutes, not hours.' },
      { title: 'Automatic deployment', text: 'Your server deploys automatically after payment.' },
    ],
  },
  tariffTeaser: {
    title: 'Plans for every workload',
    subtitle: 'From side projects to production-grade traffic',
    linkLabel: 'All plans',
  },
  datacenters: {
    title: 'Data center locations',
    subtitle: 'Place your server closer to your users',
  },
  testimonials: {
    title: 'Trusted by teams',
    subtitle: 'What customers say about hotvds',
    items: [
      { quote: 'We migrated from another host in one evening with zero downtime.', author: 'Igor Sokolov', role: 'CTO, Fintra' },
      { quote: 'Support answers faster than I can finish typing the question.', author: 'Maria Lebedeva', role: 'DevOps Engineer' },
      { quote: 'Honest pricing, no hidden bandwidth fees.', author: 'Dmitry Kovalev', role: 'Founder, ShopEasy' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      { question: 'How fast does the server activate?', answer: 'Your server deploys automatically after payment.' },
      { question: 'Can I change my plan later?', answer: 'Contact support and we will help you pick the right plan.' },
      { question: 'Do you offer backups?', answer: 'Backups are not included in the plans.' },
      { question: 'What payment methods do you accept?', answer: 'Bank cards, instant bank transfer, and cryptocurrency.' },
    ],
  },
  finalCta: {
    title: 'Ready to launch your project?',
    cta: 'Launch a server',
  },
} as const satisfies DeepWiden<typeof ruHome>;
