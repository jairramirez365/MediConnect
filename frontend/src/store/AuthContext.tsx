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
  login: (email: string, password: string) => Promise<void>;
  register: (payload: unknown) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
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
    } catch {
      clearStoredToken();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    hydrateSession();
  }, []);

  async function login(email: string, password: string) {
    const response = await api.login({ email, password });
    storeToken(response.data.accessToken);
    setUser(response.data.user);
    const profileResponse = await api.profile().catch(() => ({ data: null }));
    setProfile(profileResponse.data);
  }

  async function register(payload: unknown) {
    const response = await api.register(payload);
    storeToken(response.data.accessToken);
    setUser(response.data.user);
    setProfile(response.data.profile || null);
  }

  function logout() {
    clearStoredToken();
    setUser(null);
    setProfile(null);
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
    role: user ? roleMap[user.role] : null,
    login,
    register,
    logout,
    refreshProfile
  }), [user, profile, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
