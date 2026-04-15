const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'mediconnect_access_token';

export type ApiOptions = RequestInit & {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: ApiOptions['query']) {
  const url = new URL(`${API_URL}${path}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'No fue posible completar la solicitud.');
  }

  return payload;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
  register: (body: unknown) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body), auth: false }),
  me: () => apiRequest('/auth/me'),
  profile: () => apiRequest('/profiles/me'),
  updateProfile: (body: unknown) =>
    apiRequest('/profiles/me', { method: 'PATCH', body: JSON.stringify(body) }),
  doctors: (query?: ApiOptions['query']) => apiRequest('/doctors', { auth: false, query }),
  doctorAvailability: (doctorId: string, query?: ApiOptions['query']) =>
    apiRequest(`/doctors/${doctorId}/availability`, { auth: false, query }),
  listMyAvailability: () => apiRequest('/availability/me'),
  createAvailability: (body: unknown) =>
    apiRequest('/availability/me', { method: 'POST', body: JSON.stringify(body) }),
  deleteAvailability: (id: string) => apiRequest(`/availability/me/${id}`, { method: 'DELETE' }),
  appointments: (query?: ApiOptions['query']) => apiRequest('/appointments', { query }),
  createAppointment: (body: unknown) =>
    apiRequest('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  cancelAppointment: (id: string, body: unknown) =>
    apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH', body: JSON.stringify(body) }),
  confirmAppointment: (id: string) => apiRequest(`/appointments/${id}/confirm`, { method: 'PATCH' }),
  completeAppointment: (id: string) => apiRequest(`/appointments/${id}/complete`, { method: 'PATCH' }),
  specialties: () => apiRequest('/specialties', { auth: false }),
  users: (query?: ApiOptions['query']) => apiRequest('/users', { query }),
  blockUser: (id: string) => apiRequest(`/users/${id}/block`, { method: 'PATCH' }),
  unblockUser: (id: string) => apiRequest(`/users/${id}/unblock`, { method: 'PATCH' }),
  pendingDoctors: () => apiRequest('/doctors/pending-review'),
  uploadDoctorDocument: (body: unknown) =>
    apiRequest('/doctors/me/documents', { method: 'POST', body: JSON.stringify(body) }),
  approveDoctor: (doctorId: string) => apiRequest(`/doctors/${doctorId}/approve`, { method: 'PATCH' }),
  rejectDoctor: (doctorId: string, body: unknown) =>
    apiRequest(`/doctors/${doctorId}/reject`, { method: 'PATCH', body: JSON.stringify(body) }),
  prescriptions: () => apiRequest('/clinical/prescriptions/me'),
  medicalRecords: () => apiRequest('/clinical/medical-records/me')
};
