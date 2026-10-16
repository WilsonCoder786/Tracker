import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:battery_plus/battery_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../models/models.dart';

class StaffAppState extends ChangeNotifier {
  StaffAppState({this.listenToAuth = true}) {
    if (listenToAuth) {
      _authSub = FirebaseAuth.instance.authStateChanges().listen(_onAuth);
    }
  }

  final bool listenToAuth;
  final Battery _battery = Battery();

  bool isAuthenticated = false;
  StaffUser? user;
  List<StaffDuty> duties = [];
  List<StaffNotification> notifications = [];

  bool locationPermissionGranted = false;
  bool gpsEnabled = false;
  bool permissionScreenSeen = false;
  String? errorMessage;
  String? locationPrompt;

  StreamSubscription<User?>? _authSub;
  StreamSubscription<DatabaseEvent>? _dutySub;
  StreamSubscription<DatabaseEvent>? _noteSub;
  StreamSubscription<Position>? _positionSub;
  Timer? _offTimer;
  Timer? _windowTimer;
  String? _trackingDutyId;
  DateTime? _lastWrite;
  DateTime? _lastOffNote;
  String? _blockMessage;
  final Set<String> _locationOffInflight = {};

  StaffDuty? get todayDuty {
    final now = karachiNow();
    final occurring = duties.where((duty) {
      if (duty.status == DutyStatus.cancelled || duty.status == DutyStatus.completed) return false;
      if (_pauseCovers(duty, now)) return false;
      return _occursOn(duty, now);
    }).toList();
    for (final duty in occurring) {
      if (duty.status == DutyStatus.active && _windowOpen(duty, now)) return duty;
    }
    for (final duty in occurring) {
      if (_windowOpen(duty, now)) return duty;
    }
    return occurring.isEmpty ? null : occurring.first;
  }

  List<StaffDuty> get upcomingDuties {
    final now = karachiNow();
    final tomorrow = DateTime(now.year, now.month, now.day).add(const Duration(days: 1));
    final currentId = todayDuty?.id;
    return duties.where((duty) {
      if (duty.id == currentId) return false;
      if (duty.status == DutyStatus.cancelled || duty.status == DutyStatus.completed) return false;
      for (var day = 0; day < 14; day++) {
        final date = tomorrow.add(Duration(days: day));
        if (_occursOn(duty, date) && !_pauseCovers(duty, date)) return true;
      }
      return false;
    }).toList();
  }

  int get unreadCount => notifications.where((n) => !n.read).length;

  TrackingUiState trackingStateFor(StaffDuty? duty) {
    if (duty == null || duty.status != DutyStatus.active || !duty.trackingEnabled) {
      return TrackingUiState.dutyNotActive;
    }
    if (!locationPermissionGranted) return TrackingUiState.permissionRequired;
    if (!gpsEnabled) return TrackingUiState.gpsDisabled;
    if (duty.lastLocationAt == null) return TrackingUiState.trackingPaused;
    final age = DateTime.now().difference(duty.lastLocationAt!);
    if (age.inMinutes >= duty.locationAlertThresholdMinutes) {
      return TrackingUiState.offlineStale;
    }
    return TrackingUiState.trackingActive;
  }

  Future<void> login(String email, String password) async {
    try {
      errorMessage = null;
      notifyListeners();
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
    } on FirebaseAuthException catch (error) {
      errorMessage = error.message ?? 'Invalid email or password';
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _stopTracking();
    await FirebaseAuth.instance.signOut();
  }

  Future<void> refreshDeviceLocationStatus() async {
    gpsEnabled = await Geolocator.isLocationServiceEnabled();
    final permission = await Geolocator.checkPermission();
    locationPermissionGranted =
        permission == LocationPermission.always || permission == LocationPermission.whileInUse;
    notifyListeners();
  }

  Future<bool> requestLocationAccess() async {
    await Permission.notification.request();
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      locationPermissionGranted = false;
      permissionScreenSeen = true;
      notifyListeners();
      await Geolocator.openAppSettings();
      return false;
    }
    if (permission == LocationPermission.denied) {
      locationPermissionGranted = false;
      permissionScreenSeen = true;
      notifyListeners();
      return false;
    }
    await Permission.locationAlways.request();
    await refreshDeviceLocationStatus();
    permissionScreenSeen = true;
    if (locationPermissionGranted) unawaited(_syncDutyWindow());
    notifyListeners();
    return locationPermissionGranted;
  }

