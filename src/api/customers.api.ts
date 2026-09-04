import { api } from './client';
import type { Customer, Vehicle } from '../types/entities';

export interface ListCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListCustomersResult {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
}

export async function fetchCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
  const { data } = await api.get('/customers', { params });
  return data;
}

export async function fetchCustomer(id: number): Promise<Customer> {
  const { data } = await api.get(`/customers/${id}`);
  return data.customer;
}

export async function fetchCustomerVehicles(id: number): Promise<Vehicle[]> {
  const { data } = await api.get(`/customers/${id}/vehicles`);
  return data.vehicles;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data } = await api.post('/customers', input);
  return data.customer;
}

export async function updateCustomer(id: number, input: Partial<CustomerInput>): Promise<Customer> {
  const { data } = await api.patch(`/customers/${id}`, input);
  return data.customer;
}
