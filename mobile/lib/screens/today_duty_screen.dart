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
    final locationOn = state.locationPermissionGranted && state.gpsEnabled;

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
                          DateFormat('EEEE · MMM d').format(karachiNow()),
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
                          decoration: BoxDecoration(
                            color: locationOn ? AppColors.success : AppColors.danger,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          locationOn ? 'LOCATION ON' : 'LOCATION OFF',
                          style: GoogleFonts.ibmPlexSans(
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            FadeSlideIn(
              delay: const Duration(milliseconds: 20),
              child: _LocationCard(
                ready: locationOn,
                needsPermission: !state.locationPermissionGranted,
                onEnable: () {
                  if (!state.locationPermissionGranted) {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PermissionScreen()),
                    );
                    return;
                  }
                  context.read<StaffAppState>().openLocationSettings();
                },
              ),
            ),
            const SizedBox(height: 14),
            if (state.errorMessage != null) ...[
              SoftCard(
                child: Text(
                  state.errorMessage!,
                  style: const TextStyle(color: AppColors.danger, height: 1.4),
                ),
              ),
              const SizedBox(height: 14),
            ],
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
                                const SectionLabel('Location'),
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
                      if (!locationOn &&
                          (state.locationPrompt != null || duty.status == DutyStatus.active)) ...[
                        const SizedBox(height: 14),
                        Text(
                          'This duty cannot be tracked until location is on.',
                          style: GoogleFonts.ibmPlexSans(
                            color: AppColors.danger,
                            fontWeight: FontWeight.w700,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                delay: const Duration(milliseconds: 130),
                child: SoftCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('Automatic schedule'),
                      const SizedBox(height: 8),
                      Text(
                        duty.status == DutyStatus.active
                            ? 'This duty is live until ${duty.endTime}. Tracking runs on its own while location stays on.'
                            : 'This duty starts by itself at ${duty.startTime} and ends at ${duty.endTime}. Keep location on before then.',
                        style: GoogleFonts.ibmPlexSans(
                          color: AppColors.ink,
                          height: 1.45,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
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

class _LocationCard extends StatelessWidget {
  const _LocationCard({
    required this.ready,
    required this.needsPermission,
    required this.onEnable,
  });

  final bool ready;
  final bool needsPermission;
  final VoidCallback onEnable;

  @override
  Widget build(BuildContext context) {
    final color = ready ? AppColors.success : AppColors.danger;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                ready ? Icons.location_on_rounded : Icons.location_off_rounded,
                color: color,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  ready ? 'Location is on' : 'Location is off',
                  style: GoogleFonts.outfit(
                    color: color,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            ready
                ? 'Location must stay enabled before duty time.'
                : 'Turn location on before your duty starts. Tracking begins on its own.',
            style: GoogleFonts.ibmPlexSans(height: 1.4, color: AppColors.ink),
          ),
          if (!ready) ...[
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onEnable,
              icon: const Icon(Icons.settings_rounded),
              label: Text(needsPermission ? 'Allow location' : 'Open location settings'),
            ),
          ],
        ],
      ),
    );
  }
}
