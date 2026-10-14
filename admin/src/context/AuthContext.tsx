import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { SUPER_ADMIN_EMAIL } from '../lib/config';
import { auth, db } from '../lib/firebase';

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
}

interface AuthContextValue {
  ready: boolean;
  isAuthenticated: boolean;
  admin: AdminProfile | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  createSuperAdmin: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function profileFor(user: User): Promise<AdminProfile | null> {
  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);
  if (!snap.exists() && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
    const created: AdminProfile = {
      id: user.uid,
      fullName: 'Super Admin',
      email: SUPER_ADMIN_EMAIL,
    };
    await set(userRef, {
      role: 'admin',
      fullName: created.fullName,
      email: created.email,
      status: 'Active',
      createdAt: new Date().toISOString(),
    });
    return created;
  }
  const data = snap.val() as { role?: string; fullName?: string; email?: string } | null;
  if (!data || data.role !== 'admin') return null;
  return {
    id: user.uid,
    fullName: data.fullName ?? 'Super Admin',
    email: data.email ?? user.email ?? '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAdmin(null);
        setReady(true);
        return;
      }
      void profileFor(user)
        .then(async (profile) => {
          if (!profile) {
            await signOut(auth);
            setAdmin(null);
            return;
          }
          setAdmin(profile);
          await update(ref(db, `users/${user.uid}`), {
            lastLoginAt: new Date().toISOString(),
          }).catch(() => undefined);
        })
        .finally(() => setReady(true));
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated: admin != null,
      admin,
      login: async (email, password) => {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          const profile = await profileFor(cred.user);
          if (!profile) {
            await signOut(auth);
            return { ok: false, error: 'This account is not an admin.' };
          }
          return { ok: true };
        } catch (error) {
          return { ok: false, error: authError(error) };
        }
      },
      createSuperAdmin: async (fullName, email, password) => {
        if (email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
          return { ok: false, error: `Super admin email must be ${SUPER_ADMIN_EMAIL}` };
        }
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          await set(ref(db, `users/${cred.user.uid}`), {
            role: 'admin',
            fullName: fullName.trim() || 'Super Admin',
            email: SUPER_ADMIN_EMAIL,
            status: 'Active',
            createdAt: new Date().toISOString(),
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: authError(error) };
        }
      },
      changePassword: async (currentPassword, nextPassword) => {
        const user = auth.currentUser;
        if (!user?.email) throw new Error('Sign in again before changing the password.');
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, nextPassword);
      },
      logout: async () => {
        await signOut(auth);
      },
    }),
    [ready, admin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function authError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password';
  }
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Sign in instead.';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a moment and try again.';
  return 'Could not sign in. Check that Realtime Database is enabled and try again.';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
