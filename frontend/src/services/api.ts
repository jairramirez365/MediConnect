const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'mediconnect_access_token';

export class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type ApiOptions = RequestInit & {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function normalizePath(value: string) {
  return value.startsWith('/') ? value : `/${value}`;
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '/api/v1';
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function resolveApiBaseUrl() {
  const normalizedBaseUrl = normalizeBaseUrl(API_URL);

  if (/^https?:\/\//i.test(normalizedBaseUrl)) {
    return normalizedBaseUrl;
  }

  if (typeof window !== 'undefined') {
    return new URL(normalizePath(normalizedBaseUrl), window.location.origin).toString().replace(/\/$/, '');
  }

  return normalizedBaseUrl;
}

function buildUrl(path: string, query?: ApiOptions['query']) {
  const baseUrl = resolveApiBaseUrl();
  const normalizedPath = normalizePath(path);
  const url = new URL(`${baseUrl}${normalizedPath}`);

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
    throw new ApiError(payload.message || 'No fue posible completar la solicitud.', response.status, payload.details || null);
  }

  return payload;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
  register: (body: unknown) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body), auth: false }),
  resendVerification: (body: { userId: string; channel?: 'email' | 'sms' | 'whatsapp' }) =>
    apiRequest('/auth/resend-verification', { method: 'POST', body: JSON.stringify(body), auth: false }),
  verifyContact: (body: { userId: string; channel: 'email' | 'sms' | 'whatsapp'; code?: string; token?: string }) =>
    apiRequest('/auth/verify-contact', { method: 'POST', body: JSON.stringify(body), auth: false }),
  verificationStatus: (userId: string) => apiRequest(`/auth/verification-status/${userId}`, { auth: false }),
  me: () => apiRequest('/auth/me'),
  profile: () => apiRequest('/profiles/me'),
  updateProfile: (body: unknown) =>
    apiRequest('/profiles/me', { method: 'PATCH', body: JSON.stringify(body) }),
  departments: () => apiRequest('/locations/departments', { auth: false }),
  municipalities: (departmentCode: string) =>
    apiRequest('/locations/municipalities', { auth: false, query: { departmentCode } }),
  doctors: (query?: ApiOptions['query']) => apiRequest('/doctors', { auth: false, query }),
  doctorById: (doctorId: string) => apiRequest(`/doctors/${doctorId}`, { auth: false }),
  doctorAvailability: (doctorId: string, query?: ApiOptions['query']) =>
    apiRequest(`/doctors/${doctorId}/availability`, { auth: false, query }),
  listMyAvailability: () => apiRequest('/availability/me'),
  createAvailability: (body: unknown) =>
    apiRequest('/availability/me', { method: 'POST', body: JSON.stringify(body) }),
  deleteAvailability: (id: string) => apiRequest(`/availability/me/${id}`, { method: 'DELETE' }),
  appointments: (query?: ApiOptions['query']) => apiRequest('/appointments', { query }),
  appointmentById: (id: string) => apiRequest(`/appointments/${id}`),
  createAppointment: (body: unknown) =>
    apiRequest('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  prepareVideoSession: (appointmentId: string) =>
    apiRequest(`/appointments/${appointmentId}/video-session`, { method: 'POST', body: JSON.stringify({}) }),
  videoSessionByAppointment: (appointmentId: string) =>
    apiRequest(`/appointments/${appointmentId}/video-session`),
  payments: (query?: ApiOptions['query']) => apiRequest('/payments', { query }),
  paymentsSummary: () => apiRequest('/payments/summary'),
  payableAppointments: () => apiRequest('/payments/payable-appointments'),
  createPseCheckout: (appointmentId: string, body?: unknown) =>
    apiRequest(`/payments/appointments/${appointmentId}/pse-checkout`, { method: 'POST', body: JSON.stringify(body || {}) }),
  simulatePaymentSuccess: (paymentId: string, body?: unknown) =>
    apiRequest(`/payments/${paymentId}/simulate-success`, { method: 'POST', body: JSON.stringify(body || {}) }),
  respondCommissionAgentChatRequest: (id: string, body: { action: 'accept' | 'reject' }) =>
    apiRequest(`/appointments/${id}/commission-agent-chat-response`, { method: 'PATCH', body: JSON.stringify(body) }),
  cancelAppointment: (id: string, body: unknown) =>
    apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH', body: JSON.stringify(body) }),
  confirmAppointment: (id: string) => apiRequest(`/appointments/${id}/confirm`, { method: 'PATCH' }),
  completeAppointment: (id: string) => apiRequest(`/appointments/${id}/complete`, { method: 'PATCH' }),
  specialties: () => apiRequest('/specialties', { auth: false }),
  users: (query?: ApiOptions['query']) => apiRequest('/users', { query }),
  blockUser: (id: string) => apiRequest(`/users/${id}/block`, { method: 'PATCH' }),
  unblockUser: (id: string) => apiRequest(`/users/${id}/unblock`, { method: 'PATCH' }),
  commissionerOverview: () => apiRequest('/commissioner/overview'),
  commissionerCodes: (query?: ApiOptions['query']) => apiRequest('/commissioner/codes', { query }),
  createCommissionerCode: () => apiRequest('/commissioner/codes', { method: 'POST' }),
  commissionerPatients: (query?: ApiOptions['query']) => apiRequest('/commissioner/patients', { query }),
  pendingDoctors: () => apiRequest('/doctors/pending-review'),
  uploadDoctorDocument: (body: unknown) =>
    apiRequest('/doctors/me/documents', { method: 'POST', body: JSON.stringify(body) }),
  approveDoctor: (doctorId: string) => apiRequest(`/doctors/${doctorId}/approve`, { method: 'PATCH' }),
  rejectDoctor: (doctorId: string, body: unknown) =>
    apiRequest(`/doctors/${doctorId}/reject`, { method: 'PATCH', body: JSON.stringify(body) }),
  prescriptions: () => apiRequest('/clinical/prescriptions/me'),
  medicalRecords: () => apiRequest('/clinical/medical-records/me'),
  notifications: (query?: ApiOptions['query']) => apiRequest('/notifications/me', { query }),
  notificationUnreadSummary: () => apiRequest('/notifications/me/unread-summary'),
  notificationById: (id: string) => apiRequest(`/notifications/me/${id}`),
  markNotificationRead: (id: string) => apiRequest(`/notifications/me/${id}/read`, { method: 'PATCH' }),
  adminNotifications: (query?: ApiOptions['query']) => apiRequest('/notifications/admin/history', { query }),
  retryNotification: (id: string) => apiRequest(`/notifications/admin/${id}/retry`, { method: 'POST' }),
  runNotificationJobs: () => apiRequest('/notifications/admin/run-jobs', { method: 'POST' }),
  chatContacts: (query?: ApiOptions['query']) => apiRequest('/chat/contacts', { query }),
  chatConversations: (query?: ApiOptions['query']) => apiRequest('/chat/conversations', { query }),
  chatConversationById: (id: string) => apiRequest(`/chat/conversations/${id}`),
  openChatConversation: (body: { counterpartUserId: string; subject?: string }) =>
    apiRequest('/chat/conversations', { method: 'POST', body: JSON.stringify(body) }),
  sendChatMessage: (id: string, body: { content: string }) =>
    apiRequest(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  markChatRead: (id: string) => apiRequest(`/chat/conversations/${id}/read`, { method: 'PATCH' }),
  videoConsultations: (query?: ApiOptions['query']) => apiRequest('/video-consultations', { query }),
  startVideoSession: (id: string) => apiRequest(`/video-consultations/${id}/start`, { method: 'POST', body: JSON.stringify({}) }),
  endVideoSession: (id: string) => apiRequest(`/video-consultations/${id}/end`, { method: 'POST', body: JSON.stringify({}) }),
  videoMessages: (id: string) => apiRequest(`/video-consultations/${id}/messages`),
  sendVideoMessage: (id: string, body: { content: string }) =>
    apiRequest(`/video-consultations/${id}/messages`, { method: 'POST', body: JSON.stringify(body) })
};
