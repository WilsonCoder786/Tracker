import '../models/models.dart';

const mockStaffUser = StaffUser(
  id: 'staff-1',
  fullName: 'Ali Khan',
  email: 'ali@example.com',
  employeeId: 'EMP-001',
  phone: '+92 300 1112233',
);

final mockDuties = <StaffDuty>[
  StaffDuty(
    id: 'duty-2',
    title: 'Security Duty',
    description: 'Daily gate and patrol coverage. Location is required while active.',
    date: '2026-10-09',
    startTime: '10:00',
    endTime: '18:00',
    timezone: 'Asia/Karachi',
    status: DutyStatus.scheduled,
    trackingEnabled: true,
    trackingIntervalMinutes: 5,
    locationAlertThresholdMinutes: 15,
  ),
  StaffDuty(
    id: 'duty-1',
    title: 'Customer Delivery',
    description: 'One-time delivery route across North zone.',
    date: '2026-10-10',
    startTime: '10:00',
    endTime: '18:00',
    timezone: 'Asia/Karachi',
    status: DutyStatus.scheduled,
    trackingEnabled: true,
    trackingIntervalMinutes: 5,
    locationAlertThresholdMinutes: 15,
  ),
  StaffDuty(
    id: 'duty-6',
    title: 'City Route Sweep',
    description: 'Weekday route coverage.',
    date: '2026-10-11',
    startTime: '08:00',
    endTime: '16:00',
    timezone: 'Asia/Karachi',
    status: DutyStatus.scheduled,
    trackingEnabled: true,
    trackingIntervalMinutes: 5,
    locationAlertThresholdMinutes: 15,
  ),
  StaffDuty(
    id: 'duty-5',
    title: 'Client Visit',
    description: 'Completed site visit.',
    date: '2026-10-08',
    startTime: '11:00',
    endTime: '15:00',
    timezone: 'Asia/Karachi',
    status: DutyStatus.completed,
    trackingEnabled: false,
    trackingIntervalMinutes: 5,
    locationAlertThresholdMinutes: 15,
  ),
];

final mockNotifications = <StaffNotification>[
  StaffNotification(
    id: 'n-1',
    title: 'New duty assigned',
    message: 'Customer Delivery — 10:00 AM to 6:00 PM.',
    createdAt: DateTime.parse('2026-10-09T09:10:00Z'),
    read: false,
  ),
  StaffNotification(
    id: 'n-2',
    title: 'Schedule updated',
    message: 'Your duty schedule has been updated.',
    createdAt: DateTime.parse('2026-10-08T16:00:00Z'),
    read: true,
  ),
];
