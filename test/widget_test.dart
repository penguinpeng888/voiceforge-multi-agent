import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:sleep_cabin_app/main.dart';
import 'package:sleep_cabin_app/providers/device_provider.dart';

void main() {
  group('App Widget Tests', () {
    testWidgets('App starts with LoginScreen', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.text('睡眠舱'), findsOneWidget);
    });

    testWidgets('Login screen has phone input field', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.text('手机号'), findsOneWidget);
    });

    testWidgets('Login screen has verification code input', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.text('验证码'), findsOneWidget);
    });

    testWidgets('Login screen has send code button', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.text('获取验证码'), findsOneWidget);
    });

    testWidgets('Login screen has login button', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.text('登录'), findsOneWidget);
    });

    testWidgets('Login screen displays app icon', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.byIcon(Icons.bedtime), findsOneWidget);
    });

    testWidgets('Login screen has user agreement links', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      expect(find.text('《用户协议》'), findsOneWidget);
      expect(find.text('《隐私政策》'), findsOneWidget);
    });

    testWidgets('Should show error for invalid phone', (WidgetTester tester) async {
      await tester.pumpWidget(const SleepCabinApp());
      await tester.pumpAndSettle();
      
      // 输入错误手机号
      await tester.enterText(find.byType(TextField).first, '12345');
      await tester.pump();
      
      // 点击获取验证码
      await tester.tap(find.text('获取验证码'));
      await tester.pump();
      
      // 验证错误提示
      expect(find.text('请输入正确的手机号'), findsOneWidget);
    });
  });
}