import 'package:flutter_test/flutter_test.dart';
import 'package:sleep_cabin_app/core/models/user_model.dart';

void main() {
  group('User Model', () {
    test('fromJson should correctly parse JSON', () {
      final json = {
        'id': 'user_123',
        'name': 'Test User',
        'phone': '13800138000',
        'email': 'test@example.com',
        'avatar_url': 'https://example.com/avatar.png',
        'gender': 'male',
        'role': 'user',
        'created_at': '2024-01-01T00:00:00Z',
        'updated_at': '2024-01-15T00:00:00Z',
      };

      final user = User.fromJson(json);

      expect(user.id, 'user_123');
      expect(user.name, 'Test User');
      expect(user.phone, '13800138000');
      expect(user.email, 'test@example.com');
      expect(user.gender, 'male');
      expect(user.role, 'user');
    });

    test('toJson should correctly serialize to JSON', () {
      final user = User(
        id: 'user_123',
        name: 'Test User',
        phone: '13800138000',
        email: 'test@example.com',
        role: 'user',
        createdAt: DateTime.parse('2024-01-01T00:00:00Z'),
        updatedAt: DateTime.parse('2024-01-15T00:00:00Z'),
      );

      final json = user.toJson();

      expect(json['id'], 'user_123');
      expect(json['name'], 'Test User');
      expect(json['phone'], '13800138000');
    });

    test('copyWith should create a new instance with updated fields', () {
      final user = User(
        id: 'user_123',
        name: 'Original Name',
        phone: '13800138000',
        role: 'user',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final updatedUser = user.copyWith(name: 'New Name');

      expect(updatedUser.name, 'New Name');
      expect(updatedUser.id, 'user_123');
      expect(updatedUser.phone, '13800138000');
    });

    test('fromJson should handle null values', () {
      final json = {
        'id': 'user_123',
        'name': 'Test User',
        'phone': '13800138000',
        'role': 'user',
      };

      final user = User.fromJson(json);

      expect(user.email, isNull);
      expect(user.avatarUrl, isNull);
      expect(user.gender, isNull);
    });
  });

  group('AuthResponse', () {
    test('fromJson should correctly parse auth response', () {
      final json = {
        'token': 'abc123',
        'refresh_token': 'refresh123',
        'expires_in': 7200,
        'user': {
          'id': 'user_123',
          'name': 'Test User',
          'phone': '13800138000',
          'role': 'user',
          'created_at': '2024-01-01T00:00:00Z',
          'updated_at': '2024-01-01T00:00:00Z',
        },
      };

      final authResponse = AuthResponse.fromJson(json);

      expect(authResponse.token, 'abc123');
      expect(authResponse.refreshToken, 'refresh123');
      expect(authResponse.expiresIn, 7200);
      expect(authResponse.user.id, 'user_123');
    });
  });

  group('RefreshTokenResponse', () {
    test('fromJson should correctly parse refresh token response', () {
      final json = {
        'token': 'new_token',
        'expires_in': 7200,
      };

      final refreshResponse = RefreshTokenResponse.fromJson(json);

      expect(refreshResponse.token, 'new_token');
      expect(refreshResponse.expiresIn, 7200);
    });

    test('fromJson should use default values for missing fields', () {
      final json = <String, dynamic>{};

      final refreshResponse = RefreshTokenResponse.fromJson(json);

      expect(refreshResponse.token, '');
      expect(refreshResponse.expiresIn, 7200);
    });
  });
}