/**
 * Multi-Agent Coordinator - Claude Code COORDINATOR 模式复刻
 * 
 * 支持:
 * - Fork: 继承父上下文，缓存优化
 * - Teammate: tmux/iTerm面板，文件邮箱通信
 * - Worktree: 独立git worktree，分支隔离
 */

const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

class Coordinator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxWorkers = options.maxWorkers || 5;
    this.workers = new Map();
    this.taskGraph = new Map();
    this.mailboxDir = options.mailboxDir || './mailbox';
    
    // 确保邮箱目录存在
    if (!fs.existsSync(this.mailboxDir)) {
      fs.mkdirSync(this.mailboxDir, { recursive: true });
    }
  }

  /**
   * 创建工作代理
   */
  async spawnWorker(type, config) {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const worker = {
      id: workerId,
      type, // 'fork' | 'teammate' | 'worktree'
      status: 'starting',
      config,
      parentContext: config.parentContext || null,
      createdAt: Date.now(),
      taskId: null,
      result: null
    };

    // 根据类型初始化
    switch (type) {
      case 'fork':
        await this.initForkWorker(worker);
        break;
      case 'teammate':
        await this.initTeammateWorker(worker);
        break;
      case 'worktree':
        await this.initWorktreeWorker(worker);
        break;
    }

    this.workers.set(workerId, worker);
    this.emit('worker:created', worker);
    
    return worker;
  }

  /**
   * Fork 模式初始化（共享缓存）
   */
  async initForkWorker(worker) {
    // Fork 继承父上下文，缓存优化
    worker.sharedCache = true;
    worker.context = worker.parentContext ? { ...worker.parentContext } : {};
    worker.status = 'ready';
  }

  /**
   * Teammate 模式初始化（tmux面板）
   */
  async initTeammateWorker(worker) {
    // 创建邮箱文件
    const inbox = path.join(this.mailboxDir, `${worker.id}_inbox`);
    const outbox = path.join(this.mailboxDir, `${worker.id}_outbox`);
    
    fs.writeFileSync(inbox, JSON.stringify({ messages: [] }));
    fs.writeFileSync(outbox, JSON.stringify({ messages: [] }));
    
    worker.inbox = inbox;
    worker.outbox = outbox;
    worker.status = 'ready';
  }

  /**
   * Worktree 模式初始化（独立分支）
   */
  async initWorktreeWorker(worker) {
    // 创建独立分支
    worker.branch = `agent-${worker.id}`;
    worker.worktreePath = path.join(process.cwd(), '.worktrees', worker.id);
    worker.status = 'ready';
  }

  /**
   * 分配任务给 Worker
   */
  async assignTask(workerId, task) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    const taskId = `task_${Date.now()}`;
    task.id = taskId;
    task.workerId = workerId;
    task.status = 'assigned';

    this.taskGraph.set(taskId, task);
    worker.taskId = taskId;
    worker.status = 'working';

    this.emit('task:assigned', { workerId, taskId, task });

    // 根据类型执行
    switch (worker.type) {
      case 'fork':
        return this.executeForkTask(worker, task);
      case 'teammate':
        return this.executeTeammateTask(worker, task);
      case 'worktree':
        return this.executeWorktreeTask(worker, task);
    }
  }

  /**
   * 执行 Fork 任务
   */
  async executeForkTask(worker, task) {
    // Fork 模式：直接执行，共享缓存
    try {
      worker.status = 'executing';
      this.emit('task:start', { workerId: worker.id, taskId: task.id });
      
      // 执行任务（这里应该调用实际的 agent）
      const result = await task.execute(worker.context);
      
      worker.result = result;
      worker.status = 'completed';
      task.status = 'completed';
      task.result = result;
      
      this.emit('task:complete', { workerId: worker.id, taskId: task.id, result });
      return result;
    } catch (error) {
      worker.status = 'error';
      worker.error = error.message;
      this.emit('task:error', { workerId: worker.id, error });
      throw error;
    }
  }

  /**
   * 执行 Teammate 任务（通过邮箱）
   */
  async executeTeammateTask(worker, task) {
    // 发送任务到 inbox
    const inbox = JSON.parse(fs.readFileSync(worker.inbox, 'utf-8'));
    inbox.messages.push({
      type: 'task',
      task,
      timestamp: Date.now()
    });
    fs.writeFileSync(worker.inbox, JSON.stringify(inbox));

    // 等待结果（轮询 outbox）
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(() => {
        try {
          const outbox = JSON.parse(fs.readFileSync(worker.outbox, 'utf-8'));
          const resultMsg = outbox.messages.find(m => m.taskId === task.id && m.type === 'result');
          
          if (resultMsg) {
            clearInterval(pollInterval);
            worker.result = resultMsg.result;
            worker.status = 'completed';
            task.status = 'completed';
            task.result = resultMsg.result;
            this.emit('task:complete', { workerId: worker.id, result: resultMsg.result });
            resolve(resultMsg.result);
          }
        } catch (e) {
          clearInterval(pollInterval);
          reject(e);
        }
      }, 1000);

      // 超时
      setTimeout(() => {
        clearInterval(pollInterval);
        if (worker.status === 'working') {
          worker.status = 'timeout';
          reject(new Error('Task timeout'));
        }
      }, (task.timeout || 300000)); // 默认5分钟
    });
  }

  /**
   * 执行 Worktree 任务
   */
  async executeWorktreeTask(worker, task) {
    worker.status = 'executing';
    
    // 这里应该执行 git worktree 命令
    // const { exec } = require('child_process');
    // await exec(`git worktree add ${worker.worktreePath} -b ${worker.branch}`);
    
    try {
      const result = await task.execute({ worktree: worker.worktreePath });
      worker.result = result;
      worker.status = 'completed';
      return result;
    } catch (error) {
      worker.status = 'error';
      throw error;
    }
  }

  /**
   * 并行执行多个任务
   */
  async executeParallel(tasks) {
    const results = [];
    const batches = [];
    
    // 分批（每批 maxWorkers 个）
    for (let i = 0; i < tasks.length; i += this.maxWorkers) {
      batches.push(tasks.slice(i, i + this.maxWorkers));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(task => this.executeTask(task));
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
    }
    
    return results;
  }

  /**
   * 执行单个任务（自动创建 Worker）
   */
  async executeTask(task) {
    // 确定使用哪种 worker
    const type = task.type || 'fork';
    
    // 如果有可用 worker，复用
    let worker = Array.from(this.workers.values())
      .find(w => w.status === 'ready' && w.type === type);
    
    if (!worker) {
      worker = await this.spawnWorker(type, { parentContext: task.context });
    }
    
    return this.assignTask(worker.id, task);
  }

  /**
   * 合并结果
   */
  mergeResults(workerIds) {
    const results = workerIds
      .map(id => this.workers.get(id)?.result)
      .filter(r => r !== undefined);
    
    return {
      merged: true,
      count: results.length,
      results
    };
  }

  /**
   * 获取 Worker 状态
   */
  getWorkerStatus(workerId) {
    return this.workers.get(workerId);
  }

  /**
   * 获取所有 Worker
   */
  getAllWorkers() {
    return Array.from(this.workers.values());
  }

  /**
   * 终止 Worker
   */
  async terminateWorker(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    // 清理资源
    if (worker.inbox && fs.existsSync(worker.inbox)) {
      fs.unlinkSync(worker.inbox);
    }
    if (worker.outbox && fs.existsSync(worker.outbox)) {
      fs.unlinkSync(worker.outbox);
    }

    this.workers.delete(workerId);
    this.emit('worker:terminated', { workerId });
    return true;
  }

  /**
   * 终止所有 Worker
   */
  async terminateAll() {
    for (const workerId of this.workers.keys()) {
      await this.terminateWorker(workerId);
    }
  }

  /**
   * 获取统计
   */
  getStats() {
    const workers = this.getAllWorkers();
    return {
      total: workers.length,
      working: workers.filter(w => w.status === 'working').length,
      completed: workers.filter(w => w.status === 'completed').length,
      ready: workers.filter(w => w.status === 'ready').length,
      error: workers.filter(w => w.status === 'error').length,
      tasks: this.taskGraph.size
    };
  }
}

module.exports = Coordinator;