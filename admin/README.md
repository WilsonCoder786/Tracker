# TrackerDuty Admin (React UI — complete)

Full admin dashboard UI with shared mock store. No backend yet.

## Run

```bash
cd apps/admin
npm install
npm run dev
```

Open `http://localhost:5173`

## Demo login

- Email: `admin@example.com`
- Password: `admin123`

## Completed UI

- Login / logout / change password
- Dashboard (stats, loading skeleton, auto-refresh every 30s)
- Staff (CRUD, detail drawer, activate/deactivate confirm, reset password, photo upload UI, pagination)
- Duties (tabs, 5-step wizard, selected weekdays, pause date range, recurring edit scope, cancel confirm, detail drawer)
- Live Tracking (search, status + duty filters, mock map, detail panel)
- Location History (filters, route, paginated points, export button)
- Notifications (unread/all, type filters, mark read, clear read)
- Reports (charts + exports UI)
- Settings (tabs: tracking / alerts / notifications / retention)
- Profile
- 404 page
- Toasts, confirm dialogs, empty states, responsive sidebar

## Not included (backend later)

- Real API / MongoDB
- Real Google Maps key
- Real SMTP / FCM
