import { api } from './client';
import type { Paginated, PriceHistoryEntry, Product, Service } from '../types/catalog';

// ------------------------------- Products -------------------------------

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: number;
  brandId?: number;
  categoryId?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  sort?: 'name' | 'code' | 'price' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface ProductInput {
  code: string;
  name: string;
  companyId: number;
  categoryId: number;
  brandId?: number | null;
  unitId?: number | null;
  priceMinor?: number | null;
  priceReason?: string;
}

export async function listProducts(params: ListProductsParams): Promise<Paginated<Product>> {
  const { data } = await api.get('/products', { params });
  return data;
}
export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
}
export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await api.post('/products', input);
  return data.product;
}
export async function updateProduct(id: number, input: Partial<ProductInput> & { version: number }): Promise<Product> {
  const { data } = await api.patch(`/products/${id}`, input);
  return data.product;
}
export async function archiveProduct(id: number): Promise<Product> {
  const { data } = await api.post(`/products/${id}/archive`);
  return data.product;
}
export async function reactivateProduct(id: number): Promise<Product> {
  const { data } = await api.post(`/products/${id}/reactivate`);
  return data.product;
}
export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}
export async function getProductPriceHistory(id: number): Promise<PriceHistoryEntry[]> {
  const { data } = await api.get(`/products/${id}/price-history`);
  return data.history;
}

// ------------------------------- Services -------------------------------

export interface ListServicesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  sort?: 'name' | 'code' | 'price' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface ServiceInput {
  code: string;
  name: string;
  categoryId: number;
  durationMinutes?: number | null;
  priceMinor?: number | null;
  priceBasis?: 'NET' | 'GROSS' | 'UNKNOWN';
  taxRateBp?: number | null;
  priceInclusiveMinor?: number | null;
  priceReason?: string;
}

export async function listServices(params: ListServicesParams): Promise<Paginated<Service>> {
  const { data } = await api.get('/services', { params });
  return data;
}
export async function getService(id: number): Promise<Service> {
  const { data } = await api.get(`/services/${id}`);
  return data.service;
}
export async function createService(input: ServiceInput): Promise<Service> {
  const { data } = await api.post('/services', input);
  return data.service;
}
export async function updateService(id: number, input: Partial<ServiceInput> & { version: number }): Promise<Service> {
  const { data } = await api.patch(`/services/${id}`, input);
  return data.service;
}
export async function archiveService(id: number): Promise<Service> {
  const { data } = await api.post(`/services/${id}/archive`);
  return data.service;
}
export async function reactivateService(id: number): Promise<Service> {
  const { data } = await api.post(`/services/${id}/reactivate`);
  return data.service;
}
export async function deleteService(id: number): Promise<void> {
  await api.delete(`/services/${id}`);
}
export async function getServicePriceHistory(id: number): Promise<PriceHistoryEntry[]> {
  const { data } = await api.get(`/services/${id}/price-history`);
  return data.history;
}
