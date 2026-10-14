import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/staff_app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/status_chip.dart';
import '../widgets/ui_kit.dart';

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
                            label: 'Position',
                            value: duty.latitude == null || duty.longitude == null
                                ? '—'
                                : '${duty.latitude!.toStringAsFixed(5)}, ${duty.longitude!.toStringAsFixed(5)}',
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
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 140),
                child: SoftCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('Automatic schedule'),
                      const SizedBox(height: 8),
                      Text(
                        duty.status == DutyStatus.active
                            ? 'Live until ${duty.endTime}. Location is shared automatically. It closes when the window ends.'
                            : 'Starts at ${duty.startTime} and ends at ${duty.endTime}. No manual start is required.',
                        style: GoogleFonts.ibmPlexSans(
                          color: AppColors.muted,
                          height: 1.45,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
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
