import { useMemo, useState } from 'react';
import { LiveMap } from '../components/maps/LiveMap';
import { LocationBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatTime } from '../data/mock';
import { accuracyLabel, batteryLabel, coordLabel, locationLabel } from '../lib/format';
import { useMockStore } from '../context/MockStoreContext';
import type { LocationState } from '../types';

export function LiveTrackingPage() {
  const { liveLocations, duties } = useMockStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LocationState>('All');
  const [dutyFilter, setDutyFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(
    liveLocations[0]?.staffId ?? null,
  );

  const dutyOptions = useMemo(
    () => Array.from(new Set(liveLocations.map((l) => l.dutyTitle))),
    [liveLocations],
  );

  const filtered = useMemo(() => {
    return liveLocations.filter((loc) => {
      const matchesQuery =
        !query ||
        loc.staffName.toLowerCase().includes(query.toLowerCase()) ||
        loc.dutyTitle.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || loc.locationState === statusFilter;
      const matchesDuty = dutyFilter === 'All' || loc.dutyTitle === dutyFilter;
      return matchesQuery && matchesStatus && matchesDuty;
    });
  }, [liveLocations, query, statusFilter, dutyFilter]);

  const selected = filtered.find((l) => l.staffId === selectedId) ?? filtered[0] ?? null;
  const notLive = duties.filter(
    (duty) =>
      duty.status === 'Active' &&
      duty.trackingEnabled &&
      !liveLocations.some(
        (loc) =>
          loc.staffId === duty.staffId &&
          ['TRACKING', 'RECENT', 'STALE'].includes(loc.locationState),
      ),
  );

  return (
    <div>
      <PageHeader
        title="Live tracking"
        description="Active duties appear here on their own. Staff with location off are listed as yet not live."
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedId(filtered[0]?.staffId ?? null)}
          >
            Fit to active staff
          </button>
        }
      />

      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 240 }}
          placeholder="Search staff or duty"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="select"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | LocationState)}
        >
          <option value="All">All statuses</option>
          <option value="RECENT">Recent</option>
          <option value="STALE">Stale</option>
          <option value="OFFLINE">Offline</option>
          <option value="NOT_TRACKING">Not tracking</option>
        </select>
        <select
          className="select"
          style={{ maxWidth: 220 }}
          value={dutyFilter}
          onChange={(e) => setDutyFilter(e.target.value)}
        >
          <option value="All">All duties</option>
          {dutyOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="pill">{filtered.length} on map · {duties.filter((d) => d.status === 'Active').length} active duties</span>
      </div>

      {notLive.length > 0 ? (
        <section className="panel" style={{ marginBottom: '1rem' }}>
          <div className="panel-header">
            <h2>Yet not live</h2>
            <span className="badge badge-danger">{notLive.length}</span>
          </div>
          <div className="panel-body list-stack">
            {notLive.map((duty) => (
              <div className="list-item" key={duty.id}>
                <div>
                  <strong>{duty.staffName}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {duty.title} is in its window ({duty.startTime} – {duty.endTime}) and location is not enabled.
                  </div>
                </div>
                <span className="badge badge-danger">Yet not live</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid-2">
        {filtered.length === 0 ? (
          <section className="panel">
            <EmptyState
              title="No staff match filters"
              description="Clear filters to see active tracked staff."
            />
          </section>
        ) : (
          <LiveMap
            markers={filtered}
            selectedStaffId={selected?.staffId}
            onSelect={setSelectedId}
          />
        )}

        <section className="panel">
          <div className="panel-header">
            <h2>Staff detail</h2>
            {selected ? <LocationBadge state={selected.locationState} /> : null}
          </div>
          <div className="panel-body">
            {selected ? (
              <div className="detail-card">
                <div className="detail-row">
                  <span>Staff</span>
                  <strong>{selected.staffName}</strong>
                </div>
                <div className="detail-row">
                  <span>Duty</span>
                  <strong>{selected.dutyTitle}</strong>
                </div>
                <div className="detail-row">
                  <span>Last location</span>
                  <strong>
                    {coordLabel(selected.lat, selected.lng)}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Last updated</span>
                  <strong>{formatTime(selected.lastUpdatedAt)}</strong>
                </div>
                <div className="detail-row">
                  <span>Battery</span>
                  <strong>
                    {batteryLabel(selected.batteryPercent)}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Accuracy</span>
                  <strong>{accuracyLabel(selected.accuracyMeters)}</strong>
                </div>
                <div className="detail-row">
                  <span>Duty window</span>
                  <strong>
                    {selected.dutyStart} – {selected.dutyEnd}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Tracking status</span>
                  <strong>{locationLabel(selected.locationState)}</strong>
                </div>
              </div>
            ) : (
              <EmptyState title="No selection" description="Select a marker or staff row." />
            )}
          </div>

          <div className="panel-header" style={{ borderTop: '1px solid var(--border)' }}>
            <h2>Active list</h2>
          </div>
          <div className="panel-body list-stack">
            {filtered.map((loc) => (
              <button
                key={loc.staffId}
                type="button"
                className={`list-item ${selected?.staffId === loc.staffId ? 'unread' : ''}`}
                style={{ textAlign: 'left', width: '100%' }}
                onClick={() => setSelectedId(loc.staffId)}
              >
                <div>
                  <strong>{loc.staffName}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {loc.dutyTitle} · {formatTime(loc.lastUpdatedAt)}
                  </div>
                </div>
                <LocationBadge state={loc.locationState} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
