import 'package:intl/intl.dart';

/// 日期时间工具
class DateTimeUtils {
  static final DateFormat _timeFormat = DateFormat('HH:mm');
  static final DateFormat _dateFormat = DateFormat('yyyy-MM-dd');
  static final DateFormat _dateTimeFormat = DateFormat('yyyy-MM-dd HH:mm');
  static final DateFormat _monthDayFormat = DateFormat('MM月dd日');
  static final DateFormat _weekdayFormat = DateFormat('EEEE');

  /// 格式化时间 HH:mm
  static String formatTime(DateTime dt) => _timeFormat.format(dt);

  /// 格式化日期 yyyy-MM-dd
  static String formatDate(DateTime dt) => _dateFormat.format(dt);

  /// 格式化日期时间
  static String formatDateTime(DateTime dt) => _dateTimeFormat.format(dt);

  /// 格式化月日
  static String formatMonthDay(DateTime dt) => _monthDayFormat.format(dt);

  /// 格式化时长
  static String formatDuration(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    if (h > 0) {
      return '${h}小时${m}分钟';
    }
    return '${m}分钟';
  }

  /// 格式化相对时间
  static String formatRelative(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return '刚刚';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    if (diff.inDays < 7) return '${diff.inDays}天前';
    return formatDate(dt);
  }

  /// 获取星期几
  static String getWeekday(DateTime dt) {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return weekdays[dt.weekday - 1];
  }

  /// 判断是否同一天
  static bool isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  /// 获取一天的开始
  static DateTime startOfDay(DateTime dt) {
    return DateTime(dt.year, dt.month, dt.day);
  }

  /// 获取一天的结束
  static DateTime endOfDay(DateTime dt) {
    return DateTime(dt.year, dt.month, dt.day, 23, 59, 59);
  }
}

/// 验证工具
class Validators {
  /// 验证手机号
  static bool isValidPhone(String phone) {
    return RegExp(r'^1[3-9]\d{9}$').hasMatch(phone);
  }

  /// 验证验证码 4-6位数字
  static bool isValidCode(String code) {
    return RegExp(r'^\d{4,6}$').hasMatch(code);
  }

  /// 验证序列号
  static bool isValidSerialNumber(String serial) {
    return serial.length >= 8 && RegExp(r'^[A-Za-z0-9\-]+$').hasMatch(serial);
  }

  /// 验证密码强度
  static PasswordStrength checkPassword(String password) {
    if (password.length < 6) return PasswordStrength.weak;
    
    int score = 0;
    if (password.length >= 8) score++;
    if (RegExp(r'[a-z]').hasMatch(password)) score++;
    if (RegExp(r'[A-Z]').hasMatch(password)) score++;
    if (RegExp(r'\d').hasMatch(password)) score++;
    if (RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) score++;

    if (score >= 4) return PasswordStrength.strong;
    if (score >= 2) return PasswordStrength.medium;
    return PasswordStrength.weak;
  }
}

enum PasswordStrength { weak, medium, strong }

/// 字符串工具
class StringUtils {
  /// 脱敏手机号
  static String maskPhone(String phone) {
    if (phone.length != 11) return phone;
    return '${phone.substring(0, 3)}****${phone.substring(7)}';
  }

  /// 脱敏姓名
  static String maskName(String name) {
    if (name.isEmpty) return '';
    if (name.length == 1) return name;
    return '${name[0]}${'*' * (name.length - 1)}';
  }

  /// 截断字符串
  static String truncate(String text, int maxLength, {String suffix = '...'}) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}$suffix';
  }

  /// 首字母大写
  static String capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  /// 判断是否为空
  static bool isEmpty(String? text) {
    return text == null || text.trim().isEmpty;
  }

  /// 获取非空字符串
  static String orDefault(String? text, String defaultValue) {
    return isEmpty(text) ? defaultValue : text!;
  }
}

/// 数字工具
class NumberUtils {
  /// 格式化百分比
  static String formatPercent(double value, {int decimals = 0}) {
    return '${(value * 100).toStringAsFixed(decimals)}%';
  }

  /// 格式化文件大小
  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  /// 限制数值范围
  static int clamp(int value, int min, int max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  /// 安全转换为整数
  static int? tryParseInt(String? value) {
    if (value == null) return null;
    return int.tryParse(value);
  }

  /// 安全转换为双精度浮点数
  static double? tryParseDouble(String? value) {
    if (value == null) return null;
    return double.tryParse(value);
  }
}

/// 设备工具
class DeviceUtils {
  /// 获取设备类型图标
  static String getDeviceTypeIcon(String type) {
    switch (type) {
      case 'home':
        return '🏠';
      case 'hospital':
        return '🏥';
      default:
        return '💤';
    }
  }

  /// 获取状态颜色
  static String getStatusColor(String status) {
    switch (status) {
      case 'online':
        return 'green';
      case 'offline':
        return 'grey';
      case 'sleep':
        return 'blue';
      case 'maintenance':
        return 'orange';
      default:
        return 'grey';
    }
  }

  /// 格式化电量
  static String formatBattery(int? level) {
    if (level == null) return '未知';
    if (level >= 80) return '🟢 $level%';
    if (level >= 50) return '🟡 $level%';
    if (level >= 20) return '🟠 $level%';
    return '🔴 $level%';
  }

  /// 格式化信号强度
  static String formatSignal(int? rssi) {
    if (rssi == null) return '未知';
    if (rssi >= -50) return '🟢 强';
    if (rssi >= -70) return '🟡 中';
    if (rssi >= -90) return '🟠 弱';
    return '🔴 极弱';
  }
}

/// 睡眠数据工具
class SleepUtils {
  /// 评估睡眠质量
  static String evaluateQuality(int sleepMinutes) {
    if (sleepMinutes >= 420) return '优秀'; // >= 7小时
    if (sleepMinutes >= 360) return '良好'; // >= 6小时
    if (sleepMinutes >= 300) return '一般'; // >= 5小时
    return '较差';
  }

  /// 获取质量颜色
  static int getQualityColor(String quality) {
    switch (quality) {
      case '优秀':
        return 0xFF4CAF50;
      case '良好':
        return 0xFF8BC34A;
      case '一般':
        return 0xFFFFC107;
      case '较差':
        return 0xFFFF5722;
      default:
        return 0xFF9E9E9E;
    }
  }

  /// 计算睡眠效率
  static double calculateEfficiency(int totalMinutes, int deepMinutes, int lightMinutes) {
    if (totalMinutes == 0) return 0;
    return (deepMinutes + lightMinutes) / totalMinutes;
  }

  /// 格式化睡眠时段
  static String formatSleepPeriod(DateTime? sleepTime, DateTime? wakeTime) {
    if (sleepTime == null || wakeTime == null) return '未记录';
    final duration = wakeTime.difference(sleepTime);
    return '${DateTimeUtils.formatTime(sleepTime)} - ${DateTimeUtils.formatTime(wakeTime)}';
  }
}

/// 存储键名
class StorageKeys {
  static const String token = 'auth_token';
  static const String userId = 'user_id';
  static const String userInfo = 'user_info';
  static const String deviceList = 'device_list';
  static const String lastDevice = 'last_device';
  static const String settings = 'app_settings';
  static const String theme = 'theme_mode';
}

/// 常量
class AppConstants {
  static const int pageSize = 20;
  static const int maxRetry = 3;
  static const int cacheExpiredMinutes = 5;
  static const Duration connectionTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
}