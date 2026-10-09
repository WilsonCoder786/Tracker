import 'package:flutter/foundation.dart';

import '../data/mock_data.dart';
import '../models/models.dart';

class StaffAppState extends ChangeNotifier {
  bool isAuthenticated = false;
  StaffUser? user;
  List<StaffDuty> duties = List.of(mockDuties);
  List<StaffNotification> notifications = List.of(mockNotifications);

  bool locationPermissionGranted = false;
  bool gpsEnabled = true;
  bool permissionScreenSeen = false;
  String? errorMessage;

  StaffDuty? get todayDuty {
    const today = '2026-10-09';
    final active = duties.where((d) => d.status == DutyStatus.active).toList();
    if (active.isNotEmpty) return active.first;
    return duties.cast<StaffDuty?>().firstWhere(
          (d) => d!.date == today && d.status != DutyStatus.cancelled,
          orElse: () => null,
        );
  }

  List<StaffDuty> get upcomingDuties {
    return duties
        .where(
          (d) =>
              d.status == DutyStatus.scheduled &&
              d.id != todayDuty?.id &&
              d.date.compareTo('2026-10-09') >= 0,
        )
        .toList();
  }

  int get unreadCount => notifications.where((n) => !n.read).length;

  TrackingUiState trackingStateFor(StaffDuty? duty) {
    if (duty == null || duty.status != DutyStatus.active) {
      return TrackingUiState.dutyNotActive;
    }
    if (!duty.trackingEnabled) return TrackingUiState.dutyNotActive;
    if (!locationPermissionGranted) return TrackingUiState.permissionRequired;
    if (!gpsEnabled) return TrackingUiState.gpsDisabled;
    if (duty.lastLocationAt == null) return TrackingUiState.trackingPaused;
    final age = DateTime.now().difference(duty.lastLocationAt!);
    if (age.inMinutes >= duty.locationAlertThresholdMinutes) {
      return TrackingUiState.offlineStale;
    }
    return TrackingUiState.trackingActive;
  }

  bool login(String email, String password) {
    if (email.trim().toLowerCase() == 'ali@example.com' && password == 'staff123') {
      isAuthenticated = true;
      user = mockStaffUser;
      errorMessage = null;
      notifyListeners();
      return true;
    }
    errorMessage = 'Invalid email or password';
    notifyListeners();
    return false;
  }

  void logout() {
    isAuthenticated = false;
    user = null;
    locationPermissionGranted = false;
    permissionScreenSeen = false;
    duties = List.of(mockDuties);
    notifications = List.of(mockNotifications);
    notifyListeners();
  }

  void markPermissionSeen() {
    permissionScreenSeen = true;
    notifyListeners();
  }

  void grantPermission() {
    locationPermissionGranted = true;
    permissionScreenSeen = true;
    notifyListeners();
  }

  void denyPermission() {
    locationPermissionGranted = false;
    permissionScreenSeen = true;
    notifyListeners();
  }

  void setGpsEnabled(bool enabled) {
    gpsEnabled = enabled;
    notifyListeners();
  }

  void startDuty(String dutyId) {
    final duty = duties.firstWhere((d) => d.id == dutyId);
    if (!locationPermissionGranted && duty.trackingEnabled) {
      errorMessage = 'Location permission is required for this duty.';
      notifyListeners();
      return;
    }
    if (!gpsEnabled && duty.trackingEnabled) {
      errorMessage = 'Location services are disabled.';
      notifyListeners();
      return;
    }

    duties = duties
        .map(
          (d) => d.id == dutyId
              ? d.copyWith(
                  status: DutyStatus.active,
                  lastLocationAt: DateTime.now(),
                  batteryPercent: 68,
                  accuracyMeters: 12,
                  latitude: 24.8607,
                  longitude: 67.0011,
                )
              : d.status == DutyStatus.active
                  ? d.copyWith(status: DutyStatus.scheduled, clearLocation: true)
                  : d,
        )
        .toList();
    errorMessage = null;
    notifyListeners();
  }

  void endDuty(String dutyId) {
    duties = duties
        .map(
          (d) => d.id == dutyId
              ? d.copyWith(status: DutyStatus.completed, clearLocation: true)
              : d,
        )
        .toList();
    notifyListeners();
  }

  /// Simulates a real location ping only when tracking is allowed.
  void simulateLocationUpdate(String dutyId) {
    final duty = duties.firstWhere((d) => d.id == dutyId);
    if (duty.status != DutyStatus.active ||
        !duty.trackingEnabled ||
        !locationPermissionGranted ||
        !gpsEnabled) {
      return;
    }
    duties = duties
        .map(
          (d) => d.id == dutyId
              ? d.copyWith(
                  lastLocationAt: DateTime.now(),
                  batteryPercent: 67,
                  accuracyMeters: 11,
                  latitude: 24.8612,
                  longitude: 67.0020,
                )
              : d,
        )
        .toList();
    notifyListeners();
  }

  void markAllNotificationsRead() {
    notifications = notifications.map((n) => n.copyWith(read: true)).toList();
    notifyListeners();
  }

  StaffDuty? dutyById(String id) {
    try {
      return duties.firstWhere((d) => d.id == id);
    } catch (_) {
      return null;
    }
  }
}
