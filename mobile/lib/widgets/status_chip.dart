import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/models.dart';
import '../theme/app_theme.dart';
import 'ui_kit.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    required this.color,
    required this.bg,
    this.pulse = false,
  });

  final String label;
  final Color color;
  final Color bg;
  final bool pulse;

  factory StatusChip.duty(DutyStatus status) {
    switch (status) {
      case DutyStatus.active:
        return const StatusChip(
          label: 'ACTIVE',
          color: AppColors.success,
          bg: Color(0xFFDCFCE7),
          pulse: true,
        );
      case DutyStatus.scheduled:
        return const StatusChip(
          label: 'Scheduled',
          color: Color(0xFF1D4ED8),
          bg: Color(0xFFDBEAFE),
        );
      case DutyStatus.completed:
        return const StatusChip(
          label: 'Completed',
          color: AppColors.muted,
          bg: Color(0xFFE8EEF5),
        );
      case DutyStatus.cancelled:
        return const StatusChip(
          label: 'Cancelled',
          color: AppColors.danger,
          bg: Color(0xFFFEE2E2),
        );
      case DutyStatus.paused:
        return const StatusChip(
          label: 'Paused',
          color: AppColors.warning,
          bg: Color(0xFFFFEDD5),
        );
    }
  }

  factory StatusChip.tracking(TrackingUiState state) {
    switch (state) {
      case TrackingUiState.trackingActive:
      case TrackingUiState.recent:
        return const StatusChip(
          label: 'Tracking Active',
          color: AppColors.success,
          bg: Color(0xFFDCFCE7),
          pulse: true,
        );
      case TrackingUiState.trackingPaused:
        return const StatusChip(
          label: 'Tracking Paused',
          color: AppColors.warning,
          bg: Color(0xFFFFEDD5),
        );
      case TrackingUiState.permissionRequired:
        return const StatusChip(
          label: 'Permission Required',
          color: AppColors.warning,
          bg: Color(0xFFFFEDD5),
        );
      case TrackingUiState.gpsDisabled:
        return const StatusChip(
          label: 'GPS Disabled',
          color: AppColors.danger,
          bg: Color(0xFFFEE2E2),
        );
      case TrackingUiState.offlineStale:
        return const StatusChip(
          label: 'Offline / Stale',
          color: AppColors.danger,
          bg: Color(0xFFFEE2E2),
        );
      case TrackingUiState.dutyNotActive:
        return const StatusChip(
          label: 'Duty Not Active',
          color: AppColors.muted,
          bg: Color(0xFFE8EEF5),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          PulseDot(color: color, active: pulse),
          const SizedBox(width: 7),
          Text(
            label,
            style: GoogleFonts.ibmPlexSans(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
