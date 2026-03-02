import 'package:flutter_test/flutter_test.dart';
import 'package:sleep_cabin_app/core/models/device_model.dart';

void main() {
  group('Device Model', () {
    test('fromJson should correctly parse device JSON', () {
      final json = {
        'id': 'device_001',
        'user_id': 'user_123',
        'name': '主卧睡眠舱',
        'type': 'home',
        'connection_type': 'bluetooth',
        'serial_number': 'SC202401010001',
        'firmware_version': '1.4.0',
        'status': 'online',
        'power_mode': 'normal',
        'battery_level': 85,
      };

      final device = Device.fromJson(json);

      expect(device.id, 'device_001');
      expect(device.name, '主卧睡眠舱');
      expect(device.type, 'home');
      expect(device.connectionType, 'bluetooth');
      expect(device.status, 'online');
      expect(device.batteryLevel, 85);
    });

    test('toJson should correctly serialize device', () {
      final device = Device(
        id: 'device_001',
        userId: 'user_123',
        name: '主卧睡眠舱',
        type: 'home',
        connectionType: 'bluetooth',
        serialNumber: 'SC202401010001',
        firmwareVersion: '1.4.0',
        status: 'online',
        powerMode: 'normal',
        batteryLevel: 85,
      );

      final json = device.toJson();

      expect(json['id'], 'device_001');
      expect(json['name'], '主卧睡眠舱');
      expect(json['status'], 'online');
    });

    test('isOnline should return correct status', () {
      final onlineDevice = Device(
        id: 'device_001',
        userId: 'user_123',
        name: '设备1',
        type: 'home',
        connectionType: 'bluetooth',
        serialNumber: 'SC001',
        firmwareVersion: '1.0.0',
        status: 'online',
        powerMode: 'normal',
      );

      final offlineDevice = Device(
        id: 'device_002',
        userId: 'user_123',
        name: '设备2',
        type: 'home',
        connectionType: 'bluetooth',
        serialNumber: 'SC002',
        firmwareVersion: '1.0.0',
        status: 'offline',
        powerMode: 'off',
      );

      expect(onlineDevice.isOnline, true);
      expect(onlineDevice.isOffline, false);
      expect(offlineDevice.isOnline, false);
      expect(offlineDevice.isOffline, true);
    });

    test('copyWith should create new instance with updated fields', () {
      final device = Device(
        id: 'device_001',
        userId: 'user_123',
        name: '原名称',
        type: 'home',
        connectionType: 'bluetooth',
        serialNumber: 'SC001',
        firmwareVersion: '1.0.0',
        status: 'online',
        powerMode: 'normal',
      );

      final updated = device.copyWith(name: '新名称', status: 'offline');

      expect(updated.name, '新名称');
      expect(updated.status, 'offline');
      expect(updated.id, 'device_001');
    });
  });

  group('MusicModule', () {
    test('fromJson should correctly parse music module', () {
      final json = {
        'playing': true,
        'paused': false,
        'stopped': false,
        'volume': 50,
        'track_id': 'track_001',
        'track_name': '轻音乐',
        'duration_seconds': 300,
      };

      final music = MusicModule.fromJson(json);

      expect(music.playing, true);
      expect(music.volume, 50);
      expect(music.trackId, 'track_001');
    });

    test('should have correct default values', () {
      final music = MusicModule();

      expect(music.playing, false);
      expect(music.volume, 30);
      expect(music.stopped, true);
    });
  });

  group('LightModule', () {
    test('fromJson should correctly parse light module', () {
      final json = {
        'power': true,
        'brightness': 60,
        'color_temp': 4000,
        'mode': 'sleep',
      };

      final light = LightModule.fromJson(json);

      expect(light.power, true);
      expect(light.brightness, 60);
      expect(light.colorTemp, 4000);
    });

    test('should have correct default values', () {
      final light = LightModule();

      expect(light.power, false);
      expect(light.brightness, 40);
      expect(light.colorTemp, 3200);
    });
  });

  group('MassageModule', () {
    test('fromJson should correctly parse massage module', () {
      final json = {
        'power': true,
        'active': true,
        'idle': false,
        'intensity': 7,
        'mode': 'relax',
        'position': '63',
      };

      final massage = MassageModule.fromJson(json);

      expect(massage.power, true);
      expect(massage.intensity, 7);
      expect(massage.mode, 'relax');
    });
  });

  group('ScentModule', () {
    test('fromJson should correctly parse scent module', () {
      final json = {
        'power': true,
        'active': true,
        'concentration': 70,
        'scent_id': '2',
      };

      final scent = ScentModule.fromJson(json);

      expect(scent.power, true);
      expect(scent.concentration, 70);
      expect(scent.scentId, '2');
    });
  });

  group('DeviceStatusResponse', () {
    test('fromJson should correctly parse', () {
      final json = {
        'device_id': 'device_001',
        'status': 'online',
        'power_mode': 'normal',
        'sleep_timer': 30,
      };

      final status = DeviceStatusResponse.fromJson(json);

      expect(status.deviceId, 'device_001');
      expect(status.status, 'online');
      expect(status.powerMode, 'normal');
      expect(status.sleepTimer, 30);
    });
  });
}