  void declineLocationAccess() {
    locationPermissionGranted = false;
    permissionScreenSeen = true;
    notifyListeners();
  }

  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
    await refreshDeviceLocationStatus();
    if (locationPermissionGranted && gpsEnabled) unawaited(_syncDutyWindow());
  }

  Future<void> recordLocation(String dutyId, {bool force = false}) async {
    final duty = dutyById(dutyId);
    final current = user;
    if (duty == null || current == null) return;
    if (duty.status != DutyStatus.active && !force) return;
    await refreshDeviceLocationStatus();
    if (!locationPermissionGranted || !gpsEnabled) {
      if (duty.trackingEnabled) await _noteTrackOff(duty, current);
      return;
    }
    final interval = Duration(minutes: duty.trackingIntervalMinutes);
    if (!force && _lastWrite != null && DateTime.now().difference(_lastWrite!) < interval) {
      return;
    }
    Position position;
    try {
      position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
    } catch (_) {
      await _noteTrackOff(duty, current);
      return;
    }
    int? battery;
    try {
      battery = _validBattery(await _battery.batteryLevel);
    } catch (_) {
      battery = null;
    }
    final recordedAt = DateTime.now().toUtc().toIso8601String();
    _lastWrite = DateTime.now();
    _lastOffNote = null;
    final live = <String, Object>{
      'staffName': current.fullName,
      'dutyId': duty.id,
      'dutyTitle': duty.title,
      'lat': position.latitude,
      'lng': position.longitude,
      'accuracyMeters': position.accuracy,
      'lastUpdatedAt': recordedAt,
      'dutyStart': duty.startTime,
      'dutyEnd': duty.endTime,
      'tracking': true,
      'trackOffCount': 0,
      'offlineEmailSent': false,
    };
    if (battery != null) live['batteryPercent'] = battery;
    await FirebaseDatabase.instance.ref('liveLocations/${current.id}').update(live);
    final point = <String, Object>{
      'staffId': current.id,
      'dutyId': duty.id,
      'lat': position.latitude,
      'lng': position.longitude,
      'accuracyMeters': position.accuracy,
      'recordedAt': recordedAt,
    };
    if (battery != null) point['batteryPercent'] = battery;
    await FirebaseDatabase.instance.ref('locationPoints').push().set(point);
    await FirebaseDatabase.instance.ref('duties/$dutyId').update({
      'lastLocationAt': recordedAt,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'accuracyMeters': position.accuracy,
      'batteryPercent': ?battery,
    });
  }

  Future<void> markAllNotificationsRead() async {
    final patch = <String, Object>{};
    for (final note in notifications.where((n) => !n.read)) {
      patch['${note.id}/read'] = true;
    }
    if (patch.isEmpty) return;
    await FirebaseDatabase.instance.ref('notifications').update(patch);
  }

  StaffDuty? dutyById(String id) {
    for (final duty in duties) {
      if (duty.id == id) return duty;
    }
    return null;
  }

  Future<void> _onAuth(User? firebaseUser) async {
    if (firebaseUser == null) {
      await _dutySub?.cancel();
      await _noteSub?.cancel();
      _dutySub = null;
      _noteSub = null;
      _stopTracking();
      _windowTimer?.cancel();
      _windowTimer = null;
      isAuthenticated = false;
      user = null;
      duties = [];
      notifications = [];
      errorMessage = _blockMessage ?? errorMessage;
      _blockMessage = null;
      notifyListeners();
      return;
    }

    final snap = await FirebaseDatabase.instance.ref('users/${firebaseUser.uid}').get();
    final data = _asMap(snap.value);
    if (data['role'] != 'staff') {
      _blockMessage = 'Use the admin dashboard for this account.';
      await FirebaseAuth.instance.signOut();
      return;
    }
    if (data['status'] == 'Inactive') {
      _blockMessage = 'This account is inactive.';
      await FirebaseAuth.instance.signOut();
      return;
    }

    user = StaffUser(
      id: firebaseUser.uid,
      fullName: data['fullName']?.toString() ?? 'Staff',
      email: data['email']?.toString() ?? firebaseUser.email ?? '',
      employeeId: data['employeeId']?.toString() ?? '',
      phone: data['phone']?.toString() ?? '',
    );
    isAuthenticated = true;
    errorMessage = null;
    await refreshDeviceLocationStatus();
    _watchDuties(firebaseUser.uid);
    _watchNotifications(firebaseUser.uid);
    _windowTimer?.cancel();
    _windowTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      unawaited(_syncDutyWindow());
    });
    unawaited(_syncDutyWindow());
    await FirebaseDatabase.instance.ref('users/${firebaseUser.uid}').update({
      'lastLoginAt': DateTime.now().toUtc().toIso8601String(),
    });
    notifyListeners();
  }

  void _watchDuties(String uid) {
    _dutySub?.cancel();
    _dutySub = FirebaseDatabase.instance
        .ref('duties')
        .orderByChild('staffId')
        .equalTo(uid)
        .onValue
        .listen((event) {
      final raw = event.snapshot.value;
      final next = <StaffDuty>[];
      if (raw is Map) {
        raw.forEach((key, value) {
          next.add(_dutyFrom(key.toString(), _asMap(value)));
        });
      }
      duties = next;
      unawaited(_syncDutyWindow());
      final active = todayDuty;
      final shouldTrack = active != null &&
          active.status == DutyStatus.active &&
          active.trackingEnabled &&
          locationPermissionGranted &&
          gpsEnabled;
      if (shouldTrack && _trackingDutyId != active.id) {
        _trackingDutyId = active.id;
        _listenToPositions(active);
      } else if (!shouldTrack && !_shouldKeepTracking()) {
        _stopTracking();
      }
      notifyListeners();
    }, onError: (Object _) {
      errorMessage = 'Could not load duties. Check the connection and sign in again.';
      notifyListeners();
    });
  }

  void _watchNotifications(String uid) {
    _noteSub?.cancel();
    _noteSub = FirebaseDatabase.instance
        .ref('notifications')
        .orderByChild('staffId')
        .equalTo(uid)
        .onValue
        .listen((event) {
      final raw = event.snapshot.value;
      final next = <StaffNotification>[];
      if (raw is Map) {
        raw.forEach((key, value) {
          final data = _asMap(value);
          if (data['hidden'] == true) return;
          final created = DateTime.tryParse(data['createdAt']?.toString() ?? '') ?? DateTime.now();
          next.add(
            StaffNotification(
              id: key.toString(),
              title: data['title']?.toString() ?? '',
              message: data['message']?.toString() ?? '',
              createdAt: created,
              read: data['read'] == true,
            ),
          );
        });
      }
      next.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      notifications = next;
      notifyListeners();
    }, onError: (Object _) {
      errorMessage = 'Could not load alerts. Check the connection and sign in again.';
      notifyListeners();
    });
  }

  void _listenToPositions(StaffDuty duty) {
    _positionSub?.cancel();
    _offTimer?.cancel();
    _positionSub = Geolocator.getPositionStream(
      locationSettings: AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 0,
        intervalDuration: Duration(minutes: duty.trackingIntervalMinutes),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'TrackerDuty',
          notificationText: 'Location is shared while your duty is active',
          enableWakeLock: true,
          notificationChannelName: 'Duty tracking',
        ),
      ),
    ).listen((_) {
      unawaited(recordLocation(duty.id));
    });
    _offTimer = Timer.periodic(Duration(minutes: duty.trackingIntervalMinutes), (_) {
      unawaited(recordLocation(duty.id));
    });
  }

  Future<void> _noteTrackOff(StaffDuty duty, StaffUser current) async {
    final interval = Duration(minutes: duty.trackingIntervalMinutes);
    if (_lastOffNote != null && DateTime.now().difference(_lastOffNote!) < interval) return;
    _lastOffNote = DateTime.now();
    final ref = FirebaseDatabase.instance.ref('liveLocations/${current.id}');
    final snap = await ref.get();
    final data = _asMap(snap.value);
    final alreadySent = data['offlineEmailSent'] == true;
    final count = ((data['trackOffCount'] as num?)?.toInt() ?? 0) + 1;
    await ref.update({
      'staffName': current.fullName,
      'dutyId': duty.id,
      'dutyTitle': duty.title,
      'tracking': false,
      'trackOffCount': count,
      'lastUpdatedAt': DateTime.now().toUtc().toIso8601String(),
    });
    if (count < 3 || alreadySent) return;
    final message =
        '${current.fullName} location tracking was off 3 times. Duty: ${duty.title}.';
    final sent = await _emailAdmin(
      staffName: current.fullName,
      title: 'Location tracking off',
      message: message,
    );
    if (!sent) return;
    await ref.update({'offlineEmailSent': true});
    await FirebaseDatabase.instance.ref('notifications').push().set({
      'type': 'LOCATION_OFFLINE',
      'title': 'Location tracking off',
      'message': message,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
      'read': false,
      'hidden': false,
      'staffId': current.id,
    });
  }

  Future<void> _syncDutyWindow() async {
    final current = user;
    if (current == null) return;
    await refreshDeviceLocationStatus();
    final now = karachiNow();
    final today = _dateKey(now);
    var prompt = false;
    for (final duty in List<StaffDuty>.from(duties)) {
      if (duty.status == DutyStatus.cancelled || duty.status == DutyStatus.completed) {
        if (_trackingDutyId == duty.id) await _releaseLiveTracking(current.id);
        continue;
      }
      var status = duty.status;
      if (_pauseCovers(duty, now)) {
        if (_trackingDutyId == duty.id) await _releaseLiveTracking(current.id);
        if (status != DutyStatus.paused) {
          await FirebaseDatabase.instance.ref('duties/${duty.id}').update({'status': 'Paused'});
        }
        continue;
      }
      if (status == DutyStatus.paused) {
        if (duty.pauseResume.isNotEmpty && _dateKey(now).compareTo(duty.pauseResume) >= 0) {
          await FirebaseDatabase.instance.ref('duties/${duty.id}').update({'status': 'Scheduled'});
          status = DutyStatus.scheduled;
        } else {
          if (_trackingDutyId == duty.id) await _releaseLiveTracking(current.id);
          continue;
        }
      }
      final open = _occursOn(duty, now) && _windowOpen(duty, now);
      if (!open) {
        if (status == DutyStatus.active) {
          if (_trackingDutyId == duty.id) await _releaseLiveTracking(current.id);
          final next = duty.recurrence == 'one_time' ? 'Completed' : 'Scheduled';
          await FirebaseDatabase.instance.ref('duties/${duty.id}').update({'status': next});
        }
        continue;
      }
      if (status == DutyStatus.scheduled) {
        await FirebaseDatabase.instance.ref('duties/${duty.id}').update({'status': 'Active'});
      }
      if (!duty.trackingEnabled) continue;
      final sharing = locationPermissionGranted && gpsEnabled;
      if (sharing) {
        if (_trackingDutyId != duty.id) {
          _trackingDutyId = duty.id;
          _listenToPositions(duty);
          await recordLocation(duty.id, force: true);
        }
        continue;
      }
      prompt = true;
      if (duty.locationOffAlertDate == today || _locationOffInflight.contains(duty.id)) continue;
      _locationOffInflight.add(duty.id);
      try {
        final dutyRef = FirebaseDatabase.instance.ref('duties/${duty.id}');
        final snap = await dutyRef.get();
        if (_asMap(snap.value)['locationOffAlertDate'] == today) continue;
        final message =
            '${current.fullName} is not live yet. Duty "${duty.title}" started at ${duty.startTime} and location is not enabled.';
        await dutyRef.update({'locationOffAlertDate': today});
        await _emailAdmin(
          staffName: current.fullName,
          title: 'Yet not live',
          message: message,
        );
        await FirebaseDatabase.instance.ref('notifications').push().set({
          'type': 'LOCATION_OFFLINE',
          'title': 'Yet not live',
          'message': message,
          'createdAt': DateTime.now().toUtc().toIso8601String(),
          'read': false,
          'hidden': false,
          'staffId': current.id,
        });
      } finally {
        _locationOffInflight.remove(duty.id);
      }
    }
    locationPrompt = prompt ? 'Please enable location' : null;
    notifyListeners();
  }

  bool _shouldKeepTracking() {
    final id = _trackingDutyId;
    if (id == null || !locationPermissionGranted || !gpsEnabled) return false;
    final duty = dutyById(id);
    if (duty == null) return false;
    if (duty.status == DutyStatus.cancelled || duty.status == DutyStatus.completed) return false;
    final now = karachiNow();
    return _occursOn(duty, now) && _windowOpen(duty, now);
  }

  void _stopTracking() {
    _trackingDutyId = null;
    _positionSub?.cancel();
    _positionSub = null;
    _offTimer?.cancel();
    _offTimer = null;
  }

  Future<void> _releaseLiveTracking(String staffId) async {
    _stopTracking();
    await FirebaseDatabase.instance.ref('liveLocations/$staffId').update({
      'tracking': false,
      'trackOffCount': 0,
    });
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _dutySub?.cancel();
    _noteSub?.cancel();
    _windowTimer?.cancel();
    _stopTracking();
    super.dispose();
  }
}

