/**
 * QueryEngine - Claude Code 核心查询引擎 (优化版)
 * 
 * 优化：
 * - 内存高效的消息管理
 * - 增量压缩
 * - 错误恢复
 */

const { EventEmitter } = require('events');

class QueryEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxTokens: options.maxTokens || 200000,
      maxToolsParallel: options.maxToolsParallel || 10,
      ...options
    };
    
    // 消息历史（使用高效存储）
    this._messages = [];
    this._messageCount = 0;
    this._toolResults = [];
    this._maxMessages = 1000;
    this._maxToolResults = 100;
    
    // 内存压缩配置（5级）
    this.compactionConfig = {
      micro: { tokens: 8000, strategy: 'clear_old_tool_results' },
      context: { tokens: 40000, strategy: 'summarize_spans' },
      session: { tokens: 80000, strategy: 'extract_to_file' },
      full: { tokens: 150000, strategy: 'summarize_history' },
      ptl: { tokens: 180000, strategy: 'drop_oldest_groups' }
    };
    
    this.currentCompactionLevel = 'none';
    
    // 工具注册
    this.tools = new Map();
    this.concurrentTools = new Set(['read', 'grep', 'glob', 'find', 'search', 'web-fetch', 'web-search']);
    this.serialTools = new Set(['write', 'edit', 'delete', 'bash', 'run', 'execute', 'install', 'mkdir']);
    
    // 权限模式
    this.permissionMode = 'auto';
    
    // 状态
    this.isRunning = false;
    this.turnCount = 0;
  }

  // 消息管理（内存优化）
  get messages() {
    return this._messages;
  }

  get toolResults() {
    return this._toolResults;
  }

  /**
   * 注册工具
   */
  registerTool(tool) {
    const { name, description, schema, isConcurrent, isSerial, execute } = tool;
    
    const toolDef = {
      name,
      description: description || '',
      schema: schema || {},
      isConcurrent: isConcurrent !== undefined ? isConcurrent : this.concurrentTools.has(name),
      isSerial: isSerial !== undefined ? isSerial : this.serialTools.has(name),
      execute
    };
    
    this.tools.set(name, toolDef);
    
    // 更新分类
    if (isConcurrent) {
      this.concurrentTools.add(name);
      this.serialTools.delete(name);
    } else if (isSerial) {
      this.serialTools.add(name);
      this.concurrentTools.delete(name);
    }
    
    return this;
  }

  /**
   * 添加消息
   */
  addMessage(role, content, options = {}) {
    const message = {
      role,
      content,
      timestamp: Date.now(),
      tokenEstimate: this._estimateTokens(content),
      ...options
    };
    
    this._messages.push(message);
    this._messageCount++;
    
    // 内存保护
    if (this._messages.length > this._maxMessages) {
      this._messages = this._messages.slice(-this._maxMessages / 2);
    }
    
    // 检查压缩
    this.checkCompaction();
    
    return message;
  }

  /**
   * 估算 token 数
   */
  _estimateTokens(text) {
    return Math.ceil((text?.length || 0) / 4);
  }

  /**
   * 获取上下文大小
   */
  estimateContextSize() {
    const msgTokens = this._messages.reduce((sum, m) => sum + (m.tokenEstimate || 0), 0);
    const toolTokens = this._toolResults.length * 200;
    return msgTokens + toolTokens;
  }

  /**
   * 检查压缩
   */
  checkCompaction() {
    const size = this.estimateContextSize();
    
    for (const [level, config] of Object.entries(this.compactionConfig)) {
      if (size >= config.tokens) {
        if (level !== this.currentCompactionLevel) {
          this.currentCompactionLevel = level;
          this.emit('compaction:needed', { level, strategy: config.strategy, size });
        }
        return level;
      }
    }
    
    return 'none';
  }

  /**
   * 执行压缩
   */
  async compact(level = null) {
    const targetLevel = level || this.currentCompactionLevel;
    const config = this.compactionConfig[targetLevel];
    
    if (!config) return;
    
    this.emit('compaction:start', { level: targetLevel, strategy: config.strategy });
    
    try {
      switch (config.strategy) {
        case 'clear_old_tool_results':
          // Micro: 清理旧工具结果
          if (this._toolResults.length > 20) {
            this._toolResults = this._toolResults.slice(-10);
          }
          break;
          
        case 'summarize_spans':
          // Context: 总结对话片段
          const summary = await this._summarizeMessages(this._messages.slice(0, -10));
          this._messages = [summary, ...this._messages.slice(-10)];
          this._toolResults = [];
          break;
          
        case 'extract_to_file':
          // Session: 提取到文件
          const keyContext = this._extractKeyContext();
          this.emit('memory:persist', { type: 'session', content: keyContext });
          this._messages = this._messages.slice(-20);
          break;
          
        case 'summarize_history':
          // Full: 总结历史
          const fullSummary = await this._summarizeMessages(this._messages);
          this._messages = [fullSummary];
          this._toolResults = [];
          break;
          
        case 'drop_oldest_groups':
          // PTL: 丢弃最旧组
          this._messages = this._messages.slice(-Math.floor(this._messages.length / 2));
          break;
      }
    } catch (error) {
      this.emit('compaction:error', error);
    }
    
    this.currentCompactionLevel = 'none';
    this.emit('compaction:complete', { level: targetLevel });
  }

  /**
   * 总结消息
   */
  async _summarizeMessages(msgs) {
    const content = `[对话摘要：${msgs.length}条消息]`;
    return {
      role: 'system',
      content,
      timestamp: Date.now(),
      isSummary: true
    };
  }

  /**
   * 提取关键上下文
   */
  _extractKeyContext() {
    return this._messages
      .filter(m => m.important || m.keyDecision)
      .map(m => ({
        role: m.role,
        content: m.content.substring(0, 200),
        timestamp: m.timestamp
      }));
  }

  /**
   * 执行工具
   */
  async executeTools(toolCalls) {
    const results = [];
    const concurrentCalls = [];
    const serialCalls = [];
    
    // 分类
    for (const call of toolCalls) {
      const tool = this.tools.get(call.name);
      if (tool?.isConcurrent) {
        concurrentCalls.push(call);
      } else {
        serialCalls.push(call);
      }
    }
    
    // 并发执行只读工具
    if (concurrentCalls.length > 0) {
      const batchSize = this.options.maxToolsParallel;
      for (let i = 0; i < concurrentCalls.length; i += batchSize) {
        const batch = concurrentCalls.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(call => this._executeSingleTool(call))
        );
        results.push(...batchResults);
      }
    }
    
    // 串行执行写入工具
    for (const call of serialCalls) {
      const result = await this._executeSingleTool(call);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 执行单个工具
   */
  async _executeSingleTool(call) {
    const { name, input } = call;
    const tool = this.tools.get(name);
    
    if (!tool) {
      return { tool: name, error: `Tool ${name} not found` };
    }
    
    // 权限检查
    if (!this._checkPermission(name, input)) {
      return { tool: name, error: 'Permission denied', blocked: true };
    }
    
    this.emit('tool:start', { tool: name, input });
    const startTime = Date.now();
    
    try {
      const result = await tool.execute(input);
      const duration = Date.now() - startTime;
      
      this._toolResults.push({ 
        tool: name, 
        result, 
        timestamp: Date.now(),
        duration 
      });
      
      // 内存保护
      if (this._toolResults.length > this._maxToolResults) {
        this._toolResults = this._toolResults.slice(-this._maxToolResults / 2);
      }
      
      this.emit('tool:complete', { tool: name, result, duration });
      return { tool: name, result, duration };
      
    } catch (error) {
      this.emit('tool:error', { tool: name, error });
      return { tool: name, error: error.message };
    }
  }

  /**
   * 权限检查
   */
  _checkPermission(toolName, input) {
    switch (this.permissionMode) {
      case 'bypass':
        return true;
      case 'allow':
        return !this.serialTools.has(toolName);
      case 'auto':
        return this._classifyAction(toolName, input);
      default:
        return false;
    }
  }

  /**
   * 动作分类
   */
  _classifyAction(toolName, input) {
    if (this.concurrentTools.has(toolName)) return true;
    
    const dangerous = ['delete', 'rm', 'format', 'DROP', 'DELETE'];
    const path = JSON.stringify(input).toLowerCase();
    return !dangerous.some(d => path.includes(d));
  }

  /**
   * 设置权限模式
   */
  setPermissionMode(mode) {
    this.permissionMode = mode;
  }

  /**
   * 获取状态
   */
  getState() {
    return {
      messages: this._messageCount,
      messagesInMemory: this._messages.length,
      toolResults: this._toolResults.length,
      tools: this.tools.size,
      compactionLevel: this.currentCompactionLevel,
      permissionMode: this.permissionMode,
      turnCount: this.turnCount
    };
  }

  /**
   * 重置
   */
  reset() {
    this._messages = [];
    this._messageCount = 0;
    this._toolResults = [];
    this.currentCompactionLevel = 'none';
    this.turnCount = 0;
  }
}

module.exports = QueryEngine;