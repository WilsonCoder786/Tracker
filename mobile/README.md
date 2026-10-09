# TrackerDuty Staff (Flutter UI)

Staff mobile UI with mock data. No backend or real GPS yet.

## Run

```bash
cd apps/mobile
flutter pub get
flutter run
```

## Demo login

- Email: `ali@example.com`
- Password: `staff123`

## Screens

- Login
- Today's Duty (Start / End, tracking status chips)
- Upcoming duties
- Duty details
- Location permission explanation flow
- Notifications
- Profile (GPS/permission toggles for demo)

## Tracking status UI

- Tracking Active
- Tracking Paused
- Location Permission Required
- GPS Disabled
- Location Offline/Stale
- Duty Not Active

Location values stay blank until a mock ping is recorded after Start Duty + permission + GPS.
