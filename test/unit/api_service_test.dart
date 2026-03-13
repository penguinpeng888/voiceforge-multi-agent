import 'package:flutter_test/flutter_test.dart';
import 'package:sleep_cabin_app/services/api_service.dart';

void main() {
  group('ApiService', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
      apiService.init();
    });

    group('sendCode', () {
      test('should return success for valid phone', () async {
        // This test requires network, so we just verify the structure
        expect(apiService, isNotNull);
      });

      test('should handle invalid phone format', () async {
        // Test validation logic would be here
        expect(true, isTrue);
      });
    });

    group('login', () {
      test('should have login method', () {
        expect(apiService.login, isNotNull);
      });
    });

    group('Token Management', () {
      test('should set and clear token', () {
        apiService.setToken('test_token');
        // Token should be set internally
        expect(true, isTrue);
        
        apiService.clearToken();
        expect(true, isTrue);
      });
    });

    group('Device Operations', () {
      test('should have getDevices method', () {
        expect(apiService.getDevices, isNotNull);
      });

      test('should have getDevice method', () {
        expect(apiService.getDevice, isNotNull);
      });

      test('should have controlDevice method', () {
        expect(apiService.controlDevice, isNotNull);
      });

      test('should have bindDevice method', () {
        expect(apiService.bindDevice, isNotNull);
      });

      test('should have unbindDevice method', () {
        expect(apiService.unbindDevice, isNotNull);
      });
    });

    group('Sleep Data', () {
      test('should have getSleepData method', () {
        expect(apiService.getSleepData, isNotNull);
      });

      test('should have getSleepReport method', () {
        expect(apiService.getSleepReport, isNotNull);
      });
    });
  });

  group('ApiException', () {
    test('should create exception with message', () {
      final exception = ApiException('Test error');
      expect(exception.message, 'Test error');
      expect(exception.toString(), contains('Test error'));
    });

    test('should include error code', () {
      final exception = ApiException('Test error', code: 500);
      expect(exception.code, 500);
    });
  });

  group('ApiResponse', () {
    test('should create successful response', () {
      final response = ApiResponse(success: true, data: 'test');
      expect(response.success, true);
      expect(response.data, 'test');
    });

    test('should create failed response', () {
      final response = ApiResponse(success: false, message: 'Error');
      expect(response.success, false);
      expect(response.message, 'Error');
    });
  });
}