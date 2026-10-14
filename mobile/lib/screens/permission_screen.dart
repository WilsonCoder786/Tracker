import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../state/staff_app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/ui_kit.dart';

class PermissionScreen extends StatelessWidget {
  const PermissionScreen({super.key, this.onDone});

  final VoidCallback? onDone;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF071824), Color(0xFF0C2F3D), Color(0xFF0B4A45)],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 8, 18, 20),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Align(
                            alignment: Alignment.centerLeft,
                            child: IconButton(
                              onPressed: () => Navigator.of(context).maybePop(),
                              icon: const Icon(
                                Icons.close_rounded,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          FadeSlideIn(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: const Icon(
                                    Icons.shield_moon_outlined,
                                    color: Color(0xFF3DDC97),
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(height: 18),
                                Text(
                                  'Location only\nwhile on duty',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 36,
                                    height: 1.05,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -1,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Your location is required during active duty hours so your organization can monitor duty progress.',
                                  style: GoogleFonts.ibmPlexSans(
                                    color: Colors.white70,
                                    height: 1.5,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 22),
                          FadeSlideIn(
                            delay: const Duration(milliseconds: 70),
                            child: SoftCard(
                              child: Column(
                                children: [
                                  _point('Tracks only while a duty is active'),
                                  _point('Stops automatically when duty ends'),
                                  _point('Never used to show other staff'),
                                ],
                              ),
                            ),
                          ),
                          const Spacer(),
                          FilledButton(
                            onPressed: () async {
                              final allowed = await context
                                  .read<StaffAppState>()
                                  .requestLocationAccess();
                              if (!context.mounted) return;
                              if (!allowed) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Location permission is required before tracking can start.',
                                    ),
                                  ),
                                );
                                return;
                              }
                              onDone?.call();
                              Navigator.of(context).maybePop();
                            },
                            child: const Text('Allow location access'),
                          ),
                          const SizedBox(height: 10),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white24),
                            ),
                            onPressed: () {
                              context
                                  .read<StaffAppState>()
                                  .declineLocationAccess();
                              onDone?.call();
                              Navigator.of(context).maybePop();
                            },
                            child: const Text('Not now'),
                          ),
                          TextButton(
                            onPressed: () {
                              Geolocator.openAppSettings();
                            },
                            child: Text(
                              'Open device settings',
                              style: GoogleFonts.ibmPlexSans(
                                color: Colors.white70,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _point(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          const Icon(
            Icons.check_circle_rounded,
            color: AppColors.teal,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontWeight: FontWeight.w600, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}
