/**
 * OpenClaw Core - Claude Code 核心功能复刻 (优化版)
 * 
 * @version 2.0.0
 * 优化重点：
 * - 模块懒加载
 * - 事件驱动架构
 * - 内存效率优化
 * - 错误恢复机制
 */

const { EventEmitter } = require('events');
const { createLLMProvider } = require('./llm');

class OpenClaw extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxTokens: options.maxTokens || 200000,
      maxToolsParallel: options.maxToolsParallel || 10,
      permissionMode: options.permissionMode || 'auto',
      maxWorkers: options.maxWorkers || 5,
      memoryDir: options.memoryDir || './memory',
      workspaceDir: options.workspaceDir || process.cwd(),
      ...options
    };
    
    // 状态
    this._initialized = false;
    this._turnCount = 0;
    
    // 懒加载实例
    this._lazy = {
      QueryEngine: null,
      PersistentMemory: null,
      PermissionSystem: null,
      Coordinator: null,
      HookSystem: null,
      ConfigSystem: null,
      MCPClient: null
    };

    // 工具注册表
    this._tools = new Map();
    this._toolCategories = {
      concurrent: new Set(['read', 'grep', 'glob', 'find', 'search', 'web-fetch', 'web-search']),
      serial: new Set(['write', 'edit', 'delete', 'bash', 'run', 'execute', 'install'])
    };
    
    // LLM Provider
    this._llm = createLLMProvider({
      config: options.config,
      model: options.model
    });
  }

  get queryEngine() {
    if (!this._lazy.QueryEngine) this._lazy.QueryEngine = new (require('./core/QueryEngine'))();
    return this._lazy.QueryEngine;
  }

  get memory() {
    if (!this._lazy.PersistentMemory) this._lazy.PersistentMemory = new (require('./memory/PersistentMemory'))({memoryDir: this.options.memoryDir, userId: 'default'});
    return this._lazy.PersistentMemory;
  }

  get permissions() {
    if (!this._lazy.PermissionSystem) this._lazy.PermissionSystem = new (require('./permissions/PermissionSystem'))({mode: this.options.permissionMode, workingDir: this.options.workspaceDir});
    return this._lazy.PermissionSystem;
  }

  get coordinator() {
    if (!this._lazy.Coordinator) this._lazy.Coordinator = new (require('./agent/Coordinator'))({maxWorkers: this.options.maxWorkers});
    return this._lazy.Coordinator;
  }

  get hooks() {
    if (!this._lazy.HookSystem) this._lazy.HookSystem = new (require('./hooks/HookSystem'))();
    return this._lazy.HookSystem;
  }

  get config() {
    if (!this._lazy.ConfigSystem) this._lazy.ConfigSystem = new (require('./config/ConfigSystem'))({projectDir: this.options.workspaceDir});
    return this._lazy.ConfigSystem;
  }

  get kairos() {
    if (!this._lazy.KairosDaemon) {
      const { KairosDaemon } = require('./daemon/KairosDaemon');
      this._lazy.KairosDaemon = new KairosDaemon({memoryDir: this.options.memoryDir});
    }
    return this._lazy.KairosDaemon;
  }

  get planner() {
    if (!this._lazy.Ultraplanner) {
      const { Ultraplanner } = require('./planner/Ultraplanner');
      this._lazy.Ultraplanner = new Ultraplanner({workspaceDir: this.options.workspaceDir});
    }
    return this._lazy.Ultraplanner;
  }

  get buddy() {
    if (!this._lazy.BuddySystem) {
      const { BuddySystem } = require('./buddy/BuddySystem');
      this._lazy.BuddySystem = new BuddySystem();
    }
    return this._lazy.BuddySystem;
  }

  get mcp() {
    if (!this._lazy.MCPClient) this._lazy.MCPClient = new (require('./mcp/MCPClient'))();
    return this._lazy.MCPClient;
  }

  get telegram() {
    if (!this._lazy.TelegramIntegration) {
      const { TelegramIntegration } = require('./telegram-integration');
      this._lazy.TelegramIntegration = new TelegramIntegration(this);
    }
    return this._lazy.TelegramIntegration;
  }

  get llm() {
    return this._llm;
  }

  // ============ 初始化 ============

  async init() {
    if (this._initialized) return this;
    
    this.emit('init:start');
    
    try {
      // 加载配置
      this.config.load();
      
      // 设置权限模式
      this.queryEngine.setPermissionMode(this.options.permissionMode);
      this.permissions.setMode(this.options.permissionMode);
      
      // 注册默认工具
      this._registerDefaultTools();
      
      // 连接事件
      this._connectEvents();
      
      this._initialized = true;
      this.emit('init:complete');
      
    } catch (error) {
      this.emit('init:error', error);
      throw error;
    }
    
    return this;
  }

  _registerDefaultTools() {
    const defaultTools = [
      { name: 'read', description: 'Read file contents', concurrent: true },
      { name: 'write', description: 'Write file', serial: true },
      { name: 'edit', description: 'Edit file', serial: true },
      { name: 'bash', description: 'Run shell command', serial: true },
      { name: 'grep', description: 'Search in files', concurrent: true },
      { name: 'glob', description: 'Find files by pattern', concurrent: true },
      { name: 'web-search', description: 'Search web', concurrent: true },
      { name: 'web-fetch', description: 'Fetch URL content', concurrent: true },
      { name: 'mkdir', description: 'Create directory', serial: true },
      { name: 'delete', description: 'Delete file', serial: true }
    ];

    defaultTools.forEach(tool => {
      this.registerTool(tool);
    });
  }

  _connectEvents() {
    this.queryEngine.on('compaction:needed', (data) => {
      this.emit('memory:compaction', data);
    });
    
    this.queryEngine.on('memory:persist', (data) => {
      if (data.type === 'session') {
        this.memory.addProjectMemory('lastSession', data.content);
      }
    });
    
    this.coordinator.on('worker:created', (worker) => {
      this.emit('agent:worker:created', worker);
    });
    
    this.coordinator.on('task:complete', (data) => {
      this.emit('agent:task:complete', data);
    });
  }

  // ============ 工具管理 ============

  registerTool(tool) {
    const { name, description, execute, concurrent, serial } = tool;
    
    const toolDef = {
      name,
      description: description || '',
      isConcurrent: concurrent || this._toolCategories.concurrent.has(name),
      isSerial: serial || this._toolCategories.serial.has(name),
      execute: execute || (() => { throw new Error('Tool not implemented'); })
    };
    
    this._tools.set(name, toolDef);
    this.queryEngine.registerTool(toolDef);
    
    this.emit('tool:registered', { name });
    return this;
  }

  registerTools(tools) {
    tools.forEach(tool => this.registerTool(tool));
    return this;
  }

  getTools() {
    return Array.from(this._tools.values());
  }

  getToolsByCategory(category) {
    return Array.from(this._toolCategories[category] || []);
  }

  // ============ 核心功能 ============

  async query(prompt, options = {}) {
    if (!this._initialized) {
      await this.init();
    }

    this._turnCount++;
    this.emit('query:start', { prompt, turn: this._turnCount });

    try {
      // 触发 prePrompt 钩子
      const hookResult = await this.hooks.prePrompt(prompt);
      if (!hookResult.allowed) {
        throw new Error('Hook blocked prompt');
      }

      // 获取持久记忆
      const context = this.memory.getAllForContext();

      // 添加用户消息
      this.queryEngine.addMessage('user', prompt);

      // 构建上下文
      const messages = [
        ...(context.user.role ? [{ role: 'system', content: 'Your role: ' + context.user.role }] : []),
        ...this.queryEngine.messages
      ];

      // 调用 LLM
      const response = await this._callLLM(messages);

      // 处理工具调用
      if (response.tool_calls && response.tool_calls.length > 0) {
        // 预检查权限
        for (const call of response.tool_calls) {
          const preResult = await this.hooks.preToolUse(call.name, call.input);
          if (!preResult.allowed) {
            response.tool_calls = response.tool_calls.filter(c => c.name !== call.name);
          }
        }
        
        if (response.tool_calls.length > 0) {
          const results = await this.queryEngine.executeTools(response.tool_calls);
          
          // 后处理
          for (const result of results) {
            await this.hooks.postToolUse(result.tool, result.input, result);
          }
          
          // 添加助手消息和工具结果
          const assistantMsg = {
            role: 'assistant',
            tool_calls: response.tool_calls.map(tc => ({
              type: 'function',
              id: 'call_' + Math.random().toString(36).substr(2, 9),
              function: { name: tc.name, arguments: JSON.stringify(tc.input) }
            }))
          };
          const toolMessages = results.map(r => ({
            role: 'tool',
            content: typeof r.result === 'string' ? r.result : JSON.stringify(r.result),
            tool_call_id: r.tool
          }));
          const finalMessages = [...messages, assistantMsg, ...toolMessages];
          const finalResponse = await this._callLLM(finalMessages, options);
          
          this.emit('query:complete', { response: finalResponse, toolResults: results });
          return { response: finalResponse, toolResults: results };
        }
      }

      this.emit('query:complete', { response });
      return { response };
      
    } catch (error) {
      this.emit('query:error', error);
      throw error;
    }
  }

  async _callLLM(messages, options = {}) {
    const tools = [];
    for (const [name, tool] of this._tools) {
      tools.push({
        name,
        description: tool.description,
        schema: tool.schema || this._createDefaultSchema(name)
      });
    }

    try {
      const result = await this._llm.complete(messages, {
        tools: tools.length > 0 ? tools : undefined,
        maxTokens: Math.min(options.maxTokens || this.options.maxTokens, 32000),
        temperature: options.temperature || 0.7
      });

      return { 
        content: result.content, 
        role: result.role || 'assistant', 
        tool_calls: result.tool_calls?.map(tc => ({ name: tc.name, input: tc.arguments })) || [], 
        finish_reason: result.finish_reason,
        usage: result.usage 
      };
    } catch (error) {
      this.emit('llm:error', error);
      return { 
        content: 'LLM error: ' + error.message, 
        role: 'assistant', 
        tool_calls: [], 
        error: error.message 
      };
    }
  }

  _createDefaultSchema(name) {
    const schemas = {
      read: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      write: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
      edit: { type: 'object', properties: { path: { type: 'string' }, oldText: { type: 'string' }, newText: { type: 'string' } }, required: ['path', 'oldText', 'newText'] },
      delete: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      mkdir: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      bash: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
      grep: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } }, required: ['pattern'] },
      glob: { type: 'object', properties: { pattern: { type: 'string' }, cwd: { type: 'string' } }, required: ['pattern'] },
      ls: { type: 'object', properties: { path: { type: 'string' } } },
      'web-search': { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      'web-fetch': { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
      'git-status': { type: 'object', properties: { path: { type: 'string' } } },
      'git-log': { type: 'object', properties: { path: { type: 'string' }, limit: { type: 'number' } } },
      npm: { type: 'object', properties: { command: { type: 'string' }, pkg: { type: 'string' } }, required: ['command'] },
      env: { type: 'object', properties: { filter: { type: 'string' } } },
      uuid: { type: 'object', properties: { count: { type: 'number' } } },
      hash: { type: 'object', properties: { data: { type: 'string' }, algorithm: { type: 'string' } }, required: ['data'] },
      date: { type: 'object', properties: { timestamp: { type: 'number' }, format: { type: 'string' } } },
      'system-info': { type: 'object', properties: {} },
      'cpu-usage': { type: 'object', properties: {} },
      'memory-usage': { type: 'object', properties: {} }
    };
    return schemas[name] || { type: 'object', properties: {} };
  }

  async consolidateMemory() {
    await this.queryEngine.compact();
    const stats = this.memory.consolidate();
    this.emit('memory:consolidated', stats);
    return stats;
  }

  async parallelExecute(tasks) {
    return this.coordinator.executeParallel(tasks);
  }

  setPermissionMode(mode) {
    this.options.permissionMode = mode;
    this.permissions.setMode(mode);
    this.queryEngine.setPermissionMode(mode);
    this.emit('permission:changed', { mode });
  }

  // ============ 状态 ============

  getStatus() {
    return {
      initialized: this._initialized,
      turnCount: this._turnCount,
      tools: {
        total: this._tools.size,
        concurrent: this.getToolsByCategory('concurrent').length,
        serial: this.getToolsByCategory('serial').length
      },
      llm: this.llm.getStatus(),
      queryEngine: this.queryEngine.getState(),
      memory: this.memory.generateSummary(),
      permissions: this.permissions.getStats(),
      coordinator: this.coordinator.getStats(),
      hooks: this.hooks.getStats(),
      config: this.config.loaded
    };
  }

  getHealth() {
    return {
      status: this._initialized ? 'healthy' : 'initializing',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      turnCount: this._turnCount
    };
  }

  async shutdown() {
    this.emit('shutdown:start');
    if (this._daemon) {
      await this._daemon.stop();
    }
    await this.coordinator.terminateAll();
    this.emit('shutdown:complete');
  }
}

function createOpenClaw(options) {
  return new OpenClaw(options);
}

module.exports = { OpenClaw, createOpenClaw };