import 'package:flutter_test/flutter_test.dart';
import 'package:staff_app/main.dart';

void main() {
  testWidgets('Staff app shows cinematic login', (tester) async {
    await tester.pumpWidget(const StaffApp());
    expect(find.textContaining('Duty-ready'), findsOneWidget);
    expect(find.text('Enter duty console'), findsOneWidget);
  });
}
