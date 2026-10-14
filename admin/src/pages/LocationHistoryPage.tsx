import { useMemo, useState } from 'react';
import { LiveMap } from '../components/maps/LiveMap';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { formatTime } from '../data/mock';
import { accuracyLabel, batteryLabel, coordLabel } from '../lib/format';
import { useMockStore } from '../context/MockStoreContext';
import { downloadCsv } from '../lib/download';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 5;

export function LocationHistoryPage() {
  const { staff, duties, locationHistory } = useMockStore();
  const { push } = useToast();
  const [staffId, setStaffId] = useState(staff[0]?.id ?? '');
  const [dutyId, setDutyId] = useState(
    duties.find((d) => d.staffId === staff[0]?.id)?.id ?? '',
  );
  const [date, setDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [page, setPage] = useState(1);

  const dutyOptions = duties.filter((d) => d.staffId === staffId);

  const points = useMemo(() => {
    return locationHistory.filter(
      (p) =>
        p.staffId === staffId &&
        p.dutyId === dutyId &&
        p.recordedAt.startsWith(date),
    );
  }, [locationHistory, staffId, dutyId, date]);

  const pageItems = points.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = points[0];
  const end = points[points.length - 1];

  return (
    <div>
      <PageHeader
        title="Location history"
        description="Immutable historical points. Large routes should be paginated or downsampled before rendering."
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (points.length === 0) {
                push('No location points match these filters');
                return;
              }
              downloadCsv('trackerduty-route.csv', [
                ['Recorded at', 'Latitude', 'Longitude', 'Accuracy meters', 'Battery'],
                ...points.map((point) => [
                  point.recordedAt,
                  point.lat,
                  point.lng,
                  point.accuracyMeters,
                  point.batteryPercent ?? '',
                ]),
              ]);
              push('Route CSV downloaded');
            }}
          >
            Export route
          </button>
        }
      />

      <section className="panel" style={{ marginBottom: '1rem' }}>
        <div className="panel-body toolbar" style={{ marginBottom: 0 }}>
          <select
            className="select"
            style={{ maxWidth: 220 }}
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              const nextDuty = duties.find((d) => d.staffId === e.target.value);
              setDutyId(nextDuty?.id ?? '');
              setPage(1);
            }}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ maxWidth: 240 }}
            value={dutyId}
            onChange={(e) => {
              setDutyId(e.target.value);
              setPage(1);
            }}
          >
            {dutyOptions.length === 0 ? (
              <option value="">No duties</option>
            ) : (
              dutyOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))
            )}
          </select>
          <input
            className="input"
            style={{ maxWidth: 180 }}
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </section>

      <div className="grid-2">
        {points.length === 0 ? (
          <section className="panel">
            <EmptyState
              title="No location points"
              description="Try Ali Khan · Security Duty · 2026-10-09 for sample route data."
            />
          </section>
        ) : (
          <LiveMap route={points} />
        )}

        <section className="panel">
          <div className="panel-header">
            <h2>Route summary</h2>
            <span className="badge badge-info">{points.length} points</span>
          </div>
          <div className="panel-body detail-card">
            <div className="detail-row">
              <span>Start point</span>
              <strong>
                {start ? `${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}` : '—'}
              </strong>
            </div>
            <div className="detail-row">
              <span>End point</span>
              <strong>{end ? `${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}` : '—'}</strong>
            </div>
            <div className="detail-row">
              <span>Last known</span>
              <strong>{end ? formatTime(end.recordedAt) : '—'}</strong>
            </div>
          </div>

          <div className="panel-header" style={{ borderTop: '1px solid var(--border)' }}>
            <h2>Points</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Lat / Lng</th>
                  <th>Accuracy</th>
                  <th>Battery</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id}>
                    <td>{formatTime(p.recordedAt)}</td>
                    <td>
                      {coordLabel(p.lat, p.lng)}
                    </td>
                    <td>{accuracyLabel(p.accuracyMeters)}</td>
                    <td>{batteryLabel(p.batteryPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {points.length === 0 ? (
              <div className="empty-state">No points for this filter.</div>
            ) : null}
          </div>
          <div className="panel-body" style={{ paddingTop: 0 }}>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={points.length}
              onChange={setPage}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
