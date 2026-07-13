import { common as ruCommon } from './ru/common';
import { home as ruHome } from './ru/home';
import { pricing as ruPricing } from './ru/pricing';
import { product as ruProduct } from './ru/product';
import { dashboard as ruDashboard } from './ru/dashboard';

import { common as enCommon } from './en/common';
import { home as enHome } from './en/home';
import { pricing as enPricing } from './en/pricing';
import { product as enProduct } from './en/product';
import { dashboard as enDashboard } from './en/dashboard';

export const dictionaries = {
  ru: { common: ruCommon, home: ruHome, pricing: ruPricing, product: ruProduct, dashboard: ruDashboard },
  en: { common: enCommon, home: enHome, pricing: enPricing, product: enProduct, dashboard: enDashboard },
};

export type Lang = keyof typeof dictionaries;
export type Namespace = keyof (typeof dictionaries)['ru'];
