import 'package:flutter_test/flutter_test.dart';
import 'package:sleep_cabin_app/utils/helpers.dart';

void main() {
  group('Helpers - Time Formatting', () {
    test('formatDuration should format minutes correctly', () {
      expect(formatDuration(60), '1小时0分钟');
      expect(formatDuration(90), '1小时30分钟');
      expect(formatDuration(30), '30分钟');
      expect(formatDuration(0), '0分钟');
    });

    test('formatDuration should handle edge cases', () {
      expect(formatDuration(1), '1分钟');
      expect(formatDuration(1440), '24小时0分钟');
    });
  });

  group('Helpers - Date Formatting', () {
    test('formatDate should format date correctly', () {
      final date = DateTime(2024, 3, 15);
      expect(formatDate(date), '2024-03-15');
    });

    test('formatTime should format time correctly', () {
      final time = DateTime(2024, 3, 15, 14, 30);
      expect(formatTime(time), '14:30');
    });

    test('formatDateTime should format full datetime', () {
      final dt = DateTime(2024, 3, 15, 14, 30);
      expect(formatDateTime(dt), '2024-03-15 14:30');
    });
  });

  group('Helpers - Validation', () {
    test('isValidPhone should validate phone numbers', () {
      expect(isValidPhone('13800138000'), true);
      expect(isValidPhone('13900139000'), true);
      expect(isValidPhone('1380013800'), false);
      expect(isValidPhone('138001380000'), false);
      expect(isValidPhone('abcdef'), false);
    });

    test('isValidCode should validate verification codes', () {
      expect(isValidCode('123456'), true);
      expect(isValidCode('000000'), true);
      expect(isValidCode('12345'), false);
      expect(isValidCode('1234567'), false);
    });
  });

  group('Helpers - Battery', () {
    test('getBatteryColor should return correct color', () {
      expect(getBatteryColor(80), 'green');
      expect(getBatteryColor(50), 'green');
      expect(getBatteryColor(30), 'orange');
      expect(getBatteryColor(20), 'red');
      expect(getBatteryColor(10), 'red');
    });

    test('getBatteryText should return correct text', () {
      expect(getBatteryText(85), '85%');
      expect(getBatteryText(20), '20%');
    });
  });

  group('Helpers - Sleep Score', () {
    test('getSleepScoreLevel should return correct level', () {
      expect(getSleepScoreLevel(90), 'excellent');
      expect(getSleepScoreLevel(80), 'good');
      expect(getSleepScoreLevel(70), 'fair');
      expect(getSleepScoreLevel(50), 'poor');
    });

    test('getSleepScoreColor should return correct color', () {
      expect(getSleepScoreColor(90), 'green');
      expect(getSleepScoreColor(70), 'orange');
      expect(getSleepScoreColor(50), 'red');
    });
  });

  group('Helpers - Volume', () {
    test('volumeToPercent should convert correctly', () {
      expect(volumeToPercent(30), 30);
      expect(volumeToPercent(0), 0);
      expect(volumeToPercent(100), 100);
    });

    test('percentToVolume should convert correctly', () {
      expect(percentToVolume(30), 30);
      expect(percentToVolume(0), 0);
      expect(percentToVolume(100), 100);
    });
  });

  group('Helpers - Color Temperature', () {
    test('colorTempToDescription should return correct description', () {
      expect(colorTempToDescription(2700), '暖光');
      expect(colorTempToDescription(4000), '自然光');
      expect(colorTempToDescription(6500), '冷光');
    });

    test('isValidColorTemp should validate correctly', () {
      expect(isValidColorTemp(2700), true);
      expect(isValidColorTemp(3200), true);
      expect(isValidColorTemp(6500), true);
      expect(isValidColorTemp(2000), false);
      expect(isValidColorTemp(7000), false);
    });
  });

  group('Helpers - Device Status', () {
    test('getStatusText should return correct text', () {
      expect(getStatusText('online'), '在线');
      expect(getStatusText('offline'), '离线');
      expect(getStatusText('sleep'), '休眠中');
      expect(getStatusText('maintenance'), '维护中');
    });

    test('getStatusColor should return correct color', () {
      expect(getStatusColor('online'), 'green');
      expect(getStatusColor('offline'), 'gray');
      expect(getStatusColor('sleep'), 'blue');
    });
  });
}