import 'dart:async';
import 'package:flutter/foundation.dart';

/// 语音控制服务 - 讯飞 SDK 集成
/// 文档参考: 4.6 语音控制模块
class VoiceService {
  static final VoiceService _instance = VoiceService._internal();
  factory VoiceService() => _instance;

  VoiceService._internal();

  final _stateController = StreamController<VoiceState>.broadcast();
  final _resultController = StreamController<VoiceResult>.broadcast();

  Stream<VoiceState> get stateStream => _stateController.stream;
  Stream<VoiceResult> get resultStream => _resultController.stream;

  bool _isInitialized = false;
  bool _isListening = false;
  bool _isOnline = true; // 在线/离线模式

  bool get isInitialized => _isInitialized;
  bool get isListening => _isListening;

  // ============ 初始化 ============

  /// 初始化语音服务
  Future<bool> init({
    String? appId,
    String? secretKey,
  }) async {
    if (_isInitialized) return true;

    try {
      // TODO: 集成讯飞 SDK
      // await IFlyTts.setParameter(IFlyTts.PARAM_APP_ID, appId);
      // await IFlyTts.setParameter(IFlyTts.PARAM_NET, '1'); // 在线模式

      _isInitialized = true;
      _stateController.add(VoiceState.idle);
      return true;
    } catch (e) {
      debugPrint('VoiceService init error: $e');
      return false;
    }
  }

  // ============ 唤醒词 ============

  /// 唤醒词列表
  static const String defaultWakeWord = '小睡眠';
  
  /// 自定义唤醒词 (需在线训练，48小时生效)
  List<String> customWakeWords = [];

  /// 所有唤醒词
  List<String> get allWakeWords => [defaultWakeWord, ...customWakeWords];

  /// 注册自定义唤醒词
  Future<bool> registerWakeWord(String word) async {
    if (customWakeWords.length >= 3) return false;
    if (word.length < 2 || word.length > 8) return false;
    
    // TODO: 调用讯飞 API 注册
    customWakeWords.add(word);
    return true;
  }

  // ============ 语音识别 ============

  /// 开始监听
  Future<void> startListening() async {
    if (!_isInitialized || _isListening) return;

    _isListening = true;
    _stateController.add(VoiceState.listening);

    // TODO: 启动讯飞实时语音识别
    // await IFlyTts.startListening(callback);
  }

  /// 停止监听
  Future<void> stopListening() async {
    if (!_isListening) return;

    _isListening = false;
    _stateController.add(VoiceState.processing);

    // TODO: 停止讯飞识别
  }

  /// 处理识别结果
  void _handleResult(String text, double confidence) {
    _stateController.add(VoiceState.idle);

    final intent = _parseIntent(text, confidence);
    _resultController.add(VoiceResult(
      text: text,
      confidence: confidence,
      intent: intent,
      timestamp: DateTime.now(),
    ));
  }

