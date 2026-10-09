import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) setError(result.error ?? 'Login failed');
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
            Demo: admin@example.com / admin123
          </p>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
