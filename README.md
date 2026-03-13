<<<<<<< HEAD
# FictionDown

**用于批量下载盗版网络小说，该软件仅用于数据分析的样本采集，请勿用于其他用途**

**该软件所产生的文档请勿传播，请勿用于数据评估外的其他用途**

[![License](https://img.shields.io/github/license/ma6254/FictionDown.svg)](https://raw.githubusercontent.com/ma6254/FictionDown/master/LICENSE)
[![release_version](https://img.shields.io/github/release/ma6254/FictionDown.svg)](https://github.com/ma6254/FictionDown/releases)
[![last-commit](https://img.shields.io/github/last-commit/ma6254/FictionDown.svg)](https://github.com/ma6254/FictionDown/commits)
[![Download Count](https://img.shields.io/github/downloads/ma6254/FictionDown/total.svg)](https://github.com/ma6254/FictionDown/releases)

[![godoc](https://img.shields.io/badge/godoc-reference-blue.svg)](https://pkg.go.dev/github.com/ma6254/FictionDown/)
[![QQ 群](https://img.shields.io/badge/qq%E7%BE%A4-934873832-orange.svg)](https://jq.qq.com/?_wv=1027&k=5bN0SVA)

[![Go](https://github.com/ma6254/FictionDown/workflows/Go/badge.svg)](https://github.com/ma6254/FictionDown/actions/runs/39839114)
[![travis-ci](https://www.travis-ci.org/ma6254/FictionDown.svg?branch=master)](https://travis-ci.org/ma6254/FictionDown)
[![Go Report Card](https://goreportcard.com/badge/github.com/ma6254/FictionDown)](https://goreportcard.com/report/github.com/ma6254/FictionDown)

## 特性

- 以起点为样本，多站点多线程爬取校对
- 支持导出 txt，以兼容大多数阅读器
- 支持导出 epub(还有些问题，某些阅读器无法打开)
- 支持导出 markdown，可以用 pandoc 转换成 epub，附带 epub 的`metadata`，保留书本信息、卷结构、作者信息
- 内置简单的广告过滤（现在还不完善）
- 用 Golang 编写，安装部署方便，可选的外部依赖：PhantomJS、Chromedp
- 支持断点续爬，强制结束再爬会在上次结束的地方继续

## 站点支持

- 是否正版：✅ 为正版站点 ❌ 为盗版站点
- 是否分卷：✅ 章节分卷 ❌ 所有章节放在一个卷中不分卷
- 站内搜索：✅ 完全支持 ❌ 不支持 ❔ 站点支持但软件未适配 ⚠️ 站点支持，但不可用或维护中 ⛔ 站点支持搜索，但没有好的适配方案（比如用 Google 做站内搜索）

| 站点名称     | 网址              | 是否正版 | 是否分卷 | 支持站内搜索 | 代码文件              |
| ------------ | ----------------- | -------- | -------- | ------------ | --------------------- |
| 起点中文网   | www.qidian.com    | ✅       | ✅       | ✅           | site\qidian.go        |
| 笔趣阁       | www.biquge5200.cc | ❌       | ❌       | ✅           | site\biquge.go        |
| 笔趣阁 5200  | www.bqg5200.com   | ❌       | ❌       | ❔           | site\biquge2.go       |
| 笔趣阁       | www.biqiuge.com   | ❌       | ❌       | ⚠️           | site\biquge3.go       |
| 顶点小说     | www.booktxt.net   | ❌       | ❌       | ❔           | site\dingdian1.go     |
| 新八一中文网 | www.81new.com     | ❌       | ❌       | ✅           | site\81new.go         |
| 书迷楼       | www.shumil.co     | ❌       | ❌       | ✅           | site\shumil_co.go     |
| 完本神站     | www.wanbentxt.com | ❌       | ❌       | ✅           | site\wanbentxt_com.go |

## 使用注意

- 起点和盗版站的页面可能随时更改，可能会使抓取匹配失效，如果失效请提 issue
- 生成的 EPUB 文件可能过大，市面上大多数阅读器会异常卡顿或者直接崩溃
- 某些过于老的书或者作者频繁修改的书，盗版站都没有收录，也就无法爬取，如能找此书可用的盗版站请提 issue，并写出书名和正版站链接、盗版站链接

## 工作流程

1. 输入起点链接
2. 获取到书本信息，开始爬取每章内容，遇到 vip 章节放入`Example`中作为校对样本
3. 手动设置笔趣阁等盗版小说的对应链接，`tamp`字段
4. 再次启动，开始爬取，只爬取 VIP 部分，并跟`Example`进行校对
5. 手动编辑对应的缓存文件，手动删除广告和某些随机字符(有部分是关键字,可能会导致 pandoc 内存溢出或者样式错误)
6. `conv -f md`生成 markwown
7. 用 pandoc 转换成 epub，`pandoc -o xxxx.epub xxxx.md`

### Example

```bash
> ./FictionDown --url https://book.qidian.com/info/3249362 d # 获取正版信息

# 有时会发生`not match volumes`的错误，请启用Chromedp或者PhantomJS
# Use Chromedp
> ./FictionDown --url https://book.qidian.com/info/3249362 -d chromedp d
# Use PhantomJS
> ./FictionDown --url https://book.qidian.com/info/3249362 -d phantomjs d

> vim 一世之尊.FictionDown # 加入盗版小说链接
> ./FictionDown -i 一世之尊.FictionDown d # 获取盗版内容
# 爬取完毕就可以输出可阅读的文档了
> ./FictionDown -i 一世之尊.FictionDown conv -f txt
# 转换成epub有两种方式
# 1.输出markdown，再用pandoc转换成epub
> ./FictionDown -i 一世之尊.FictionDown conv -f md
> pandoc -o 一世之尊.epub 一世之尊.md
# 某些阅读器需要对章节进行定位,需要加上--epub-chapter-level=2
> pandoc -o 一世之尊.epub --epub-chapter-level=2 一世之尊.md
# 2.直接输出epub（调用Pandoc）
> ./FictionDown -i 一世之尊.FictionDown conv -f epub
```

#### 现在支持小说站内搜索，可以不用手动填入了

```bash
> ./FictionDown --url https://book.qidian.com/info/3249362 d # 获取正版信息

# 有时会发生`not match volumes`的错误，请启用Chromedp或者PhantomJS
# Use Chromedp
> ./FictionDown --url https://book.qidian.com/info/3249362 --driver chromedp d
# Use PhantomJS
> ./FictionDown --url https://book.qidian.com/info/3249362 --driver phantomjs d

> ./FictionDown -i 一世之尊.FictionDown s -k 一世之尊 -p # 搜索然后放入
> ./FictionDown -i 一世之尊.FictionDown d # 获取盗版内容
# 爬取完毕就可以输出可阅读的文档了
> ./FictionDown -i 一世之尊.FictionDown conv -f txt
# 转换成epub有两种方式
# 1.输出markdown，再用pandoc转换成epub
> ./FictionDown -i 一世之尊.FictionDown conv -f md
> pandoc -o 一世之尊.epub 一世之尊.md
# 2.直接输出epub（某些阅读器会报错）
> ./FictionDown -i 一世之尊.FictionDown conv -f epub
```

## 未实现

- 爬取正版的时候带上`Cookie`，用于爬取已购买章节
- 支持 晋江文学城
- 支持 纵横中文网
- 支持有毒小说网
- 支持刺猬猫（即“欢乐书客”）
- 整理 main 包中的面条逻辑
- 整理命令行参数风格
- 完善广告过滤
- 简化使用步骤
- 优化 log 输出
- 对于特殊章节，支持手动指定盗版链接或者跳过忽略
- 外部加载匹配规则，让用户可以自己添加正/盗版源
- 支持章节更新
- 章节匹配过程优化

## Usage

```bash
NAME:
   FictionDown - https://github.com/ma6254/FictionDown

USAGE:
    [global options] command [command options] [arguments...]

AUTHOR:
   ma6254 <9a6c5609806a@gmail.com>

COMMANDS:
     download, d, down  下载缓存文件
     check, c, chk      检查缓存文件
     edit, e            对缓存文件进行手动修改
     convert, conv      转换格式输出
     pirate, p          检索盗版站点
     search, s          检索盗版站点
     help, h            Shows a list of commands or help for one command

GLOBAL OPTIONS:
   -u value, --url value     图书链接
   --tu value, --turl value  资源网站链接
   -i value, --input value   输入缓存文件
   --log value               log file path
   --driver value, -d value  请求方式,support: none,phantomjs,chromedp
   --help, -h                show help
   --version, -v             print the version
```

## 安装和编译

程序为单执行文件，命令行 CLI 界面

包管理为 gomod

```bash
go get github.com/ma6254/FictionDown
```

交叉编译这几个平台的可执行文件：`linux/arm` `linux/amd64` `darwin/amd64` `windows/amd64`

```bash
make multiple_build
```
=======
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
>>>>>>> a4a0128b3fe65afd5adcfb3b774ea6995d4412fd
