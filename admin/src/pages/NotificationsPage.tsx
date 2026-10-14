import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { formatTime } from '../data/mock';
import { useMockStore } from '../context/MockStoreContext';
import { useToast } from '../context/ToastContext';

const types = [
  'All',
  'DUTY_ASSIGNED',
  'DUTY_UPDATED',
  'DUTY_CANCELLED',
  'DUTY_REMINDER',
  'LOCATION_OFFLINE',
  'LOCATION_RECOVERED',
  'SYSTEM_ALERT',
] as const;

export function NotificationsPage() {
  const { push } = useToast();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    hideReadNotifications,
  } = useMockStore();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<(typeof types)[number]>('All');
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (tab === 'unread' && n.read) return false;
      if (typeFilter !== 'All' && n.type !== typeFilter) return false;
      if (
        query &&
        !`${n.title} ${n.message}`.toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [notifications, tab, typeFilter, query]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app alerts for duties and location health. Offline and recovery emails go to the super admin while this dashboard is open."
        actions={
          <div className="page-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                markAllNotificationsRead();
                push('All notifications marked read');
              }}
            >
              Mark all read
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmClear(true)}>
              Clear read
            </button>
          </div>
        }
      />

      <section className="panel">
        <div className="panel-body">
          <Tabs
            active={tab}
            onChange={(id) => setTab(id as 'all' | 'unread')}
            tabs={[
              { id: 'all', label: 'All', count: notifications.length },
              {
                id: 'unread',
                label: 'Unread',
                count: notifications.filter((n) => !n.read).length,
              },
            ]}
          />

          <div className="toolbar" style={{ marginTop: '1rem' }}>
            <input
              className="input"
              style={{ maxWidth: 280 }}
              placeholder="Search notifications"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="select"
              style={{ maxWidth: 220 }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as (typeof types)[number])}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All types' : t.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="list-stack">
            {filtered.length === 0 ? (
              <EmptyState
                title="No notifications"
                description="Alerts appear here when duties change or location goes offline."
              />
            ) : (
              filtered.map((n) => (
                <div className={`list-item ${n.read ? '' : 'unread'}`} key={n.id}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{n.title}</strong>
                      <span className="badge badge-muted">{n.type.replaceAll('_', ' ')}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{n.message}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
                      {formatTime(n.createdAt)}
                    </div>
                  </div>
                  {!n.read ? (
                    <button className="btn btn-secondary" onClick={() => markNotificationRead(n.id)}>
                      Mark read
                    </button>
                  ) : (
                    <span className="badge badge-success">Read</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear read notifications?"
        message="Read notifications leave this inbox. The records stay saved."
        confirmLabel="Clear read"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          void hideReadNotifications();
          setConfirmClear(false);
          push('Read notifications cleared');
        }}
      />
    </div>
  );
}
