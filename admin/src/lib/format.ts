import type { LocationState } from '../types';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function karachiClock(time: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(new Date(time));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  let hour = Number(read('hour'));
  if (hour === 24) hour = 0;
  const weekday = weekdays.indexOf(read('weekday'));
  return {
    dateKey: `${read('year')}-${read('month')}-${read('day')}`,
    minutes: hour * 60 + Number(read('minute')),
    weekday,
  };
}

export function calendarWeekday(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return -1;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function validBattery(value: unknown): number | null {
  const level = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(level) || level < 0 || level > 100) return null;
  return Math.round(level);
}

export function batteryLabel(value: number | null | undefined): string {
  const level = validBattery(value);
  return level == null ? '—' : `${level}%`;
}

export function accuracyLabel(meters: number | null | undefined): string {
  if (meters == null || !Number.isFinite(meters) || meters <= 0) return '—';
  return `${Math.round(meters)} m`;
}

export function hasPosition(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function coordLabel(lat: number, lng: number): string {
  if (!hasPosition(lat, lng)) return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

const locationLabels: Record<LocationState, string> = {
  TRACKING: 'Live',
  RECENT: 'Recent',
  STALE: 'Stale',
  OFFLINE: 'Offline',
  PERMISSION_REQUIRED: 'Permission needed',
  GPS_DISABLED: 'Location off',
  DUTY_NOT_ACTIVE: 'Not live',
  NOT_TRACKING: 'Not tracking',
};

export function locationLabel(state: LocationState): string {
  return locationLabels[state];
}
