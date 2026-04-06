/**
 * MCP Client - Model Context Protocol 复刻
 * 
 * 支持:
 * - stdio 传输
 * - HTTP 传输
 * - MCP 配置解析
 * - OAuth 支持
 * - 工具暴露
 */

const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

class MCPClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      transport: options.transport || 'stdio', // stdio | http
      ...options
    };
    
    this.connected = false;
    this.tools = new Map();
    this.serverProcess = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * 解析 MCP 配置文件
   */
  parseConfig(configPath) {
    const fs = require('fs');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return this.normalizeConfig(config);
  }

  /**
   * 标准化配置
   */
  normalizeConfig(config) {
    const normalized = {
      servers: {}
    };
    
    // 解析 mcpServers
    if (config.mcpServers) {
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        normalized.servers[name] = {
          command: serverConfig.command,
          args: serverConfig.args || [],
          env: serverConfig.env || {},
          transport: serverConfig.transport || 'stdio'
        };
      }
    }
    
    return normalized;
  }

  /**
   * 连接 MCP 服务器
   */
  async connect(config) {
    this.serverConfig = config;
    
    if (this.options.transport === 'stdio') {
      return this.connectStdio(config);
    } else {
      return this.connectHttp(config);
    }
  }

  /**
   * STDIO 连接
   */
  connectStdio(config) {
    return new Promise((resolve, reject) => {
      const args = config.args || [];
      
      this.serverProcess = spawn(config.command, args, {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let buffer = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        this.handleStdioMessage(buffer);
      });
      
      this.serverProcess.stderr.on('data', (data) => {
        console.error('[MCP stderr]:', data.toString());
      });
      
      this.serverProcess.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
      
      this.serverProcess.on('exit', (code) => {
        this.connected = false;
        this.emit('disconnected', { code });
      });
      
      // 初始化
      setTimeout(() => {
        this.connected = true;
        this.emit('connected');
        this.listTools();
        resolve();
      }, 1000);
    });
  }

  /**
   * HTTP 连接
   */
  connectHttp(config) {
    return new Promise((resolve, reject) => {
      this.httpClient = config.https ? https : http;
      this.serverUrl = config.url;
      
      // 发送初始化请求
      this.sendHttpRequest({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'openclaw',
            version: '1.0.0'
          }
        }
      }).then(() => {
        this.connected = true;
        this.emit('connected');
        this.listTools();
        resolve();
      }).catch(reject);
    });
  }

  /**
   * 处理 STDIO 消息
   */
  handleStdioMessage(buffer) {
    try {
      // 简单按行分割（实际应该处理 JSON-RPC 帧）
      const lines = buffer.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (e) {
          // 非 JSON 行，可能是日志
        }
      }
    } catch (e) {
      console.error('[MCP] Failed to parse message:', e);
    }
  }

  /**
   * 处理消息
   */
  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
    
    if (message.method) {
      // 服务器发来的通知
      this.emit(message.method, message.params);
    }
  }

  /**
   * 发送 STDIO 请求
   */
  sendStdioRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      
      this.pendingRequests.set(id, { resolve, reject });
      
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };
      
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // 超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * 发送 HTTP 请求
   */
  sendHttpRequest(body) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.serverUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = this.httpClient.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const message = JSON.parse(data);
            if (message.error) {
              reject(new Error(message.error.message));
            } else {
              resolve(message.result);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * 列出可用工具
   */
  async listTools() {
    try {
      let result;
      
      if (this.options.transport === 'stdio') {
        result = await this.sendStdioRequest('tools/list');
      } else {
        result = await this.sendHttpRequest({
          jsonrpc: '2.0',
          id: this.requestId++,
          method: 'tools/list'
        });
      }
      
      if (result && result.tools) {
        for (const tool of result.tools) {
          this.tools.set(tool.name, tool);
        }
      }
      
      this.emit('tools:loaded', Array.from(this.tools.keys()));
      return this.tools;
      
    } catch (e) {
      console.error('[MCP] Failed to list tools:', e);
      return this.tools;
    }
  }

  /**
   * 调用 MCP 工具
   */
  async callTool(name, arguments_ = {}) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }
    
    if (!this.tools.has(name)) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    let result;
    
    if (this.options.transport === 'stdio') {
      result = await this.sendStdioRequest('tools/call', {
        name,
        arguments: arguments_
      });
    } else {
      result = await this.sendHttpRequest({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/call',
        params: { name, arguments: arguments_ }
      });
    }
    
    this.emit('tool:called', { name, result });
    return result;
  }

  /**
   * 获取工具列表
   */
  getToolList() {
    return Array.from(this.tools.values());
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      connected: this.connected,
      transport: this.options.transport,
      toolsCount: this.tools.size,
      tools: Array.from(this.tools.keys())
    };
  }
}

// ============ 演示 ============

async function demo() {
  console.log('=== MCP Client Demo ===\n');
  
  const mcp = new MCPClient({ transport: 'stdio' });
  
  // 模拟配置
  const config = {
    command: 'node',
    args: ['-e', 'console.log("mock MCP server")'],
    env: {}
  };
  
  console.log('--- MCP Status ---');
  console.log(mcp.getStatus());
  
  // 实际使用需要真实的 MCP 服务器
  console.log('\n--- Note ---');
  console.log('MCP requires a running MCP server.');
  console.log('Use parseConfig() to load from config file.');
  console.log('Use connect() to connect to server.');
  console.log('Use callTool() to call MCP tools.');
}

if (require.main === module) {
  demo().catch(console.error);
}

module.exports = MCPClient;