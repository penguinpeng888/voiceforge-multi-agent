# 睡眠舱智能控制系统

> 睡眠舱 Flutter 移动端应用 v1.4.0

## 项目简介

睡眠舱是一款智能睡眠控制设备配套应用，支持蓝牙连接、远程控制、睡眠数据分析等功能。

## 功能特性

- 📱 设备连接：蓝牙 BLE / WiFi / MQTT 多协议支持
- 🎵 音乐控制：播放/暂停/音量/模式控制
- 💡 灯光控制：亮度/色温/模式调节
- 💆 按摩控制：强度/模式/位置选择
- 🌸 气味控制：香型/浓度调节
- 📊 睡眠数据：实时监测、历史报告
- 🔄 OTA 升级：远程固件更新
- 🔔 推送通知：极光推送集成
- 🎤 语音控制：语音指令识别

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Flutter 3.0+ |
| 状态管理 | Provider |
| 本地存储 | Hive |
| 蓝牙通信 | Flutter Blue Plus |
| 网络请求 | Dio |
| 实时通信 | WebSocket |
| 图表展示 | Fl Chart |

## 项目结构

```
lib/
├── core/               # 核心模块
│   ├── constants/      # 常量定义
│   │   ├── app_constants.dart     # 应用常量
│   │   ├── ble_constants.dart     # 蓝牙常量
│   │   └── error_constants.dart   # 错误码定义
│   └── models/         # 数据模型
│       ├── device_model.dart      # 设备模型
│       └── user_model.dart        # 用户模型
├── screens/            # 页面
│   ├── login_screen.dart          # 登录页
│   ├── home_screen.dart           # 首页
│   └── device_screen.dart         # 设备控制页
├── services/           # 服务层
│   ├── api_service.dart           # API 服务
│   ├── ble_service.dart           # 蓝牙服务
│   ├── offline_service.dart       # 离线服务
│   ├── ota_service.dart           # OTA 升级
│   ├── push_service.dart          # 推送服务
│   └── voice_service.dart         # 语音服务
├── providers/          # 状态管理
│   └── device_provider.dart       # 设备状态
├── widgets/            # 通用组件
│   └── common_widgets.dart        # 公共组件
└── utils/              # 工具类
    └── helpers.dart               # 辅助函数
```

## 环境要求

- Flutter SDK >= 3.16
- Android SDK >= 28 (Android 9.0)
- iOS >= 13.0
- Xcode >= 15.0

## 安装配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd sleep_cabin_app
```

### 2. 安装依赖

```bash
flutter pub get
```

### 3. 配置平台

#### Android (`android/app/build.gradle`)

```gradle
android {
    defaultConfig {
        minSdkVersion 28
        targetSdkVersion 34
    }
}
```

添加权限 (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

#### iOS (`ios/Runner/Info.plist`)

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>需要蓝牙权限连接睡眠舱设备</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>需要蓝牙权限连接睡眠舱设备</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要位置权限以扫描蓝牙设备</string>
```

### 4. 运行项目

```bash
# debug 模式
flutter run

# release 模式
flutter build apk --release
flutter build ios --release
```

## 配置说明

修改 `lib/core/constants/app_constants.dart` 中的配置：

```dart
// API 地址
static const String baseUrl = 'https://api.sleepcabin.com/api/v1';

// 开发环境
static const String devBaseUrl = 'https://dev-api.sleepcabin.com/api/v1';

// 预发布环境
static const String stagingBaseUrl = 'https://staging-api.sleepcabin.com/api/v1';
```

## 常见问题

### 蓝牙连接失败

1. 检查设备蓝牙是否开启
2. 确认手机定位权限已授权
3. 确认设备在有效距离内（10米）

### OTA 升级失败

1. 确保电量 > 20%
2. 确保网络稳定
3. 不要在升级过程中断电

### 数据不同步

1. 检查网络连接
2. 确认登录状态有效
3. 手动触发同步

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.4.0 | 2024-03-01 | 新增语音控制、推送服务 |
| 1.3.0 | 2024-02-15 | 新增 OTA 升级、离线模式 |
| 1.2.0 | 2024-01-20 | 新增气味控制、多设备支持 |
| 1.1.0 | 2024-01-05 | 新增按摩控制、睡眠报告 |
| 1.0.0 | 2023-12-15 | 初始版本 |

## 许可证

Copyright © 2024 SleepCabin. All rights reserved.