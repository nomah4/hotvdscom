import { common as ruCommon } from './ru/common';
import { home as ruHome } from './ru/home';
import { pricing as ruPricing } from './ru/pricing';
import { product as ruProduct } from './ru/product';
import { dashboard as ruDashboard } from './ru/dashboard';
import { legal as ruLegal } from './ru/legal';

import { common as enCommon } from './en/common';
import { home as enHome } from './en/home';
import { pricing as enPricing } from './en/pricing';
import { product as enProduct } from './en/product';
import { dashboard as enDashboard } from './en/dashboard';
import { legal as enLegal } from './en/legal';

export const dictionaries = {
  ru: { common: ruCommon, home: ruHome, pricing: ruPricing, product: ruProduct, dashboard: ruDashboard, legal: ruLegal },
  en: { common: enCommon, home: enHome, pricing: enPricing, product: enProduct, dashboard: enDashboard, legal: enLegal },
};

export type Lang = keyof typeof dictionaries;
export type Namespace = keyof (typeof dictionaries)['ru'];
