import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter/foundation.dart';

/// 离线缓存与数据同步服务
/// 文档参考: 第 9 章 数据同步与离线策略
class OfflineService {
  static final OfflineService _instance = OfflineService._internal();
  factory OfflineService() => _instance;

  OfflineService._internal();

  final Connectivity _connectivity = Connectivity();
  final _networkController = StreamController<bool>.broadcast();
  final _syncController = StreamController<SyncStatus>.broadcast();

  Stream<bool> get networkStream => _networkController.stream;
  Stream<SyncStatus> get syncStream => _syncController.stream;

  bool _isOnline = true;
  List<ConnectivityResult> _connectionStatus = [];

  bool get isOnline => _isOnline;

  // Hive boxes
  late Box _deviceBox;
  late Box _preferenceBox;
  late Box _sleepDataBox;
  late Box _reportBox;
  late Box _trackBox;

  // 待同步队列
  final List<SyncTask> _pendingTasks = [];

  // ============ 初始化 ============

  Future<void> init() async {
    await Hive.initFlutter();

    // 打开各类型数据的存储桶
    _deviceBox = await Hive.openBox('devices');        // 设备配置 (100KB/设备)
    _preferenceBox = await Hive.openBox('preferences'); // 用户偏好 (50KB)
    _sleepDataBox = await Hive.openBox('sleep_data');   // 睡眠数据 (7天, 50MB)
    _reportBox = await Hive.openBox('reports');         // 睡眠报告 (30天, 100MB)
    _trackBox = await Hive.openBox('tracks');           // 音轨列表 (7天, 1MB)

    // 监听网络状态
    _connectivity.onConnectivityChanged.listen(_handleConnectivityChange);

    // 获取初始网络状态
    _connectionStatus = await _connectivity.checkConnectivity();
    _updateNetworkStatus();
  }

  void _handleConnectivityChange(List<ConnectivityResult> result) {
    _connectionStatus = result;
    _updateNetworkStatus();

    if (_isOnline) {
      // 网络恢复：执行同步
      _flushPendingData();
      _pullRemoteUpdates();
    }
  }

  void _updateNetworkStatus() {
    _isOnline = !_connectionStatus.contains(ConnectivityResult.none) &&
        _connectionStatus.isNotEmpty;

    _networkController.add(_isOnline);

    if (_isOnline) {
      debugPrint('Network: Online');
    } else {
      debugPrint('Network: Offline');
    }
  }

  // ============ 本地缓存策略 (9.5) ============

  /// 缓存设备配置 (永久, 100KB/设备)
  Future<void> cacheDeviceConfig(String deviceId, Map<String, dynamic> data) async {
    await _deviceBox.put(deviceId, {
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
      'version': 1,
    });
  }

  /// 获取缓存的设备配置
  Map<String, dynamic>? getCachedDeviceConfig(String deviceId) {
    final cached = _deviceBox.get(deviceId);
    if (cached == null) return null;
    return Map<String, dynamic>.from(cached['data']);
  }

