/**
 * ULTRAPLAN 深度规划系统
 * 源自 Claude Code 的 ULTRAPLAN feature
 * 30分钟超长任务规划
 */

import { kairos } from './kairos.js';

/**
 * 规划阶段
 */
const PlanPhase = {
  ANALYSIS: 'analysis',      // 分析问题
  DECOMPOSE: 'decompose',    // 分解任务
  DEPENDENCIES: 'dependencies', // 识别依赖
  ESTIMATE: 'estimate',       // 估算时间
  EXECUTE: 'execute',         // 执行
  VERIFY: 'verify'           // 验证
};

/**
 * 深度规划器
 */
class UltraPlanner {
  constructor() {
    this.timeout = 30 * 60 * 1000; // 30分钟
    this.currentPlan = null;
    this.checkpoints = [];
  }

  /**
   * 创建深度规划
   */
  async createPlan(goal, context = {}) {
    // 分析阶段
    const analysis = await this.analyzeGoal(goal, context);
    
    // 分解阶段
    const tasks = await this.decompose(analysis);
    
    // 依赖分析
    const dependencies = await this.analyzeDependencies(tasks);
    
    // 时间估算
    const estimate = this.estimateTime(tasks);
    
    // 生成执行计划
    const plan = {
      id: 'plan_' + Date.now(),
      goal,
      analysis,
      tasks,
      dependencies,
      estimate,
      createdAt: Date.now(),
      phases: Object.values(PlanPhase),
      currentPhase: PlanPhase.ANALYSIS,
      status: 'planning'
    };
    
    this.currentPlan = plan;
    
    // 保存到记忆
    kairos.addShortTerm(
      `规划: ${goal.substring(0, 100)}`,
      'ultraplan',
      { importance: 9, metadata: { planId: plan.id } }
    );
    
    return plan;
  }

  /**
   * 分析目标
   */
  async analyzeGoal(goal, context) {
    // 提取关键词
    const keywords = goal.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    // 识别任务类型
    let taskType = 'general';
    if (goal.includes('开发') || goal.includes('写代码') || goal.includes('build')) {
      taskType = 'development';
    } else if (goal.includes('分析') || goal.includes('研究')) {
      taskType = 'research';
    } else if (goal.includes('写作') || goal.includes('写')) {
      taskType = 'writing';
    } else if (goal.includes('部署') || goal.includes('上线')) {
      taskType = 'deployment';
    }
    
    // 识别复杂度
    let complexity = 'simple';
    const complexityIndicators = goal.length > 200 || goal.split(/[,，]/).length > 5;
    if (complexityIndicators) complexity = 'medium';
    if (goal.includes('完整') || goal.includes('系统') || goal.includes('平台')) {
      complexity = 'complex';
    }
    
    // 从记忆获取相关上下文
    const relevantMemories = kairos.getRelevantContext(goal, 3);
    
    return {
      taskType,
      complexity,
      keywords,
      relevantContext: relevantMemories,
      keyRequirements: this.extractRequirements(goal),
      constraints: this.extractConstraints(goal)
    };
  }

  /**
   * 提取需求
   */
  extractRequirements(text) {
    const requirements = [];
    const patterns = [
      /需要(.+?)[，,]/g,
      /要有(.+?)[，,]/g,
      /支持(.+?)[，,]/g,
      /实现(.+?)[，,]/g
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        requirements.push(...matches.map(m => m.replace(/[,，]$/, '')));
      }
    }
    