  /// 解析语音指令 (4.6.3 完整指令集)
  VoiceIntent? _parseIntent(String text, double confidence) {
    if (confidence < 0.7) return null;

    final lowerText = text.toLowerCase();

    // 电源控制
    if (lowerText.contains('开机') || lowerText.contains('启动')) {
      return VoiceIntent(
        action: VoiceAction.powerOn,
        confirmMessage: '好的，已开机',
      );
    }
    if (lowerText.contains('关机') || lowerText.contains('关闭')) {
      return VoiceIntent(
        action: VoiceAction.powerOff,
        confirmMessage: '好的，已关机',
      );
    }
    if (lowerText.contains('休眠') || lowerText.contains('睡眠模式')) {
      return VoiceIntent(
        action: VoiceAction.enterSleepMode,
        confirmMessage: '好的，已进入休眠模式',
      );
    }

    // 音乐控制
    if (lowerText.contains('播放音乐') || lowerText.contains('播放')) {
      return VoiceIntent(
        action: VoiceAction.musicPlay,
        confirmMessage: '好的，正在播放音乐',
      );
    }
    if (lowerText.contains('暂停')) {
      return VoiceIntent(
        action: VoiceAction.musicPause,
        confirmMessage: '好的，已暂停',
      );
    }
    if (lowerText.contains('下一首') || lowerText.contains('下一曲')) {
      return VoiceIntent(
        action: VoiceAction.musicNext,
        confirmMessage: '好的，下一首',
      );
    }
    // 音量控制
    final volumeMatch = RegExp(r'音量.*?(\d+)').firstMatch(text);
    if (volumeMatch != null) {
      final volume = int.tryParse(volumeMatch.group(1) ?? '30');
      return VoiceIntent(
        action: VoiceAction.musicVolume,
        params: {'volume': volume ?? 30},
        confirmMessage: '好的，音量调至 $volume',
      );
    }

    // 灯光控制
    if (lowerText.contains('开灯') || lowerText.contains('灯打开')) {
      return VoiceIntent(
        action: VoiceAction.lightOn,
        confirmMessage: '好的，灯光已开启',
      );
    }
    if (lowerText.contains('关灯') || lowerText.contains('灯关闭')) {
      return VoiceIntent(
        action: VoiceAction.lightOff,
        confirmMessage: '好的，灯光已关闭',
      );
    }
    if (lowerText.contains('调暗')) {
      return VoiceIntent(
        action: VoiceAction.lightDimDown,
        confirmMessage: '好的，灯光已调暗',
      );
    }
    if (lowerText.contains('呼吸') || lowerText.contains('模式')) {
      final mode = lowerText.contains('呼吸') ? 'breathing' : 'warm_white';
      return VoiceIntent(
        action: VoiceAction.lightSetMode,
        params: {'mode': mode},
        confirmMessage: '好的，灯光模式已设置',
      );
    }

    // 按摩控制
    if (lowerText.contains('开始按摩') || lowerText.contains('按摩启动')) {
      return VoiceIntent(
        action: VoiceAction.massageStart,
        confirmMessage: '好的，按摩已启动',
      );
    }
    if (lowerText.contains('停止按摩') || lowerText.contains('按摩停止')) {
      return VoiceIntent(
        action: VoiceAction.massageStop,
        confirmMessage: '好的，按摩已停止',
      );
    }
    // 按摩强度
    final intensityMatch = RegExp(r'强度.*?(\d+)').firstMatch(text);
    if (intensityMatch != null) {
      final intensity = int.tryParse(intensityMatch.group(1) ?? '5');
      return VoiceIntent(
        action: VoiceAction.massageSetIntensity,
        params: {'intensity': intensity ?? 5},
        confirmMessage: '好的，按摩强度调至 $intensity',
      );
    }

    // 气味控制
    if (lowerText.contains('香味') || lowerText.contains('释放香味')) {
      return VoiceIntent(
        action: VoiceAction.scentOn,
        confirmMessage: '好的，正在释放香味',
      );
    }
    if (lowerText.contains('停止香味') || lowerText.contains('关闭香味')) {
      return VoiceIntent(
        action: VoiceAction.scentOff,
        confirmMessage: '好的，香气已停止',
      );
    }

    // 快捷指令
    if (lowerText.contains('开始助眠') || lowerText.contains('助眠方案')) {
      return VoiceIntent(
        action: VoiceAction.startSleepPlan,
        confirmMessage: '好的，正在开始助眠',
      );
    }
    if (lowerText.contains('晚安')) {
      return VoiceIntent(
        action: VoiceAction.goodNight,
        confirmMessage: '晚安，祝您有个好梦',
      );
    }
    if (lowerText.contains('我要睡了') || lowerText.contains('睡着了')) {
      return VoiceIntent(
        action: VoiceAction.startMonitoring,
        confirmMessage: '好的，已启动睡眠监测',
      );
    }

    // 查询指令
    if (lowerText.contains('心率') || lowerText.contains('心跳')) {
      return VoiceIntent(
        action: VoiceAction.queryHeartRate,
        confirmMessage: '', // 需要查询后填充
      );
    }

    return null;
  }

  // ============ 语音合成 (TTS) ============

  /// 语音播报
  Future<void> speak(String text) async {
    if (!_isInitialized) return;

    _stateController.add(VoiceState.speaking);
    
    // TODO: 调用讯飞 TTS
    // await IFlyTts.speak(text);
    
    _stateController.add(VoiceState.idle);
  }

  /// 播报心率数据
  Future<void> speakHeartRate(int heartRate) async {
    await speak('您的心率是 $heartRate 次每分钟');
  }

  // ============ 模式切换 ============

  /// 切换到离线模式
  Future<void> setOfflineMode() async {
    _isOnline = false;
    // TODO: 加载离线引擎 (约 50MB)
    // await IFlyTts.setParameter(IFlyTts.PARAM_NET, '0');
  }

  /// 切换到在线模式
  Future<void> setOnlineMode() async {
    _isOnline = true;
    // TODO: 切换到在线识别
  }

  bool get isOnline => _isOnline;

  // ============ 释放资源 ============

  void dispose() {
    _stateController.close();
    _resultController.close();
  }
}

// ============ 枚举和类定义 ============

enum VoiceState {
  idle,
  listening,
  processing,
  speaking,
  error,
}

enum VoiceAction {
  // 电源
  powerOn,
  powerOff,
  enterSleepMode,
  // 音乐
  musicPlay,
  musicPause,
  musicStop,
  musicNext,
  musicPrev,
  musicVolume,
  // 灯光
  lightOn,
  lightOff,
  lightDimUp,
  lightDimDown,
  lightSetMode,
  // 按摩
  massageStart,
  massageStop,
  massageSetIntensity,
  // 气味
  scentOn,
  scentOff,
  scentSetConcentration,
  // 快捷指令
  startSleepPlan,
  goodNight,
  startMonitoring,
  // 查询
  queryHeartRate,
  queryBloodOxygen,
}

class VoiceIntent {
  final VoiceAction action;
  final Map<String, dynamic> params;
  final String confirmMessage;

  VoiceIntent({
    required this.action,
    this.params = const {},
    required this.confirmMessage,
  });
}

class VoiceResult {
  final String text;
  final double confidence;
  final VoiceIntent? intent;
  final DateTime timestamp;

  VoiceResult({
    required this.text,
    required this.confidence,
    this.intent,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isValid => intent != null && confidence >= 0.7;
}