import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import '../core/constants/ble_constants.dart';

/// 蓝牙服务 - 完整实现 BLE 协议
class BleService {
  static final BleService _instance = BleService._internal();
  factory BleService() => _instance;

  BleService._internal();

  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _txCharacteristic;
  BluetoothCharacteristic? _rxCharacteristic;

  final _stateController = StreamController<BleState>.broadcast();
  final _dataController = StreamController<BleData>.broadcast();

  // 重连配置
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  Timer? _reconnectTimer;

  Stream<BleState> get stateStream => _stateController.stream;
  Stream<BleData> get dataStream => _dataController.stream;
  bool get isConnected => _connectedDevice != null;

  // ============ 扫描设备 ============

  /// 扫描蓝牙设备
  Future<List<BluetoothDevice>> scanDevices({int timeout = 10}) async {
    _stateController.add(BleState.scanning);

    if (await FlutterBluePlus.isSupported == false) {
      _stateController.add(BleState.unsupported);
      return [];
    }

    // 检查蓝牙权限
    if (await FlutterBluePlus.adapterState.first != BluetoothAdapterState.on) {
      _stateController.add(BleState.bluetoothOff);
      return [];
    }

    await FlutterBluePlus.startScan(timeout: Duration(seconds: timeout));

    final devices = await FlutterBluePlus.scanResults.first;
    _stateController.add(BleState.idle);

    return devices.map((d) => d.device).toList();
  }

  /// 停止扫描
  Future<void> stopScan() async {
    await FlutterBluePlus.stopScan();
    _stateController.add(BleState.idle);
  }

  // ============ 连接管理 ============

  /// 连接到设备
  Future<bool> connect(BluetoothDevice device) async {
    try {
      _stateController.add(BleState.connecting);

      await device.connect(timeout: const Duration(seconds: 10));
      _connectedDevice = device;
      _reconnectAttempts = 0;

      // 发现服务并查找特征
      final services = await device.discoverServices();
      for (var service in services) {
        // 检查是否为目标服务 UUID: 0000FFE0-0000-1000-8000-00805F9B34FB
        if (service.uuid.str.toUpperCase().contains('FFE0')) {
          for (var char in service.characteristics) {
            // 写入特征: 0000FFE1-0000-1000-8000-00805F9B34FB
            if (char.uuid.str.toUpperCase().contains('FFE1')) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                _txCharacteristic = char;
              }
              // 通知特征
              if (char.properties.notify) {
                _rxCharacteristic = char;
                await char.setNotifyValue(true);
                char.lastValueStream.listen(_handleReceiveData);
              }
            }
          }
        }
      }

