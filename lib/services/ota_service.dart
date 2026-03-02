import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// OTA 固件升级服务
/// 文档参考: 第 8 章 OTA 固件升级
class OtaService {
  static final OtaService _instance = OtaService._internal();
  factory OtaService() => _instance;

  OtaService._internal();

  final Dio _dio = Dio();

  final _progressController = StreamController<OtaProgress>.broadcast();

  Stream<OtaProgress> get progressStream => _progressController.stream;

  OtaProgress? _currentProgress;

  // ============ 版本检测 ============

  /// 检查最新固件版本
  Future<OtaVersionInfo?> checkLatestVersion(String deviceId) async {
    try {
      final response = await _dio.get(
        '/api/v1/devices/$deviceId/firmware/latest',
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        return OtaVersionInfo(
          latestVersion: data['latest_version'],
          changelog: data['changelog'] ?? '',
          isRequired: data['is_required'] ?? false,
          fileSize: data['file_size'] ?? 0,
          releaseDate: data['release_date'] != null
              ? DateTime.parse(data['release_date'])
              : null,
        );
      }
    } catch (e) {
      debugPrint('Check version error: $e');
    }
    return null;
  }

  // ============ 固件下载 ============

  /// 下载固件包
  Future<String?> downloadFirmware({
    required String deviceId,
    required String targetVersion,
    required String savePath,
    String transferMode = 'wifi', // wifi | bluetooth | cloud
  }) async {
    try {
      // 更新状态: 下载中
      _updateProgress(OtaStatus.downloading, 0);

      final response = await _dio.get(
        '/api/v1/devices/$deviceId/firmware/download',
        queryParameters: {
          'version': targetVersion,
          'mode': transferMode,
        },
        options: Options(
          responseType: ResponseType.bytes,
          followRedirects: true,
          receiveTimeout: const Duration(minutes: 10),
        ),
        onReceiveProgress: (received, total) {
          if (total > 0) {
            final progress = (received / total * 100).round();
            _updateProgress(OtaStatus.downloading, progress);
          }
        },
      );

      // 保存文件
      final file = File(savePath);
      await file.writeAsBytes(response.data);

      _updateProgress(OtaStatus.downloading, 100);
      return savePath;
    } catch (e) {
      debugPrint('Download firmware error: $e');
      _updateProgress(OtaStatus.failed, 0, errorMessage: '下载失败: $e');
      return null;
    }
  }

  // ============ 固件传输 ============

  /// 传输固件到设备
  Future<bool> transferFirmware({
    required String deviceId,
    required String firmwarePath,
    required String transferMode,
    void Function(int progress)? onProgress,
  }) async {
    try {
      _updateProgress(OtaStatus.transferring, 0);

      // 触发 OTA 升级
      await _dio.post(
        '/api/v1/devices/$deviceId/firmware/upgrade',
        data: {
          'target_version': firmwarePath,
          'transfer_mode': transferMode,
        },
      );

      // 轮询传输进度
      return await _pollProgress(deviceId, onProgress);
    } catch (e) {
      debugPrint('Transfer firmware error: $e');
      _updateProgress(OtaStatus.failed, 0, errorMessage: '传输失败: $e');
      return false;
    }
  }

  /// 轮询升级进度
  Future<bool> _pollProgress(
    String deviceId,
    void Function(int progress)? onProgress,
  ) async {
    const pollInterval = Duration(seconds: 3);
    const maxAttempts = 60; // 最多 3 分钟

    for (int i = 0; i < maxAttempts; i++) {
      await Future.delayed(pollInterval);

      try {
        final response = await _dio.get(
          '/api/v1/devices/$deviceId/firmware/progress',
        );

        final data = response.data['data'];
        final status = _parseStatus(data['status']);
        final progress = data['progress'] ?? 0;

        _updateProgress(status, progress);
        onProgress?.call(progress);

        if (status == OtaStatus.completed) {
          return true;
        }
        if (status == OtaStatus.failed) {
          return false;
        }
      } catch (e) {
        debugPrint('Poll progress error: $e');
      }
    }

    _updateProgress(OtaStatus.failed, 0, errorMessage: '升级超时');
    return false;
  }