    return requirements.slice(0, 10);
  }

  /**
   * 提取约束
   */
  extractConstraints(text) {
    const constraints = [];
    const patterns = [
      /不能(.+?)[，,]/g,
      /禁止(.+?)[，,]/g,
      /必须在(.+?)[，,]/g,
      /只能(.+?)[，,]/g
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        constraints.push(...matches.map(m => m.replace(/[,，]$/, '')));
      }
    }
    
    return constraints.slice(0, 5);
  }

  /**
   * 分解任务
   */
  async decompose(analysis) {
    const tasks = [];
    
    // 根据任务类型生成标准任务
    switch (analysis.taskType) {
      case 'development':
        tasks.push(
          { id: 'task_1', name: '需求确认', description: '确认功能需求和边界', duration: 5 },
          { id: 'task_2', name: '技术方案设计', description: '设计架构和技术选型', duration: 15 },
          { id: 'task_3', name: '核心功能实现', description: '实现核心逻辑', duration: 60 },
          { id: 'task_4', name: '测试验证', description: '编写测试用例并验证', duration: 20 },
          { id: 'task_5', name: '代码优化', description: '性能优化和重构', duration: 15 },
          { id: 'task_6', name: '文档编写', description: '编写使用文档', duration: 10 }
        );
        break;
        
      case 'research':
        tasks.push(
          { id: 'task_1', name: '信息收集', description: '收集相关资料', duration: 20 },
          { id: 'task_2', name: '现状分析', description: '分析当前情况', duration: 15 },
          { id: 'task_3', name: '对比分析', description: '竞品或方案对比', duration: 25 },
          { id: 'task_4', name: '结论建议', description: '得出结论和建议', duration: 15 }
        );
        break;
        
      case 'writing':
        tasks.push(
          { id: 'task_1', name: '大纲设计', description: '设计文章结构', duration: 15 },
          { id: 'task_2', name: '初稿撰写', description: '完成初稿', duration: 45 },
          { id: 'task_3', name: '内容修改', description: '优化内容', duration: 20 },
          { id: 'task_4', name: '格式调整', description: '调整格式和排版', duration: 10 }
        );
        break;
        
      default:
        tasks.push(
          { id: 'task_1', name: '理解任务', description: '理解目标', duration: 10 },
          { id: 'task_2', name: '执行', description: '完成任务', duration: 60 },
          { id: 'task_3', name: '检查', description: '检查结果', duration: 15 }
        );
    }
    
    return tasks;
  }

  /**
   * 分析依赖
   */
  async analyzeDependencies(tasks) {
    const dependencies = [];
    
    for (let i = 1; i < tasks.length; i++) {
      // 简单假设：所有任务依赖前一个任务
      dependencies.push({
        from: tasks[i-1].id,
        to: tasks[i].id,
        type: 'sequential'
      });
    }
    
    return dependencies;
  }

  /**
   * 估算时间
   */
  estimateTime(tasks) {
    const total = tasks.reduce((sum, t) => sum + t.duration, 0);
    const buffer = Math.ceil(total * 0.2); // 20% buffer
    
    return {
      estimated: total,
      withBuffer: total + buffer,
      unit: '分钟',
      breakdown: tasks.map(t => ({ task: t.name, minutes: t.duration }))
    };
  }

  /**
   * 获取下一个检查点
   */
  getNextCheckpoint() {
    const now = Date.now();
    const elapsed = now - this.currentPlan.createdAt;
    const progress = elapsed / this.timeout;
    
    const checkpoints = [
      { percent: 0.25, phase: PlanPhase.DECOMPOSE, message: '任务分解完成' },
      { percent: 0.5, phase: PlanPhase.EXECUTE, message: '执行中...' },
      { percent: 0.75, phase: PlanPhase.VERIFY, message: '验证结果' },
      { percent: 1.0, phase: 'complete', message: '规划完成' }
    ];
    
    for (const cp of checkpoints) {
      if (progress <= cp.percent) {
        return cp;
      }
    }
    
    return checkpoints[checkpoints.length - 1];
  }

  /**
   * 更新进度
   */
  updateProgress(taskId, status) {
    if (this.currentPlan) {
      const task = this.currentPlan.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        task.completedAt = status === 'completed' ? Date.now() : null;
      }
    }
  }

  /**
   * 获取计划状态
   */
  getPlanStatus() {
    if (!this.currentPlan) {
      return { hasPlan: false, message: '没有进行中的规划' };
    }
    
    const completed = this.currentPlan.tasks.filter(t => t.status === 'completed').length;
    const total = this.currentPlan.tasks.length;
    const progress = Math.round((completed / total) * 100);
    const checkpoint = this.getNextCheckpoint();
    
    return {
      hasPlan: true,
      goal: this.currentPlan.goal,
      progress,
      checkpoint,
      tasks: this.currentPlan.tasks,
      estimate: this.currentPlan.estimate
    };
  }

  /**
   * 取消计划
   */
  cancelPlan() {
    if (this.currentPlan) {
      kairos.addShortTerm(
        `取消规划: ${this.currentPlan.goal.substring(0, 50)}`,
        'ultraplan_cancelled',
        { importance: 5 }
      );
      this.currentPlan = null;
    }
  }
}

// 单例
export const ultraPlanner = new UltraPlanner();

export default { ultraPlanner, PlanPhase };