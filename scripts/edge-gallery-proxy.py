#!/usr/bin/env python3
"""
Google AI Edge Gallery 网络代理
让本地模型通过电脑/服务器网络访问互联网

使用方法:
    # 电脑端运行服务器
    python edge-gallery-proxy.py server
    
    # 手机端通过 Termux 连接
    ssh -L 8080:localhost:8080 user@电脑IP
    # 或在 Termux 中
    export http_proxy=http://电脑IP:8080
    export https_proxy=http://电脑IP:8080
"""

import http.server
import socketserver
import socket
import threading
import argparse
import sys
import ssl
import select

PORT = 8080
BUFFER_SIZE = 65536

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_CONNECT(self):
        """处理 HTTPS 请求"""
        host, port = self.path.split(':')
        port = int(port)
        
        try:
            # 连接到目标服务器
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((host, port))
            
            # 发送 200 Connection Established
            self.send_response(200, 'Connection Established')
            self.end_headers()
            
            # 创建 SSL 隧道 (简单的，不验证证书)
            try:
                sock = ssl.wrap_socket(sock, cert_reqs=ssl.CERT_NONE)
            except:
                pass  # 有些服务器不支持 SSL
            
            # 双向转发
            self.connection.setblocking(False)
            sock.setblocking(False)
            
            while True:
                r, w, x = select.select([self.connection, sock], [], [], 30)
                if not r:
                    break
                    
                for ready in r:
                    if ready is self.connection:
                        data = self.connection.recv(BUFFER_SIZE)
                        if data:
                            sock.sendall(data)
                    else:
                        data = sock.recv(BUFFER_SIZE)
                        if data:
                            self.connection.sendall(data)
                            
        except Exception as e:
            self.send_error(502, str(e))
        finally:
            try:
                sock.close()
            except:
                pass

    def do_GET(self):
        """处理 HTTP 请求 (主要用于测试)"""
        # 简单的测试页面
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'''
            <html>
            <head><title>Edge Gallery Proxy</title></head>
            <body>
                <h1>✅ 代理服务器运行中</h1>
                <p>请在 Termux 中设置:</p>
                <pre>export http_proxy=http://[服务器IP]:8080
export https_proxy=http://[服务器IP]:8080</pre>
            </body>
            </html>
            ''')
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        print(f"[PROXY] {args[0]}")

def start_server():
    """启动代理服务器"""
    with socketserver.ThreadingTCPServer(("", PORT), ProxyHandler) as httpd:
        print(f"""
╔═══════════════════════════════════════════════════════════╗
║     🌐 Google AI Edge Gallery 代理服务器                  ║
╠═══════════════════════════════════════════════════════════╣
║  服务器运行中: http://0.0.0.0:{PORT}                       ║
║                                                           ║
║  📱 手机端设置 (Termux):                                   ║
║                                                           ║
║    export http_proxy=http://[服务器IP]:{PORT}              ║
║    export https_proxy=http://[服务器IP]:{PORT}             ║
║                                                           ║
║  🔧 或者用 SSH 隧道:                                       ║
║                                                           ║
║    ssh -L {PORT}:localhost:{PORT} user@服务器IP            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        """)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 代理服务器已停止")
            sys.exit(0)

def test_connection():
    """测试代理是否工作"""
    import urllib.request
    try:
        proxy_handler = urllib.request.ProxyHandler({'http': f'http://localhost:{PORT}'})
        opener = urllib.request.build_opener(proxy_handler)
        resp = opener.open('http://httpbin.org/ip', timeout=10)
        print(f"✅ 代理工作正常! IP: {resp.read().decode()}")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Edge Gallery 网络代理')
    parser.add_argument('command', nargs='?', default='server', 
                       choices=['server', 'test'], help='命令')
    args = parser.parse_args()
    
    if args.command == 'server':
        start_server()
    elif args.command == 'test':
        test_connection()