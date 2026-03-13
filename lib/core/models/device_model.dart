/// 设备模型
class Device {
  final String id;
  final String userId;
  final String name;
  final String type; // home / hospital
  final String connectionType; // bluetooth / wifi / fiber / mqtt
  final String? macAddress;
  final String? ipAddress;
  final String serialNumber;
  final String firmwareVersion;
  final String status; // online / offline / sleep / maintenance
  final String powerMode; // normal / sleep / deep_sleep / off
  final int? batteryLevel;
  final DateTime? lastActiveAt;
  final DeviceModules? modules;

  Device({
    required this.id,
    required this.userId,
    required this.name,
    required this.type,
    required this.connectionType,
    this.macAddress,
    this.ipAddress,
    required this.serialNumber,
    required this.firmwareVersion,
    required this.status,
    required this.powerMode,
    this.batteryLevel,
    this.lastActiveAt,
    this.modules,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'home',
      connectionType: json['connection_type'] ?? 'bluetooth',
      macAddress: json['mac_address'],
      ipAddress: json['ip_address'],
      serialNumber: json['serial_number'] ?? '',
      firmwareVersion: json['firmware_version'] ?? '1.0.0',
      status: json['status'] ?? 'offline',
      powerMode: json['power_mode'] ?? 'off',
      batteryLevel: json['battery_level'],
      lastActiveAt: json['last_active_at'] != null 
          ? DateTime.parse(json['last_active_at']) 
          : null,
      modules: json['modules'] != null 
          ? DeviceModules.fromJson(json['modules']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'type': type,
      'connection_type': connectionType,
      'mac_address': macAddress,
      'ip_address': ipAddress,
      'serial_number': serialNumber,
      'firmware_version': firmwareVersion,
      'status': status,
      'power_mode': powerMode,
      'battery_level': batteryLevel,
      'last_active_at': lastActiveAt?.toIso8601String(),
      'modules': modules?.toJson(),
    };
  }

  Device copyWith({
    String? id,
    String? userId,
    String? name,
    String? type,
    String? connectionType,
    String? macAddress,
    String? ipAddress,
    String? serialNumber,
    String? firmwareVersion,
    String? status,
    String? powerMode,
    int? batteryLevel,
    DateTime? lastActiveAt,
    DeviceModules? modules,
  }) {
    return Device(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      type: type ?? this.type,
      connectionType: connectionType ?? this.connectionType,
      macAddress: macAddress ?? this.macAddress,
      ipAddress: ipAddress ?? this.ipAddress,
      serialNumber: serialNumber ?? this.serialNumber,
      firmwareVersion: firmwareVersion ?? this.firmwareVersion,
      status: status ?? this.status,
      powerMode: powerMode ?? this.powerMode,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      modules: modules ?? this.modules,
    );
  }

  bool get isOnline => status == 'online';
  bool get isOffline => status == 'offline';
}

/// 设备模块状态
class DeviceModules {
  final MusicModule? music;
  final LightModule? light;
  final MassageModule? massage;
  final ScentModule? scent;

  DeviceModules({
    this.music,
    this.light,
    this.massage,
    this.scent,
  });

  factory DeviceModules.fromJson(Map<String, dynamic> json) {
    return DeviceModules(
      music: json['music'] != null ? MusicModule.fromJson(json['music']) : null,
      light: json['light'] != null ? LightModule.fromJson(json['light']) : null,
      massage: json['massage'] != null ? MassageModule.fromJson(json['massage']) : null,
      scent: json['scent'] != null ? ScentModule.fromJson(json['scent']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'music': music?.toJson(),
      'light': light?.toJson(),
      'massage': massage?.toJson(),
      'scent': scent?.toJson(),
    };
  }
}

/// 音乐模块
class MusicModule {
  final bool playing;
  final bool paused;
  final bool stopped;
  final int volume;
  final String? trackId;
  final String? trackName;
  final int? durationSeconds;

  MusicModule({
    this.playing = false,
    this.paused = false,
    this.stopped = true,
    this.volume = 30,
    this.trackId,
    this.trackName,
    this.durationSeconds,
  });

  factory MusicModule.fromJson(Map<String, dynamic> json) {
    return MusicModule(
      playing: json['playing'] ?? false,
      paused: json['paused'] ?? false,
      stopped: json['stopped'] ?? true,
      volume: json['volume'] ?? 30,
      trackId: json['track_id'],
      trackName: json['track_name'],
      durationSeconds: json['duration_seconds'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'playing': playing,
      'paused': paused,
      'stopped': stopped,
      'volume': volume,
      'track_id': trackId,
      'track_name': trackName,
      'duration_seconds': durationSeconds,
    };
  }
}

/// 灯光模块
class LightModule {
  final bool power;
  final int brightness;
  final int colorTemp;
  final String? mode;

  LightModule({
    this.power = false,
    this.brightness = 40,
    this.colorTemp = 3200,
    this.mode,
  });

  factory LightModule.fromJson(Map<String, dynamic> json) {
    return LightModule(
      power: json['power'] ?? false,
      brightness: json['brightness'] ?? 40,
      colorTemp: json['color_temp'] ?? 3200,
      mode: json['mode'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'power': power,
      'brightness': brightness,
      'color_temp': colorTemp,
      'mode': mode,
    };
  }
}

/// 按摩模块
class MassageModule {
  final bool power;
  final bool active;
  final bool idle;
  final int intensity;
  final String? mode;
  final String? position;

  MassageModule({
    this.power = false,
    this.active = false,
    this.idle = true,
    this.intensity = 5,
    this.mode,
    this.position,
  });

  factory MassageModule.fromJson(Map<String, dynamic> json) {
    return MassageModule(
      power: json['power'] ?? false,
      active: json['active'] ?? false,
      idle: json['idle'] ?? true,
      intensity: json['intensity'] ?? 5,
      mode: json['mode'],
      position: json['position'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'power': power,
      'active': active,
      'idle': idle,
      'intensity': intensity,
      'mode': mode,
      'position': position,
    };
  }
}

/// 气味模块
class ScentModule {
  final bool power;
  final bool active;
  final bool idle;
  final int concentration;
  final String? scentId;

  ScentModule({
    this.power = false,
    this.active = false,
    this.idle = true,
    this.concentration = 50,
    this.scentId,
  });

  factory ScentModule.fromJson(Map<String, dynamic> json) {
    return ScentModule(
      power: json['power'] ?? false,
      active: json['active'] ?? false,
      idle: json['idle'] ?? true,
      concentration: json['concentration'] ?? 50,
      scentId: json['scent_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'power': power,
      'active': active,
      'idle': idle,
      'concentration': concentration,
      'scent_id': scentId,
    };
  }
}

/// 设备状态响应
class DeviceStatusResponse {
  final String deviceId;
  final String status;
  final String powerMode;
  final int? sleepTimer;
  final DateTime? estimatedSleepTime;

  DeviceStatusResponse({
    required this.deviceId,
    required this.status,
    required this.powerMode,
    this.sleepTimer,
    this.estimatedSleepTime,
  });

  factory DeviceStatusResponse.fromJson(Map<String, dynamic> json) {
    return DeviceStatusResponse(
      deviceId: json['device_id'] ?? '',
      status: json['status'] ?? 'offline',
      powerMode: json['power_mode'] ?? 'off',
      sleepTimer: json['sleep_timer'],
      estimatedSleepTime: json['estimated_sleep_time'] != null 
          ? DateTime.parse(json['estimated_sleep_time']) 
          : null,
    );
  }
}