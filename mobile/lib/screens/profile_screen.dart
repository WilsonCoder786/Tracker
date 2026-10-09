import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../state/staff_app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/ui_kit.dart';
import 'permission_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StaffAppState>();
    final user = state.user;

    return AtmosphereBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 100),
          children: [
            FadeSlideIn(
              child: Text(
                'Profile',
                style: GoogleFonts.outfit(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                ),
              ),
            ),
            const SizedBox(height: 16),
            FadeSlideIn(
              delay: const Duration(milliseconds: 40),
              child: SoftCard(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF12324F), Color(0xFF0E5F58)],
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.white.withValues(alpha: 0.16),
                      child: Text(
                        user?.fullName.substring(0, 1) ?? 'S',
                        style: GoogleFonts.outfit(
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user?.fullName ?? 'Staff',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.75)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            FadeSlideIn(
              delay: const Duration(milliseconds: 80),
              child: SoftCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _tile('Employee ID', user?.employeeId ?? '—'),
                    const Divider(height: 1),
                    _tile('Phone', user?.phone ?? '—'),
                    const Divider(height: 1),
                    _tile('Role', 'STAFF'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            FadeSlideIn(
              delay: const Duration(milliseconds: 110),
              child: SoftCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      title: Text(
                        'Location permission',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        state.locationPermissionGranted ? 'Granted' : 'Not granted',
                        style: const TextStyle(color: AppColors.muted),
                      ),
                      trailing: TextButton(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const PermissionScreen()),
                        ),
                        child: const Text('Manage'),
                      ),
                    ),
                    const Divider(height: 1),
                    SwitchListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                      title: Text(
                        'GPS enabled',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                      ),
                      value: state.gpsEnabled,
                      activeThumbColor: Colors.white,
                      activeTrackColor: AppColors.teal,
                      onChanged: (v) => context.read<StaffAppState>().setGpsEnabled(v),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: () => context.read<StaffAppState>().logout(),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Logout'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(String label, String value) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      title: Text(label, style: const TextStyle(color: AppColors.muted)),
      trailing: Text(
        value,
        style: GoogleFonts.ibmPlexSans(fontWeight: FontWeight.w700),
      ),
    );
  }
}
