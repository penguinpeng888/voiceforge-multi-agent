/// BLE 蓝牙协议常量
class BleConstants {
  BleConstants._();

  // UUID 配置
  static const String serviceUuid = '0000FFE0-0000-1000-8000-00805F9B34FB';
  static const String characteristicUuid = '0000FFE1-0000-1000-8000-00805F9B34FB';

  // 帧格式
  static const int frameHeader = 0xAA55;
  static const int crcPolynomial = 0x07;
  static const int crcInitialValue = 0x00;

  // 命令码
  static const int cmdHeartbeat = 0x01;
  static const int cmdPowerControl = 0x02;
  static const int cmdMusicControl = 0x10;
  static const int cmdLightControl = 0x11;
  static const int cmdMassageControl = 0x12;
  static const int cmdScentControl = 0x13;
  static const int cmdVitalSignsQuery = 0x20;
  static const int cmdFullStatusQuery = 0x21;

  // 响应码
  static const int rspHeartbeat = 0x81;
  static const int rspPowerControl = 0x82;
  static const int rspMusicControl = 0x90;
  static const int rspLightControl = 0x91;
  static const int rspMassageControl = 0x92;
  static const int rspScentControl = 0x93;
  static const int rspVitalSigns = 0xA0;
  static const int rspFullStatus = 0xA1;

  // 电源模式
  static const int powerOff = 0x00;
  static const int powerNormal = 0x01;
  static const int powerSleep = 0x02;
  static const int powerDeepSleep = 0x03;

  // 音乐播放动作
  static const int musicPlay = 0x01;
  static const int musicPause = 0x02;
  static const int musicStop = 0x03;
  static const int musicNext = 0x04;
  static const int musicPrev = 0x05;

  // 音乐播放模式
  static const String musicModeSingle = 'single';
  static const String musicModeLoop = 'loop';
  static const String musicModeRandom = 'random';

  // 灯光模式
  static const String lightModeSunsetFade = 'sunset_fade';
  static const String lightModeBreathing = 'breathing';
  static const String lightModeWarmWhite = 'warm_white';
  static const String lightModeStarlight = 'starlight';

  // 按摩模式
  static const String massageModeRelaxation = 'relaxation';
  static const String massageModeDeep = 'deep';
  static const String massageModeAcupoint = 'acupoint';
  static const String massageModeWave = 'wave';

  // 按摩部位
  static const String massagePositionHead = 'head';
  static const String massagePositionNeck = 'neck';
  static const String massagePositionBack = 'back';
  static const String massagePositionWaist = 'waist';
  static const String massagePositionLegs = 'legs';
  static const String massagePositionFeet = 'feet';

  // 香味类型
  static const String scentLavender = 'lavender';
  static const String scentChamomile = 'chamomile';
  static const String scentSandalwood = 'sandalwood';
  static const String scentVanilla = 'vanilla';
  static const String scentEucalyptus = 'eucalyptus';

  // 重连配置
  static const int maxReconnectAttempts = 5;
  static const List<int> reconnectDelays = [1, 2, 4, 8, 16];

  // 连接状态
  static const String statusOnline = 'online';
  static const String statusOffline = 'offline';
  static const String statusSleep = 'sleep';
  static const String statusMaintenance = 'maintenance';

  // 电源模式状态
  static const String powerModeNormal = 'normal';
  static const String powerModeSleep = 'sleep';
  static const String powerModeDeepSleep = 'deep_sleep';
  static const String powerModeOff = 'off';
}