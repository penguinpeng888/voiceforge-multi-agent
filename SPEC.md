# 睡眠舱 App 技术规格说明书

> 版本: 1.4.0  
> 日期: 2024-03-01

## 1. 项目概述

### 1.1 项目背景
睡眠舱是一款智能睡眠控制设备，通过移动应用实现远程控制和数据管理。

### 1.2 目标用户
- 个人用户：家庭睡眠舱使用者
- 医疗机构：医用睡眠舱管理人员

### 1.3 功能摘要
| 模块 | 功能 |
|------|------|
| 认证 | 手机号验证码登录 |
| 设备管理 | 设备绑定、解绑、状态查看 |
| 控制 | 电源、音乐、灯光、按摩、气味 |
| 数据 | 睡眠监测、报告生成 |
| 升级 | OTA 固件远程升级 |

---

## 2. 技术架构

### 2.1 整体架构
```
┌─────────────────────────────────────────┐
│              Flutter App                │
├─────────────────────────────────────────┤
│  UI Layer (Screens + Widgets)           │
├─────────────────────────────────────────┤
│  State Management (Provider)            │
├─────────────────────────────────────────┤
│  Service Layer                          │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐ │
│  │ API │ BLE │OTA  │Push │Voice│Offl │ │
│  └─────┴─────┴─────┴─────┴─────┴─────┘ │
├─────────────────────────────────────────┤
│  Data Layer (Hive + Models)             │
└─────────────────────────────────────────┘
```

### 2.2 技术栈
| 层级 | 技术选型 |
|------|----------|
| 框架 | Flutter 3.16+ |
| 状态管理 | Provider |
| 本地存储 | Hive |
| 网络 | Dio |
| 蓝牙 | Flutter Blue Plus |
| 实时通信 | WebSocket |

---

## 3. 功能规格

### 3.1 登录模块
- 手机号 + 验证码登录
- Token 缓存
- 自动登录

### 3.2 设备管理
- 设备列表展示
- 设备绑定（序列号）
- 设备解绑
- 在线状态检测

### 3.3 设备控制
| 功能 | 参数 |
|------|------|
| 电源 | mode: 0-3 (关机/正常/休眠/深度休眠) |
| 音乐 | action, volume, mode, track |
| 灯光 | on/off, brightness, colorTemp, mode |
| 按摩 | on/off, intensity, mode, position |
| 气味 | on/off, concentration, scentId |

### 3.4 睡眠数据
- 实时心率、呼吸、体温
- 睡眠阶段分析
- 睡眠报告生成
- 历史数据查询

### 3.5 系统功能
- OTA 升级
- 推送通知
- 语音控制
- 离线模式

---

## 4. 数据模型

### 4.1 用户模型
```dart
class User {
  String id;
  String name;
  String phone;
  String? email;
  String? avatarUrl;
  String role;
}
```

### 4.2 设备模型
```dart
class Device {
  String id;
  String name;
  String type;        // home / hospital
  String status;      // online / offline / sleep
  String connectionType;
  DeviceModules? modules;
}
```

### 4.3 模块状态
```dart
class DeviceModules {
  MusicModule? music;
  LightModule? light;
  MassageModule? massage;
  ScentModule? scent;
}
```

---

## 5. API 接口

### 5.1 认证
- POST /auth/send-code - 发送验证码
- POST /auth/login - 登录
- POST /auth/logout - 登出

### 5.2 设备
- GET /devices - 获取设备列表
- GET /devices/:id - 获取设备详情
- GET /devices/:id/status - 获取设备状态
- POST /devices/:id/control - 控制设备
- POST /devices/bind - 绑定设备
- DELETE /devices/:id - 解绑设备

### 5.3 睡眠数据
- GET /devices/:id/sleep-data - 获取睡眠数据
- GET /devices/:id/sleep-report - 获取睡眠报告

---

## 6. BLE 协议

### 6.1 服务 UUID
- Service: 0000FFE0-0000-1000-8000-00805F9B34FB
- Characteristic: 0000FFE1-0000-1000-8000-00805F9B34FB

### 6.2 通信帧格式
```
| 帧头(2) | 长度(1) | 命令(1) | 数据(N) | CRC8(1) |
```

### 6.3 命令集
| 命令码 | 功能 |
|--------|------|
| 0x01 | 心跳检测 |
| 0x02 | 电源控制 |
| 0x10 | 音乐控制 |
| 0x11 | 灯光控制 |
| 0x12 | 按摩控制 |
| 0x13 | 气味控制 |
| 0x20 | 查询体征 |
| 0x21 | 查询全状态 |

---

## 7. 性能要求

| 指标 | 目标值 |
|------|--------|
| 冷启动 | < 3秒 |
| 本地命令 | < 1秒 |
| 云端命令 | < 2秒 |
| 实时数据 | < 500ms |
| 内存占用 | < 150MB |

---

## 8. 兼容性

### 8.1 支持平台
- Android 9.0+ (API 28)
- iOS 13.0+

### 8.2 屏幕适配
- 手机竖屏
- 平板竖屏（待支持）

---

## 9. 安全要求

- HTTPS 传输加密
- Token 本地加密存储
- BLE 通信 CRC 校验
- 敏感数据脱敏展示

---

## 10. 后续规划

### 10.1 v1.5.0
- 语音唤醒词自定义
- 睡眠闹钟功能
- 多设备联动

### 10.2 v2.0.0
- 家庭账户共享
- 睡眠社区
- 健康报告分享