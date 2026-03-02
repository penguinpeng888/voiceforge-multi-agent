# 睡眠舱测试文档

> 文档版本: 1.4.0  
> 更新日期: 2024-03-01

## 目录

1. [测试策略](#1-测试策略)
2. [单元测试](#2-单元测试)
3. [集成测试](#3-集成测试)
4. [测试用例](#4-测试用例)
5. [覆盖率](#5-覆盖率)

---

## 1. 测试策略

### 1.1 测试金字塔

```
        /\
       /  \      E2E 测试 (10%)
      /----\
     /      \   集成测试 (20%)
    /--------\
   /          \  单元测试 (70%)
  /------------\
```

### 1.2 测试环境

| 环境 | 用途 |
|------|------|
| dev | 开发测试 |
| staging | 预发布测试 |
| prod | 线上验证 |

---

## 2. 单元测试

### 2.1 测试框架

- **flutter_test**: 官方测试框架
- **mockito**: Mock 框架
- **fake_async**: 异步测试

### 2.2 运行测试

```bash
# 运行所有测试
flutter test

# 运行单元测试
flutter test test/unit/

# 运行集成测试
flutter test test/integration/

# 生成覆盖率报告
flutter test --coverage
```

---

## 3. 集成测试

### 3.1 测试场景

| 场景 | 说明 |
|------|------|
| 登录流程 | 手机号验证码登录 |
| 设备连接 | BLE 连接与发现 |
| 设备控制 | 各模块控制命令 |
| 数据同步 | 离线与在线同步 |

### 3.2 设备模拟

```dart
class MockBleDevice extends Mock implements BluetoothDevice {}
class MockBleService extends Mock implements BleService {}
```

---

## 4. 测试用例

### 4.1 API 服务测试

```dart
group('ApiService', () {
  test('登录成功返回用户信息', () async {
    // Arrange
    final apiService = ApiService();
    
    // Act
    final result = await apiService.login('13800138000', '123456');
    
    // Assert
    expect(result.success, true);
    expect(result.data, isNotNull);
  });
  
  test('登录失败返回错误信息', () async {
    // Arrange
    final apiService = ApiService();
    
    // Act
    final result = await apiService.login('13800138000', '000000');
    
    // Assert
    expect(result.success, false);
    expect(result.message, isNotNull);
  });
  
  test('token 过期自动刷新', () async {
    // Arrange
    final apiService = ApiService();
    apiService.setToken('expired_token');
    
    // Act
    final result = await apiService.getUserInfo();
    
    // Assert
    // 应该触发刷新并成功
  });
});
```

### 4.2 BLE 服务测试

```dart
group('BleService', () {
  test('扫描设备返回列表', () async {
    // Arrange
    final bleService = BleService();
    
    // Act
    final devices = await bleService.scanDevices(timeout: 5);
    
    // Assert
    expect(devices, isA<List<BluetoothDevice>>());
  });
  
  test('发送命令帧格式正确', () async {
    // Arrange
    final bleService = BleService();
    
    // Act
    final result = await bleService.sendFrame(
      command: 0x11,
      data: Uint8List.fromList([0x01, 0x28]),
    );
    
    // Assert
    expect(result.success, true);
  });
  
  test('CRC8 校验正确', () {
    // Arrange
    final data = Uint8List.fromList([0xAA, 0x55, 0x11, 0x01]);
    
    // Act
    final crc = calculateCrc8(data);
    
    // Assert
    expect(crc, equals(0xXX)); // 预期值
  });
});
```

### 4.3 数据模型测试

```dart
group('Device Model', () {
  test('fromJson 正确解析', () {
    // Arrange
    final json = {
      'id': 'device_001',
      'name': '测试设备',
      'type': 'home',
      'status': 'online',
    };
    
    // Act
    final device = Device.fromJson(json);
    
    // Assert
    expect(device.id, 'device_001');
    expect(device.name, '测试设备');
    expect(device.status, 'online');
  });
  
  test('toJson 正确序列化', () {
    // Arrange
    final device = Device(
      id: 'device_001',
      name: '测试设备',
      // ...
    );
    
    // Act
    final json = device.toJson();
    
    // Assert
    expect(json['id'], 'device_001');
  });
  
  test('copyWith 创建副本', () {
    // Arrange
    final device = Device(
      id: 'device_001',
      name: '原名称',
      // ...
    );
    
    // Act
    final copied = device.copyWith(name: '新名称');
    
    // Assert
    expect(copied.name, '新名称');
    expect(copied.id, 'device_001');
  });
});
```

### 4.4 离线服务测试

```dart
group('OfflineService', () {
  test('缓存写入与读取', () async {
    // Arrange
    final offlineService = OfflineService();
    final testData = {'key': 'value'};
    
    // Act
    await offlineService.cacheWrite('test_key', testData);
    final result = await offlineService.cacheRead('test_key');
    
    // Assert
    expect(result, testData);
  });
  
  test('离线队列管理', () async {
    // Arrange
    final offlineService = OfflineService();
    
    // Act
    await offlineService.queueCommand('device_001', 'light', {'on': true});
    final queue = offlineService.getPendingCommands();
    
    // Assert
    expect(queue.length, 1);
  });
});
```

---

## 5. 覆盖率

### 5.1 目标覆盖率

| 类型 | 目标 |
|------|------|
| 单元测试 | ≥ 80% |
| 集成测试 | ≥ 60% |
| 总覆盖率 | ≥ 70% |

### 5.2 覆盖率报告

```bash
# 生成 HTML 报告
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# 查看报告
open coverage/html/index.html
```

### 5.3 关键模块覆盖率要求

| 模块 | 最低覆盖率 |
|------|------------|
| services/api_service.dart | 90% |
| services/ble_service.dart | 85% |
| models/*.dart | 95% |
| utils/helpers.dart | 80% |

---

## 附录

### A. Mock 示例

```dart
class MockApiService extends Mock implements ApiService {}

void main() {
  late MockApiService mockApiService;
  
  setUp(() {
    mockApiService = MockApiService();
  });
  
  test('示例测试', () async {
    when(() => mockApiService.login(any(), any()))
        .thenAnswer((_) async => ApiResponse(
          success: true,
          data: User(...),
        ));
    
    final result = await mockApiService.login('13800138000', '123456');
    expect(result.success, true);
  });
}
```

### B. CI 配置 (.gitlab-ci.yml)

```yaml
test:
  script:
    - flutter test --coverage
  coverage: '/Total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)/'
```

### C. 测试数据

| 测试账号 | 用途 |
|----------|------|
| 13800138000 | 正常登录 |
| 13900139000 | 异常账号 |
| 13000130000 | OTA 测试 |