  /// 缓存用户偏好 (永久, 50KB)
  Future<void> cacheUserPreferences(Map<String, dynamic> preferences) async {
    await _preferenceBox.put('user_prefs', {
      'data': preferences,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  /// 获取缓存的用户偏好
  Map<String, dynamic>? getCachedUserPreferences() {
    final cached = _preferenceBox.get('user_prefs');
    if (cached == null) return null;
    return Map<String, dynamic>.from(cached['data']);
  }

  /// 缓存睡眠数据 (7天, 50MB)
  Future<void> cacheSleepData(String sessionId, Map<String, dynamic> data) async {
    // 清理过期数据
    await _cleanExpiredSleepData();

    await _sleepDataBox.put(sessionId, {
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  /// 获取缓存的睡眠数据
  List<Map<String, dynamic>> getCachedSleepData({int? days}) {
    final now = DateTime.now();
    final cutoff = days != null
        ? now.subtract(Duration(days: days))
        : now.subtract(const Duration(days: 7));

    final List<Map<String, dynamic>> result = [];

    for (var key in _sleepDataBox.keys) {
      final cached = _sleepDataBox.get(key);
      if (cached != null) {
        final timestamp = DateTime.parse(cached['timestamp']);
        if (timestamp.isAfter(cutoff)) {
          result.add(Map<String, dynamic>.from(cached['data']));
        }
      }
    }

    return result;
  }

  /// 清理过期的睡眠数据
  Future<void> _cleanExpiredSleepData() async {
    final cutoff = DateTime.now().subtract(const Duration(days: 7));

    final keysToDelete = <dynamic>[];
    for (var key in _sleepDataBox.keys) {
      final cached = _sleepDataBox.get(key);
      if (cached != null) {
        final timestamp = DateTime.parse(cached['timestamp']);
        if (timestamp.isBefore(cutoff)) {
          keysToDelete.add(key);
        }
      }
    }

    await _sleepDataBox.deleteAll(keysToDelete);
  }

  /// 缓存睡眠报告 (30天, 100MB)
  Future<void> cacheSleepReport(String reportId, Map<String, dynamic> data) async {
    // 清理 30 天前的报告
    await _cleanExpiredReports();

    await _reportBox.put(reportId, {
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  /// 获取缓存的报告
  Map<String, dynamic>? getCachedReport(String reportId) {
    final cached = _reportBox.get(reportId);
    if (cached == null) return null;
    return Map<String, dynamic>.from(cached['data']);
  }

  /// 清理过期报告
  Future<void> _cleanExpiredReports() async {
    final cutoff = DateTime.now().subtract(const Duration(days: 30));

    final keysToDelete = <dynamic>[];
    for (var key in _reportBox.keys) {
      final cached = _reportBox.get(key);
      if (cached != null) {
        final timestamp = DateTime.parse(cached['timestamp']);
        if (timestamp.isBefore(cutoff)) {
          keysToDelete.add(key);
        }
      }
    }

    await _reportBox.deleteAll(keysToDelete);
  }

  /// 缓存音轨列表 (7天, 1MB)
  Future<void> cacheTrackList(List<Map<String, dynamic>> tracks) async {
    await _trackBox.put('track_list', {
      'data': tracks,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  /// 获取缓存的音轨列表
  List<Map<String, dynamic>> getCachedTrackList() {
    final cached = _trackBox.get('track_list');
    if (cached == null) return [];
    return List<Map<String, dynamic>>.from(cached['data']);
  }

  // ============ 数据同步策略 (9.1) ============

  /// 添加待同步任务
  Future<void> addSyncTask(SyncTask task) async {
    _pendingTasks.add(task);
    
    // 如果在线，立即同步
    if (_isOnline) {
      await _flushPendingData();
    }
  }

  /// 推送本地待同步数据 (网络恢复时)
  Future<void> _flushPendingData() async {
    if (_pendingTasks.isEmpty) return;

    _syncController.add(SyncStatus.syncing);

    final failedTasks = <SyncTask>[];

    for (var task in _pendingTasks) {
      try {
        final success = await _executeSyncTask(task);
        if (!success) {
          failedTasks.add(task);
        }
      } catch (e) {
        debugPrint('Sync task error: $e');
        failedTasks.add(task);
      }
    }

    // 更新待同步队列
    _pendingTasks.clear();
    _pendingTasks.addAll(failedTasks);

    _syncController.add(failedTasks.isEmpty ? SyncStatus.completed : SyncStatus.failed);
  }

  /// 执行单个同步任务
  Future<bool> _executeSyncTask(SyncTask task) async {
    switch (task.type) {
      case SyncType.userPreference:
        // TODO: 调用 API 同步用户偏好
        return true;
      case SyncType.deviceConfig:
        // TODO: 调用 API 同步设备配置
        return true;
      case SyncType.sleepSession:
        // TODO: 调用 API 上传睡眠会话
        return true;
    }
  }

  /// 拉取服务端更新
  Future<void> _pullRemoteUpdates() async {
    _syncController.add(SyncStatus.pulling);

    // TODO: 并行拉取各类型数据更新
    // 1. 用户偏好
    // 2. 设备配置
    // 3. 设备列表

    _syncController.add(SyncStatus.completed);
  }

  // ============ 冲突解决 (9.3) ============

  /// 解决数据冲突
  /// 规则：用户偏好 - 时间戳大的版本生效
  ///       设备配置 - 弹窗让用户选择
  ///       睡眠数据 - 以服务端为准
  Future<ConflictResolution> resolveConflict({
    required String type,
    required Map<String, dynamic> local,
    required Map<String, dynamic> remote,
  }) async {
    switch (type) {
      case 'user_preference':
        // 时间戳大的生效
        final localTime = DateTime.parse(local['updated_at'] ?? '1970');
        final remoteTime = DateTime.parse(remote['updated_at'] ?? '1970');
        return ConflictResolution(
          resolved: true,
          data: remoteTime.isAfter(localTime) ? remote : local,
        );

      case 'device_config':
        // 弹窗让用户选择 (返回 null 表示需要 UI 介入)
        return ConflictResolution(
          resolved: false,
          needsUserChoice: true,
          localData: local,
          remoteData: remote,
        );

      case 'sleep_data':
        // 以服务端为准
        return ConflictResolution(
          resolved: true,
          data: remote,
        );

      default:
        return ConflictResolution(resolved: true, data: remote);
    }
  }

  // ============ 离线功能矩阵 (9.4) ============

  /// 检查功能是否可用
  bool isFeatureAvailable(FeatureType feature, {bool hasCache = false}) {
    switch (feature) {
      case FeatureType.bleControl:
        return true; // BLE 不依赖网络
      case FeatureType.wifiCloudControl:
        return _isOnline;
      case FeatureType.vitalSignDisplay:
        return _isOnline || hasCache;
      case FeatureType.historyDataView:
        return _isOnline || hasCache;
      case FeatureType.sleepReportView:
        return _isOnline || hasCache;
      case FeatureType.generateReport:
        return _isOnline; // 需要云端计算
      case FeatureType.modifyPreference:
        return true; // 可离线修改，待同步
    }
  }

  // ============ 网络状态监听 ============

  /// 监听网络恢复
  StreamSubscription<bool> onNetworkRestored(void Function() callback) {
    return _networkController.stream
        .where((isOnline) => isOnline)
        .listen((_) => callback());
  }

  void dispose() {
    _networkController.close();
    _syncController.close();
  }
}

// ============ 枚举和类定义 ============

enum SyncType {
  userPreference,
  deviceConfig,
  sleepSession,
}

enum SyncStatus {
  idle,
  syncing,
  pulling,
  completed,
  failed,
}

class SyncTask {
  final SyncType type;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  SyncTask({
    required this.type,
    required this.data,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class ConflictResolution {
  final bool resolved;
  final bool needsUserChoice;
  final Map<String, dynamic>? data;
  final Map<String, dynamic>? localData;
  final Map<String, dynamic>? remoteData;

  ConflictResolution({
    required this.resolved,
    this.needsUserChoice = false,
    this.data,
    this.localData,
    this.remoteData,
  });
}

enum FeatureType {
  bleControl,
  wifiCloudControl,
  vitalSignDisplay,
  historyDataView,
  sleepReportView,
  generateReport,
  modifyPreference,
}