import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  mockDashboardStats,
  mockDuties,
  mockLiveLocations,
  mockLocationHistory,
  mockNotifications,
  mockSettings,
  mockStaff,
} from '../data/mock';
import type {
  AppNotification,
  DashboardStats,
  Duty,
  LiveStaffLocation,
  LocationPoint,
  StaffMember,
  SystemSettings,
} from '../types';

interface MockStoreValue {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  duties: Duty[];
  setDuties: React.Dispatch<React.SetStateAction<Duty[]>>;
  liveLocations: LiveStaffLocation[];
  setLiveLocations: React.Dispatch<React.SetStateAction<LiveStaffLocation[]>>;
  locationHistory: LocationPoint[];
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  stats: DashboardStats;
  lastRefreshedAt: Date;
  refresh: () => void;
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const MockStoreContext = createContext<MockStoreValue | null>(null);

function computeStats(
  staff: StaffMember[],
  duties: Duty[],
  liveLocations: LiveStaffLocation[],
): DashboardStats {
  return {
    totalStaff: staff.length,
    activeStaff: staff.filter((s) => s.status === 'Active').length,
    todaysDuties: duties.filter((d) =>
      ['Scheduled', 'Active', 'Paused'].includes(d.status),
    ).length,
    activeDuties: duties.filter((d) => d.status === 'Active').length,
    currentlyTracking: liveLocations.filter((l) =>
      ['RECENT', 'TRACKING', 'STALE'].includes(l.locationState),
    ).length,
    locationOfflineStale: liveLocations.filter((l) =>
      ['OFFLINE', 'STALE'].includes(l.locationState),
    ).length,
    completedDuties: duties.filter((d) => d.status === 'Completed').length,
  };
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState(mockStaff);
  const [duties, setDuties] = useState(mockDuties);
  const [liveLocations, setLiveLocations] = useState(mockLiveLocations);
  const [locationHistory] = useState(mockLocationHistory);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [settings, setSettings] = useState(mockSettings);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
  const [stats, setStats] = useState(() =>
    computeStats(mockStaff, mockDuties, mockLiveLocations),
  );

  const refresh = useCallback(() => {
    setStats(computeStats(staff, duties, liveLocations));
    setLastRefreshedAt(new Date());
  }, [staff, duties, liveLocations]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      staff,
      setStaff,
      duties,
      setDuties,
      liveLocations,
      setLiveLocations,
      locationHistory,
      notifications,
      setNotifications,
      settings,
      setSettings,
      stats: {
        ...mockDashboardStats,
        ...stats,
        totalStaff: staff.length,
        activeStaff: staff.filter((s) => s.status === 'Active').length,
        activeDuties: duties.filter((d) => d.status === 'Active').length,
        completedDuties: duties.filter((d) => d.status === 'Completed').length,
        currentlyTracking: liveLocations.filter((l) =>
          ['RECENT', 'TRACKING', 'STALE'].includes(l.locationState),
        ).length,
        locationOfflineStale: liveLocations.filter((l) =>
          ['OFFLINE', 'STALE'].includes(l.locationState),
        ).length,
        todaysDuties: duties.filter((d) =>
          ['Scheduled', 'Active', 'Paused'].includes(d.status),
        ).length,
      },
      lastRefreshedAt,
      refresh,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      staff,
      duties,
      liveLocations,
      locationHistory,
      notifications,
      settings,
      stats,
      lastRefreshedAt,
      refresh,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return (
    <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>
  );
}

export function useMockStore() {
  const ctx = useContext(MockStoreContext);
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider');
  return ctx;
}
