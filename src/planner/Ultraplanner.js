/**
 * Ultraplanner - 远程多Agent规划系统复刻
 * 
 * 功能：
 * - 10-30分钟规划窗口
 * - 多Agent协作战略决策
 * - 远程/异步执行
 * - 任务分解、分配、进度监控、结果合并
 */

const { EventEmitter } = require('events');

class Ultraplanner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxAgents: options.maxAgents || 5,
      planningWindow: options.planningWindow || 15 * 60 * 1000, // 15分钟默认
      ...options
    };
    
    this.sessions = new Map();
    this.agentPool = [];
    this.activeSession = null;
  }

  /**
   * 创建规划会话
   */
  async createSession(config = {}) {
    const sessionId = `plan_${Date.now()}`;
    const session = {
      id: sessionId,
      goal: config.goal || '',
      context: config.context || {},
      tasks: [],
      agents: [],
      status: 'pending',
      createdAt: Date.now(),
      deadline: Date.now() + (config.duration || this.options.planningWindow),
      results: []
    };
    
    this.sessions.set(sessionId, session);
    this.emit('session:created', session);
    
    return session;
  }

  /**
   * 分解任务
   */
  decomposeTask(task, maxDepth = 3) {
    const subtasks = [];
    
    // 简单的任务分解逻辑
    const steps = task.split(/[,，然后然后]/).filter(s => s.trim());
    
    for (const step of steps) {
      subtasks.push({
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        description: step.trim(),
        status: 'pending',
        dependencies: [],
        assignedTo: null,
        result: null
      });
    }
    
    return subtasks;
  }

  /**
   * 添加任务到会话
   */
  addTask(sessionId, taskDescription) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    const tasks = this.decomposeTask(taskDescription);
    session.tasks.push(...tasks);
    
    this.emit('tasks:added', { sessionId, count: tasks.length });
    return tasks;
  }

  /**
   * 分配任务给Agent
   */
  assignTask(sessionId, taskId, agentId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    const task = session.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    // 检查依赖
    const unresolvedDeps = task.dependencies.filter(depId => {
      const dep = session.tasks.find(t => t.id === depId);
      return dep && dep.status !== 'completed';
    });
    
    if (unresolvedDeps.length > 0) {
      throw new Error(`Dependencies not met: ${unresolvedDeps.join(', ')}`);
    }
    
    task.assignedTo = agentId;
    task.status = 'assigned';
    
    this.emit('task:assigned', { sessionId, taskId, agentId });
    return task;
  }

  /**
   * 开始执行会话
   */
  async startSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    session.status = 'running';
    this.activeSession = session;
    this.emit('session:started', session);
    
    // 启动执行循环
    this.executeLoop(session);
    
    return session;
  }

  /**
   * 执行循环
   */
  async executeLoop(session) {
    const checkInterval = setInterval(() => {
      // 检查是否超时
      if (Date.now() > session.deadline) {
        clearInterval(checkInterval);
        this.endSession(session.id, 'timeout');
        return;
      }
      
      // 查找可执行的任务（没有未完成的依赖）
      const readyTasks = session.tasks.filter(t => 
        t.status === 'pending' && 
        t.dependencies.every(depId => {
          const dep = session.tasks.find(task => task.id === depId);
          return dep && dep.status === 'completed';
        })
      );
      
      // 分配给可用Agent
      for (const task of readyTasks.slice(0, this.options.maxAgents)) {
        const agent = this.getAvailableAgent();
        if (agent) {
          this.assignTask(session.id, task.id, agent.id);
          this.executeTask(session, task, agent);
        }
      }
      
      // 检查是否全部完成
      const allDone = session.tasks.every(t => t.status === 'completed');
      if (allDone) {
        clearInterval(checkInterval);
        this.endSession(session.id, 'completed');
      }
      
    }, 1000);
  }

  /**
   * 获取可用Agent
   */
  getAvailableAgent() {
    const busy = new Set(
      this.activeSession?.tasks
        .filter(t => t.status === 'running')
        .map(t => t.assignedTo)
    );
    
    return this.agentPool.find(a => !busy.has(a.id));
  }

  /**
   * 执行任务
   */
  async executeTask(session, task, agent) {
    task.status = 'running';
    task.startedAt = Date.now();
    
    this.emit('task:started', { sessionId: session.id, taskId: task.id, agentId: agent.id });
    
    try {
      // 模拟任务执行
      const result = await agent.execute(task.description, session.context);
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = Date.now();
      
      session.results.push({
        taskId: task.id,
        agentId: agent.id,
        result
      });
      
      this.emit('task:completed', { sessionId: session.id, taskId: task.id, result });
      
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      this.emit('task:failed', { sessionId: session.id, taskId: task.id, error });
    }
  }

  /**
   * 结束会话
   */
  endSession(sessionId, reason) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.status = reason;
    session.endedAt = Date.now();
    
    this.emit('session:ended', { sessionId, reason, results: session.results });
    this.activeSession = null;
    
    return session;
  }

  /**
   * 合并结果
   */
  mergeResults(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    return {
      sessionId,
      goal: session.goal,
      totalTasks: session.tasks.length,
      completed: session.tasks.filter(t => t.status === 'completed').length,
      failed: session.tasks.filter(t => t.status === 'failed').length,
      duration: session.endedAt - session.createdAt,
      results: session.results
    };
  }

  /**
   * 注册Agent
   */
  registerAgent(agent) {
    this.agentPool.push({
      id: agent.id || `agent_${this.agentPool.length}`,
      name: agent.name || 'unnamed',
      capabilities: agent.capabilities || [],
      execute: agent.execute // async (task, context) => result
    });
  }

  /**
   * 获取会话状态
   */
  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      id: session.id,
      status: session.status,
      tasks: {
        total: session.tasks.length,
        pending: session.tasks.filter(t => t.status === 'pending').length,
        running: session.tasks.filter(t => t.status === 'running').length,
        completed: session.tasks.filter(t => t.status === 'completed').length,
        failed: session.tasks.filter(t => t.status === 'failed').length
      },
      deadline: session.deadline,
      timeRemaining: Math.max(0, session.deadline - Date.now())
    };
  }
}

module.exports = Ultraplanner;