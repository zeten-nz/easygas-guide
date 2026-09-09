export type CatalogStatus = 'ACTIVE' | 'ARCHIVED';
export type PriceBasis = 'NET' | 'GROSS' | 'UNKNOWN';
export type InjectionTechnology = 'PORT_MULTIPOINT' | 'DIRECT' | 'UNKNOWN';
export type ForcedInduction = 'NONE' | 'TURBO' | 'SUPERCHARGED' | 'UNKNOWN';

export interface Product {
  id: number;
  code: string;
  name: string;
  companyId: number;
  companyName: string;
  brandId: number | null;
  brandName: string | null;
  categoryId: number;
  categoryName: string;
  unitId: number | null;
  unitCode: string | null;
  unitName: string | null;
  priceMinor: number | null;
  currency: string;
  status: CatalogStatus;
  version: number;
  source: string;
  sourceRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  durationMinutes: number | null;
  priceMinor: number | null;
  currency: string;
  priceBasis: PriceBasis;
  taxRateBp: number | null;
  priceInclusiveMinor: number | null;
  status: CatalogStatus;
  version: number;
  source: string;
  sourceRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceItem {
  id: number;
  name: string;
  code: string | null;
  status: CatalogStatus;
  inUseCount: number;
  deletable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InjectionReference {
  id: number;
  designation: string;
  technology: InjectionTechnology;
  forcedInduction: ForcedInduction;
  description: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  id: number;
  oldPriceMinor: number | null;
  newPriceMinor: number | null;
  currency: string;
  changedById: number | null;
  changedByName: string | null;
  reason: string | null;
  source: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const REFERENCE_KINDS = ['companies', 'brands', 'product-categories', 'service-categories', 'units'] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];
