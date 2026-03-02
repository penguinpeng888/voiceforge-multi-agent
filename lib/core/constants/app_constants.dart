/// 应用常量定义
class AppConstants {
  AppConstants._();

  // ============ API 配置 ============
  static const String baseUrl = 'https://api.sleepcabin.com/api/v1';
  static const String devBaseUrl = 'https://dev-api.sleepcabin.com/api/v1';
  static const String stagingBaseUrl = 'https://staging-api.sleepcabin.com/api/v1';

  // ============ BLE 配置 ============
  static const String bleServiceUuid = '0000FFE0-0000-1000-8000-00805F9B34FB';
  static const String bleCharacteristicUuid = '0000FFE1-0000-1000-8000-00805F9B34FB';

  // ============ MQTT 配置 ============
  static const String mqttBroker = 'mqtt://localhost:1883';
  static const String mqttUsername = '';
  static const String mqttPassword = '';

  // ============ 缓存配置 ============
  static const int deviceConfigCacheSize = 100 * 1024; // 100KB/设备
  static const int userPreferencesCacheSize = 50 * 1024; // 50KB
  static const int realTimeDataCacheSize = 2 * 1024 * 1024; // 2MB
  static const int sleepDataCacheSize = 50 * 1024 * 1024; // 50MB
  static const int reportCacheSize = 100 * 1024 * 1024; // 100MB
  static const int trackListCacheSize = 1 * 1024; // 1MB

  // ============ 缓存期限 ============
  static const int deviceConfigCacheExpiry = 0; // 永久
  static const int userPreferencesCacheExpiry = 0; // 永久
  static const int realTimeDataCacheExpiry = 1; // 1小时
  static const int sleepDataCacheExpiry = 7; // 7天
  static const int reportCacheExpiry = 30; // 30天
  static const int trackListCacheExpiry = 7; // 7天

  // ============ 重试配置 ============
  static const int bleConnectMaxRetries = 5;
  static const int apiRequestMaxRetries = 3;
  static const int dataUploadMaxRetries = -1; // 无限重试
  static const int commandSendMaxRetries = 3;

  static const List<int> bleRetryDelays = [1, 2, 4, 8, 16]; // 秒
  static const List<int> apiRetryDelays = [1, 2, 4]; // 秒

  // ============ 超时配置 ============
  static const int connectionTimeout = 10000; // 10秒
  static const int receiveTimeout = 15000; // 15秒
  static const int sendTimeout = 10000; // 10秒
  static const int bleCommandTimeout = 5000; // 5秒

  // ============ 限流配置 ============
  static const int loginRateLimit = 10; // 10次/分钟/IP
  static const int deviceControlRateLimit = 60; // 60次/分钟/设备
  static const int dataQueryRateLimit = 120; // 120次/分钟/用户
  static const int otaRateLimit = 5; // 5次/天/设备

  // ============ Token 配置 ============
  static const int tokenExpiryMinutes = 120; // 2小时
  static const int refreshTokenExpiryDays = 30; // 30天
  static const int tokenRefreshAheadMinutes = 10; // 提前10分钟刷新

  // ============ 性能指标 ============
  static const int coldStartTargetMs = 3000; // 3秒
  static const int localCommandTargetMs = 1000; // 1秒
  static const int cloudCommandTargetMs = 2000; // 2秒
  static const int realTimeDataTargetMs = 500; // 500ms
  static const int dataLoadTargetMs = 2000; // 2秒
  static const int sleepDataSyncTargetMs = 30000; // 30秒

  // ============ 电量阈值 ============
  static const int minBatteryForOta = 20; // 20%

  // ============ 版本要求 ============
  static const String minAndroidVersion = '9.0'; // API 28
  static const String minIosVersion = '13.0';
  static const String minFlutterVersion = '3.16';

  // ============ 语音唤醒词 ============
  static const List<String> defaultWakeWords = ['小睡眠', '睡眠舱'];
  static const int maxCustomWakeWords = 3;

  // ============ 主题配置 ============
  static const int defaultMusicVolume = 30;
  static const int defaultMusicDuration = 30; // 分钟
  static const int defaultLightBrightness = 40;
  static const int defaultLightColorTemp = 3200; // K
  static const int defaultMassageIntensity = 5;
  static const int defaultScentConcentration = 50;

  // ============ 色温范围 ============
  static const int minColorTemp = 2700; // K
  static const int maxColorTemp = 6500; // K

  // ============ 音量范围 ============
  static const int minVolume = 0;
  static const int maxVolume = 100;

  // ============ 按摩强度范围 ============
  static const int minMassageIntensity = 1;
  static const int maxMassageIntensity = 10;

  // ============ 浓度范围 ============
  static const int minConcentration = 0;
  static const int maxConcentration = 100;
}