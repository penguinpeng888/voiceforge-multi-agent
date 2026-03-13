import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';
import '../core/models/device_model.dart';
import '../widgets/common_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // 页面加载时获取设备列表
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeviceProvider>().loadDevices();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('睡眠舱'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showBindDeviceDialog,
            tooltip: '绑定设备',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<DeviceProvider>().refreshDevices(),
            tooltip: '刷新',
          ),
        ],
      ),
      body: Column(
        children: [
          // 搜索栏
          _buildSearchBar(),
          // 设备列表
          Expanded(child: _buildDeviceList()),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: Colors.indigo,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: '搜索设备...',
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    context.read<DeviceProvider>().setSearchQuery('');
                  },
                )
              : null,
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        onChanged: (value) => context.read<DeviceProvider>().setSearchQuery(value),
      ),
    );
  }

  Widget _buildDeviceList() {
    return Consumer<DeviceProvider>(
      builder: (context, provider, _) {
        // 加载中
        if (provider.isLoading && provider.devices.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        // 加载错误
        if (provider.hasError && provider.devices.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                Text(provider.errorMessage ?? '加载失败'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => provider.loadDevices(),
                  child: const Text('重试'),
                ),
              ],
            ),
          );
        }

        // 空状态
        if (provider.devices.isEmpty) {
          return _buildEmptyState();
        }

        // 下拉刷新
        return RefreshIndicator(
          onRefresh: () => provider.refreshDevices(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.devices.length,
            itemBuilder: (context, index) {
              final device = provider.devices[index];
              return _buildDeviceCard(device);
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.device_unknown, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text('未发现设备', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
          const SizedBox(height: 8),
          Text('点击右上角 + 绑定设备', style: TextStyle(color: Colors.grey[500])),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _showBindDeviceDialog,
            icon: const Icon(Icons.add),
            label: const Text('绑定设备'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceCard(Device device) {
    final isOnline = device.status == 'online';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _navigateToDevice(device),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // 设备图标
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: isOnline ? Colors.indigo[50] : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.bed,
                  size: 32,
                  color: isOnline ? Colors.indigo : Colors.grey,
                ),
              ),
              const SizedBox(width: 16),
              // 设备信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      device.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          isOnline ? Icons.wifi : Icons.wifi_off,
                          size: 14,
                          color: isOnline ? Colors.green : Colors.grey,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isOnline ? '在线' : '离线',
                          style: TextStyle(
                            fontSize: 12,
                            color: isOnline ? Colors.green : Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          device.type == 'home' ? '家用' : '医用',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    if (device.modules != null) ...[
                      const SizedBox(height: 8),
                      _buildModuleStatus(device),
                    ],
                  ],
                ),
              ),
              // 箭头
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModuleStatus(Device device) {
    final modules = device.modules;
    if (modules == null) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: [
        if (modules.music?.playing == true)
          _buildModuleTag(Icons.music_note, '音乐', Colors.green),
        if (modules.light?.power == true)
          _buildModuleTag(Icons.lightbulb, '灯光', Colors.amber),
        if (modules.massage?.active == true)
          _buildModuleTag(Icons.massage, '按摩', Colors.blue),
        if (modules.scent?.active == true)
          _buildModuleTag(Icons.air, '香气', Colors.purple),
      ],
    );
  }

  Widget _buildModuleTag(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 10, color: color)),
        ],
      ),
    );
  }

  void _navigateToDevice(Device device) {
    context.read<DeviceProvider>().selectDevice(device);
    Navigator.pushNamed(context, '/device');
  }

  void _showBindDeviceDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('绑定设备'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: '设备序列号',
            hintText: '请输入设备背面的序列号',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                final success = await context.read<DeviceProvider>().bindDevice(controller.text);
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(success ? '绑定成功' : '绑定失败')),
                  );
                }
              }
            },
            child: const Text('绑定'),
          ),
        ],
      ),
    );
  }
}