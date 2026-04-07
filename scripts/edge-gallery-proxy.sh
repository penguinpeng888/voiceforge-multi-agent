#!/bin/bash
# Google AI Edge Gallery 网络代理脚本
# 将手机流量通过电脑/服务器转发

# 配置
PHONE_IP="192.168.1.xxx"  # 你的手机局域网IP
SERVER_IP="192.168.1.xxx"  # 你的服务器/电脑IP
PROXY_PORT=1080
SERVER_PORT=3000

echo "📱 Google AI Edge Gallery 网络代理设置"
echo "========================================"

# 检查 ADB
if ! command -v adb &> /dev/null; then
    echo "❌ ADB 未安装，请先安装: brew install android-platform-tools"
    exit 1
fi

# 检查手机连接
echo "📱 检查手机连接..."
if ! adb devices | grep -q "device$"; then
    echo "❌ 未检测到手机，请确保 USB 调试已开启"
    exit 1
fi

echo "✅ 手机已连接"

# 方法1: ADB Reverse Proxy (推荐 - 让手机app访问电脑的网络)
setup_reverse_proxy() {
    echo ""
    echo "🔄 启动 ADB Reverse Proxy..."
    adb reverse tcp:8080 tcp:$PROXY_PORT
    echo "✅ 已设置: adb reverse tcp:8080 -> localhost:$PROXY_PORT"
    echo ""
    echo "📝 下一步:"
    echo "1. 在手机上安装 ProxyDroid 或手动设置代理"
    echo "2. 代理地址: 127.0.0.1:8080"
    echo "3. 或者用 Termux 运行: export http_proxy=http://127.0.0.1:8080"
}

# 方法2: 创建 SSH 隧道 (需要手机端运行 SSH server)
setup_ssh_tunnel() {
    echo ""
    echo "🔄 启动 SSH 隧道..."
    echo "需要在手机上安装 Termux 并运行: sshd"
    ssh -N -D 1080 -o "StrictHostKeyChecking=no" user@$PHONE_IP &
    echo "✅ SSH 隧道已建立"
}

# 方法3: 让 OpenClaw 充当中转服务器
setup_openclaw_proxy() {
    echo ""
    echo "🔄 配置 OpenClaw 作为代理..."
    
    # 启动代理服务
    cat > /tmp/proxy-server.js << 'EOF'
const http = require('http');
const net = require('net');

const PORT = 8080;
const TARGET = process.env.TARGET || 'api.openai.com:443';

const server = http.createServer((req, res) => {
    const proxy = net.connect(TARGET, () => {
        proxy.write(req.method + ' ' + req.url + ' HTTP/1.1\r\n');
        for (const [k, v] of Object.entries(req.headers)) {
            if (k !== 'host') proxy.write(k + ': ' + v + '\r\n');
        }
        proxy.write('\r\n');
        
        req.pipe(proxy);
        proxy.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('Proxy server running on port ' + PORT);
});
EOF
    
    node /tmp/proxy-server.js &
    echo "✅ 代理服务已启动在端口 $PORT"
}

# 显示菜单
show_menu() {
    echo ""
    echo "请选择:"
    echo "1. ADB Reverse Proxy (手机 → 电脑)"
    echo "2. SSH Tunnel (需要手机 Termux + sshd)"
    echo "3. OpenClaw 代理 (手机 → OpenClaw服务器)"
    echo "4. 查看当前状态"
    echo "0. 退出"
    echo ""
    echo -n "请输入选项: "
}

# 主循环
while true; do
    show_menu
    read choice
    case $choice in
        1) setup_reverse_proxy ;;
        2) setup_ssh_tunnel ;;
        3) setup_openclaw_proxy ;;
        4) 
            echo ""
            echo "📊 当前状态:"
            adb reverse --list 2>/dev/null || echo "无 reverse 规则"
            ;;
        0) exit 0 ;;
        *) echo "无效选项" ;;
    esac
done