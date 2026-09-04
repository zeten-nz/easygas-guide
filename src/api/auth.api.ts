import { api } from './client';
import type { User } from '../types/auth';

export interface LoginInput {
  phone: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  branchId: number;
  comment?: string;
  password: string;
}

export async function login(input: LoginInput): Promise<User> {
  const { data } = await api.post('/auth/login', input);
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/** Returns the current user, or null when not authenticated (401). */
export async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401) return null;
    }
    throw err;
  }
}

export async function register(input: RegisterInput): Promise<{ message: string }> {
  const { data } = await api.post('/auth/register', input);
  return data;
}

export async function forgotPassword(phone: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { phone });
  return data;
}

export async function verifyOtp(phone: string, otp: string): Promise<{ resetToken: string }> {
  const { data } = await api.post('/auth/verify-otp', { phone, otp });
  return data;
}

export async function resetPassword(resetToken: string, password: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { resetToken, password });
  return data;
}
