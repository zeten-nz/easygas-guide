import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  timeout: 20_000,
});

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

/** Extracts the server's structured error, falling back to a generic Uzbek message. */
export function getApiError(err: unknown): ApiErrorPayload {
  if (err instanceof AxiosError) {
    const payload = err.response?.data?.error;
    if (payload && typeof payload.message === 'string') {
      return payload as ApiErrorPayload;
    }
    if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      return { code: 'NETWORK_ERROR', message: "Server bilan aloqa yo'q. Internetni tekshiring." };
    }
  }
  return { code: 'UNKNOWN', message: "Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring." };
}
