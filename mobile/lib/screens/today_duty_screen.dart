import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/staff_app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/duty_time_ring.dart';
import '../widgets/status_chip.dart';
import '../widgets/tracking_radar.dart';
import '../widgets/ui_kit.dart';
import 'duty_detail_screen.dart';
import 'permission_screen.dart';

class TodayDutyScreen extends StatelessWidget {
  const TodayDutyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StaffAppState>();
    final duty = state.todayDuty;
    final tracking = state.trackingStateFor(duty);
    final firstName = state.user?.fullName.split(' ').first ?? 'Staff';

    return AtmosphereBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
          children: [
            FadeSlideIn(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFormat('EEEE · MMM d').format(DateTime(2026, 10, 9)),
                          style: GoogleFonts.ibmPlexSans(
                            color: AppColors.muted,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          firstName,
                          style: GoogleFonts.outfit(
                            fontSize: 34,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.tealBright,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'STAFF',
                          style: GoogleFonts.ibmPlexSans(
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (duty == null)
              const SoftCard(
                child: Text(
                  'No duty scheduled for today.',
                  style: TextStyle(color: AppColors.muted),
                ),
              )
            else ...[
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: _MissionHero(
                  duty: duty,
                  tracking: tracking,
                  onOpen: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => DutyDetailScreen(dutyId: duty.id),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 90),
                child: SoftCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SectionLabel('Signal health'),
                                const SizedBox(height: 10),
                                StatusChip.tracking(tracking),
                              ],
                            ),
                          ),
                          DutyTimeRing(
                            startTime: duty.startTime,
                            endTime: duty.endTime,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          MetricTile(
                            label: 'Updated',
                            value: duty.lastLocationAt == null
                                ? '—'
                                : DateFormat('h:mm a')
                                    .format(duty.lastLocationAt!.toLocal()),
                            icon: Icons.schedule_rounded,
                          ),
                          const SizedBox(width: 10),
                          MetricTile(
                            label: 'Battery',
                            value: duty.batteryPercent == null
                                ? '—'
                                : '${duty.batteryPercent}%',
                            icon: Icons.battery_charging_full_rounded,
                          ),
                          const SizedBox(width: 10),
                          MetricTile(
                            label: 'Accuracy',
                            value: duty.accuracyMeters == null
                                ? '—'
                                : '${duty.accuracyMeters!.toStringAsFixed(0)}m',
                            icon: Icons.my_location_rounded,
                          ),
                        ],
                      ),
                      if (tracking == TrackingUiState.permissionRequired) ...[
                        const SizedBox(height: 14),
                        _ActionBanner(
                          title: 'Permission needed',
                          body: 'Location permission is required for this duty.',
                          cta: 'Grant access',
                          color: AppColors.warning,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const PermissionScreen(),
                            ),
                          ),
                        ),
                      ],
                      if (tracking == TrackingUiState.gpsDisabled) ...[
                        const SizedBox(height: 14),
                        _ActionBanner(
                          title: 'GPS disabled',
                          body: 'Enable location services to continue tracking.',
                          cta: 'Enable GPS',
                          color: AppColors.danger,
                          onTap: () =>
                              context.read<StaffAppState>().setGpsEnabled(true),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                delay: const Duration(milliseconds: 130),
                child: Column(
                  children: [
                    if (duty.status == DutyStatus.scheduled)
                      _PrimaryCta(
                        label: 'Start Duty',
                        icon: Icons.play_arrow_rounded,
                        onPressed: () => _handleStart(context, state, duty),
                      ),
                    if (duty.status == DutyStatus.active) ...[
                      _PrimaryCta(
                        label: 'Send location update',
                        icon: Icons.radar_rounded,
                        onPressed: () {
                          context
                              .read<StaffAppState>()
                              .simulateLocationUpdate(duty.id);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Location ping recorded'),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () {
                          context.read<StaffAppState>().endDuty(duty.id);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Duty ended · tracking stopped'),
                            ),
                          );
                        },
                        icon: const Icon(Icons.stop_circle_outlined),
                        label: const Text('End Duty'),
                      ),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            SoftCard(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              child: SwitchListTile(
                title: Text(
                  'GPS enabled',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text('Demo control for GPS-off state'),
                value: state.gpsEnabled,
                activeThumbColor: Colors.white,
                activeTrackColor: AppColors.teal,
                onChanged: (v) => context.read<StaffAppState>().setGpsEnabled(v),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleStart(
    BuildContext context,
    StaffAppState state,
    StaffDuty duty,
  ) async {
    if (duty.trackingEnabled && !state.locationPermissionGranted) {
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const PermissionScreen()),
      );
    }
    if (!context.mounted) return;
    final latest = context.read<StaffAppState>();
    latest.startDuty(duty.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(latest.errorMessage ?? 'Duty started · tracking active')),
    );
  }
}

class _MissionHero extends StatelessWidget {
  const _MissionHero({
    required this.duty,
    required this.tracking,
    required this.onOpen,
  });

  final StaffDuty duty;
  final TrackingUiState tracking;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onOpen,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF071824),
              Color(0xFF12324F),
              Color(0xFF0B4A45),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.navy.withValues(alpha: 0.28),
              blurRadius: 28,
              offset: const Offset(0, 16),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Text(
                  'TODAY MISSION',
                  style: GoogleFonts.ibmPlexSans(
                    color: Colors.white54,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                    fontSize: 11,
                  ),
                ),
                const Spacer(),
                StatusChip.duty(duty.status),
              ],
            ),
            const SizedBox(height: 8),
            TrackingRadar(state: tracking, size: 168),
            const SizedBox(height: 8),
            Text(
              duty.title,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.6,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${duty.startTime} – ${duty.endTime} · ${duty.timezone}',
              style: GoogleFonts.ibmPlexSans(
                color: const Color(0xFFB7EDE4),
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.touch_app_rounded, color: Colors.white70, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tap for full duty details',
                      style: GoogleFonts.ibmPlexSans(
                        color: Colors.white70,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Icon(Icons.arrow_forward_rounded, color: Colors.white70, size: 18),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrimaryCta extends StatelessWidget {
  const _PrimaryCta({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [AppColors.tealBright, AppColors.teal],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.teal.withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: FilledButton.icon(
        style: FilledButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          minimumSize: const Size.fromHeight(58),
        ),
        onPressed: onPressed,
        icon: Icon(icon),
        label: Text(label),
      ),
    );
  }
}

class _ActionBanner extends StatelessWidget {
  const _ActionBanner({
    required this.title,
    required this.body,
    required this.cta,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String body;
  final String cta;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(body, style: TextStyle(color: color.withValues(alpha: 0.9), height: 1.35)),
          const SizedBox(height: 8),
          TextButton(
            onPressed: onTap,
            style: TextButton.styleFrom(
              foregroundColor: color,
              padding: EdgeInsets.zero,
            ),
            child: Text(cta, style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
