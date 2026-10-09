import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'state/staff_app_state.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StaffApp());
}

class StaffApp extends StatelessWidget {
  const StaffApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => StaffAppState(),
      child: MaterialApp(
        title: 'TrackerDuty Staff',
        debugShowCheckedModeBanner: false,
        theme: buildStaffTheme(),
        home: Consumer<StaffAppState>(
          builder: (context, state, _) {
            return state.isAuthenticated ? const HomeShell() : const LoginScreen();
          },
        ),
      ),
    );
  }
}
