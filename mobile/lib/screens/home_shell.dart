import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/staff_app_state.dart';
import '../widgets/glass_nav_bar.dart';
import 'notifications_screen.dart';
import 'permission_screen.dart';
import 'profile_screen.dart';
import 'today_duty_screen.dart';
import 'upcoming_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;
  var _askedLocation = false;

  final pages = const [
    TodayDutyScreen(),
    UpcomingScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _askLocation());
  }

  Future<void> _askLocation() async {
    if (_askedLocation || !mounted) return;
    final state = context.read<StaffAppState>();
    if (state.permissionScreenSeen || state.locationPermissionGranted) return;
    _askedLocation = true;
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const PermissionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unread = context.watch<StaffAppState>().unreadCount;

    return Scaffold(
      extendBody: true,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 320),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, animation) {
          final offset = Tween<Offset>(
            begin: const Offset(0.03, 0.02),
            end: Offset.zero,
          ).animate(animation);
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(position: offset, child: child),
          );
        },
        child: KeyedSubtree(
          key: ValueKey(index),
          child: pages[index],
        ),
      ),
      bottomNavigationBar: GlassNavBar(
        index: index,
        unread: unread,
        onChanged: (value) => setState(() => index = value),
      ),
    );
  }
}
