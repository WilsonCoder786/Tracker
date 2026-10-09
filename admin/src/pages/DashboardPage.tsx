import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { DutyBadge, LocationBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { TableSkeleton } from '../components/ui/Skeleton';
import { formatTime } from '../data/mock';
import { useMockStore } from '../context/MockStoreContext';

export function DashboardPage() {
  const { stats, duties, liveLocations, notifications, refresh } = useMockStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const id = window.setTimeout(() => {
      refresh();
      setLoading(false);
    }, 400);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const activeDuties = duties.filter((d) => d.status === 'Active' || d.status === 'Scheduled');
  const unread = notifications.filter((n) => !n.read);

  if (loading) {
    return (
      <div>
        <PageHeader title="Operations overview" description="Loading dashboard…" />
        <div className="stats-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <div className="stat-card" key={i}>
              <TableSkeleton rows={2} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Operations overview"
        description="Live snapshot of staff, duties, and location health. Auto-refreshes every 30s."
        actions={
          <div className="page-actions">
            <Link className="btn btn-secondary" to="/live-tracking">
              Open live map
            </Link>
            <Link className="btn btn-primary" to="/duties">
              Manage duties
            </Link>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total Staff" value={stats.totalStaff} hint="All registered members" />
        <StatCard label="Active Staff" value={stats.activeStaff} hint="Can receive duties" />
        <StatCard label="Today's Duties" value={stats.todaysDuties} hint="Scheduled for today" />
        <StatCard label="Active Duties" value={stats.activeDuties} hint="Currently in progress" />
        <StatCard label="Currently Tracking" value={stats.currentlyTracking} hint="Tracking enabled + active" />
        <StatCard
          label="Location Offline / Stale"
          value={stats.locationOfflineStale}
          hint="Needs attention"
        />
        <StatCard label="Completed Duties" value={stats.completedDuties} hint="Finished recently" />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-header">
            <h2>Today&apos;s duties</h2>
            <Link to="/duties" className="btn btn-ghost">
              View all
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Duty</th>
                  <th>Staff</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeDuties.map((duty) => (
                  <tr key={duty.id}>
                    <td>
                      <strong>{duty.title}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {duty.recurrenceLabel}
                      </div>
                    </td>
                    <td>{duty.staffName}</td>
                    <td>
                      {duty.startTime} – {duty.endTime}
                    </td>
                    <td>
                      <DutyBadge status={duty.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Location health</h2>
            <Link to="/live-tracking" className="btn btn-ghost">
              Live map
            </Link>
          </div>
          <div className="panel-body list-stack">
            {liveLocations.map((loc) => (
              <div className="list-item" key={loc.staffId}>
                <div>
                  <strong>{loc.staffName}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {loc.dutyTitle} · Updated {formatTime(loc.lastUpdatedAt)}
                  </div>
                </div>
                <LocationBadge state={loc.locationState} />
              </div>
            ))}
          </div>
          <div className="panel-header" style={{ borderTop: '1px solid var(--border)' }}>
            <h2>Unread alerts</h2>
            <span className="badge badge-danger">{unread.length}</span>
          </div>
          <div className="panel-body list-stack">
            {unread.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>
                No unread alerts
              </div>
            ) : (
              unread.slice(0, 4).map((n) => (
                <Link className="list-item unread" key={n.id} to="/notifications">
                  <div>
                    <strong>{n.title}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{n.message}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
