/**
 * OpenClaw Core - Claude Code 核心功能复刻 (v2.0 优化版)
 * 
 * 已实现:
 * - QueryEngine: 5级内存压缩 + 并行/串行工具执行
 * - PersistentMemory: 4层持久记忆系统
 * - PermissionSystem: 3种权限模式
 * - Coordinator: 多代理编排 (Fork/Teammate/Worktree)
 * - HookSystem: 5种生命周期钩子
 * - ConfigSystem: 5层配置继承
 * - MCPClient: Model Context Protocol 支持
 * - KairosDaemon: 守护进程 + autoDream
 * - BuddySystem: 18种终端宠物
 * - Ultraplanner: 多Agent规划
 * 
 * @version 2.0.0
 * 优化：懒加载、事件驱动、内存保护、错误恢复
 */

// 导出新版统一入口
const { OpenClaw, createOpenClaw } = require('./OpenClaw');

// 导出所有模块
const QueryEngine = require('./core/QueryEngine');
const PersistentMemory = require('./memory/PersistentMemory');
const PermissionSystem = require('./permissions/PermissionSystem');
const Coordinator = require('./agent/Coordinator');
const HookSystem = require('./hooks/HookSystem');
const ConfigSystem = require('./config/ConfigSystem');
const MCPClient = require('./mcp/MCPClient');
const { KairosDaemon } = require('./daemon/KairosDaemon');
const { BuddySystem } = require('./buddy/BuddySystem');
const Ultraplanner = require('./planner/Ultraplanner');

class OpenClawCore {
  constructor(options = {}) {
    this.options = options;
    
    // 初始化核心组件
    this.queryEngine = new QueryEngine({
      maxTokens: options.maxTokens || 200000,
      maxToolsParallel: options.maxToolsParallel || 10
    });
    
    this.memory = new PersistentMemory({
      memoryDir: options.memoryDir || './memory',
      userId: options.userId || 'default'
    });
    
    this.permissions = new PermissionSystem({
      mode: options.permissionMode || 'auto',
      workingDir: options.workingDir || process.cwd()
    });
    
    this.coordinator = new Coordinator({
      maxWorkers: options.maxWorkers || 5,
      mailboxDir: options.mailboxDir || './mailbox'
    });
    
    this.hooks = new HookSystem();
    this.config = new ConfigSystem({
      projectDir: options.workingDir || process.cwd()
    });
    this.mcp = new MCPClient();
    
    // 事件连接
    this.connectEvents();
  }

  /**
   * 连接事件
   */
  connectEvents() {
    // 内存压缩事件
    this.queryEngine.on('compaction:needed', (data) => {
      console.log(`[Memory] Compaction needed: ${data.level} (${data.size} tokens)`);
    });
    
    this.queryEngine.on('compaction:complete', (data) => {
      console.log(`[Memory] Compaction complete: ${data.level}`);
    });
    
    // 持久化事件
    this.queryEngine.on('memory:persist', (data) => {
      if (data.type === 'session') {
        this.memory.addProjectMemory('lastSession', data.content);
      }
    });
    
    // Worker 事件
    this.coordinator.on('worker:created', (worker) => {
      console.log(`[Coordinator] Worker created: ${worker.id} (${worker.type})`);
    });
    
    this.coordinator.on('task:complete', (data) => {
      console.log(`[Coordinator] Task complete: ${data.taskId}`);
    });
  }

  /**
   * 注册工具
   */
  registerTool(tool) {
    this.queryEngine.registerTool(tool);
  }

