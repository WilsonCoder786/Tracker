import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'state/staff_app_state.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StaffApp());
}

class StaffApp extends StatefulWidget {
  const StaffApp({super.key});

  @override
  State<StaffApp> createState() => _StaffAppState();
}

class _StaffAppState extends State<StaffApp> {
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: DefaultFirebaseOptions.android);
      }
    } on FirebaseException catch (error) {
      if (error.code != 'duplicate-app') {
        if (!mounted) return;
        setState(() {
          _error = 'Could not start. Check the internet connection and reopen the app.';
        });
        return;
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not start. Check the internet connection and reopen the app.';
      });
      return;
    }
    if (!mounted) return;
    setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: Colors.white,
          body: Center(
            child: _error == null
                ? const CircularProgressIndicator()
                : Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(_error!, textAlign: TextAlign.center),
                  ),
          ),
        ),
      );
    }

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
