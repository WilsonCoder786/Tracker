import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockAdmin } from '../data/mock';

interface AuthContextValue {
  isAuthenticated: boolean;
  admin: typeof mockAdmin | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'trackerapp.admin.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      admin: isAuthenticated ? mockAdmin : null,
      login: (email, password) => {
        if (email.trim().toLowerCase() === 'admin@example.com' && password === 'admin123') {
          sessionStorage.setItem(STORAGE_KEY, '1');
          setIsAuthenticated(true);
          return { ok: true };
        }
        return { ok: false, error: 'Invalid email or password (use admin@example.com / admin123)' };
      },
      logout: () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
