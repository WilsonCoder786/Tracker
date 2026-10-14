import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import emailjs from '@emailjs/browser';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  limitToLast,
  onValue,
  orderByChild,
  get,
  push,
  query,
  ref,
  set,
  update,
} from 'firebase/database';
import { mockSettings } from '../data/mock';
import {
  EMAILJS_PUBLIC_KEY,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  firebaseConfig,
} from '../lib/config';
import { calendarWeekday, karachiClock, validBattery } from '../lib/format';
import { auth, db } from '../lib/firebase';
import type {
  AppNotification,
  DashboardStats,
  Duty,
  LiveStaffLocation,
  LocationPoint,
  LocationState,
  StaffMember,
  StaffStatus,
  SystemSettings,
} from '../types';

interface LiveRecord extends LiveStaffLocation {
  tracking: boolean;
  offlineEmailSent: boolean;
  trackOffCount: number;
}

interface StoreValue {
  staff: StaffMember[];
  duties: Duty[];
  liveLocations: LiveStaffLocation[];
  locationHistory: LocationPoint[];
  notifications: AppNotification[];
  settings: SystemSettings;
  stats: DashboardStats;
  lastRefreshedAt: Date;
  loading: boolean;
  refresh: () => void;
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  hideReadNotifications: () => Promise<void>;
  createStaff: (input: {
    fullName: string;
    email: string;
    phone: string;
    employeeId: string;
    password: string;
    status: StaffStatus;
    notes: string;
  }) => Promise<void>;
  updateStaff: (
    id: string,
    patch: Partial<Pick<StaffMember, 'fullName' | 'email' | 'phone' | 'employeeId' | 'status' | 'notes'>>,
  ) => Promise<void>;
  setStaffStatus: (id: string, status: StaffStatus) => Promise<void>;
  resetStaffPassword: (email: string) => Promise<void>;
  createDuty: (duty: Omit<Duty, 'id'>) => Promise<void>;
  patchDuty: (id: string, patch: Partial<Omit<Duty, 'id'>>) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id'>) => Promise<void>;
  saveSettings: (next: SystemSettings) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);
const emailInflight = new Set<string>();

function entries<T>(value: unknown): Array<T & { id: string }> {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, T>).map(([id, data]) => ({ ...data, id }));
}

