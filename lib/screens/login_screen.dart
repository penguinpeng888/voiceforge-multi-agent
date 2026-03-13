import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  
  bool _isLoading = false;
  bool _isSendingCode = false;
  int _countdown = 0;
  
  String? _phoneError;
  String? _codeError;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  bool _validate() {
    bool valid = true;
    
    // 验证手机号
    if (!Validators.isValidPhone(_phoneController.text)) {
      setState(() => _phoneError = '请输入正确的手机号');
      valid = false;
    } else {
      setState(() => _phoneError = null);
    }
    
    // 验证验证码
    if (!Validators.isValidCode(_codeController.text)) {
      setState(() => _codeError = '请输入4-6位验证码');
      valid = false;
    } else {
      setState(() => _codeError = null);
    }
    
    return valid;
  }

  Future<void> _sendCode() async {
    final phone = _phoneController.text.trim();
    
    if (!Validators.isValidPhone(phone)) {
      setState(() => _phoneError = '请输入正确的手机号');
      return;
    }
    
    setState(() {
      _isSendingCode = true;
      _phoneError = null;
    });
    
    final api = ApiService();
    final result = await api.sendCode(phone);
    
    if (result.success) {
      // 开始倒计时
      setState(() => _countdown = 60);
      _startCountdown();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('验证码已发送')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message ?? '发送失败')),
        );
      }
    }
    
    setState(() => _isSendingCode = false);
  }

  void _startCountdown() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        if (_countdown > 0) {
          _countdown--;
          _startCountdown();
        }
      });
    });
  }

  Future<void> _login() async {
    if (!_validate()) return;
    
    setState(() => _isLoading = true);
    
    final api = ApiService();
    final result = await api.login(
      _phoneController.text.trim(),
      _codeController.text.trim(),
    );
    
    setState(() => _isLoading = false);
    
    if (result.success && result.data != null) {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message ?? '登录失败')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              // Logo
              const Icon(
                Icons.bedtime,
                size: 80,
                color: Colors.indigo,
              ),
              const SizedBox(height: 16),
              // 标题
              const Text(
                '睡眠舱',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.indigo,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                '智能睡眠控制系统',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              
              // 手机号输入
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                maxLength: 11,
                enabled: !_isLoading,
                decoration: InputDecoration(
                  labelText: '手机号',
                  hintText: '请输入手机号',
                  prefixIcon: const Icon(Icons.phone_android),
                  counterText: '',
                  errorText: _phoneError,
                ),
                onChanged: (_) {
                  if (_phoneError != null) {
                    setState(() => _phoneError = null);
                  }
                },
              ),
              const SizedBox(height: 16),
              
              // 验证码输入
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _codeController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      enabled: !_isLoading,
                      decoration: InputDecoration(
                        labelText: '验证码',
                        hintText: '请输入验证码',
                        prefixIcon: const Icon(Icons.lock_outline),
                        counterText: '',
                        errorText: _codeError,
                      ),
                      onChanged: (_) {
                        if (_codeError != null) {
                          setState(() => _codeError = null);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _countdown > 0 || _isSendingCode || _isLoading
                          ? null
                          : _sendCode,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      child: _countdown > 0
                          ? Text('$_countdown s')
                          : _isSendingCode
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('获取验证码'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              
              // 登录按钮
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          '登录',
                          style: TextStyle(fontSize: 18),
                        ),
                ),
              ),
              const SizedBox(height: 24),
              
              // 其他登录方式
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton.icon(
                    onPressed: () {
                      // TODO: 微信登录
                    },
                    icon: const Icon(Icons.chat),
                    label: const Text('微信登录'),
                  ),
                  const SizedBox(width: 24),
                  TextButton.icon(
                    onPressed: () {
                      // TODO: Apple 登录 (iOS)
                    },
                    icon: const Icon(Icons.apple),
                    label: const Text('Apple 登录'),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // 用户协议
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '登录即表示同意',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                  TextButton(
                    onPressed: () {
                      // TODO: 显示用户协议
                    },
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 0),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      '《用户协议》',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                  Text(
                    '和',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                  TextButton(
                    onPressed: () {
                      // TODO: 显示隐私政策
                    },
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 0),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      '《隐私政策》',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}