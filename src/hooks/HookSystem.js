/**
 * Hook System - Claude Code Hooks 复刻
 * 
 * 支持的钩子类型:
 * - preToolUse: 工具执行前
 * - postToolUse: 工具执行后
 * - prePrompt: 用户提示提交前
 * - sessionStart: 会话开始
 * - sessionEnd: 会话结束
 * 
 * 返回值:
 * - 0: 允许执行
 * - 2: 阻止执行
 * - 其他: 警告但继续
 */

const { EventEmitter } = require('events');

class HookSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.hooks = new Map();
    this.executionLog = [];
    
    // 初始化钩子类型
    const hookTypes = ['preToolUse', 'postToolUse', 'prePrompt', 'sessionStart', 'sessionEnd'];
    hookTypes.forEach(type => this.hooks.set(type, []));
  }

  /**
   * 注册钩子
   */
  register(type, handler, options = {}) {
    if (!this.hooks.has(type)) {
      throw new Error(`Unknown hook type: ${type}`);
    }
    
    const hook = {
      id: `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      handler,
      options: {
        order: options.order || 0,
        name: options.name || 'anonymous',
        blocking: options.blocking || false,
        ...options
      }
    };
    
    this.hooks.get(type).push(hook);
    // 按 order 排序
    this.hooks.get(type).sort((a, b) => a.options.order - b.options.order);
    
    return hook.id;
  }

  /**
   * 注销钩子
   */
  unregister(hookId) {
    for (const [type, handlers] of this.hooks) {
      const index = handlers.findIndex(h => h.id === hookId);
      if (index !== -1) {
        handlers.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * 触发钩子
   */
  async trigger(type, context = {}) {
    if (!this.hooks.has(type)) {
      return { allowed: true, warnings: [] };
    }
    
    const handlers = this.hooks.get(type);
    const results = [];
    const warnings = [];
    let blocked = false;
    
    this.emit('trigger', { type, context });
    
    for (const hook of handlers) {
      try {
        // 支持同步和异步 handler
        let result;
        if (hook.handler.length >= 2) {
          result = await hook.handler(context);
        } else {
          result = hook.handler(context);
        }
        
        const logEntry = {
          hookId: hook.id,
          hookName: hook.options.name,
          type,
          result,
          timestamp: Date.now()
        };
        
        this.executionLog.push(logEntry);
        results.push(logEntry);
        
        // 处理返回值
        if (result === 2) {
          // 阻止
          blocked = true;
          this.emit('blocked', { hook, context });
          break;
        } else if (result !== 0 && result !== undefined) {
          // 警告但继续
          warnings.push({ hook: hook.options.name, message: result });
          this.emit('warning', { hook, warning: result });
        }
        
      } catch (error) {
        const errorEntry = {
          hookId: hook.id,
          hookName: hook.options.name,
          type,
          error: error.message,
          timestamp: Date.now()
        };
        this.executionLog.push(errorEntry);
        
        this.emit('error', { hook, error });
        
        // 钩子错误是否阻止取决于 blocking 选项
        if (hook.options.blocking) {
          blocked = true;
          break;
        }
      }
    }
    
    return {
      allowed: !blocked,
      blocked,
      warnings,
      results: results.length
    };
  }

  // ============ 便捷方法 ============

  /**
   * 工具执行前钩子
   */
  async preToolUse(toolName, input) {
    return this.trigger('preToolUse', { toolName, input });
  }

  /**
   * 工具执行后钩子
   */
  async postToolUse(toolName, input, result) {
    return this.trigger('postToolUse', { toolName, input, result });
  }

  /**
   * 用户提示提交前钩子
   */
  async prePrompt(prompt) {
    return this.trigger('prePrompt', { prompt });
  }

  /**
   * 会话开始钩子
   */
  async sessionStart(context = {}) {
    return this.trigger('sessionStart', context);
  }

  /**
   * 会话结束钩子
   */
  async sessionEnd(summary = {}) {
    return this.trigger('sessionEnd', summary);
  }

  /**
   * 获取执行日志
   */
  getLog(limit = 50) {
    return this.executionLog.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    const stats = {};
    for (const [type, handlers] of this.hooks) {
      stats[type] = handlers.length;
    }
    return {
      totalHooks: Object.values(stats).reduce((a, b) => a + b, 0),
      byType: stats,
      totalExecutions: this.executionLog.length
    };
  }

  /**
   * 清除所有钩子
   */
  clear() {
    for (const type of this.hooks.keys()) {
      this.hooks.get(type).length = 0;
    }
  }
}

// ============ 演示 ============

async function demo() {
  console.log('=== Hook System Demo ===\n');
  
  const hooks = new HookSystem();
  
  // 注册 preToolUse 钩子
  hooks.register('preToolUse', (ctx) => {
    console.log(`[PreToolUse] ${ctx.toolName} will execute`);
    // 阻止危险操作
    if (ctx.toolName === 'bash' && ctx.input?.command?.includes('rm -rf')) {
      console.log('[PreToolUse] Blocking dangerous rm -rf!');
      return 2; // 阻止
    }
    return 0; // 允许
  }, { name: 'security-check', order: 1 });
  
  // 注册 postToolUse 钩子
  hooks.register('postToolUse', (ctx) => {
    console.log(`[PostToolUse] ${ctx.toolName} completed`);
    // 可以自动更新文档
    if (ctx.toolName === 'write' && ctx.input?.path?.endsWith('.md')) {
      console.log('[PostToolUse] Triggering docs update...');
      return 'Documentation update triggered';
    }
    return 0;
  }, { name: 'docs-autoupdate', order: 2 });
  
  // 注册 sessionStart 钩子
  hooks.register('sessionStart', (ctx) => {
    console.log('[SessionStart] New session started');
    return 0;
  }, { name: 'logger' });
  
  // 注册 prePrompt 钩子
  hooks.register('prePrompt', (ctx) => {
    // 可以修改或增强 prompt
    console.log('[PrePrompt] Processing prompt...');
    return 0;
  }, { name: 'prompt-enhancer' });
  
  // 测试 sessionStart
  console.log('\n--- Testing sessionStart ---');
  await hooks.sessionStart({ userId: 'test-user' });
  
  // 测试 preToolUse (允许)
  console.log('\n--- Testing preToolUse (allowed) ---');
  const readResult = await hooks.preToolUse('read', { path: '/home/user/file.txt' });
  console.log('Result:', readResult);
  
  // 测试 preToolUse (阻止)
  console.log('\n--- Testing preToolUse (blocked) ---');
  const bashResult = await hooks.preToolUse('bash', { command: 'rm -rf /' });
  console.log('Result:', bashResult);
  
  // 测试 postToolUse
  console.log('\n--- Testing postToolUse ---');
  await hooks.postToolUse('write', { path: 'README.md' }, { success: true });
  
  console.log('\n--- Stats ---');
  console.log(hooks.getStats());
  
  console.log('\n--- Log ---');
  console.log(hooks.getLog());
}

if (require.main === module) {
  demo().catch(console.error);
}

module.exports = HookSystem;