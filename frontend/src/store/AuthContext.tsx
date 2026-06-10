import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearStoredToken, getStoredToken, storeToken } from '../services/api';

export type BackendRole = 'medico' | 'paciente' | 'comisionista' | 'administrador';
export type UiRole = 'doctor' | 'patient' | 'commissioner' | 'admin';

type SessionUser = {
  id: string;
  email: string;
  role: BackendRole;
  status: string;
  phone?: string;
};

type AuthContextValue = {
  user: SessionUser | null;
  profile: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UiRole | null;
  verificationStatus: any;
  login: (email: string, password: string) => Promise<any>;
  register: (payload: unknown) => Promise<any>;
  resendVerification: (payload: { userId: string; channel?: 'email' | 'sms' | 'whatsapp' }) => Promise<any>;
  verifyContact: (payload: { userId: string; channel: 'email' | 'sms' | 'whatsapp'; code?: string; token?: string }) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const roleMap: Record<BackendRole, UiRole> = {
  medico: 'doctor',
  paciente: 'patient',
  comisionista: 'commissioner',
  administrador: 'admin'
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function hydrateSession() {
    if (!getStoredToken()) {
      setIsLoading(false);
      return;
    }

    try {
      const meResponse = await api.me();
      setUser(meResponse.data);
      const profileResponse = await api.profile().catch(() => ({ data: null }));
      setProfile(profileResponse.data);
      if (meResponse.data?.status === 'pendiente_verificacion') {
        const verificationResponse = await api.verificationStatus(meResponse.data.id).catch(() => ({ data: null }));
        setVerificationStatus(verificationResponse.data);
      } else {
        setVerificationStatus(null);
      }
    } catch {
      clearStoredToken();
      setUser(null);
      setProfile(null);
      setVerificationStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    hydrateSession();
  }, []);

  async function refreshSession() {
    const meResponse = await api.me();
    setUser(meResponse.data);
    const profileResponse = await api.profile().catch(() => ({ data: null }));
    setProfile(profileResponse.data);
    if (meResponse.data?.status === 'pendiente_verificacion') {
      const verificationResponse = await api.verificationStatus(meResponse.data.id).catch(() => ({ data: null }));
      setVerificationStatus(verificationResponse.data);
    } else {
      setVerificationStatus(null);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.login({ email, password });
    storeToken(response.data.accessToken);
    setUser(response.data.user);
    const profileResponse = await api.profile().catch(() => ({ data: null }));
    setProfile(profileResponse.data);
    setVerificationStatus(null);
    return response.data;
  }

  async function register(payload: unknown) {
    const response = await api.register(payload);
    storeToken(response.data.accessToken);
    setUser(response.data.user);
    setProfile(response.data.profile || null);
    setVerificationStatus(response.data.verification || null);
    return response.data;
  }

  async function resendVerification(payload: { userId: string; channel?: 'email' | 'sms' | 'whatsapp' }) {
    const response = await api.resendVerification(payload);
    setVerificationStatus(response.data || null);
    return response.data;
  }

  async function verifyContact(payload: { userId: string; channel: 'email' | 'sms' | 'whatsapp'; code?: string; token?: string }) {
    const response = await api.verifyContact(payload);
    if (response.data?.accessToken) {
      storeToken(response.data.accessToken);
      await refreshSession();
    } else {
      setVerificationStatus(response.data?.status || null);
    }
    return response.data;
  }

  function logout() {
    clearStoredToken();
    setUser(null);
    setProfile(null);
    setVerificationStatus(null);
  }

  async function refreshProfile() {
    const profileResponse = await api.profile();
    setProfile(profileResponse.data);
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    isAuthenticated: Boolean(user),
    isLoading,
    verificationStatus,
    role: user ? roleMap[user.role] : null,
    login,
    register,
    resendVerification,
    verifyContact,
    logout,
    refreshProfile,
    refreshSession
  }), [user, profile, isLoading, verificationStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