      _stateController.add(BleState.connected);
      return true;
    } catch (e) {
      _stateController.add(BleState.error);
      return false;
    }
  }

  /// 断开连接
  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    await _connectedDevice?.disconnect();
    _connectedDevice = null;
    _txCharacteristic = null;
    _rxCharacteristic = null;
    _stateController.add(BleState.disconnected);
  }

  /// 指数退避重连
  Future<void> connectWithRetry(BluetoothDevice device) async {
    while (_reconnectAttempts < _maxReconnectAttempts) {
      final success = await connect(device);
      if (success) return;

      _reconnectAttempts++;
      final waitSeconds = _calculateBackoff(_reconnectAttempts);
      _stateController.add(BleState.reconnecting);

      await Future.delayed(Duration(seconds: waitSeconds));
    }

    _stateController.add(BleState.error);
  }

  int _calculateBackoff(int attempt) {
    // 1, 2, 4, 8, 16 秒
    return 1 << (attempt - 1);
  }

  // ============ 数据发送 - 协议帧格式 ============

  /// 发送数据帧 (按文档格式: 0xAA55 + 长度 + 命令 + 数据 + CRC8)
  Future<BleSendResult> sendFrame({
    required int command,
    Uint8List? data,
  }) async {
    if (_txCharacteristic == null) {
      return BleSendResult(false, 'Not connected');
    }

    try {
      // 构建帧
      final payloadLength = data?.length ?? 0;
      final frame = Uint8List(4 + payloadLength);

      // 帧头: 0xAA55
      frame[0] = 0xAA;
      frame[1] = 0x55;

      // 长度
      frame[2] = payloadLength + 1; // 命令 + 数据

      // 命令码
      frame[3] = command;

      // 数据载荷
      if (data != null && data.isNotEmpty) {
        frame.setRange(4, 4 + data.length, data);
      }

      // CRC8 校验 (多项式 0x07, 初值 0x00)
      frame[frame.length - 1] = _calculateCrc8(frame.sublist(0, frame.length - 1));

      await _txCharacteristic!.write(frame, withoutResponse: false);
      return BleSendResult(true, 'Success');
    } catch (e) {
      return BleSendResult(false, e.toString());
    }
  }

  /// CRC8 校验算法 (多项式 0x07)
  int _calculateCrc8(Uint8List data) {
    int crc = 0x00;
    for (var byte in data) {
      crc ^= byte;
      for (int i = 0; i < 8; i++) {
        if ((crc & 0x80) != 0) {
          crc = (crc << 1) ^ 0x07;
        } else {
          crc <<= 1;
        }
        crc &= 0xFF;
      }
    }
    return crc;
  }

  // ============ 设备控制命令 ============

  /// 心跳检测 (0x01)
  Future<BleSendResult> heartbeat() async {
    return sendFrame(command: 0x01);
  }

  /// 电源控制 (0x02)
  /// mode: 0=关机, 1=正常, 2=休眠, 3=深度休眠
  Future<BleSendResult> setPowerMode(int mode) async {
    return sendFrame(command: 0x02, data: Uint8List.fromList([mode]));
  }

  /// 音乐控制 (0x10)
  /// action: 播放/暂停/停止, volume: 0-100, trackId: 音轨ID
  Future<BleSendResult> controlMusic({
    required int action,
    int volume = 30,
    String? trackId,
    int mode = 0,
    int duration = 0,
  }) async {
    final data = Uint8List(8);
    data[0] = action;       // 0=停止, 1=播放, 2=暂停
    data[1] = volume;       // 音量
    data[2] = mode;         // 0=single, 1=loop, 2=random
    // trackId 占用 3-6 字节
    // duration 占用 7-8 字节
    return sendFrame(command: 0x10, data: data);
  }

  /// 灯光控制 (0x11)
  Future<BleSendResult> controlLight({
    required bool power,
    int brightness = 40,
    int colorTemp = 3200,
    int mode = 0,
  }) async {
    final data = Uint8List(8);
    data[0] = power ? 1 : 0;
    data[1] = brightness;
    // RGB 占用 2-4 字节
    data[5] = colorTemp >> 8;    // 色温高字节
    data[6] = colorTemp & 0xFF;  // 色温低字节
    data[7] = mode;              // 模式
    return sendFrame(command: 0x11, data: data);
  }

  /// 按摩控制 (0x12)
  Future<BleSendResult> controlMassage({
    required bool power,
    int intensity = 5,
    int mode = 0,
    int position = 0x3F, // 默认全部位置
  }) async {
    final data = Uint8List(4);
    data[0] = power ? 1 : 0;
    data[1] = intensity;
    data[2] = mode;
    data[3] = position;
    return sendFrame(command: 0x12, data: data);
  }

  /// 气味控制 (0x13)
  Future<BleSendResult> controlScent({
    required bool power,
    int concentration = 50,
    int scentId = 0,
  }) async {
    final data = Uint8List(3);
    data[0] = power ? 1 : 0;
    data[1] = concentration;
    data[2] = scentId;
    return sendFrame(command: 0x13, data: data);
  }

  /// 查询体征数据 (0x20)
  Future<BleSendResult> queryVitalSigns() async {
    return sendFrame(command: 0x20);
  }

  /// 查询全状态 (0x21)
  Future<BleSendResult> queryFullStatus() async {
    return sendFrame(command: 0x21);
  }

  // ============ 数据接收处理 ============

  void _handleReceiveData(List<int> data) {
    if (data.length < 4) return;

    // 解析响应帧
    // 响应格式: 0x55AA + 长度 + 响应码 + 状态 + 数据 + CRC
    if (data[0] == 0x55 && data[1] == 0xAA) {
      final responseCode = data[2];
      final status = data[3];
      final payload = data.length > 4 ? data.sublist(4, data.length - 1) : <int>[];

      _dataController.add(BleData(
        bytes: data,
        responseCode: responseCode,
        status: status,
        payload: payload,
        timestamp: DateTime.now(),
      ));
    }
  }

  // ============ 错误码映射 ============

  static String getErrorMessage(int responseCode, int status) {
    switch (responseCode) {
      case 0x81: // 心跳响应
        return status == 0x01 ? '正常' : '异常';
      case 0x82: // 电源控制响应
        return _getPowerStatusMessage(status);
      case 0x90: // 音乐控制响应
        return _getMusicStatusMessage(status);
      case 0x91: // 灯光控制响应
        return _getLightStatusMessage(status);
      case 0x92: // 按摩控制响应
        return _getMassageStatusMessage(status);
      case 0x93: // 气味控制响应
        return _getScentStatusMessage(status);
      case 0xA0: // 体征数据
        return '体征数据已获取';
      case 0xA1: // 全状态
        return '全状态已获取';
      default:
        return '未知响应';
    }
  }

  static String _getPowerStatusMessage(int status) {
    switch (status) {
      case 0x01: return '成功';
      case 0x02: return '设备忙碌';
      case 0x03: return '参数错误';
      default: return '未知错误';
    }
  }

  static String _getMusicStatusMessage(int status) {
    switch (status) {
      case 0x01: return '播放成功';
      case 0x02: return '播放失败';
      case 0x03: return '无此曲目';
      default: return '未知错误';
    }
  }

  static String _getLightStatusMessage(int status) {
    switch (status) {
      case 0x01: return '灯光已开启';
      case 0x02: return '灯光已关闭';
      default: return '未知错误';
    }
  }

  static String _getMassageStatusMessage(int status) {
    switch (status) {
      case 0x01: return '按摩已启动';
      case 0x02: return '按摩已停止';
      default: return '未知错误';
    }
  }

  static String _getScentStatusMessage(int status) {
    switch (status) {
      case 0x01: return '香气已释放';
      case 0x02: return '香气已停止';
      default: return '未知错误';
    }
  }

  void dispose() {
    _reconnectTimer?.cancel();
    _stateController.close();
    _dataController.close();
  }
}

// ============ 枚举和类定义 ============

enum BleState {
  idle,
  scanning,
  connecting,
  connected,
  disconnected,
  reconnecting,
  bluetoothOff,
  unsupported,
  error,
}

class BleData {
  final List<int> bytes;
  final int? responseCode;
  final int? status;
  final List<int> payload;
  final DateTime timestamp;

  BleData({
    required this.bytes,
    this.responseCode,
    this.status,
    this.payload = const [],
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory BleData.fromBytes(List<int> bytes) => BleData(bytes: bytes);

  String get stringValue => String.fromCharCodes(bytes);

  String get errorMessage {
    if (responseCode == null || status == null) return '';
    return BleService.getErrorMessage(responseCode!, status!);
  }
}

class BleSendResult {
  final bool success;
  final String message;

  BleSendResult(this.success, this.message);
}