DateTime karachiNow() {
  final shifted = DateTime.now().toUtc().add(const Duration(hours: 5));
  return DateTime(
    shifted.year,
    shifted.month,
    shifted.day,
    shifted.hour,
    shifted.minute,
    shifted.second,
  );
}

String _dateKey(DateTime now) {
  final month = now.month.toString().padLeft(2, '0');
  final day = now.day.toString().padLeft(2, '0');
  return '${now.year}-$month-$day';
}

bool _pauseCovers(StaffDuty duty, DateTime now) {
  if (duty.pauseFrom.isEmpty || duty.pauseResume.isEmpty) return false;
  final key = _dateKey(now);
  return key.compareTo(duty.pauseFrom) >= 0 && key.compareTo(duty.pauseResume) < 0;
}

bool _windowOpen(StaffDuty duty, DateTime now) {
  final start = _clockMinutes(duty.startTime);
  final end = _clockMinutes(duty.endTime);
  if (start == null || end == null) return false;
  final nowMin = now.hour * 60 + now.minute;
  final inside = end >= start ? nowMin >= start && nowMin <= end : nowMin >= start || nowMin <= end;
  return inside;
}

int? _validBattery(int? value) {
  if (value == null || value < 0 || value > 100) return null;
  return value;
}

int? _clockMinutes(String value) {
  final parts = value.split(':');
  if (parts.length < 2) return null;
  final hour = int.tryParse(parts[0]);
  final minute = int.tryParse(parts[1]);
  if (hour == null || minute == null) return null;
  return hour * 60 + minute;
}

