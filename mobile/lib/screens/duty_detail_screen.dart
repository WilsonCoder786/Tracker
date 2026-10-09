import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/staff_app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/status_chip.dart';
import '../widgets/ui_kit.dart';
import 'permission_screen.dart';

class DutyDetailScreen extends StatelessWidget {
  const DutyDetailScreen({super.key, required this.dutyId});

  final String dutyId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StaffAppState>();
    final duty = state.dutyById(dutyId);

    if (duty == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Duty')),
        body: const Center(child: Text('Duty not found')),
      );
    }

    final tracking = state.trackingStateFor(duty);

    return Scaffold(
      body: AtmosphereBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const Spacer(),
                  StatusChip.duty(duty.status),
                ],
              ),
              FadeSlideIn(
                child: Text(
                  duty.title,
                  style: GoogleFonts.outfit(
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.8,
                    height: 1.1,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: StatusChip.tracking(tracking),
              ),
              const SizedBox(height: 18),
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: SoftCard(
                  child: Column(
                    children: [
                      _row('Date', duty.date),
                      _row('Time', '${duty.startTime} – ${duty.endTime}'),
                      _row('Timezone', duty.timezone),
                      _row(
                        'Tracking',
                        duty.trackingEnabled
                            ? 'Every ${duty.trackingIntervalMinutes} min'
                            : 'Disabled',
                      ),
                      _row('Alert after', '${duty.locationAlertThresholdMinutes} minutes'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 110),
                child: SoftCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('About this duty'),
                      const SizedBox(height: 10),
                      Text(
                        duty.description,
                        style: const TextStyle(
                          color: AppColors.muted,
                          height: 1.5,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 140),
                child: SoftCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('Live metrics'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          MetricTile(
                            label: 'Updated',
                            value: duty.lastLocationAt == null
                                ? '—'
                                : DateFormat('h:mm a').format(duty.lastLocationAt!.toLocal()),
                            icon: Icons.schedule_rounded,
                          ),
                          const SizedBox(width: 10),
                          MetricTile(
                            label: 'Battery',
                            value: duty.batteryPercent == null ? '—' : '${duty.batteryPercent}%',
                            icon: Icons.battery_std_rounded,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          MetricTile(
                            label: 'Accuracy',
                            value: duty.accuracyMeters == null
                                ? '—'
                                : '${duty.accuracyMeters!.toStringAsFixed(0)} m',
                            icon: Icons.gps_fixed_rounded,
                          ),
                          const SizedBox(width: 10),
                          MetricTile(
                            label: 'Coords',
                            value: duty.latitude == null
                                ? '—'
                                : duty.latitude!.toStringAsFixed(2),
                            icon: Icons.map_outlined,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Blank values mean no location has been received yet.',
                        style: GoogleFonts.ibmPlexSans(
                          color: AppColors.muted,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (duty.status == DutyStatus.scheduled)
                FilledButton.icon(
                  onPressed: () async {
                    if (duty.trackingEnabled && !state.locationPermissionGranted) {
                      await Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const PermissionScreen()),
                      );
                    }
                    if (!context.mounted) return;
                    context.read<StaffAppState>().startDuty(duty.id);
                  },
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Start Duty'),
                ),
              if (duty.status == DutyStatus.active)
                OutlinedButton.icon(
                  onPressed: () => context.read<StaffAppState>().endDuty(duty.id),
                  icon: const Icon(Icons.stop_circle_outlined),
                  label: const Text('End Duty'),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: const TextStyle(color: AppColors.muted)),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.ibmPlexSans(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
