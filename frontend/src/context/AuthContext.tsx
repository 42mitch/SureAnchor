import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api';

export interface AuthUser {
  email: string;
  displayName: string | null;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; destination?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then((data: AuthUser | null) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<{ error?: string; destination?: string }> {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.message ?? 'Login failed.' };
      }
      const data: AuthUser = await res.json();
      setUser(data);
      const destination = data.roles.includes('Admin') || data.roles.includes('Staff')
        ? '/admin'
        : data.roles.includes('Donor')
        ? '/donor'
        : '/';
      return { destination };
    } catch {
      return { error: 'Could not reach the server. Try again.' };
    }
  }

  async function logout(): Promise<void> {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