bool _occursOn(StaffDuty duty, DateTime day) {
  final start = DateTime.tryParse(duty.date);
  if (start == null) return false;
  final today = DateTime(day.year, day.month, day.day);
  final startDay = DateTime(start.year, start.month, start.day);
  if (today.isBefore(startDay)) return false;
  if (duty.recurrenceEndDate.isNotEmpty) {
    final end = DateTime.tryParse(duty.recurrenceEndDate);
    if (end != null && today.isAfter(DateTime(end.year, end.month, end.day))) return false;
  }
  switch (duty.recurrence) {
    case 'daily':
      return true;
    case 'weekdays':
      return today.weekday >= DateTime.monday && today.weekday <= DateTime.friday;
    case 'weekly':
      return today.weekday == startDay.weekday;
    case 'selected_days':
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return duty.selectedDays.contains(names[today.weekday - 1]);
    default:
      return today == startDay;
  }
}

List<String> _stringList(Object? value) {
  if (value is List) return value.map((item) => item.toString()).toList();
  return const [];
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return {};
}

Future<bool> _emailAdmin({
  required String staffName,
  required String title,
  required String message,
}) async {
  final client = HttpClient();
  try {
    final request = await client.postUrl(Uri.parse('https://api.emailjs.com/api/v1.0/email/send'));
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode({
      'service_id': 'service_fqvv84t',
      'template_id': 'template_s7fx8e7',
      'user_id': 'qmucjzFPPlSdaZFXT',
      'template_params': {
        'staff_name': staffName,
        'title': title,
        'message': message,
        'time': DateTime.now().toUtc().toIso8601String(),
      },
    }));
    final response = await request.close();
    return response.statusCode >= 200 && response.statusCode < 300;
  } catch (_) {
    return false;
  } finally {
    client.close();
  }
}

