import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { DutyBadge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Tabs } from '../components/ui/Tabs';
import { useMockStore } from '../context/MockStoreContext';
import { useToast } from '../context/ToastContext';
import type { Duty, DutyStatus, RecurrenceType } from '../types';

const steps = ['Select Staff', 'Duty Details', 'Schedule', 'Location Tracking', 'Review'];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PAGE_SIZE = 6;

const initialWizard = {
  staffId: '',
  title: '',
  description: '',
  date: '2026-10-10',
  startTime: '10:00',
  endTime: '18:00',
  recurrence: 'one_time' as RecurrenceType,
  recurrenceEndDate: '',
  selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as string[],
  trackingEnabled: true,
  trackingIntervalMinutes: 5 as 5 | 10,
  locationAlertThresholdMinutes: 15,
};

export function DutiesPage() {
  const { push } = useToast();
  const { duties, setDuties, staff, setNotifications } = useMockStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialWizard);
  const [editScopeOpen, setEditScopeOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null);
  const [detail, setDetail] = useState<Duty | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseFrom, setPauseFrom] = useState('2026-10-20');
  const [pauseResume, setPauseResume] = useState('2026-11-01');
  const [confirmCancel, setConfirmCancel] = useState<Duty | null>(null);

  const counts = useMemo(
    () => ({
      all: duties.length,
      active: duties.filter((d) => d.status === 'Active').length,
      scheduled: duties.filter((d) => d.status === 'Scheduled').length,
      paused: duties.filter((d) => d.status === 'Paused').length,
      history: duties.filter((d) => ['Completed', 'Cancelled'].includes(d.status)).length,
    }),
    [duties],
  );

  const filtered = useMemo(() => {
    return duties.filter((d) => {
      const q = query.toLowerCase();
      const matches =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.staffName.toLowerCase().includes(q);
      if (!matches) return false;
      if (tab === 'active') return d.status === 'Active';
      if (tab === 'scheduled') return d.status === 'Scheduled';
      if (tab === 'paused') return d.status === 'Paused';
      if (tab === 'history') return d.status === 'Completed' || d.status === 'Cancelled';
      return true;
    });
  }, [duties, query, tab]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedStaff = staff.find((s) => s.id === form.staffId);

  function openWizard() {
    setForm(initialWizard);
    setStep(0);
    setWizardOpen(true);
  }

  function nextStep() {
    if (step === 0 && !form.staffId) {
      push('Select a staff member');
      return;
    }
    if (step === 1 && !form.title.trim()) {
      push('Duty title is required');
      return;
    }
    if (step === 2 && form.startTime >= form.endTime && form.recurrence !== 'daily') {
      // allow overnight for night patrols; only soft warn in UI toast for same-day
    }
    if (step === 2 && form.recurrence === 'selected_days' && form.selectedDays.length === 0) {
      push('Select at least one day');
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function notifyStaff(type: 'DUTY_ASSIGNED' | 'DUTY_UPDATED' | 'DUTY_CANCELLED', message: string) {
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}`,
        type,
        title:
          type === 'DUTY_ASSIGNED'
            ? 'Duty assigned'
            : type === 'DUTY_CANCELLED'
              ? 'Duty cancelled'
              : 'Duty updated',
        message,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }

  function createDuty(e?: FormEvent) {
    e?.preventDefault();
    if (!selectedStaff) return;

    const recurrenceLabel =
      form.recurrence === 'one_time'
        ? 'One time'
        : form.recurrence === 'daily'
          ? 'Every day'
          : form.recurrence === 'weekdays'
            ? 'Every weekday'
            : form.recurrence === 'weekly'
              ? 'Weekly'
              : form.recurrence === 'selected_days'
                ? `Days: ${form.selectedDays.join(', ')}`
                : 'Custom';

    const duty: Duty = {
      id: `duty-${Date.now()}`,
      staffId: selectedStaff.id,
      staffName: selectedStaff.fullName,
      title: form.title,
      description: form.description,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      timezone: 'Asia/Karachi',
      trackingEnabled: form.trackingEnabled,
      trackingIntervalMinutes: form.trackingIntervalMinutes,
      locationAlertThresholdMinutes: form.locationAlertThresholdMinutes,
      status: 'Scheduled',
      recurrence: form.recurrence,
      recurrenceLabel,
    };

    setDuties((prev) => [duty, ...prev]);
    notifyStaff(
      'DUTY_ASSIGNED',
      `New duty assigned: ${duty.title} — ${duty.startTime} to ${duty.endTime}.`,
    );
    setWizardOpen(false);
    push('Duty created · staff notification queued');
  }

  function applyEditScope(scope: 'one' | 'future' | 'all') {
    if (!selectedDuty) return;
    const labels = {
      one: 'Only this occurrence updated',
      future: 'This and future occurrences updated',
      all: 'Entire schedule updated (history preserved)',
    };
    notifyStaff('DUTY_UPDATED', `Your duty schedule has been updated: ${selectedDuty.title}.`);
    setEditScopeOpen(false);
    push(labels[scope]);
  }

  return (
    <div>
      <PageHeader
        title="Duties"
        description="Assign one-time and recurring duties. Historical completed duties stay immutable."
        actions={
          <button className="btn btn-primary" onClick={openWizard}>
            <Plus size={16} />
            Create duty
          </button>
        }
      />

      <section className="panel">
        <div className="panel-body">
          <Tabs
            active={tab}
            onChange={(id) => {
              setTab(id);
              setPage(1);
            }}
            tabs={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'active', label: 'Active', count: counts.active },
              { id: 'scheduled', label: 'Scheduled', count: counts.scheduled },
              { id: 'paused', label: 'Paused', count: counts.paused },
              { id: 'history', label: 'History', count: counts.history },
            ]}
          />

          <div className="toolbar" style={{ marginTop: '1rem' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}
              />
              <input
                className="input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search duty or staff"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Duty</th>
                  <th>Staff</th>
                  <th>Schedule</th>
                  <th>Tracking</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((duty) => (
                  <tr key={duty.id}>
                    <td>
                      <button className="link-btn" onClick={() => setDetail(duty)}>
                        <strong>{duty.title}</strong>
                      </button>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {duty.recurrenceLabel}
                      </div>
                    </td>
                    <td>{duty.staffName}</td>
                    <td>
                      {duty.date}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {duty.startTime} – {duty.endTime}
                      </div>
                    </td>
                    <td>
                      {duty.trackingEnabled
                        ? `${duty.trackingIntervalMinutes}m / alert ${duty.locationAlertThresholdMinutes}m`
                        : 'Disabled'}
                    </td>
                    <td>
                      <DutyBadge status={duty.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {duty.recurrence !== 'one_time' &&
                        !['Completed', 'Cancelled'].includes(duty.status) ? (
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setSelectedDuty(duty);
                              setEditScopeOpen(true);
                            }}
                          >
                            Edit recurring
                          </button>
                        ) : null}
                        {duty.status === 'Paused' ? (
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              setDuties((prev) =>
                                prev.map((d) =>
                                  d.id === duty.id ? { ...d, status: 'Scheduled' as DutyStatus } : d,
                                ),
                              );
                              push('Schedule resumed');
                            }}
                          >
                            Resume
                          </button>
                        ) : !['Completed', 'Cancelled'].includes(duty.status) ? (
                          <button
                            className="btn btn-ghost"
                            onClick={() => {
                              setSelectedDuty(duty);
                              setPauseOpen(true);
                            }}
                          >
                            Pause
                          </button>
                        ) : null}
                        {!['Cancelled', 'Completed'].includes(duty.status) ? (
                          <button
                            className="btn btn-ghost"
                            onClick={() => setConfirmCancel(duty)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <EmptyState
                title="No duties in this view"
                description="Create a duty or switch tabs."
                action={
                  <button className="btn btn-primary" onClick={openWizard}>
                    Create duty
                  </button>
                }
              />
            ) : null}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        </div>
      </section>

      <Modal
        title="Create duty"
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        wide
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => (step === 0 ? setWizardOpen(false) : setStep((s) => s - 1))}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={nextStep}>
                Continue
              </button>
            ) : (
              <button className="btn btn-primary" onClick={createDuty}>
                Create duty
              </button>
            )}
          </>
        }
      >
        <div className="steps">
          {steps.map((label, index) => (
            <span
              key={label}
              className={`step-chip ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`}
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>

        {step === 0 ? (
          <div className="field">
            <label>Staff member</label>
            <select
              className="select"
              value={form.staffId}
              onChange={(e) => setForm({ ...form, staffId: e.target.value })}
            >
              <option value="">Select staff…</option>
              {staff
                .filter((s) => s.status === 'Active')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeId})
                  </option>
                ))}
            </select>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid-form">
            <div className="field full">
              <label>Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Customer Delivery"
              />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea
                className="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid-form">
            <div className="field">
              <label>Start date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Recurrence</label>
              <select
                className="select"
                value={form.recurrence}
                onChange={(e) =>
                  setForm({ ...form, recurrence: e.target.value as RecurrenceType })
                }
              >
                <option value="one_time">One time</option>
                <option value="daily">Every day</option>
                <option value="weekdays">Every weekday</option>
                <option value="weekly">Weekly</option>
                <option value="selected_days">Selected days of week</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="field">
              <label>Start time</label>
              <input
                className="input"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="field">
              <label>End time</label>
              <input
                className="input"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            {form.recurrence === 'selected_days' ? (
              <div className="field full">
                <label>Days of week</label>
                <div className="chip-row">
                  {weekDays.map((day) => {
                    const active = form.selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`day-chip ${active ? 'active' : ''}`}
                        onClick={() =>
                          setForm({
                            ...form,
                            selectedDays: active
                              ? form.selectedDays.filter((d) => d !== day)
                              : [...form.selectedDays, day],
                          })
                        }
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {form.recurrence !== 'one_time' ? (
              <div className="field">
                <label>End date (optional)</label>
                <input
                  className="input"
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
                />
              </div>
            ) : null}
            <div className="field">
              <label>Timezone</label>
              <input className="input" value="Asia/Karachi" readOnly />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid-form">
            <div className="field">
              <label>Location tracking</label>
              <select
                className="select"
                value={form.trackingEnabled ? 'yes' : 'no'}
                onChange={(e) =>
                  setForm({ ...form, trackingEnabled: e.target.value === 'yes' })
                }
              >
                <option value="yes">Enabled</option>
                <option value="no">Disabled</option>
              </select>
            </div>
            <div className="field">
              <label>Tracking interval</label>
              <select
                className="select"
                value={form.trackingIntervalMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    trackingIntervalMinutes: Number(e.target.value) as 5 | 10,
                  })
                }
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
              </select>
            </div>
            <div className="field">
              <label>Offline alert threshold (minutes)</label>
              <input
                className="input"
                type="number"
                min={5}
                value={form.locationAlertThresholdMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    locationAlertThresholdMinutes: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="list-stack">
            <div className="list-item">
              <span>Staff</span>
              <strong>{selectedStaff?.fullName}</strong>
            </div>
            <div className="list-item">
              <span>Duty</span>
              <strong>{form.title || '—'}</strong>
            </div>
            <div className="list-item">
              <span>Schedule</span>
              <strong>
                {form.recurrence.replaceAll('_', ' ')} · {form.startTime}–{form.endTime}
              </strong>
            </div>
            <div className="list-item">
              <span>Start date</span>
              <strong>{form.date}</strong>
            </div>
            <div className="list-item">
              <span>End date</span>
              <strong>{form.recurrenceEndDate || 'No end date'}</strong>
            </div>
            <div className="list-item">
              <span>Tracking</span>
              <strong>
                {form.trackingEnabled
                  ? `Enabled · ${form.trackingIntervalMinutes}m · alert ${form.locationAlertThresholdMinutes}m`
                  : 'Disabled'}
              </strong>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="What do you want to change?"
        open={editScopeOpen}
        onClose={() => setEditScopeOpen(false)}
        footer={
          <button className="btn btn-secondary" onClick={() => setEditScopeOpen(false)}>
            Close
          </button>
        }
      >
        <div className="warn-box">
          Editing <strong>{selectedDuty?.title}</strong>. Completed historical duties are never
          modified.
        </div>
        <div className="list-stack" style={{ marginTop: '1rem' }}>
          <button className="btn btn-secondary scope-btn" onClick={() => applyEditScope('one')}>
            Only this occurrence
          </button>
          <button className="btn btn-secondary scope-btn" onClick={() => applyEditScope('future')}>
            This and future occurrences
          </button>
          <button className="btn btn-secondary scope-btn" onClick={() => applyEditScope('all')}>
            Entire schedule
          </button>
        </div>
      </Modal>

      <Modal
        title="Pause recurring schedule"
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPauseOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!selectedDuty) return;
                setDuties((prev) =>
                  prev.map((d) =>
                    d.id === selectedDuty.id ? { ...d, status: 'Paused' } : d,
                  ),
                );
                setPauseOpen(false);
                push(`Paused from ${pauseFrom} · resume ${pauseResume}`);
              }}
            >
              Pause schedule
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
          During the paused period no new duty occurrence should become active. History stays
          unchanged.
        </p>
        <div className="grid-form">
          <div className="field">
            <label>Pause from</label>
            <input
              className="input"
              type="date"
              value={pauseFrom}
              onChange={(e) => setPauseFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Resume on</label>
            <input
              className="input"
              type="date"
              value={pauseResume}
              onChange={(e) => setPauseResume(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Drawer
        open={!!detail}
        title={detail?.title ?? 'Duty detail'}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <div className="detail-card">
            <div className="detail-row">
              <span>Staff</span>
              <strong>{detail.staffName}</strong>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <DutyBadge status={detail.status} />
            </div>
            <div className="detail-row">
              <span>Date</span>
              <strong>{detail.date}</strong>
            </div>
            <div className="detail-row">
              <span>Time</span>
              <strong>
                {detail.startTime} – {detail.endTime}
              </strong>
            </div>
            <div className="detail-row">
              <span>Timezone</span>
              <strong>{detail.timezone}</strong>
            </div>
            <div className="detail-row">
              <span>Recurrence</span>
              <strong>{detail.recurrenceLabel}</strong>
            </div>
            <div className="detail-row">
              <span>Tracking</span>
              <strong>
                {detail.trackingEnabled
                  ? `${detail.trackingIntervalMinutes} min / alert ${detail.locationAlertThresholdMinutes} min`
                  : 'Disabled'}
              </strong>
            </div>
            <div className="detail-row">
              <span>Description</span>
              <strong>{detail.description || '—'}</strong>
            </div>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel duty?"
        message={`Cancel "${confirmCancel?.title}" for ${confirmCancel?.staffName}? Staff will be notified.`}
        confirmLabel="Cancel duty"
        danger
        onCancel={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (!confirmCancel) return;
          setDuties((prev) =>
            prev.map((d) =>
              d.id === confirmCancel.id ? { ...d, status: 'Cancelled' } : d,
            ),
          );
          notifyStaff('DUTY_CANCELLED', `Your duty has been cancelled: ${confirmCancel.title}.`);
          setConfirmCancel(null);
          push('Duty cancelled');
        }}
      />
    </div>
  );
}
