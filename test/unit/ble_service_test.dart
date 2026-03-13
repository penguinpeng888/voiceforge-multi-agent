import 'package:flutter_test/flutter_test.dart';
import 'package:sleep_cabin_app/services/ble_service.dart';

void main() {
  group('BleService', () {
    late BleService bleService;

    setUp(() {
      bleService = BleService();
    });

    test('should have correct default state', () {
      expect(bleService.isConnected, false);
    });

    test('should have state and data streams', () {
      expect(bleService.stateStream, isNotNull);
      expect(bleService.dataStream, isNotNull);
    });
  });

  group('BleSendResult', () {
    test('should create success result', () {
      final result = BleSendResult(true, 'Success');
      expect(result.success, true);
      expect(result.message, 'Success');
    });

    test('should create failure result', () {
      final result = BleSendResult(false, 'Failed');
      expect(result.success, false);
      expect(result.message, 'Failed');
    });
  });

  group('BleData', () {
    test('should create from bytes', () {
      final data = BleData(bytes: [0x55, 0xAA, 0x01, 0x00]);
      expect(data.bytes.length, 4);
    });

    test('should handle empty bytes', () {
      final data = BleData(bytes: []);
      expect(data.bytes.isEmpty, true);
    });
  });

  group('BleState enum', () {
    test('should have all expected states', () {
      expect(BleState.values.contains(BleState.idle), true);
      expect(BleState.values.contains(BleState.scanning), true);
      expect(BleState.values.contains(BleState.connecting), true);
      expect(BleState.values.contains(BleState.connected), true);
      expect(BleState.values.contains(BleState.disconnected), true);
    });
  });

  group('Error Message Mapping', () {
    test('should get error message for heartbeat response', () {
      final message = BleService.getErrorMessage(0x81, 0x01);
      expect(message, isNotEmpty);
    });

    test('should return unknown for invalid response code', () {
      final message = BleService.getErrorMessage(0xFF, 0x00);
      expect(message, '未知响应');
    });
  });
}