# 睡眠舱数据库设计文档

> 文档版本: 1.4.0  
> 更新日期: 2024-03-01

## 目录

1. [概述](#1-概述)
2. [Hive 数据模型](#2-hive-数据模型)
3. [数据表结构](#3-数据表结构)
4. [缓存策略](#4-缓存策略)
5. [数据同步](#5-数据同步)

---

## 1. 概述

本应用使用 **Hive** 作为本地数据库，实现离线数据存储和缓存。

### 1.1 技术选型

| 特性 | Hive |
|------|------|
| 类型 | NoSQL 键值数据库 |
| 平台 | Flutter (Dart) |
| 特点 | 轻量、极速、无服务端 |

### 1.2 数据分类

| 类别 | 说明 | 存储方式 |
|------|------|----------|
| 用户数据 | 登录信息、设置 | 加密 Box |
| 设备数据 | 设备列表、状态 | 普通 Box |
| 缓存数据 | API 响应缓存 | 普通 Box |
| 睡眠数据 | 历史睡眠记录 | 普通 Box |

---

## 2. Hive 数据模型

### 2.1 Box 列表

| Box 名称 | 说明 | 加密 |
|----------|------|------|
| user_box | 用户信息 | 是 |
| device_box | 设备列表 | 否 |
| config_box | 应用配置 | 否 |
| cache_box | API 缓存 | 否 |
| sleep_box | 睡眠数据 | 否 |
| ota_box | OTA 状态 | 否 |

### 2.2 适配器注册

```dart
void initHive() {
  // 注册适配器
  Hive.registerAdapter(UserAdapter());
  Hive.registerAdapter(DeviceAdapter());
  Hive.registerAdapter(DeviceStatusAdapter());
  Hive.registerAdapter(SleepRecordAdapter());
}
```

---

## 3. 数据表结构

### 3.1 用户表 (user_box)

**TypeId: 0**

```dart
@HiveType(typeId: 0)
class User extends HiveObject {
  @HiveField(0) String id;
  @HiveField(1) String name;
  @HiveField(2) String phone;
  @HiveField(3) String? email;
  @HiveField(4) String? avatarUrl;
  @HiveField(5) DateTime? birthDate;
  @HiveField(6) String? gender;
  @HiveField(7) String role;
  @HiveField(8) DateTime createdAt;
  @HiveField(9) DateTime updatedAt;
}
```

**存储键**: `current_user`

---

### 3.2 设备表 (device_box)

**TypeId: 1**

```dart
@HiveType(typeId: 1)
class Device extends HiveObject {
  @HiveField(0) String id;
  @HiveField(1) String userId;
  @HiveField(2) String name;
  @HiveField(3) String type;           // home / hospital
  @HiveField(4) String connectionType; // bluetooth / wifi / mqtt
  @HiveField(5) String? macAddress;
  @HiveField(6) String? ipAddress;
  @HiveField(7) String serialNumber;
  @HiveField(8) String firmwareVersion;
  @HiveField(9) String status;         // online / offline / sleep
  @HiveField(10) String powerMode;
  @HiveField(11) int? batteryLevel;
  @HiveField(12) DateTime? lastActiveAt;
}
```

**存储键**: 设备 ID (`device_{id}`)

---

### 3.3 设备状态表 (device_box)

**TypeId: 2**

```dart
@HiveType(typeId: 2)
class DeviceStatus extends HiveObject {
  @HiveField(0) String deviceId;
  @HiveField(1) bool power;
  @HiveField(2) MusicStatus? music;
  @HiveField(3) LightStatus? light;
  @HiveField(4) MassageStatus? massage;
  @HiveField(5) ScentStatus? scent;
  @HiveField(6) VitalSigns? vitalSigns;
  @HiveField(7) DateTime updatedAt;
}
```

---

### 3.4 睡眠记录表 (sleep_box)

**TypeId: 3**

```dart
@HiveType(typeId: 3)
class SleepRecord extends HiveObject {
  @HiveField(0) String id;
  @HiveField(1) String deviceId;
  @HiveField(2) DateTime startTime;
  @HiveField(3) DateTime endTime;
  @HiveField(4) int totalDuration;      // 分钟
  @HiveField(5) int deepSleepDuration;
  @HiveField(6) int lightSleepDuration;
  @HiveField(7) int remDuration;
  @HiveField(8) int awakeDuration;
  @HiveField(9) int sleepScore;
  @HiveField(10) double sleepEfficiency;
  @HiveField(11) int heartRateAvg;
  @HiveField(12) int breathRateAvg;
  @HiveField(13) double bodyTempAvg;
  @HiveField(14) int turnOverCount;
  @HiveField(15) DateTime createdAt;
}
```

**索引键**: `{deviceId}_{date}` (如: `device_001_2024-03-01`)

---

### 3.5 配置表 (config_box)

**TypeId: 4**

```dart
@HiveType(typeId: 4)
class AppConfig extends HiveObject {
  @HiveField(0) String apiBaseUrl;
  @HiveField(1) String? mqttBroker;
  @HiveField(2) int dataSyncInterval;   // 分钟
  @HiveField(3) bool pushEnabled;
  @HiveField(4) String? wakeWord;
  @HiveField(5) int defaultVolume;
  @HiveField(6) int defaultBrightness;
  @HiveField(7) DateTime updatedAt;
}
```

**存储键**: `app_config`

---

### 3.6 Token 表 (user_box)

**TypeId: 5**

```dart
@HiveType(typeId: 5)
class TokenInfo extends HiveObject {
  @HiveField(0) String accessToken;
  @HiveField(1) String refreshToken;
  @HiveField(2) int expiresAt;         // 时间戳
  @HiveField(3) DateTime createdAt;
}
```

**存储键**: `token_info`

---

## 4. 缓存策略

### 4.1 缓存配置

| 数据类型 | 大小限制 | 过期时间 | 同步策略 |
|----------|----------|----------|----------|
| 设备配置 | 100KB | 永久 | 手动 |
| 用户配置 | 50KB | 永久 | 手动 |
| 实时数据 | 2MB | 1小时 | 自动 |
| 睡眠数据 | 50MB | 7天 | 手动 |
| 睡眠报告 | 100MB | 30天 | 手动 |
| 音轨列表 | 1MB | 7天 | 自动 |

### 4.2 缓存键命名

```
// API 缓存
cache_{api_path}_{hash(params)}

// 示例
cache_devices_list_
cache_devices_device_001_status_
cache_devices_device_001_sleep-data_2024-03-01_
```

---

## 5. 数据同步

### 5.1 同步策略

| 数据类型 | 同步时机 | 冲突处理 |
|----------|----------|----------|
| 用户信息 | 登录时 | 服务端优先 |
| 设备列表 | 每次打开首页 | 服务端优先 |
| 设备状态 | 每 30 秒 | 合并 |
| 睡眠数据 | 手动同步 | 服务端优先 |
| 配置信息 | 每次打开应用 | 服务端优先 |

### 5.2 离线支持

- **读操作**: 优先读缓存，无缓存时返回空
- **写操作**: 队列缓存，联网后自动同步
- **冲突检测**: 基于 `updatedAt` 字段比较

### 5.3 同步状态

```dart
enum SyncStatus {
  pending,   // 待同步
  syncing,   // 同步中
  synced,    // 已同步
  conflict,  // 冲突
  failed     // 失败
}
```

---

## 附录

### A. Hive 初始化代码

```dart
Future<void> initDatabase() async {
  await Hive.initFlutter();
  
  // 打开 Boxes
  await Hive.openBox<User>('user_box');
  await Hive.openBox<Device>('device_box');
  await Hive.openBox('config_box');
  await Hive.openBox('cache_box');
  await Hive.openBox<SleepRecord>('sleep_box');
  
  // 注册适配器
  Hive.registerAdapter(UserAdapter());
  Hive.registerAdapter(DeviceAdapter());
  Hive.registerAdapter(SleepRecordAdapter());
}
```

### B. 加密 Box

```dart
Future<void> openEncryptedBox() async {
  final encryptionKey = await Hive.generateSecureKey();
  await Hive.openBox<User>(
    'user_box',
    encryptionCipher: HiveAesCipher(encryptionKey),
  );
}
```

### C. 数据清理

```dart
Future<void> clearCache() async {
  final cacheBox = Hive.box('cache_box');
  await cacheBox.clear();
}

Future<void> clearOldSleepData(int days) async {
  final sleepBox = Hive.box<SleepRecord>('sleep_box');
  final cutoffDate = DateTime.now().subtract(Duration(days: days));
  
  final keysToDelete = sleepBox.keys.where((key) {
    final record = sleepBox.get(key);
    return record?.createdAt.isBefore(cutoffDate) ?? false;
  });
  
  await sleepBox.deleteAll(keysToDelete);
}
```