function withoutEmpty(patch: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

export function locationStateFor(
  lastUpdatedAt: string,
  settings: SystemSettings,
  tracking: boolean,
  now: number,
  trackOffCount = 0,
): LocationState {
  if (!tracking) return trackOffCount > 0 ? 'OFFLINE' : 'DUTY_NOT_ACTIVE';
  const ageMinutes = (now - new Date(lastUpdatedAt).getTime()) / 60000;
  if (Number.isNaN(ageMinutes)) return 'OFFLINE';
  if (ageMinutes <= 1) return 'TRACKING';
  if (ageMinutes <= settings.recentWindowMinutes) return 'RECENT';
  if (ageMinutes < settings.offlineWindowMinutes) return 'STALE';
  return 'OFFLINE';
}

function computeStats(
  staff: StaffMember[],
  duties: Duty[],
  liveLocations: LiveStaffLocation[],
  now: number,
): DashboardStats {
  return {
    totalStaff: staff.length,
    activeStaff: staff.filter((s) => s.status === 'Active').length,
    todaysDuties: duties.filter(
      (duty) =>
        ['Scheduled', 'Active', 'Paused'].includes(duty.status) && dutyOccursToday(duty, now),
    ).length,
    activeDuties: duties.filter((d) => d.status === 'Active').length,
    currentlyTracking: liveLocations.filter((l) =>
      ['RECENT', 'TRACKING', 'STALE'].includes(l.locationState),
    ).length,
    locationOfflineStale: liveLocations.filter((l) => ['OFFLINE', 'STALE'].includes(l.locationState))
      .length,
    completedDuties: duties.filter((d) => d.status === 'Completed').length,
  };
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [rawLive, setRawLive] = useState<LiveRecord[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(mockSettings);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const ready = { users: false, duties: false, live: false, points: false, notes: false };
    const mark = (key: keyof typeof ready) => {
      ready[key] = true;
      if (Object.values(ready).every(Boolean)) setLoading(false);
    };

    const unsubUsers = onValue(ref(db, 'users'), (snap) => {
      setStaff(
        entries<StaffMember & { role?: string }>(snap.val()).filter((user) => user.role === 'staff'),
      );
      mark('users');
    });
    const unsubDuties = onValue(ref(db, 'duties'), (snap) => {
      const next = entries<Duty>(snap.val());
      next.sort((a, b) => (a.date < b.date ? 1 : -1));
      setDuties(next);
      mark('duties');
    });
    const unsubLive = onValue(ref(db, 'liveLocations'), (snap) => {
      const value = snap.val() as Record<string, Omit<LiveRecord, 'staffId' | 'locationState'>> | null;
      setRawLive(
        Object.entries(value ?? {}).map(([staffId, data]) => ({
          staffId,
          staffName: data.staffName ?? '',
          dutyId: data.dutyId ?? '',
          dutyTitle: data.dutyTitle ?? '',
          lat: Number(data.lat),
          lng: Number(data.lng),
          accuracyMeters: Number(data.accuracyMeters),
          batteryPercent: validBattery(data.batteryPercent),
          lastUpdatedAt: data.lastUpdatedAt ?? '',
          locationState: 'NOT_TRACKING',
          dutyStart: data.dutyStart ?? '',
          dutyEnd: data.dutyEnd ?? '',
          tracking: data.tracking === true,
          offlineEmailSent: data.offlineEmailSent === true,
          trackOffCount: Number(data.trackOffCount ?? 0),
        })),
      );
      mark('live');
    });
    const unsubPoints = onValue(
      query(ref(db, 'locationPoints'), orderByChild('recordedAt'), limitToLast(500)),
      (snap) => {
        const next = entries<LocationPoint>(snap.val()).map((point) => ({
          ...point,
          lat: Number(point.lat),
          lng: Number(point.lng),
          accuracyMeters: Number(point.accuracyMeters),
          batteryPercent: validBattery(point.batteryPercent),
        }));
        next.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
        setLocationHistory(next);
        mark('points');
      },
    );
    const unsubNotes = onValue(ref(db, 'notifications'), (snap) => {
      const next = entries<AppNotification>(snap.val()).filter((item) => !item.hidden);
      next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setNotifications(next);
      mark('notes');
    });
    const unsubSettings = onValue(ref(db, 'settings/app'), (snap) => {
      if (snap.exists()) setSettings({ ...mockSettings, ...(snap.val() as SystemSettings) });
    });

    return () => {
      unsubUsers();
      unsubDuties();
      unsubLive();
      unsubPoints();
      unsubNotes();
      unsubSettings();
    };
  }, []);

  const liveLocations = useMemo(
    () =>
      rawLive.map((loc) => ({
        ...loc,
        locationState: locationStateFor(
          loc.lastUpdatedAt,
          settings,
          loc.tracking,
          now,
          loc.trackOffCount,
        ),
      })),
    [rawLive, settings, now],
  );

  useEffect(() => {
    for (const loc of liveLocations) {
      const raw = rawLive.find((item) => item.staffId === loc.staffId);
      if (!raw) continue;
      if (!loc.tracking && raw.trackOffCount < 3) continue;
      const offline = loc.locationState === 'OFFLINE' || raw.trackOffCount >= 3;
      if (offline && raw.trackOffCount >= 3 && settings.emailAlertsEnabled && !raw.offlineEmailSent) {
        void sendLocationEmail(loc, 'offline');
      }
      if (
        !offline &&
        (loc.locationState === 'TRACKING' || loc.locationState === 'RECENT') &&
        settings.recoveryAlertsEnabled &&
        raw.offlineEmailSent
      ) {
        void sendLocationEmail(loc, 'recovery');
      }
    }
  }, [liveLocations, rawLive, settings.emailAlertsEnabled, settings.recoveryAlertsEnabled]);

  useEffect(() => {
    if (!settings.dutyReminderEnabled) return;
    const today = dateKey(now);
    for (const duty of duties) {
      if (duty.status !== 'Scheduled' || !dutyOccursToday(duty, now)) continue;
      if (duty.reminderSentDate === today || (duty.recurrence === 'one_time' && duty.reminderSent)) continue;
      const start = clockMinutes(duty.startTime);
      if (start == null) continue;
      const minutesUntil = start - karachiClock(now).minutes;
      if (minutesUntil < 0 || minutesUntil > 30) continue;
      void sendDutyReminder(duty, today);
    }
  }, [duties, settings.dutyReminderEnabled, now]);

  useEffect(() => {
    for (const duty of duties) {
      if (duty.status === 'Cancelled' || duty.status === 'Completed') continue;
      const today = dateKey(now);
      const paused = pauseCovers(duty, today);
      if (paused) {
        if (duty.status !== 'Paused') void syncDutyStatus(duty.id, 'Paused');
        continue;
      }
      if (duty.status === 'Paused') {
        if (duty.pauseResume && today >= duty.pauseResume) void syncDutyStatus(duty.id, 'Scheduled');
        continue;
      }
      const open = dutyOccursToday(duty, now) && dutyWindowOpen(duty, now);
      if (open && duty.status === 'Scheduled') {
        void syncDutyStatus(duty.id, 'Active');
      } else if (!open && duty.status === 'Active') {
        void syncDutyStatus(duty.id, duty.recurrence === 'one_time' ? 'Completed' : 'Scheduled');
      }
    }
  }, [duties, now]);

  useEffect(() => {
    const todayKey = dateKey(now);
    for (const duty of duties) {
      if (!duty.trackingEnabled) continue;
      if (duty.status === 'Completed' || duty.status === 'Cancelled' || duty.status === 'Paused') continue;
      if (duty.locationOffAlertDate === todayKey) continue;
      if (!dutyOccursToday(duty, now) || !dutyWindowOpen(duty, now)) continue;
      const raw = rawLive.find((item) => item.staffId === duty.staffId);
      const threshold = duty.locationAlertThresholdMinutes || settings.offlineWindowMinutes;
      if (locationIsOn(raw, now, threshold)) continue;
      void alertLocationOff(duty, todayKey, settings.emailAlertsEnabled);
    }
  }, [duties, rawLive, now, settings.offlineWindowMinutes, settings.emailAlertsEnabled]);

  const visibleHistory = useMemo(() => {
    const cutoff = now - settings.locationRetentionDays * 24 * 60 * 60 * 1000;
    return locationHistory.filter((point) => new Date(point.recordedAt).getTime() >= cutoff);
  }, [locationHistory, settings.locationRetentionDays, now]);

  const stats = useMemo(
    () => computeStats(staff, duties, liveLocations, now),
    [staff, duties, liveLocations, now],
  );

  const refresh = useCallback(() => {
    setNow(Date.now());
    setLastRefreshedAt(new Date());
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      staff,
      duties,
      liveLocations,
      locationHistory: visibleHistory,
      notifications,
      settings,
      stats,
      lastRefreshedAt,
      loading,
      refresh,
      unreadCount: notifications.filter((n) => !n.read).length,
      markNotificationRead: (id) => {
        void update(ref(db, `notifications/${id}`), { read: true });
      },
      markAllNotificationsRead: () => {
        const patch: Record<string, boolean> = {};
        notifications.filter((n) => !n.read).forEach((n) => {
          patch[`${n.id}/read`] = true;
        });
        if (Object.keys(patch).length === 0) return;
        void update(ref(db, 'notifications'), patch);
      },
      hideReadNotifications: async () => {
        const patch: Record<string, boolean> = {};
        notifications.filter((n) => n.read).forEach((n) => {
          patch[`${n.id}/hidden`] = true;
        });
        if (Object.keys(patch).length === 0) return;
        await update(ref(db, 'notifications'), patch);
      },
      createStaff: async (input) => {
        const name = `staff-create-${Date.now()}`;
        const secondary = initializeApp(firebaseConfig, name);
        try {
          const secondaryAuth = getAuth(secondary);
          const cred = await createUserWithEmailAndPassword(
            secondaryAuth,
            input.email.trim(),
            input.password,
          );
          await set(ref(db, `users/${cred.user.uid}`), {
            role: 'staff',
            fullName: input.fullName.trim(),
            email: input.email.trim().toLowerCase(),
            phone: input.phone.trim(),
            employeeId: input.employeeId.trim(),
            status: input.status,
            notes: input.notes.trim(),
            createdAt: new Date().toISOString(),
          });
          await signOut(secondaryAuth);
        } finally {
          await deleteApp(secondary);
        }
      },
      updateStaff: async (id, patch) => {
        await update(ref(db, `users/${id}`), withoutEmpty(patch));
      },
      setStaffStatus: async (id, status) => {
        await update(ref(db, `users/${id}`), { status });
      },
      resetStaffPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      createDuty: async (duty) => {
        const dutyRef = push(ref(db, 'duties'));
        await set(dutyRef, duty);
      },
      patchDuty: async (id, patch) => {
        await update(ref(db, `duties/${id}`), withoutEmpty(patch));
      },
      addNotification: async (notification) => {
        const noteRef = push(ref(db, 'notifications'));
        await set(noteRef, notification);
      },
      saveSettings: async (next) => {
        await set(ref(db, 'settings/app'), next);
      },
    }),
    [staff, duties, liveLocations, visibleHistory, notifications, settings, stats, lastRefreshedAt, loading, refresh],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function dateKey(time: number) {
  return karachiClock(time).dateKey;
}

function pauseCovers(duty: Duty, today: string) {
  if (!duty.pauseFrom || !duty.pauseResume) return false;
  return today >= duty.pauseFrom && today < duty.pauseResume;
}

function clockMinutes(value: string) {
  const [hour, minute] = value.split(':').map((part) => Number(part));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

export function dutyOccursToday(duty: Duty, time: number) {
  const today = dateKey(time);
  if (!duty.date || today < duty.date) return false;
  if (duty.recurrenceEndDate && today > duty.recurrenceEndDate) return false;
  const weekday = calendarWeekday(today);
  switch (duty.recurrence) {
    case 'daily':
      return true;
    case 'weekdays':
      return weekday >= 1 && weekday <= 5;
    case 'weekly':
      return weekday === calendarWeekday(duty.date);
    case 'selected_days': {
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return (duty.selectedDays ?? []).includes(names[weekday] ?? '');
    }
    default:
      return today === duty.date;
  }
}

function dutyWindowOpen(duty: Duty, time: number) {
  const start = clockMinutes(duty.startTime);
  const end = clockMinutes(duty.endTime);
  if (start == null || end == null) return false;
  const nowMin = karachiClock(time).minutes;
  const inside = end >= start ? nowMin >= start && nowMin <= end : nowMin >= start || nowMin <= end;
  return inside;
}

function locationIsOn(raw: LiveRecord | undefined, time: number, threshold: number) {
  if (!raw?.tracking) return false;
  const updated = new Date(raw.lastUpdatedAt).getTime();
  if (Number.isNaN(updated)) return false;
  return (time - updated) / 60000 <= threshold;
}

const statusInflight = new Set<string>();

async function syncDutyStatus(dutyId: string, next: Duty['status']) {
  const key = `${dutyId}:${next}`;
  if (statusInflight.has(key)) return;
  statusInflight.add(key);
  try {
    const dutyRef = ref(db, `duties/${dutyId}`);
    const snap = await get(dutyRef);
    const current = snap.val() as { status?: string } | null;
    if (!current || current.status === next) return;
    if (current.status === 'Paused' || current.status === 'Cancelled') return;
    await update(dutyRef, { status: next });
  } finally {
    statusInflight.delete(key);
  }
}

async function alertLocationOff(duty: Duty, todayKey: string, emailAlerts: boolean) {
  const key = `loc-off:${duty.id}:${todayKey}`;
  if (emailInflight.has(key)) return;
  emailInflight.add(key);
  const message = `${duty.staffName} is not live yet. Duty "${duty.title}" started at ${duty.startTime} and location is not enabled.`;
  try {
    const dutyRef = ref(db, `duties/${duty.id}`);
    const snap = await get(dutyRef);
    const current = snap.val() as { locationOffAlertDate?: string } | null;
    if (current?.locationOffAlertDate === todayKey) return;
    const noteRef = push(ref(db, 'notifications'));
    await set(noteRef, {
      type: 'LOCATION_OFFLINE',
      title: 'Yet not live',
      message,
      createdAt: new Date().toISOString(),
      read: false,
      hidden: false,
      staffId: duty.staffId,
    });
    await update(dutyRef, { locationOffAlertDate: todayKey });
    if (emailAlerts) {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        staff_name: duty.staffName,
        title: 'Yet not live',
        message,
        time: new Date().toISOString(),
      });
    }
  } catch {
    emailInflight.delete(key);
  }
}