  /**
   * 注册多个工具
   */
  registerTools(tools) {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * 发送查询
   */
  async query(prompt) {
    // 1. 获取持久记忆
    const context = this.memory.getAllForContext();
    
    // 2. 检查历史错误
    const pastMistakes = this.memory.checkPastMistakes(prompt);
    if (pastMistakes.length > 0) {
      console.log(`[Memory] Found ${pastMistakes.length} past mistakes to avoid`);
    }
    
    // 3. 添加用户消息
    this.queryEngine.addMessage('user', prompt);
    
    // 4. 构建完整上下文
    const messages = [
      ...(context.user.role ? [{ role: 'system', content: `你的角色: ${context.user.role}` }] : []),
      ...this.queryEngine.messages
    ];
    
    // 5. 调用 LLM（需要外部实现）
    const response = await this.callLLM(messages);
    
    // 6. 处理工具调用
    if (response.tool_calls) {
      const results = await this.queryEngine.executeTools(response.tool_calls);
      
      // 7. 检查权限
      for (const result of results) {
        if (result.blocked) {
          console.log(`[Permission] Blocked: ${result.tool}`);
          return { blocked: true, tool: result.tool, message: 'Permission denied' };
        }
      }
      
      return { response, toolResults: results };
    }
    
    return { response };
  }

  /**
   * 调用 LLM（需要实现）
   */
  async callLLM(messages) {
    // 这里需要接入实际的 LLM API
    // MiniMax, OpenAI, Claude 等
    throw new Error('callLLM not implemented - need to add LLM provider');
  }

  /**
   * 设置权限模式
   */
  setPermissionMode(mode) {
    this.permissions.setMode(mode);
    this.queryEngine.setPermissionMode(mode);
  }

  /**
   * 记忆整合（类似 KAIROS autoDream）
   */
  async consolidateMemory() {
    // 压缩上下文
    await this.queryEngine.compact();
    
    // 清理持久记忆
    const stats = this.memory.consolidate();
    
    return {
      compaction: this.queryEngine.getState(),
      memory: stats
    };
  }

  /**
   * 并行执行多任务
   */
  async parallelExecute(tasks) {
    return this.coordinator.executeParallel(tasks);
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      queryEngine: this.queryEngine.getState(),
      memory: this.memory.generateSummary(),
      permissions: this.permissions.getStats(),
      coordinator: this.coordinator.getStats(),
      hooks: this.hooks.getStats(),
      config: this.config.loaded,
      mcp: this.mcp.getStatus()
    };
  }
}

// 演示
async function demo() {
  console.log('=== OpenClaw Core Demo ===\n');
  
  const core = new OpenClawCore({
    permissionMode: 'auto',
    maxWorkers: 3
  });
  
  // 注册示例工具
  core.registerTools([
    {
      name: 'read',
      description: 'Read file contents',
      concurrent: true,
      execute: async (input) => ({ content: 'file content...' })
    },
    {
      name: 'write',
      description: 'Write file',
      serial: true,
      execute: async (input) => ({ success: true })
    },
    {
      name: 'bash',
      description: 'Run shell command',
      serial: true,
      execute: async (input) => ({ output: 'command output' })
    }
  ]);
  
  // 添加用户信息
  core.memory.setUserInfo('role', '全栈开发者');
  core.memory.setUserInfo('expertise', 'React, Node.js, AI');
  
  // 添加反馈（模拟错误纠正）
  core.memory.addFeedback({
    original: '使用 var 而不是 let',
    corrected: '使用 let 或 const',
    context: 'JavaScript 变量声明'
  });
  
  // 添加项目记忆
  core.memory.addProjectMemory('deadline', '2026-04-15');
  core.memory.addProjectMemory('feature', '用户认证系统');
  
  // 添加外部引用
  core.memory.addReference('linear', 'Sprint Board', 'https://linear.app/team/issue', '当前迭代任务');
  core.memory.addReference('slack', 'Dev Channel', 'https://slack.com/archives/dev', '开发讨论');
  
  console.log('--- Memory Layers ---');
  console.log(core.memory.getAllForContext());
  console.log();
  
  console.log('--- Permission Check ---');
  const perm1 = await core.permissions.checkAction('read', { path: '/home/user/file.txt' });
  console.log('Read:', perm1.allowed ? 'Allowed' : 'Blocked');
  
  const perm2 = await core.permissions.checkAction('bash', { command: 'rm -rf /' });
  console.log('Dangerous bash:', perm2.allowed ? 'Allowed' : 'Blocked', '(reason:', perm2.reason + ')');
  console.log();
  
  console.log('--- Multi-Agent ---');
  const worker1 = await core.coordinator.spawnWorker('fork', {});
  const worker2 = await core.coordinator.spawnWorker('teammate', {});
  console.log('Created workers:', worker1.id, worker2.id);
  
  await core.coordinator.assignTask(worker1.id, {
    id: 'task1',
    execute: async (ctx) => ({ result: 'Task 1 done' })
  });
  
  console.log('Assigned task to worker1');
  console.log();
  
  console.log('--- Status ---');
  console.log(core.getStatus());
}

// 如果直接运行
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = OpenClawCore;