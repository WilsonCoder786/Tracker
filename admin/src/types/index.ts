export type StaffStatus = 'Active' | 'Inactive';

export type DutyStatus =
  | 'Scheduled'
  | 'Active'
  | 'Completed'
  | 'Cancelled'
  | 'Paused';

export type LocationState =
  | 'TRACKING'
  | 'RECENT'
  | 'STALE'
  | 'OFFLINE'
  | 'PERMISSION_REQUIRED'
  | 'GPS_DISABLED'
  | 'DUTY_NOT_ACTIVE'
  | 'NOT_TRACKING';

export type RecurrenceType =
  | 'one_time'
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'selected_days'
  | 'custom';

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  employeeId: string;
  status: StaffStatus;
  photoUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface Duty {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  trackingEnabled: boolean;
  trackingIntervalMinutes: 5 | 10;
  locationAlertThresholdMinutes: number;
  status: DutyStatus;
  recurrence: RecurrenceType;
  recurrenceLabel: string;
  recurrenceEndDate?: string;
  selectedDays?: string[];
  pauseFrom?: string;
  pauseResume?: string;
  reminderSent?: boolean;
  reminderSentDate?: string;
  locationOffAlertDate?: string;
}

export interface LiveStaffLocation {
  staffId: string;
  staffName: string;
  dutyId: string;
  dutyTitle: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  batteryPercent: number | null;
  lastUpdatedAt: string;
  locationState: LocationState;
  dutyStart: string;
  dutyEnd: string;
}

export interface LocationPoint {
  id: string;
  staffId: string;
  dutyId: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  batteryPercent: number | null;
  recordedAt: string;
}

export interface AppNotification {
  id: string;
  type:
    | 'DUTY_ASSIGNED'
    | 'DUTY_UPDATED'
    | 'DUTY_CANCELLED'
    | 'DUTY_REMINDER'
    | 'LOCATION_OFFLINE'
    | 'LOCATION_RECOVERED'
    | 'SYSTEM_ALERT';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  staffId?: string;
  hidden?: boolean;
}

export interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  todaysDuties: number;
  activeDuties: number;
  currentlyTracking: number;
  locationOfflineStale: number;
  completedDuties: number;
}

export interface SystemSettings {
  defaultTrackingIntervalMinutes: 5 | 10;
  defaultAlertThresholdMinutes: number;
  locationRetentionDays: number;
  recentWindowMinutes: number;
  staleWindowMinutes: number;
  offlineWindowMinutes: number;
  dutyReminderEnabled: boolean;
  emailAlertsEnabled: boolean;
  recoveryAlertsEnabled: boolean;
  timezoneDefault: string;
}
