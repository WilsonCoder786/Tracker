import { useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ProfilePage() {
  const { admin, logout } = useAuth();
  const { push } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  function onChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      push('Enter current and new password');
      return;
    }
    if (newPassword.length < 8) {
      push('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      push('New passwords do not match');
      return;
    }
    push('Password updated (mock)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Admin account details and password change."
        actions={
          <button className="btn btn-secondary" onClick={() => setConfirmLogout(true)}>
            Logout
          </button>
        }
      />

      <div className="grid-2">
        <section className="panel">
          <div className="panel-header">
            <h2>Account</h2>
          </div>
          <div className="panel-body detail-card">
            <div className="detail-row">
              <span>Name</span>
              <strong>{admin?.fullName}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{admin?.email}</strong>
            </div>
            <div className="detail-row">
              <span>Role</span>
              <strong>ADMIN</strong>
            </div>
            <div className="detail-row">
              <span>Access</span>
              <strong>Full staff, duties, locations, settings</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Change password</h2>
          </div>
          <form className="panel-body grid-form" onSubmit={onChangePassword}>
            <div className="field full">
              <label>Current password</label>
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="field full">
              <button className="btn btn-primary" type="submit">
                Update password
              </button>
            </div>
          </form>
        </section>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Logout?"
        message="You will need to sign in again to access the admin console."
        confirmLabel="Logout"
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
      />
    </div>
  );
}
