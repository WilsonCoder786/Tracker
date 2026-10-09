import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/models.dart';
import '../theme/app_theme.dart';
import 'status_chip.dart';
import 'ui_kit.dart';

class DutyCard extends StatelessWidget {
  const DutyCard({
    super.key,
    required this.duty,
    this.onTap,
    this.featured = false,
    this.trailing,
  });

  final StaffDuty duty;
  final VoidCallback? onTap;
  final bool featured;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final isActive = duty.status == DutyStatus.active;

    return SoftCard(
      onTap: onTap,
      padding: EdgeInsets.all(featured ? 20 : 16),
      gradient: featured
          ? LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isActive
                  ? const [Color(0xFF0F3A4A), AppColors.navy, Color(0xFF0E5F58)]
                  : const [Color(0xFF163A57), AppColors.navy, Color(0xFF1A4A5C)],
            )
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  featured ? 'TODAY' : duty.date,
                  style: GoogleFonts.ibmPlexSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.1,
                    color: featured ? Colors.white70 : AppColors.muted,
                  ),
                ),
              ),
              StatusChip.duty(duty.status),
            ],
          ),
          SizedBox(height: featured ? 14 : 10),
          Text(
            duty.title,
            style: GoogleFonts.outfit(
              fontSize: featured ? 28 : 20,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.4,
              color: featured ? Colors.white : AppColors.ink,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${duty.startTime} – ${duty.endTime}',
            style: GoogleFonts.ibmPlexSans(
              fontSize: featured ? 18 : 15,
              fontWeight: FontWeight.w600,
              color: featured ? const Color(0xFFD7F5F0) : AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            duty.timezone,
            style: TextStyle(
              color: featured ? Colors.white60 : AppColors.muted,
              fontSize: 13,
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(height: 16),
            trailing!,
          ],
          if (onTap != null && !featured) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'View details',
                  style: GoogleFonts.ibmPlexSans(
                    color: AppColors.teal,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward_rounded, size: 16, color: AppColors.teal),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
