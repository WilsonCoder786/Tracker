import { locationLabel } from '../../lib/format';
import type { DutyStatus, LocationState, StaffStatus } from '../../types';

const dutyClass: Record<DutyStatus, string> = {
  Scheduled: 'badge-info',
  Active: 'badge-success',
  Completed: 'badge-muted',
  Cancelled: 'badge-danger',
  Paused: 'badge-warning',
};

const staffClass: Record<StaffStatus, string> = {
  Active: 'badge-success',
  Inactive: 'badge-muted',
};

const locationClass: Record<LocationState, string> = {
  TRACKING: 'badge-success',
  RECENT: 'badge-success',
  STALE: 'badge-warning',
  OFFLINE: 'badge-danger',
  PERMISSION_REQUIRED: 'badge-warning',
  GPS_DISABLED: 'badge-warning',
  DUTY_NOT_ACTIVE: 'badge-muted',
  NOT_TRACKING: 'badge-muted',
};

export function DutyBadge({ status }: { status: DutyStatus }) {
  return <span className={`badge ${dutyClass[status]}`}>{status}</span>;
}

export function StaffBadge({ status }: { status: StaffStatus }) {
  return <span className={`badge ${staffClass[status]}`}>{status}</span>;
}

export function LocationBadge({ state }: { state: LocationState }) {
  return <span className={`badge ${locationClass[state]}`}>{locationLabel(state)}</span>;
}
