# 睡眠舱部署文档

> 文档版本: 1.4.0  
> 更新日期: 2024-03-01

## 目录

1. [构建环境](#1-构建环境)
2. [Android 构建](#2-android-构建)
3. [iOS 构建](#3-ios-构建)
4. [CI/CD 配置](#4-cicd-配置)
5. [发布流程](#5-发布流程)
6. [版本管理](#6-版本管理)

---

## 1. 构建环境

### 1.1 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Flutter | ≥ 3.16 | SDK |
| Dart | ≥ 3.0 | 编程语言 |
| Android SDK | ≥ 28 | Android 9.0+ |
| Xcode | ≥ 15.0 | iOS 开发 |
| CocoaPods | ≥ 1.12 | iOS 依赖管理 |

### 1.2 环境变量

```bash
# ~/.bashrc 或 ~/.zshrc

# Flutter
export PATH="$PATH:/path/to/flutter/bin"

# Android
export ANDROID_HOME=/path/to/android/sdk
export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"

# iOS
# 需要 Xcode 命令行工具
xcode-select --install
```

---

## 2. Android 构建

### 2.1 Debug 构建

```bash
# 进入项目目录
cd sleep_cabin_app

# 获取依赖
flutter pub get

# Debug 构建
flutter build apk --debug

# 输出位置: build/app/outputs/flutter-apk/app-debug.apk
```

### 2.2 Release 构建

```bash
# 生成密钥库 (首次)
keytool -genkey -v -keystore sleep_cabin.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sleepcabin

# 配置签名 (android/app/build.gradle)
android {
    signingConfigs {
        release {
            storeFile file("sleep_cabin.jks")
            storePassword "password"
            keyAlias "sleepcabin"
            keyPassword "password"
        }
    }
}

# Release 构建
flutter build apk --release

# 输出位置: build/app/outputs/flutter-apk/app-release.apk
```

### 2.3 构建参数

| 参数 | Debug | Release |
|------|-------|---------|
| 包名 | com.sleepcabin.app.debug | com.sleepcabin.app |
| 版本名 | 1.4.0+1 | 1.4.0 |
| 混淆 | 否 | 是 |
| 签名 | 测试密钥 | 发布密钥 |

### 2.4 多渠道构建

```bash
# 华为应用市场
flutter build apk --release --flavor huawei -t lib/main_huawei.dart

# 小米应用商店
flutter build apk --release --flavor xiaomi -t lib/main_xiaomi.dart

# Google Play
flutter build apk --release --flavor google -t lib/main_google.dart
```

---

## 3. iOS 构建

### 3.1 环境检查

```bash
# 检查 Flutter 环境
flutter doctor

# 检查 Xcode
xcodebuild -version

# 检查 CocoaPods
pod --version
```

### 3.2 模拟器构建

```bash
# 获取依赖
flutter pub get
cd ios
pod install
cd ..

# 模拟器构建
flutter build ios --simulator --no-codesign
```

### 3.3 真机构建

```bash
# 证书配置
# 1. Xcode → Preferences → Accounts → 添加 Apple ID
# 2. 下载证书和配置文件
# 3. 配置 Bundle ID 和 Team ID

# 真机构建
flutter build ios --release

# 输出位置: build/ios/iphoneos/Runner.app
```

### 3.4 打包 IPA

```bash
# 1. 导出 Runner.app
# 2. 使用 Xcode 打包
xcodebuild -exportArchive -archivePath Runner.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath SleepCabin.ipa
```

---

## 4. CI/CD 配置

### 4.1 GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          
      - name: Get dependencies
        run: flutter pub get
        
      - name: Run tests
        run: flutter test
        
      - name: Build APK
        run: flutter build apk --release
        
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: build/app/outputs/flutter-apk/app-release.apk

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          
      - name: Get dependencies
        run: flutter pub get
        
      - name: iOS Build
        run: flutter build ios --release --no-codesign
```

### 4.2 GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

flutter-test:
  stage: test
  script:
    - flutter pub get
    - flutter test
  only:
    - develop
    - main

android-build:
  stage: build
  script:
    - flutter pub get
    - flutter build apk --release
  artifacts:
    paths:
      - build/app/outputs/flutter-apk/*.apk
  only:
    - develop

android-release:
  stage: deploy
  script:
    - flutter pub get
    - flutter build apk --release
    - 'curl -F "file=@build/app/outputs/flutter-apk/app-release.apk" https://example.com/upload'
  only:
    - main
  when: manual
```

---

## 5. 发布流程

### 5.1 发布检查清单

- [ ] 所有测试通过
- [ ] 代码已 Code Review
- [ ] 更新版本号
- [ ] 更新 Changelog
- [ ] 构建签名 APK
- [ ] 测试环境验证
- [ ] 预发布环境验证

### 5.2 应用市场发布

| 市场 | 平台 | 审核时间 |
|------|------|----------|
| Google Play | Android | 1-3 天 |
| App Store | iOS | 1-7 天 |
| 华为应用市场 | Android | 3-7 天 |
| 小米应用商店 | Android | 2-5 天 |
| OPPO 应用商店 | Android | 3-7 天 |

### 5.3 热更新 (可选)

使用 **shorebird** 实现热更新：

```bash
# 初始化
flutter pub add shorebird
shorebird init

# 推送补丁
shorebird patch --arch arm64

# 发布补丁
shorebird release --arch arm64
```

---

## 6. 版本管理

### 6.1 版本号规则

```
主版本.次版本.修订版本[-构建号]

示例: 1.4.0+1
- 主版本 (1): 重大功能变更
- 次版本 (4): 新功能
- 修订版本 (0): Bug 修复
- 构建号 (+1): 构建次数
```

### 6.2 版本更新流程

```bash
# 1. 创建版本分支
git checkout -b release/1.5.0

# 2. 更新版本号 (pubspec.yaml)
version: 1.5.0+1

# 3. 更新 Changelog
# 编辑 CHANGELOG.md

# 4. 提交
git add .
git commit -m "Release v1.5.0"

# 5. 打标签
git tag -a v1.5.0 -m "Release v1.5.0"

# 6. 推送
git push origin main
git push origin v1.5.0
```

### 6.3 Changelog 格式

```markdown
## [1.5.0] - 2024-03-15

### 新增
- 语音控制功能
- 优化蓝牙连接稳定性

### 修复
- 修复睡眠报告生成错误
- 修复 OTA 升级失败问题

### 优化
- 提升应用启动速度
- 优化内存占用
```

---

## 附录

### A. 构建问题排查

| 问题 | 解决方案 |
|------|----------|
| SDK 版本不匹配 | 更新 Flutter 和 Android SDK |
| 签名失败 | 检查密钥库配置 |
| 构建超时 | 增加内存或优化依赖 |
| 混淆失败 | 检查 proguard 配置 |

### B. 发布检查命令

```bash
# 检查版本
flutter --version

# 检查依赖
flutter pub outdated

# 分析代码
flutter analyze

# 运行测试
flutter test
```