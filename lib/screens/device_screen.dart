import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';
import '../core/models/device_model.dart';

class DeviceScreen extends StatefulWidget {
  const DeviceScreen({super.key});

  @override
  State<DeviceScreen> createState() => _DeviceScreenState();
}

class _DeviceScreenState extends State<DeviceScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DeviceProvider>(
      builder: (context, provider, _) {
        final device = provider.selectedDevice;

        if (device == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('设备控制')),
            body: const Center(child: Text('未选择设备')),
          );
        }

        return Scaffold(
          backgroundColor: Colors.grey[100],
          appBar: AppBar(
            title: Text(device.name),
            backgroundColor: Colors.indigo,
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => provider.refreshDeviceStatus(),
                tooltip: '刷新状态',
              ),
              PopupMenuButton<String>(
                onSelected: (value) => _handleMenuAction(value, provider, device),
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'unbind', child: Text('解绑设备')),
                  const PopupMenuItem(value: 'info', child: Text('设备信息')),
                ],
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: Colors.white,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              tabs: const [
                Tab(icon: Icon(Icons.power), text: '电源'),
                Tab(icon: Icon(Icons.music_note), text: '音乐'),
                Tab(icon: Icon(Icons.lightbulb), text: '灯光'),
                Tab(icon: Icon(Icons.more_horiz), text: '更多'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildPowerTab(device, provider),
              _buildMusicTab(device, provider),
              _buildLightTab(device, provider),
              _buildMoreTab(device, provider),
            ],
          ),
        );
      },
    );
  }

  // ============ 电源控制 ============

  Widget _buildPowerTab(Device device, DeviceProvider provider) {
    final isOnline = device.status == 'online';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 电源状态卡片
          _buildStatusCard(
            icon: Icons.power_settings_new,
            title: '电源状态',
            subtitle: isOnline ? '设备已开启' : '设备已关闭',
            trailing: Switch(
              value: isOnline,
              activeColor: Colors.indigo,
              onChanged: (value) => value ? provider.powerOn() : provider.powerOff(),
            ),
          ),
          const SizedBox(height: 16),
          // 功率模式
          _buildStatusCard(
            icon: Icons.bolt,
            title: '功率模式',
            subtitle: _getPowerModeText(device.powerMode),
          ),
          const SizedBox(height: 16),
          // 快捷操作
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('快捷操作', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildQuickActionButton(
                          icon: Icons.bedtime,
                          label: '启动睡眠',
                          onPressed: isOnline ? () => provider.startSleepMode() : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildQuickActionButton(
                          icon: Icons.timer,
                          label: '定时关机',
                          onPressed: isOnline ? () => _showTimerDialog(provider) : null,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getPowerModeText(String mode) {
    switch (mode) {
      case 'normal': return '正常模式';
      case 'sleep': return '睡眠模式';
      case 'deep_sleep': return '深度睡眠';
      case 'off': return '关机';
      default: return '未知';
    }
  }

  // ============ 音乐控制 ============

  Widget _buildMusicTab(Device device, DeviceProvider provider) {
    final music = device.modules?.music;
    final isPlaying = music?.playing ?? false;
    final isOnline = device.status == 'online';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 播放控制卡片
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(Icons.music_note, size: 80, color: isPlaying ? Colors.indigo : Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    music?.trackName ?? '未播放',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.skip_previous, size: 36),
                        onPressed: isOnline && isPlaying ? () {} : null,
                      ),
                      const SizedBox(width: 16),
                      IconButton(
                        icon: Icon(
                          isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                          size: 64,
                          color: Colors.indigo,
                        ),
                        onPressed: isOnline
                            ? (isPlaying ? provider.pauseMusic : () => provider.playMusic())
                            : null,
                      ),
                      const SizedBox(width: 16),
                      IconButton(
                        icon: const Icon(Icons.skip_next, size: 36),
                        onPressed: isOnline && isPlaying ? () {} : null,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 音量控制
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('音量', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      const Icon(Icons.volume_down),
                      Expanded(
                        child: Slider(
                          value: (music?.volume ?? 30).toDouble(),
                          min: 0,
                          max: 100,
                          activeColor: Colors.indigo,
                          onChanged: isOnline
                              ? (value) => provider.setVolume(value.toInt())
                              : null,
                        ),
                      ),
                      const Icon(Icons.volume_up),
                    ],
                  ),
                  Center(child: Text('${music?.volume ?? 30}%')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============ 灯光控制 ============

  Widget _buildLightTab(Device device, DeviceProvider provider) {
    final light = device.modules?.light;
    final isOn = light?.power ?? false;
    final isOnline = device.status == 'online';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 灯光开关
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    isOn ? Icons.lightbulb : Icons.lightbulb_outline,
                    size: 48,
                    color: isOn ? Colors.amber : Colors.grey,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('灯光', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(isOn ? '已开启' : '已关闭', style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                  ),
                  Switch(
                    value: isOn,
                    activeColor: Colors.amber,
                    onChanged: isOnline
                        ? (value) => value ? provider.lightOn() : provider.lightOff()
                        : null,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 亮度调节
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('亮度', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      const Icon(Icons.brightness_low),
                      Expanded(
                        child: Slider(
                          value: (light?.brightness ?? 40).toDouble(),
                          min: 0,
                          max: 100,
                          activeColor: Colors.amber,
                          onChanged: isOnline && isOn
                              ? (value) => provider.setBrightness(value.toInt())
                              : null,
                        ),
                      ),
                      const Icon(Icons.brightness_high),
                    ],
                  ),
                  Center(child: Text('${light?.brightness ?? 40}%')),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 色温调节
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('色温', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      const Text('暖光', style: TextStyle(color: Colors.orange)),
                      Expanded(
                        child: Slider(
                          value: (light?.colorTemp ?? 3200).toDouble(),
                          min: 2700,
                          max: 6500,
                          activeColor: Colors.orange,
                          onChanged: isOnline && isOn
                              ? (value) => provider.setColorTemp(value.toInt())
                              : null,
                        ),
                      ),
                      const Text('冷光', style: TextStyle(color: Colors.blue)),
                    ],
                  ),
                  Center(child: Text('${light?.colorTemp ?? 3200}K')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============ 更多功能 ============

  Widget _buildMoreTab(Device device, DeviceProvider provider) {
    final massage = device.modules?.massage;
    final scent = device.modules?.scent;
    final isOnline = device.status == 'online';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 按摩控制
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.massage, size: 32, color: massage?.active == true ? Colors.blue : Colors.grey),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text('按摩', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                      Switch(
                        value: massage?.active ?? false,
                        activeColor: Colors.blue,
                        onChanged: isOnline
                            ? (value) => value ? provider.startMassage() : provider.stopMassage()
                            : null,
                      ),
                    ],
                  ),
                  if (massage?.active == true) ...[
                    const SizedBox(height: 16),
                    const Text('强度', style: TextStyle(fontSize: 14)),
                    Slider(
                      value: (massage?.intensity ?? 5).toDouble(),
                      min: 1,
                      max: 10,
                      activeColor: Colors.blue,
                      onChanged: isOnline
                          ? (value) => provider.setMassageIntensity(value.toInt())
                          : null,
                    ),
                    Center(child: Text('${massage?.intensity ?? 5}/10')),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 香气控制
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.air, size: 32, color: scent?.active == true ? Colors.purple : Colors.grey),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text('香气', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                      Switch(
                        value: scent?.active ?? false,
                        activeColor: Colors.purple,
                        onChanged: isOnline
                            ? (value) => value ? provider.startScent() : provider.stopScent()
                            : null,
                      ),
                    ],
                  ),
                  if (scent?.active == true) ...[
                    const SizedBox(height: 16),
                    const Text('浓度', style: TextStyle(fontSize: 14)),
                    Slider(
                      value: (scent?.concentration ?? 50).toDouble(),
                      min: 0,
                      max: 100,
                      activeColor: Colors.purple,
                      onChanged: isOnline
                          ? (value) => provider.setScentConcentration(value.toInt())
                          : null,
                    ),
                    Center(child: Text('${scent?.concentration ?? 50}%')),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============ 通用组件 ============

  Widget _buildStatusCard({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
  }) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, size: 32, color: Colors.indigo),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(subtitle, style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            ),
            if (trailing != null) trailing,
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback? onPressed,
  }) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Column(
        children: [
          Icon(icon),
          const SizedBox(height: 4),
          Text(label),
        ],
      ),
    );
  }

  void _handleMenuAction(String action, DeviceProvider provider, Device device) {
    switch (action) {
      case 'unbind':
        _showUnbindDialog(provider, device);
        break;
      case 'info':
        _showDeviceInfo(device);
        break;
    }
  }

  void _showUnbindDialog(DeviceProvider provider, Device device) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('解绑设备'),
        content: Text('确定要解绑 "${device.name}" 吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              final success = await provider.unbindDevice(device.id);
              if (context.mounted) {
                Navigator.pop(context);
                if (success) {
                  Navigator.pop(context);
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('解绑'),
          ),
        ],
      ),
    );
  }

  void _showDeviceInfo(Device device) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('设备信息'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _infoRow('名称', device.name),
            _infoRow('类型', device.type == 'home' ? '家用' : '医用'),
            _infoRow('序列号', device.serialNumber),
            _infoRow('固件版本', device.firmwareVersion),
            _infoRow('状态', device.status),
            if (device.macAddress != null) _infoRow('MAC地址', device.macAddress!),
            if (device.ipAddress != null) _infoRow('IP地址', device.ipAddress!),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text('$label:', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  void _showTimerDialog(DeviceProvider provider) {
    int selectedMinutes = 30;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('定时关机'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('选择定时时长：'),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [15, 30, 60, 120].map((minutes) {
                  return ChoiceChip(
                    label: Text('$minutes 分钟'),
                    selected: selectedMinutes == minutes,
                    onSelected: (selected) {
                      if (selected) setState(() => selectedMinutes = minutes);
                    },
                  );
                }).toList(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                provider.setSleepTimer(selectedMinutes);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('已设置 $selectedMinutes 分钟后关机')),
                );
              },
              child: const Text('确定'),
            ),
          ],
        ),
      ),
    );
  }
}