import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useMockStore } from '../context/MockStoreContext';
import { useToast } from '../context/ToastContext';

export function ReportsPage() {
  const { staff, duties, liveLocations, stats, settings } = useMockStore();
  const { push } = useToast();

  const completed = duties.filter((d) => d.status === 'Completed').length;
  const cancelled = duties.filter((d) => d.status === 'Cancelled').length;
  const offline = liveLocations.filter((l) => l.locationState === 'OFFLINE').length;
  const stale = liveLocations.filter((l) => l.locationState === 'STALE').length;

  const recurrenceBars = [
    { label: 'One time', value: duties.filter((d) => d.recurrence === 'one_time').length },
    { label: 'Daily', value: duties.filter((d) => d.recurrence === 'daily').length },
    { label: 'Weekdays', value: duties.filter((d) => d.recurrence === 'weekdays').length },
    { label: 'Weekly', value: duties.filter((d) => d.recurrence === 'weekly').length },
  ];
  const maxBar = Math.max(...recurrenceBars.map((b) => b.value), 1);

  const statusBars = [
    { label: 'Scheduled', value: duties.filter((d) => d.status === 'Scheduled').length, color: '#1d4ed8' },
    { label: 'Active', value: duties.filter((d) => d.status === 'Active').length, color: '#15803d' },
    { label: 'Paused', value: duties.filter((d) => d.status === 'Paused').length, color: '#c2410c' },
    { label: 'Completed', value: completed, color: '#64748b' },
    { label: 'Cancelled', value: cancelled, color: '#b91c1c' },
  ];
  const maxStatus = Math.max(...statusBars.map((b) => b.value), 1);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Operations summary. Date-range exports connect when the API is available."
        actions={
          <div className="page-actions">
            <button className="btn btn-secondary" onClick={() => push('CSV export queued (UI)')}>
              Export CSV
            </button>
            <button className="btn btn-ghost" onClick={() => push('PDF report queued (UI)')}>
              Export PDF
            </button>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Staff roster" value={staff.length} />
        <StatCard label="Active staff" value={stats.activeStaff} />
        <StatCard label="Duties tracked" value={duties.length} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Cancelled" value={cancelled} />
        <StatCard label="Offline now" value={offline} />
        <StatCard
          label="Retention window"
          value={`${settings.locationRetentionDays} days`}
          hint="Configurable in Settings"
        />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-header">
            <h2>Duty status mix</h2>
          </div>
          <div className="panel-body chart-stack">
            {statusBars.map((bar) => (
              <div className="chart-row" key={bar.label}>
                <div className="chart-label">
                  <span>{bar.label}</span>
                  <strong>{bar.value}</strong>
                </div>
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{
                      width: `${(bar.value / maxStatus) * 100}%`,
                      background: bar.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Recurrence mix</h2>
          </div>
          <div className="panel-body chart-stack">
            {recurrenceBars.map((bar) => (
              <div className="chart-row" key={bar.label}>
                <div className="chart-label">
                  <span>{bar.label}</span>
                  <strong>{bar.value}</strong>
                </div>
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${(bar.value / maxBar) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: '1rem' }}>
        <div className="panel-header">
          <h2>Location health snapshot</h2>
        </div>
        <div className="panel-body toolbar" style={{ marginBottom: 0 }}>
          <span className="badge badge-success">Recent / tracking: {liveLocations.filter((l) => ['RECENT', 'TRACKING'].includes(l.locationState)).length}</span>
          <span className="badge badge-warning">Stale: {stale}</span>
          <span className="badge badge-danger">Offline: {offline}</span>
          <span className="badge badge-muted">
            Not tracking: {liveLocations.filter((l) => l.locationState === 'NOT_TRACKING').length}
          </span>
        </div>
      </section>
    </div>
  );
}
