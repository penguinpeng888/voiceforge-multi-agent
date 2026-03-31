/**
 * Claude Code inspired Task System
 * 基于 Claude Code 源码中的 tasks/ 目录简化实现
 */

// UUID生成函数
function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Task 状态
 */
export const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped'
};

/**
 * Task 优先级
 */
export const TaskPriority = {
  LOW: 1,
  MEDIUM: 5,
  HIGH: 10,
  CRITICAL: 20
};

/**
 * Task 定义
 */
export class Task {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.name = config.name || 'Untitled Task';
    this.description = config.description || '';
    this.status = config.status || TaskStatus.PENDING;
    this.priority = config.priority || TaskPriority.MEDIUM;
    this.input = config.input || {};
    this.output = null;
    this.error = null;
    this.createdAt = config.createdAt || Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.parentId = config.parentId || null;
    this.tags = config.tags || [];
    this.metadata = config.metadata || {};
  }

  generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 开始执行
  start() {
    this.status = TaskStatus.RUNNING;
    this.startedAt = Date.now();
  }

  // 完成
  complete(output) {
    this.status = TaskStatus.COMPLETED;
    this.output = output;
    this.completedAt = Date.now();
  }

  // 失败
  fail(error) {
    this.status = TaskStatus.FAILED;
    this.error = error;
    this.completedAt = Date.now();
  }

  // 停止
  stop() {
    this.status = TaskStatus.STOPPED;
    this.completedAt = Date.now();
  }

  // 获取持续时间
  getDuration() {
    if (!this.startedAt) return 0;
    const end = this.completedAt || Date.now();
    return end - this.startedAt;
  }

  // 获取摘要
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      priority: this.priority,
      createdAt: this.createdAt,
      duration: this.getDuration()
    };
  }
}


/**
 * Task 管理器
 */
export class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.listeners = new Map();
  }

  // 创建Task
  create(config) {
    const task = new Task(config);
    this.tasks.set(task.id, task);
    this.emit('created', task);
    return task;
  }

  // 获取Task
  get(id) {
    return this.tasks.get(id);
  }

  // 检查Task是否存在
  has(id) {
    return this.tasks.has(id);
  }

  // 更新Task
  update(id, updates) {
    const task = this.tasks.get(id);
    if (!task) return null;
    
    Object.assign(task, updates);
    this.emit('updated', task);
    return task;
  }

  // 删除Task
  delete(id) {
    const task = this.tasks.get(id);
    if (task) {
      this.tasks.delete(id);
      this.emit('deleted', task);
      return true;
    }
    return false;
  }

  // 批量获取
  getMany(ids) {
    return ids.map(id => this.tasks.get(id)).filter(Boolean);
  }

  // 获取所有
  getAll() {
    return Array.from(this.tasks.values());
  }

  // 按状态获取
  getByStatus(status) {
    return this.getAll().filter(t => t.status === status);
  }

  // 按优先级获取
  getByPriority(minPriority) {
    return this.getAll().filter(t => t.priority >= minPriority);
  }

  // 获取待执行任务
  getPending() {
    return this.getByStatus(TaskStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);
  }

  // 获取运行中的任务
  getRunning() {
    return this.getByStatus(TaskStatus.RUNNING);
  }

  // 获取最近完成的任务
  getRecent(limit = 10) {
    return this.getAll()
      .filter(t => t.completedAt)
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
  }

  // 事件监听
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // 触发事件
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  // 清理完成的任务
  cleanup(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    const now = Date.now();
    const toDelete = [];
    
    for (const [id, task] of this.tasks) {
      if (task.completedAt && (now - task.completedAt) > maxAge) {
        toDelete.push(id);
      }
    }
    
    toDelete.forEach(id => this.delete(id));
    return toDelete.length;
  }

  // 统计
  getStats() {
    const tasks = this.getAll();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      running: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
      stopped: tasks.filter(t => t.status === TaskStatus.STOPPED).length
    };
  }
}


// 默认Task管理器
export const taskManager = new TaskManager();


/**
 * Task 执行器
 */
export class TaskExecutor {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.running = false;
    this.maxConcurrent = 3;
  }

  // 开始执行循环
  start() {
    this.running = true;
    this.loop();
  }

  // 停止
  stop() {
    this.running = false;
  }

  // 执行循环
  async loop() {
    while (this.running) {
      const running = this.taskManager.getRunning().length;
      
      if (running < this.maxConcurrent) {
        const pending = this.taskManager.getPending();
        const toRun = pending.slice(0, this.maxConcurrent - running);
        
        for (const task of toRun) {
          this.executeTask(task);
        }
      }
      
      await this.sleep(1000); // 每秒检查一次
    }
  }

  // 执行单个任务
  async executeTask(task) {
    task.start();
    
    try {
      // 模拟任务执行
      const result = await this.execute(task.input);
      task.complete(result);
    } catch (error) {
      task.fail(error.message);
    }
  }

  // 具体执行逻辑 (子类实现)
  async execute(input) {
    // 默认实现 - 可以被覆盖
    return { result: 'done' };
  }

  // 睡眠
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


export default {
  Task,
  TaskManager,
  TaskExecutor,
  taskManager,
  TaskStatus,
  TaskPriority
};