DutyStatus _status(Object? value) {
  switch (value) {
    case 'Active':
      return DutyStatus.active;
    case 'Completed':
      return DutyStatus.completed;
    case 'Cancelled':
      return DutyStatus.cancelled;
    case 'Paused':
      return DutyStatus.paused;
    default:
      return DutyStatus.scheduled;
  }
}

StaffDuty _dutyFrom(String id, Map<String, dynamic> data) {
  final recorded = data['lastLocationAt']?.toString();
  return StaffDuty(
    id: id,
    title: data['title']?.toString() ?? '',
    description: data['description']?.toString() ?? '',
    date: data['date']?.toString() ?? '',
    recurrence: data['recurrence']?.toString() ?? 'one_time',
    recurrenceEndDate: data['recurrenceEndDate']?.toString() ?? '',
    selectedDays: _stringList(data['selectedDays']),
    locationOffAlertDate: data['locationOffAlertDate']?.toString() ?? '',
    pauseFrom: data['pauseFrom']?.toString() ?? '',
    pauseResume: data['pauseResume']?.toString() ?? '',
    startTime: data['startTime']?.toString() ?? '',
    endTime: data['endTime']?.toString() ?? '',
    timezone: data['timezone']?.toString() ?? 'Asia/Karachi',
    status: _status(data['status']),
    trackingEnabled: data['trackingEnabled'] == true,
    trackingIntervalMinutes: (data['trackingIntervalMinutes'] as num?)?.toInt() ?? 5,
    locationAlertThresholdMinutes: (data['locationAlertThresholdMinutes'] as num?)?.toInt() ?? 15,
    lastLocationAt: recorded == null ? null : DateTime.tryParse(recorded),
    batteryPercent: _validBattery((data['batteryPercent'] as num?)?.toInt()),
    accuracyMeters: (data['accuracyMeters'] as num?)?.toDouble(),
    latitude: (data['latitude'] as num?)?.toDouble(),
    longitude: (data['longitude'] as num?)?.toDouble(),
  );
}
