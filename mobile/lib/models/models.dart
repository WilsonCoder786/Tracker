enum DutyStatus { scheduled, active, completed, cancelled, paused }

enum TrackingUiState {
  trackingActive,
  trackingPaused,
  permissionRequired,
  gpsDisabled,
  offlineStale,
  dutyNotActive,
  recent,
}

class StaffUser {
  const StaffUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.employeeId,
    required this.phone,
  });

  final String id;
  final String fullName;
  final String email;
  final String employeeId;
  final String phone;
}

class StaffDuty {
  const StaffDuty({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.timezone,
    required this.status,
    required this.trackingEnabled,
    required this.trackingIntervalMinutes,
    required this.locationAlertThresholdMinutes,
    this.lastLocationAt,
    this.batteryPercent,
    this.accuracyMeters,
    this.latitude,
    this.longitude,
  });

  final String id;
  final String title;
  final String description;
  final String date;
  final String startTime;
  final String endTime;
  final String timezone;
  final DutyStatus status;
  final bool trackingEnabled;
  final int trackingIntervalMinutes;
  final int locationAlertThresholdMinutes;
  final DateTime? lastLocationAt;
  final int? batteryPercent;
  final double? accuracyMeters;
  final double? latitude;
  final double? longitude;

  StaffDuty copyWith({
    DutyStatus? status,
    DateTime? lastLocationAt,
    int? batteryPercent,
    double? accuracyMeters,
    double? latitude,
    double? longitude,
    bool clearLocation = false,
  }) {
    return StaffDuty(
      id: id,
      title: title,
      description: description,
      date: date,
      startTime: startTime,
      endTime: endTime,
      timezone: timezone,
      status: status ?? this.status,
      trackingEnabled: trackingEnabled,
      trackingIntervalMinutes: trackingIntervalMinutes,
      locationAlertThresholdMinutes: locationAlertThresholdMinutes,
      lastLocationAt: clearLocation ? null : (lastLocationAt ?? this.lastLocationAt),
      batteryPercent: clearLocation ? null : (batteryPercent ?? this.batteryPercent),
      accuracyMeters: clearLocation ? null : (accuracyMeters ?? this.accuracyMeters),
      latitude: clearLocation ? null : (latitude ?? this.latitude),
      longitude: clearLocation ? null : (longitude ?? this.longitude),
    );
  }
}

class StaffNotification {
  const StaffNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.createdAt,
    required this.read,
  });

  final String id;
  final String title;
  final String message;
  final DateTime createdAt;
  final bool read;

  StaffNotification copyWith({bool? read}) {
    return StaffNotification(
      id: id,
      title: title,
      message: message,
      createdAt: createdAt,
      read: read ?? this.read,
    );
  }
}
