import { common as ruCommon } from './ru/common';
import { home as ruHome } from './ru/home';
import { pricing as ruPricing } from './ru/pricing';
import { dashboard as ruDashboard } from './ru/dashboard';
import { legal as ruLegal } from './ru/legal';
import { network as ruNetwork } from './ru/network';
import { company as ruCompany } from './ru/company';
import { docs as ruDocs } from './ru/docs';

import { common as enCommon } from './en/common';
import { home as enHome } from './en/home';
import { pricing as enPricing } from './en/pricing';
import { dashboard as enDashboard } from './en/dashboard';
import { legal as enLegal } from './en/legal';
import { network as enNetwork } from './en/network';
import { company as enCompany } from './en/company';
import { docs as enDocs } from './en/docs';

export const dictionaries = {
  ru: {
    common: ruCommon,
    home: ruHome,
    pricing: ruPricing,
    dashboard: ruDashboard,
    legal: ruLegal,
    network: ruNetwork,
    company: ruCompany,
    docs: ruDocs,
  },
  en: {
    common: enCommon,
    home: enHome,
    pricing: enPricing,
    dashboard: enDashboard,
    legal: enLegal,
    network: enNetwork,
    company: enCompany,
    docs: enDocs,
  },
};

export type Lang = keyof typeof dictionaries;
export type Namespace = keyof (typeof dictionaries)['ru'];
