/// API 错误码定义
class ApiErrorCodes {
  ApiErrorCodes._();

  // 通用成功
  static const int success = 200;

  // 客户端错误 4xxx
  static const int invalidRequest = 4000;
  static const int unauthorized = 4010;
  static const int forbidden = 4030;
  static const int notFound = 4040;
  static const int dataConflict = 4090;
  static const int rateLimitExceeded = 4290;

  // 服务端错误 5xxx
  static const int serverError = 5000;
  static const int serviceUnavailable = 5030;

  // 自定义错误码
  static const int bleConnectFailed = 5001;
  static const int wifiConnectTimeout = 5002;
  static const int deviceOffline = 5003;
  static const int commandSendFailed = 5004;
  static const int dataSyncFailed = 5005;
  static const int otaUpgradeFailed = 5006;
  static const int loginFailed = 5007;
  static const int insufficientPermissions = 5008;
}

/// BLE 错误码
class BleErrorCodes {
  BleErrorCodes._();

  static const String connectFailed = 'E001';
  static const String wifiTimeout = 'E002';
  static const String deviceOffline = 'E003';
  static const String commandSendFailed = 'E004';
  static const String dataSyncFailed = 'E005';
  static const String otaFailed = 'E006';
  static const String loginFailed = 'E007';
  static const String permissionDenied = 'E008';
}

/// OTA 升级状态
class OtaStatus {
  OtaStatus._();

  static const String checking = 'checking';
  static const String downloading = 'downloading';
  static const String transferring = 'transferring';
  static const String installing = 'installing';
  static const String completed = 'completed';
  static const String failed = 'failed';
}

/// 用户角色
class UserRole {
  UserRole._();

  static const String user = 'user';
  static const String doctor = 'doctor';
  static const String nurse = 'nurse';
  static const String admin = 'admin';
}

/// 设备连接类型
class ConnectionType {
  ConnectionType._();

  static const String bluetooth = 'bluetooth';
  static const String wifi = 'wifi';
  static const String fiber = 'fiber';
  static const String mqtt = 'mqtt';
}

/// 设备类型
class DeviceType {
  DeviceType._();

  static const String home = 'home';
  static const String hospital = 'hospital';
}

/// 睡眠阶段
class SleepStage {
  SleepStage._();

  static const String awake = 'awake';
  static const String light = 'light';
  static const String deep = 'deep';
  static const String rem = 'rem';
}

/// 分数等级
class ScoreLevel {
  ScoreLevel._();

  static const String excellent = 'excellent';
  static const String good = 'good';
  static const String fair = 'fair';
  static const String poor = 'poor';
}

/// 同步状态
class SyncStatus {
  SyncStatus._();

  static const String pending = 'pending';
  static const String synced = 'synced';
  static const String conflict = 'conflict';
}