import type { home as ruHome } from '../ru/home';
import type { DeepWiden } from '../../deepWiden';

export const home = {
  meta: {
    title: 'hotvds — NVMe VDS Hosting',
    description:
      'Powerful NVMe VDS from $10/mo with DDoS protection and 24/7 support. Your server deploys automatically after payment.',
  },
  hero: {
    eyebrow: 'A new generation of VDS',
    title: 'NVMe VDS hosting',
    subtitle:
      'Powerful NVMe-backed servers with support that actually answers. Spin up your project today — zero paperwork.',
    ctaPrimary: 'Launch a server',
    ctaSecondary: 'View pricing',
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
  finalCta: {
    title: 'Ready to launch your project?',
    cta: 'Launch a server',
  },
} as const satisfies DeepWiden<typeof ruHome>;
