import 'package:dio/dio.dart';
import '../core/constants/app_constants.dart';
import '../core/constants/error_constants.dart';
import '../core/models/device_model.dart';
import '../core/models/user_model.dart';

/// API 服务异常
class ApiException implements Exception {
  final String message;
  final int? code;
  final dynamic originalError;

  ApiException(this.message, {this.code, this.originalError});

  @override
  String toString() => 'ApiException: $message (code: $code)';
}

/// API 响应封装
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? code;

  ApiResponse({required this.success, this.data, this.message, this.code});
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;
  String? _token;

  ApiService._internal();

  void init() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // 统一错误处理
        return handler.next(error);
      },
    ));
  }

  void setToken(String token) => _token = token;
  void clearToken() => _token = null;

  // ============ 认证相关 ============

  /// 发送验证码
  Future<ApiResponse<bool>> sendCode(String phone) async {
    try {
      final response = await _dio.post('/auth/send-code', data: {'phone': phone});
      return ApiResponse(success: true, data: true, message: '验证码已发送');
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 登录
  Future<ApiResponse<User>> login(String phone, String code) async {
    try {
      final response = await _dio.post('/auth/login', data: {'phone': phone, 'code': code});
      final token = response.data['token'] as String?;
      if (token != null) setToken(token);
      return ApiResponse(success: true, data: User.fromJson(response.data['user']));
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 登出
  Future<ApiResponse<bool>> logout() async {
    try {
      await _dio.post('/auth/logout');
      clearToken();
      return ApiResponse(success: true, data: true);
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  // ============ 用户相关 ============

  /// 获取用户信息
  Future<ApiResponse<User>> getUserInfo() async {
    try {
      final response = await _dio.get('/user/info');
      return ApiResponse(success: true, data: User.fromJson(response.data));
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 更新用户信息
  Future<ApiResponse<User>> updateUserInfo(Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/user/info', data: data);
      return ApiResponse(success: true, data: User.fromJson(response.data));
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  // ============ 设备相关 ============

  /// 获取设备列表
  Future<ApiResponse<List<Device>>> getDevices() async {
    try {
      final response = await _dio.get('/devices');
      final list = (response.data['devices'] as List)
          .map((d) => Device.fromJson(d))
          .toList();
      return ApiResponse(success: true, data: list);
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 获取设备详情
  Future<ApiResponse<Device>> getDevice(String deviceId) async {
    try {
      final response = await _dio.get('/devices/$deviceId');
      return ApiResponse(success: true, data: Device.fromJson(response.data));
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 获取设备状态
  Future<ApiResponse<DeviceStatusResponse>> getDeviceStatus(String deviceId) async {
    try {
      final response = await _dio.get('/devices/$deviceId/status');
      return ApiResponse(success: true, data: DeviceStatusResponse.fromJson(response.data));
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 控制设备
  Future<ApiResponse<bool>> controlDevice(String deviceId, String command, Map<String, dynamic> params) async {
    try {
      await _dio.post('/devices/$deviceId/control', data: {'command': command, 'params': params});
      return ApiResponse(success: true, data: true);
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 绑定设备
  Future<ApiResponse<Device>> bindDevice(String serialNumber) async {
    try {
      final response = await _dio.post('/devices/bind', data: {'serial_number': serialNumber});
      return ApiResponse(success: true, data: Device.fromJson(response.data));
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 解绑设备
  Future<ApiResponse<bool>> unbindDevice(String deviceId) async {
    try {
      await _dio.delete('/devices/$deviceId');
      return ApiResponse(success: true, data: true);
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  // ============ 睡眠数据 ============

  /// 获取睡眠数据
  Future<ApiResponse<Map<String, dynamic>>> getSleepData(String deviceId, DateTime start, DateTime end) async {
    try {
      final response = await _dio.get('/devices/$deviceId/sleep-data', queryParameters: {
        'start': start.toIso8601String(),
        'end': end.toIso8601String(),
      });
      return ApiResponse(success: true, data: response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  /// 获取睡眠报告
  Future<ApiResponse<Map<String, dynamic>>> getSleepReport(String deviceId, String date) async {
    try {
      final response = await _dio.get('/devices/$deviceId/sleep-report', queryParameters: {'date': date});
      return ApiResponse(success: true, data: response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      return ApiResponse(success: false, message: _handleError(e));
    }
  }

  // ============ 错误处理 ============

  String _handleError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ErrorConstants.networkTimeout;
      case DioExceptionType.connectionError:
        return ErrorConstants.networkError;
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        if (statusCode == 401) return ErrorConstants.unauthorized;
        if (statusCode == 403) return ErrorConstants.forbidden;
        if (statusCode == 404) return ErrorConstants.notFound;
        if (statusCode == 500) return ErrorConstants.serverError;
        return e.response?.data?['message'] ?? ErrorConstants.unknownError;
      default:
        return ErrorConstants.unknownError;
    }
  }
}