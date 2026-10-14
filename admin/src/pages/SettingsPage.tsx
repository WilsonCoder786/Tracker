import { useState } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { useMockStore } from '../context/MockStoreContext';
import { useToast } from '../context/ToastContext';
import type { SystemSettings } from '../types';

export function SettingsPage() {
  const { push } = useToast();
  const { settings, saveSettings } = useMockStore();
  const [draft, setDraft] = useState<SystemSettings>(settings);
  const [tab, setTab] = useState('tracking');
  const [confirmReset, setConfirmReset] = useState(false);

  function save() {
    if (draft.recentWindowMinutes >= draft.staleWindowMinutes) {
      push('Recent window must be less than stale window');
      return;
    }
    if (draft.staleWindowMinutes >= draft.offlineWindowMinutes) {
      push('Stale window must be less than offline window');
      return;
    }
    void saveSettings(draft)
      .then(() => push('Settings saved'))
      .catch(() => push('Settings could not be saved'));
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Tracking intervals, offline thresholds, retention, and notification preferences."
        actions={
          <div className="page-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
              Reset defaults
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save settings
            </button>
          </div>
        }
      />

      <section className="panel">
        <div className="panel-body">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'tracking', label: 'Location tracking' },
              { id: 'alerts', label: 'Alert windows' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'retention', label: 'Retention' },
            ]}
          />

          {tab === 'tracking' ? (
            <div className="grid-form" style={{ marginTop: '1.1rem' }}>
              <div className="field">
                <label>Default tracking interval</label>
                <select
                  className="select"
                  value={draft.defaultTrackingIntervalMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      defaultTrackingIntervalMinutes: Number(e.target.value) as 5 | 10,
                    })
                  }
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                </select>
              </div>
              <div className="field">
                <label>Default offline alert threshold (minutes)</label>
                <input
                  className="input"
                  type="number"
                  min={5}
                  value={draft.defaultAlertThresholdMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      defaultAlertThresholdMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Default timezone</label>
                <input className="input" value={draft.timezoneDefault} readOnly />
                <span className="field-hint">Schedules store Asia/Karachi explicitly.</span>
              </div>
            </div>
          ) : null}

          {tab === 'alerts' ? (
            <div className="grid-form" style={{ marginTop: '1.1rem' }}>
              <div className="field">
                <label>Recent window (minutes)</label>
                <input
                  className="input"
                  type="number"
                  value={draft.recentWindowMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, recentWindowMinutes: Number(e.target.value) })
                  }
                />
                <span className="field-hint">Example: 0–7 min = RECENT</span>
              </div>
              <div className="field">
                <label>Stale window (minutes)</label>
                <input
                  className="input"
                  type="number"
                  value={draft.staleWindowMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, staleWindowMinutes: Number(e.target.value) })
                  }
                />
                <span className="field-hint">Example: 8–14 min = STALE</span>
              </div>
              <div className="field">
                <label>Offline window (minutes)</label>
                <input
                  className="input"
                  type="number"
                  value={draft.offlineWindowMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, offlineWindowMinutes: Number(e.target.value) })
                  }
                />
                <span className="field-hint">Example: 15+ min = OFFLINE</span>
              </div>
            </div>
          ) : null}

          {tab === 'notifications' ? (
            <div className="grid-form" style={{ marginTop: '1.1rem' }}>
              {(
                [
                  ['dutyReminderEnabled', 'Duty reminder notifications'],
                  ['emailAlertsEnabled', 'Email alerts for offline location'],
                  ['recoveryAlertsEnabled', 'Notify on location recovery'],
                ] as const
              ).map(([key, label]) => (
                <div className="field" key={key}>
                  <label>{label}</label>
                  <select
                    className="select"
                    value={draft[key] ? 'yes' : 'no'}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value === 'yes' })
                    }
                  >
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                </div>
              ))}
              <div className="field full">
                <div className="warn-box">
                  Duplicate offline alerts are suppressed until location becomes healthy again
                  (idempotent alert state).
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'retention' ? (
            <div className="grid-form" style={{ marginTop: '1.1rem' }}>
              <div className="field">
                <label>Location retention (days)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={draft.locationRetentionDays}
                  onChange={(e) =>
                    setDraft({ ...draft, locationRetentionDays: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field full">
                <div className="warn-box">
                  Older points stay stored. The history page only shows points inside this retention window.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset settings to defaults?"
        message="This restores the working defaults (5 min interval, 15 min offline alert, 90 day retention)."
        confirmLabel="Reset"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          const defaults: SystemSettings = {
            defaultTrackingIntervalMinutes: 5,
            defaultAlertThresholdMinutes: 15,
            locationRetentionDays: 90,
            recentWindowMinutes: 7,
            staleWindowMinutes: 14,
            offlineWindowMinutes: 15,
            dutyReminderEnabled: true,
            emailAlertsEnabled: true,
            recoveryAlertsEnabled: true,
            timezoneDefault: 'Asia/Karachi',
          };
          setDraft(defaults);
          void saveSettings(defaults);
          setConfirmReset(false);
          push('Settings reset to defaults');
        }}
      />
    </div>
  );
}
