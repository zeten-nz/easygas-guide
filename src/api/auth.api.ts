import { api, setCsrfToken } from './client';
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
  setCsrfToken(data.csrfToken ?? null, data.rotationSeq);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setCsrfToken(null);
  }
}

/** Returns the current user, or null when not authenticated (401). */
export async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me');
    setCsrfToken(data.csrfToken ?? null, data.rotationSeq);
    return data.user;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        setCsrfToken(null);
        return null;
      }
    }
    throw err;
  }
}

export async function register(input: RegisterInput): Promise<{ message: string }> {
  const { data } = await api.post('/auth/register', input);
  return data;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Authenticated self password change. Clears the first-login restriction of a
 * temporary-password session. The server revokes the old session and returns a
 * fresh one + CSRF token, so we adopt the new token and return the updated user
 * (mustChangePassword now false).
 */
export async function changePassword(input: ChangePasswordInput): Promise<User> {
  const { data } = await api.post('/auth/change-password', input);
  setCsrfToken(data.csrfToken ?? null, data.rotationSeq);
  return data.user;
}
