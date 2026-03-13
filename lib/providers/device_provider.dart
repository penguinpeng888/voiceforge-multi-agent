import 'package:flutter/foundation.dart';
import '../core/models/device_model.dart';
import '../services/api_service.dart';

/// 设备状态
enum DeviceLoadingState { idle, loading, success, error }

class DeviceProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Device> _devices = [];
  Device? _selectedDevice;
  DeviceLoadingState _state = DeviceLoadingState.idle;
  String? _errorMessage;

  // 搜索过滤
  String _searchQuery = '';

  List<Device> get devices => _searchQuery.isEmpty
      ? _devices
      : _devices.where((d) => d.name.contains(_searchQuery)).toList();
  Device? get selectedDevice => _selectedDevice;
  DeviceLoadingState get state => _state;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _state == DeviceLoadingState.loading;
  bool get hasError => _state == DeviceLoadingState.error;

  // ============ 设备列表 ============

  /// 加载设备列表
  Future<void> loadDevices() async {
    _state = DeviceLoadingState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _api.getDevices();

    if (result.success && result.data != null) {
      _devices = result.data!;
      _state = DeviceLoadingState.success;
    } else {
      _errorMessage = result.message ?? '加载设备失败';
      _state = DeviceLoadingState.error;
    }
    notifyListeners();
  }

  /// 刷新设备列表
  Future<void> refreshDevices() => loadDevices();

  /// 设置搜索关键词
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  /// 选中设备
  void selectDevice(Device device) {
    _selectedDevice = device;
    notifyListeners();
  }

  /// 清除选中
  void clearSelection() {
    _selectedDevice = null;
    notifyListeners();
  }

  // ============ 设备控制 ============

  /// 控制设备 - 通用方法
  Future<bool> controlDevice(String command, Map<String, dynamic> params) async {
    if (_selectedDevice == null) return false;

    final result = await _api.controlDevice(_selectedDevice!.id, command, params);
    if (result.success) {
      // 刷新设备状态
      await refreshDeviceStatus();
      return true;
    }
    return false;
  }

  /// 刷新当前选中设备状态
  Future<void> refreshDeviceStatus() async {
    if (_selectedDevice == null) return;

    final result = await _api.getDeviceStatus(_selectedDevice!.id);
    if (result.success && result.data != null) {
      final status = result.data!;
      // 更新选中设备的状态
      _selectedDevice = _selectedDevice!.copyWith(
        status: status.status,
        powerMode: status.powerMode,
      );
      // 更新列表中的设备
      final index = _devices.indexWhere((d) => d.id == _selectedDevice!.id);
      if (index != -1) {
        _devices[index] = _selectedDevice!;
      }
      notifyListeners();
    }
  }

  // ============ 电源控制 ============

  /// 开机
  Future<bool> powerOn() => controlDevice('power_on', {});

  /// 关机
  Future<bool> powerOff() => controlDevice('power_off', {});

  // ============ 音乐控制 ============

  /// 播放音乐
  Future<bool> playMusic({String? trackId}) =>
      controlDevice('music_play', {'track_id': trackId ?? ''});

  /// 暂停音乐
  Future<bool> pauseMusic() => controlDevice('music_pause', {});

  /// 停止音乐
  Future<bool> stopMusic() => controlDevice('music_stop', {});

  /// 设置音量
  Future<bool> setVolume(int volume) =>
      controlDevice('music_volume', {'volume': volume.clamp(0, 100)});

  // ============ 灯光控制 ============

  /// 开灯
  Future<bool> lightOn() => controlDevice('light_on', {});

  /// 关灯
  Future<bool> lightOff() => controlDevice('light_off', {});

  /// 设置亮度
  Future<bool> setBrightness(int brightness) =>
      controlDevice('light_brightness', {'brightness': brightness.clamp(0, 100)});

  /// 设置色温
  Future<bool> setColorTemp(int colorTemp) =>
      controlDevice('light_color_temp', {'color_temp': colorTemp.clamp(2700, 6500)});

  // ============ 按摩控制 ============

  /// 开启按摩
  Future<bool> startMassage({String? mode, String? position}) =>
      controlDevice('massage_start', {'mode': mode ?? 'auto', 'position': position ?? 'all'});

  /// 停止按摩
  Future<bool> stopMassage() => controlDevice('massage_stop', {});

  /// 设置按摩强度
  Future<bool> setMassageIntensity(int intensity) =>
      controlDevice('massage_intensity', {'intensity': intensity.clamp(1, 10)});

  // ============ 气味控制 ============

  /// 开启香气
  Future<bool> startScent({String? scentId, int concentration = 50}) =>
      controlDevice('scent_start', {'scent_id': scentId ?? 'default', 'concentration': concentration.clamp(0, 100)});

  /// 关闭香气
  Future<bool> stopScent() => controlDevice('scent_stop', {});

  /// 设置香气浓度
  Future<bool> setScentConcentration(int concentration) =>
      controlDevice('scent_concentration', {'concentration': concentration.clamp(0, 100)});

  // ============ 睡眠模式 ============

  /// 启动睡眠模式
  Future<bool> startSleepMode({int? timerMinutes}) =>
      controlDevice('sleep_start', {'timer': timerMinutes ?? 0});

  /// 退出睡眠模式
  Future<bool> exitSleepMode() => controlDevice('sleep_exit', {});

  /// 设置睡眠定时器
  Future<bool> setSleepTimer(int minutes) =>
      controlDevice('sleep_timer', {'minutes': minutes});

  // ============ 设备绑定 ============

  /// 绑定设备
  Future<bool> bindDevice(String serialNumber) async {
    final result = await _api.bindDevice(serialNumber);
    if (result.success) {
      await loadDevices();
      return true;
    }
    return false;
  }

  /// 解绑设备
  Future<bool> unbindDevice(String deviceId) async {
    final result = await _api.unbindDevice(deviceId);
    if (result.success) {
      if (_selectedDevice?.id == deviceId) {
        _selectedDevice = null;
      }
      _devices.removeWhere((d) => d.id == deviceId);
      notifyListeners();
      return true;
    }
    return false;
  }
}