  OtaStatus _parseStatus(String status) {
    switch (status) {
      case 'checking':
        return OtaStatus.checking;
      case 'downloading':
        return OtaStatus.downloading;
      case 'transferring':
        return OtaStatus.transferring;
      case 'installing':
        return OtaStatus.installing;
      case 'completed':
        return OtaStatus.completed;
      case 'failed':
        return OtaStatus.failed;
      default:
        return OtaStatus.checking;
    }
  }

  // ============ 完整升级流程 ============

  /// 执行完整 OTA 流程
  /// 1. 版本检测 → 2. 用户确认 → 3. 下载 → 4. 传输 → 5. 安装
  Future<OtaResult> executeUpgrade({
    required String deviceId,
    String? localFirmwarePath,
    bool isRequired = false,
  }) async {
    // 1. 版本检测
    _updateProgress(OtaStatus.checking, 0);

    final versionInfo = await checkLatestVersion(deviceId);
    if (versionInfo == null) {
      return OtaResult(false, '无法检查版本，请检查网络');
    }

    // 检查是否需要升级
    // TODO: 对比当前版本

    // 2. 用户确认 (非强制升级)
    // 由 UI 层处理，这里只负责流程

    // 3. 下载固件
    if (localFirmwarePath == null) {
      final tempPath = '/tmp/firmware_${versionInfo.latestVersion}.bin';
      final downloadedPath = await downloadFirmware(
        deviceId: deviceId,
        targetVersion: versionInfo.latestVersion,
        savePath: tempPath,
      );
      if (downloadedPath == null) {
        return OtaResult(false, '固件下载失败');
      }
      localFirmwarePath = downloadedPath;
    }

    // 4. 传输到设备
    final transferSuccess = await transferFirmware(
      deviceId: deviceId,
      firmwarePath: localFirmwarePath,
      transferMode: 'wifi',
    );

    if (!transferSuccess) {
      return OtaResult(false, '固件传输失败');
    }

    // 5. 安装完成
    _updateProgress(OtaStatus.completed, 100);

    return OtaResult(true, '升级成功', version: versionInfo.latestVersion);
  }

  // ============ 电量检查 ============

  /// 检查设备电量是否足够 (需 > 20%)
  Future<bool> checkBatteryLevel(String deviceId) async {
    // TODO: 通过 BLE 或 API 获取电量
    // 电量 < 20% 时拒绝升级
    return true;
  }

  // ============ 进度更新 ============

  void _updateProgress(OtaStatus status, int progress, {String? errorMessage}) {
    _currentProgress = OtaProgress(
      status: status,
      progress: progress,
      errorMessage: errorMessage,
      timestamp: DateTime.now(),
    );
    _progressController.add(_currentProgress!);
  }

  OtaProgress? get currentProgress => _currentProgress;

  void dispose() {
    _progressController.close();
  }
}

// ============ 枚举和类定义 ============

enum OtaStatus {
  idle,
  checking,
  downloading,
  transferring,
  installing,
  completed,
  failed,
}

class OtaProgress {
  final OtaStatus status;
  final int progress;
  final String? errorMessage;
  final DateTime timestamp;

  OtaProgress({
    required this.status,
    required this.progress,
    this.errorMessage,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  String get statusText {
    switch (status) {
      case OtaStatus.idle:
        return '等待升级';
      case OtaStatus.checking:
        return '正在检查更新...';
      case OtaStatus.downloading:
        return '正在下载升级包 ($progress%)';
      case OtaStatus.transferring:
        return '正在传输到设备 ($progress%)';
      case OtaStatus.installing:
        return '正在安装，请勿断电';
      case OtaStatus.completed:
        return '升级成功！设备已重启';
      case OtaStatus.failed:
        return errorMessage ?? '升级失败';
    }
  }
}

class OtaVersionInfo {
  final String latestVersion;
  final String changelog;
  final bool isRequired;
  final int fileSize;
  final DateTime? releaseDate;

  OtaVersionInfo({
    required this.latestVersion,
    required this.changelog,
    required this.isRequired,
    required this.fileSize,
    this.releaseDate,
  });

  String get fileSizeText {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class OtaResult {
  final bool success;
  final String message;
  final String? version;

  OtaResult(this.success, this.message, {this.version});
}