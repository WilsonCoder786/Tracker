import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/screens/login_screen.dart';
import 'package:staff_app/screens/permission_screen.dart';
import 'package:staff_app/screens/profile_screen.dart';
import 'package:staff_app/state/staff_app_state.dart';
import 'package:staff_app/theme/app_theme.dart';

void main() {
  testWidgets('Staff app shows cinematic login', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => StaffAppState(listenToAuth: false),
        child: MaterialApp(
          theme: buildStaffTheme(),
          home: const LoginScreen(),
        ),
      ),
    );
    expect(find.textContaining('Duty-ready'), findsOneWidget);
    expect(find.text('Enter duty console'), findsOneWidget);
  });

  testWidgets('Permission screen fits a short viewport', (tester) async {
    tester.view.physicalSize = const Size(360, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => StaffAppState(listenToAuth: false),
        child: MaterialApp(
          theme: buildStaffTheme(),
          home: const PermissionScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Allow location access'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Profile list tiles paint ink on their card', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => StaffAppState(listenToAuth: false),
        child: MaterialApp(
          theme: buildStaffTheme(),
          home: const ProfileScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Location permission'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
