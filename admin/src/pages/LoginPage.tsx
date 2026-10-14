import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { SUPER_ADMIN_EMAIL } from '../lib/config';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, createSuperAdmin, isAuthenticated, ready } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!ready) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) setError(result.error ?? 'Login failed');
  }

  async function onCreate() {
    setBusy(true);
    const result = await createSuperAdmin(fullName, email, password);
    setBusy(false);
    if (!result.ok) setError(result.error ?? 'Could not create the admin account');
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand-mark" style={{ width: 48, height: 48, borderRadius: 14 }}>
          TD
        </div>
        <h1>TrackerDuty Admin</h1>
        <p>Sign in to manage staff, duties, and live location tracking.</p>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Only needed the first time"
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? (
          <p style={{ color: 'var(--danger)', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
            {error}
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
            First time: create the admin account with {SUPER_ADMIN_EMAIL}
          </p>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={busy}>
          Sign in
        </button>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '0.6rem' }}
          type="button"
          disabled={busy}
          onClick={() => void onCreate()}
        >
          Create super admin
        </button>
      </form>
    </div>
  );
}
