import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { DutyBadge, StaffBadge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { useMockStore } from '../context/MockStoreContext';
import { useToast } from '../context/ToastContext';
import { formatTime } from '../data/mock';
import type { StaffMember, StaffStatus } from '../types';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  employeeId: '',
  password: '',
  status: 'Active' as StaffStatus,
  notes: '',
};

const PAGE_SIZE = 5;

export function StaffPage() {
  const { push } = useToast();
  const { staff, duties, createStaff, updateStaff, setStaffStatus, resetStaffPassword } = useMockStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | StaffStatus>('All');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState<StaffMember | null>(null);
  const [confirm, setConfirm] = useState<{
    type: 'deactivate' | 'activate' | 'reset';
    member: StaffMember;
  } | null>(null);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchesQuery =
        !query ||
        s.fullName.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [staff, query, statusFilter]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditing(member);
    setForm({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      employeeId: member.employeeId,
      password: '',
      status: member.status,
      notes: member.notes ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!form.fullName || !form.email || !form.employeeId) {
      push('Please fill required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      push('Enter a valid email address');
      return;
    }

    try {
      if (editing) {
        await updateStaff(editing.id, {
          fullName: form.fullName,
          email: form.email.trim().toLowerCase(),
          phone: form.phone,
          employeeId: form.employeeId,
          status: form.status,
          notes: form.notes,
        });
        push('Staff updated');
      } else {
        if (form.password.length < 8) {
          push('Temporary password must be at least 8 characters');
          return;
        }
        const duplicate = staff.some(
          (s) => s.employeeId.toLowerCase() === form.employeeId.toLowerCase(),
        );
        if (duplicate) {
          push('Employee ID must be unique');
          return;
        }
        await createStaff({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          employeeId: form.employeeId,
          password: form.password,
          status: form.status,
          notes: form.notes,
        });
        push('Staff created. They can sign in on the Android app.');
      }
      setOpen(false);
    } catch {
      push('Could not save staff. Check the email is new and Realtime Database rules are published.');
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    const { type, member } = confirm;
    try {
      if (type === 'reset') {
        await resetStaffPassword(member.email);
        push(`Password reset email sent to ${member.email}`);
      } else {
        const status = type === 'activate' ? 'Active' : 'Inactive';
        await setStaffStatus(member.id, status);
        push(`${member.fullName} marked ${status}`);
      }
    } catch {
      push('That action could not be saved');
    }
    setConfirm(null);
  }

  const detailDuties = detail
    ? duties.filter((d) => d.staffId === detail.id).slice(0, 5)
    : [];

  return (
    <div>
      <PageHeader
        title="Staff management"
        description="Add staff, update their details, or mark an account inactive. Inactive staff cannot sign in."
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Add staff
          </button>
        }
      />

      <section className="panel">
        <div className="panel-body">
          <div className="toolbar">
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}
              />
              <input
                className="input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search name, email, employee ID"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="select"
              style={{ maxWidth: 180 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'All' | StaffStatus);
                setPage(1);
              }}
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <button className="link-btn" onClick={() => setDetail(member)}>
                        <strong>{member.fullName}</strong>
                      </button>
                    </td>
                    <td>{member.employeeId}</td>
                    <td>{member.email}</td>
                    <td>{member.phone || '—'}</td>
                    <td>
                      <StaffBadge status={member.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => openEdit(member)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() =>
                            setConfirm({
                              type: member.status === 'Active' ? 'deactivate' : 'activate',
                              member,
                            })
                          }
                        >
                          {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setConfirm({ type: 'reset', member })}
                        >
                          Reset password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <EmptyState
                title="No staff found"
                description="Try clearing filters or create a new staff member."
                action={
                  <button className="btn btn-primary" onClick={openCreate}>
                    Add staff
                  </button>
                }
              />
            ) : null}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={setPage}
          />
        </div>
      </section>

      <Modal
        title={editing ? 'Edit staff' : 'Create staff'}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => onSubmit()}>
              {editing ? 'Save changes' : 'Create staff'}
            </button>
          </>
        }
      >
        <form className="grid-form" onSubmit={onSubmit}>
          <div className="field">
            <label>Full name *</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Employee ID *</label>
            <input
              className="input"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Email *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+92 3XX XXXXXXX"
            />
          </div>
          {!editing ? (
            <div className="field">
              <label>Temporary password</label>
              <input
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                type="password"
                required
              />
            </div>
          ) : null}
          <div className="field">
            <label>Status</label>
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StaffStatus })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="field full">
            <label>Notes</label>
            <textarea
              className="textarea"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      <Drawer
        open={!!detail}
        title={detail?.fullName ?? 'Staff detail'}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <>
              <button className="btn btn-secondary" onClick={() => openEdit(detail)}>
                Edit
              </button>
              <button className="btn btn-primary" onClick={() => setDetail(null)}>
                Close
              </button>
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="detail-card">
            <div className="detail-row">
              <span>Employee ID</span>
              <strong>{detail.employeeId}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{detail.email}</strong>
            </div>
            <div className="detail-row">
              <span>Phone</span>
              <strong>{detail.phone || '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <StaffBadge status={detail.status} />
            </div>
            <div className="detail-row">
              <span>Created</span>
              <strong>{formatTime(detail.createdAt)}</strong>
            </div>
            <div className="detail-row">
              <span>Last login</span>
              <strong>{detail.lastLoginAt ? formatTime(detail.lastLoginAt) : '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Notes</span>
              <strong>{detail.notes || '—'}</strong>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Recent duties</h3>
              <div className="list-stack">
                {detailDuties.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1rem' }}>
                    No duties yet
                  </div>
                ) : (
                  detailDuties.map((d) => (
                    <div className="list-item" key={d.id}>
                      <div>
                        <strong>{d.title}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {d.date} · {d.startTime}–{d.endTime}
                        </div>
                      </div>
                      <DutyBadge status={d.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === 'reset'
            ? 'Reset password?'
            : confirm?.type === 'deactivate'
              ? 'Deactivate staff?'
              : 'Activate staff?'
        }
        message={
          confirm?.type === 'reset'
            ? `Send a temporary password reset for ${confirm.member.fullName}?`
            : confirm?.type === 'deactivate'
              ? `${confirm.member.fullName} will not receive new duties and cannot start duties.`
              : `${confirm?.member.fullName} will be able to receive and start duties again.`
        }
        confirmLabel={
          confirm?.type === 'reset'
            ? 'Reset password'
            : confirm?.type === 'deactivate'
              ? 'Deactivate'
              : 'Activate'
        }
        danger={confirm?.type === 'deactivate'}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
}
