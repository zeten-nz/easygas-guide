import { api } from './client';
import type { Vehicle } from '../types/entities';

export interface ListVehiclesParams {
  search?: string;
  customerId?: number;
  page?: number;
  limit?: number;
}

export interface ListVehiclesResult {
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
}

export interface VehicleInput {
  customerId: number;
  plateNumber: string;
  vin?: string | null;
  make: string;
  model: string;
  year?: number | null;
  engine?: string | null;
  mileage?: number | null;
}

export async function fetchVehicles(params: ListVehiclesParams): Promise<ListVehiclesResult> {
  const { data } = await api.get('/vehicles', { params });
  return data;
}

export async function fetchVehicle(id: number): Promise<Vehicle> {
  const { data } = await api.get(`/vehicles/${id}`);
  return data.vehicle;
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data } = await api.post('/vehicles', input);
  return data.vehicle;
}

export async function updateVehicle(id: number, input: Partial<VehicleInput>): Promise<Vehicle> {
  const { data } = await api.patch(`/vehicles/${id}`, input);
  return data.vehicle;
}
