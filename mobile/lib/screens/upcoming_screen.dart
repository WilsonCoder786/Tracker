import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../state/staff_app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/duty_card.dart';
import '../widgets/ui_kit.dart';
import 'duty_detail_screen.dart';

class UpcomingScreen extends StatelessWidget {
  const UpcomingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final upcoming = context.watch<StaffAppState>().upcomingDuties;

    return AtmosphereBackground(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
              child: FadeSlideIn(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your plan',
                      style: GoogleFonts.outfit(
                        fontSize: 34,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${upcoming.length} upcoming ${upcoming.length == 1 ? 'mission' : 'missions'}',
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: upcoming.isEmpty
                  ? const Center(
                      child: SoftCard(
                        child: Text(
                          'No upcoming duties right now.',
                          style: TextStyle(color: AppColors.muted),
                        ),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(18, 8, 18, 100),
                      itemCount: upcoming.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final duty = upcoming[index];
                        return FadeSlideIn(
                          delay: Duration(milliseconds: 40 * index),
                          child: DutyCard(
                            duty: duty,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => DutyDetailScreen(dutyId: duty.id),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
