# 睡眠舱 API 接口文档

> API 版本: v1  
> 基础 URL: `https://api.sleepcabin.com/api/v1`

## 目录

1. [认证接口](#1-认证接口)
2. [用户接口](#2-用户接口)
3. [设备接口](#3-设备接口)
4. [睡眠数据接口](#4-睡眠数据接口)
5. [错误码](#5-错误码)

---

## 1. 认证接口

### 1.1 发送验证码

```
POST /auth/send-code
```

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号，11位数字 |

**响应示例:**

```json
{
  "success": true,
  "message": "验证码已发送",
  "data": true
}
```

---

### 1.2 登录

```
POST /auth/login
```

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 6位验证码 |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_123456",
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatar": "https://...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### 1.3 登出

```
POST /auth/logout
```

**Headers:**

| 参数 | 说明 |
|------|------|
| Authorization | Bearer Token |

**响应示例:**

```json
{
  "success": true,
  "data": true
}
```

---

## 2. 用户接口

### 2.1 获取用户信息

```
GET /user/info
```

**Headers:**

| 参数 | 说明 |
|------|------|
| Authorization | Bearer Token |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "phone": "13800138000",
    "nickname": "用户昵称",
    "avatar": "https://...",
    "email": "user@example.com",
    "gender": "male",
    "birthday": "1990-01-01",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

---

### 2.2 更新用户信息

```
PUT /user/info
```

**Headers:** `Authorization: Bearer Token`

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar | string | 否 | 头像 URL |
| email | string | 否 | 邮箱 |
| gender | string | 否 | 性别: male/female/other |
| birthday | string | 否 | 生日 YYYY-MM-DD |

---

## 3. 设备接口

### 3.1 获取设备列表

```
GET /devices
```

**Headers:** `Authorization: Bearer Token`

**响应示例:**

```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device_001",
        "serial_number": "SC202401010001",
        "name": "主卧睡眠舱",
        "type": "home",
        "connection_type": "bluetooth",
        "firmware_version": "1.4.0",
        "status": "online",
        "last_online": "2024-03-01T10:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 3.2 获取设备详情

```
GET /devices/:deviceId
```

**路径参数:**

| 参数 | 说明 |
|------|------|
| deviceId | 设备 ID |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "device_001",
    "serial_number": "SC202401010001",
    "name": "主卧睡眠舱",
    "type": "home",
    "connection_type": "bluetooth",
    "firmware_version": "1.4.0",
    "status": "online",
    "power_mode": 1,
    "battery": 85,
    "online_time": "2024-03-01T08:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3.3 获取设备状态

```
GET /devices/:deviceId/status
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "power": {
      "mode": 1,
      "status": "normal"
    },
    "music": {
      "playing": true,
      "track_id": "track_001",
      "volume": 30,
      "mode": "loop"
    },
    "light": {
      "on": true,
      "brightness": 40,
      "color_temp": 3200,
      "mode": "sleep"
    },
    "massage": {
      "on": true,
      "intensity": 5,
      "mode": "relax",
      "position": 63
    },
    "scent": {
      "on": true,
      "concentration": 50,
      "scent_id": 1
    },
    "vital_signs": {
      "heart_rate": 65,
      "breath_rate": 14,
      "body_temperature": 36.5
    }
  }
}
```

---

### 3.4 控制设备

```
POST /devices/:deviceId/control
```

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| command | string | 是 | 控制命令 |
| params | object | 是 | 命令参数 |

**支持的命令:**

| 命令 | 说明 | 参数 |
|------|------|------|
| power | 电源控制 | mode: 0-3 |
| music | 音乐控制 | action, volume, trackId, mode |
| light | 灯光控制 | on, brightness, colorTemp, mode |
| massage | 按摩控制 | on, intensity, mode, position |
| scent | 气味控制 | on, concentration, scentId |

**示例 - 灯光控制:**

```json
{
  "command": "light",
  "params": {
    "on": true,
    "brightness": 40,
    "colorTemp": 3200,
    "mode": "sleep"
  }
}
```

---

### 3.5 绑定设备

```
POST /devices/bind
```

**请求体:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| serial_number | string | 是 | 设备序列号 |

---

### 3.6 解绑设备

```
DELETE /devices/:deviceId
```

---

## 4. 睡眠数据接口

### 4.1 获取睡眠数据

```
GET /devices/:deviceId/sleep-data
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | string | 是 | 开始时间 ISO8601 |
| end | string | 是 | 结束时间 ISO8601 |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "device_id": "device_001",
    "start_time": "2024-03-01T22:00:00Z",
    "end_time": "2024-03-02T06:00:00Z",
    "total_duration": 480,
    "stages": [
      {"stage": "awake", "duration": 15},
      {"stage": "light", "duration": 180},
      {"stage": "deep", "duration": 150},
      {"stage": "rem", "duration": 135}
    ],
    "heart_rate_avg": 62,
    "heart_rate_min": 55,
    "heart_rate_max": 78,
    "breath_rate_avg": 14,
    "body_temp_avg": 36.4,
    "turn_over_count": 12
  }
}
```

---

### 4.2 获取睡眠报告

```
GET /devices/:deviceId/sleep-report
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 日期 YYYY-MM-DD |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "date": "2024-03-01",
    "sleep_score": 85,
    "sleep_duration": 480,
    "deep_sleep_duration": 150,
    "light_sleep_duration": 180,
    "rem_duration": 135,
    "awake_duration": 15,
    "sleep_efficiency": 0.92,
    "fall_asleep_time": 15,
    "wake_count": 2,
    "heart_rate_avg": 62,
    "breath_rate_avg": 14,
    "suggestions": [
      "睡眠质量良好",
      "建议保持规律的作息时间"
    ]
  }
}
```

---

## 5. 错误码

| 错误码 | 说明 |
|--------|------|
| 4000 | 无效请求 |
| 4010 | 未授权 |
| 4030 | 禁止访问 |
| 4040 | 资源不存在 |
| 4090 | 数据冲突 |
| 4290 | 请求过于频繁 |
| 5000 | 服务器错误 |
| 5030 | 服务不可用 |
| 5001 | 蓝牙连接失败 |
| 5002 | WiFi 连接超时 |
| 5003 | 设备离线 |
| 5004 | 命令发送失败 |
| 5005 | 数据同步失败 |
| 5006 | OTA 升级失败 |
| 5007 | 登录失败 |
| 5008 | 权限不足 |

---

## 附录

### A. 响应包装格式

所有响应均使用以下格式:

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200
}
```

### B. 分页响应（列表）

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### C. 授权方式

除 `/auth/*` 外所有接口需要 Bearer Token:

```
Authorization: Bearer <token>
```