async function sendDutyReminder(duty: Duty, today: string) {
  const key = `reminder:${duty.id}:${today}`;
  if (emailInflight.has(key)) return;
  emailInflight.add(key);
  const message = `${duty.title} for ${duty.staffName} starts at ${duty.startTime} today.`;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      staff_name: duty.staffName,
      title: 'Duty reminder',
      message,
      time: new Date().toISOString(),
    });
    await update(ref(db, `duties/${duty.id}`), { reminderSent: true, reminderSentDate: today });
    const noteRef = push(ref(db, 'notifications'));
    await set(noteRef, {
      type: 'DUTY_REMINDER',
      title: 'Duty reminder',
      message,
      createdAt: new Date().toISOString(),
      read: false,
      hidden: false,
      staffId: duty.staffId,
    });
  } catch {
    emailInflight.delete(key);
  }
}

async function sendLocationEmail(loc: LiveStaffLocation, kind: 'offline' | 'recovery') {
  const key = `${loc.staffId}:${kind}`;
  if (emailInflight.has(key)) return;
  emailInflight.add(key);
  const title = kind === 'offline' ? 'Location offline' : 'Location recovered';
  const message =
    kind === 'offline'
      ? `${loc.staffName} has not sent a location since ${loc.lastUpdatedAt}. Duty: ${loc.dutyTitle}.`
      : `${loc.staffName} is sending location again. Duty: ${loc.dutyTitle}.`;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      staff_name: loc.staffName,
      title,
      message,
      time: new Date().toISOString(),
    });
    await update(ref(db, `liveLocations/${loc.staffId}`), {
      offlineEmailSent: kind === 'offline',
    });
    const noteRef = push(ref(db, 'notifications'));
    await set(noteRef, {
      type: kind === 'offline' ? 'LOCATION_OFFLINE' : 'LOCATION_RECOVERED',
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      hidden: false,
      staffId: loc.staffId,
    });
  } catch {
    emailInflight.delete(key);
  }
}

export function useMockStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider');
  return ctx;
}
