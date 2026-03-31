/**
 * Claude Code inspired Agent System
 * 基于 Claude Code 源码中的 AgentTool 和 QueryEngine 简化实现
 */

import { toolRegistry, Tool } from './Tool.js';

/**
 * Agent定义
 */
export class Agent {
  constructor(config) {
    this.name = config.name;
    this.description = config.description || '';
    this.color = config.color || 'blue';
    this.model = config.model || 'default';
    this.systemPrompt = config.systemPrompt || '';
    this.tools = config.tools || [];
    this.capabilities = config.capabilities || [];
  }

  // 获取Agent定义
  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      color: this.color,
      model: this.model,
      capabilities: this.capabilities
    };
  }
}

/**
 * Agent注册表
 */
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.aliasMap = new Map();
  }

  register(agent) {
    if (agent instanceof Agent) {
      this.agents.set(agent.name, agent);
    }
  }

  get(name) {
    const target = this.aliasMap.get(name) || name;
    return this.agents.get(target);
  }

  has(name) {
    return this.agents.has(name) || this.aliasMap.has(name);
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  alias(name, target) {
    this.aliasMap.set(name, target);
  }
}

export const agentRegistry = new AgentRegistry();


/**
 * Master Agent - 需求理解与调度
 */
export class MasterAgent extends Agent {
  constructor() {
    super({
      name: 'master',
      description: '需求理解与Agent调度',
      color: 'purple',
      systemPrompt: `你是VoiceForge AI的多Agent系统Master，负责理解用户需求并调度其他Agent。

用户输入可能包括：
- 配音需求（旁白、角色对话、情感变化）
- 修改要求（语调、语速、情感）
- 新项目创建
- 代码开发任务
- 问题咨询

你的任务：
1. 理解用户需求
2. 判断需要哪些Agent处理
3. 调度相应Agent
4. 汇总结果返回给用户

决策逻辑：
- 如果需求模糊 → 调度Planner扩展需求
- 如果有具体功能需要实现 → 调度Generator
- 如果需要评估/测试 → 调度Evaluator
- 如果是简单问题 → 直接回答`
    });
  }

  async decide(input, context = {}) {
    const lowerInput = input.toLowerCase();
    
    // 简单决策逻辑
    if (lowerInput.includes('创建') || lowerInput.includes('开发') || lowerInput.includes('实现')) {
      return 'planner';
    }
    if (lowerInput.includes('测试') || lowerInput.includes('评估') || lowerInput.includes('检查')) {
      return 'evaluator';
    }
    if (lowerInput.includes('修改') || lowerInput.includes('调整') || lowerInput.includes('改')) {
      return 'generator';
    }
    
    // 默认调度到Planner
    return 'planner';
  }
}


/**
 * Planner Agent - 需求扩展与规格生成
 */
export class PlannerAgent extends Agent {
  constructor() {
    super({
      name: 'planner',
      description: '需求分析与规格生成',
      color: 'blue',
      systemPrompt: `你是VoiceForge AI的Planner Agent，负责把用户需求扩展为完整的规格文档。

你的任务：
1. 分析用户需求意图
2. 扩展为完整的功能规格
3. 列出所有需要实现的功能点（features）
4. 确定优先级
5. 识别潜在的依赖和风险

输出格式要求：
- spec: 详细的需求规格描述
- features: 功能列表 [{id, name, description, priority}]
- dependencies: 依赖关系
- risks: 潜在风险`
    });
  }

  async plan(input) {
    // 模拟生成规格
    const features = [
      { id: 'f1', name: '需求理解', description: '理解用户输入的意图', priority: 'high' },
      { id: 'f2', name: '功能拆分', description: '将需求拆分为可执行的功能', priority: 'high' },
      { id: 'f3', name: '优先级排序', description: '确定功能实现顺序', priority: 'medium' },
      { id: 'f4', name: '规格文档', description: '生成完整的规格说明', priority: 'medium' }
    ];

    return {
      spec: `用户需求：${input}\n\n需要分析并扩展为完整的实现规格。`,
      features,
      dependencies: [],
      risks: []
    };
  }
}


/**
 * Generator Agent - 功能实现
 */
export class GeneratorAgent extends Agent {
  constructor() {
    super({
      name: 'generator',
      description: '功能实现与代码生成',
      color: 'green',
      systemPrompt: `你是VoiceForge AI的Generator Agent，负责实现具体功能。

你的任务：
1. 理解feature需求
2. 实现代码
3. 自我测试
4. 产出符合contract的完成物

注意：你实现的代码会被Evaluator评估，所以要确保质量。`
    });
  }

  async generate(feature, context = {}) {
    return {
      feature: feature.id,
      status: 'implemented',
      code: `// 实现 ${feature.name}: ${feature.description}`,
      tests: ['测试通过'],
      output: `已完成 ${feature.name} 的实现`
    };
  }
}


/**
 * Evaluator Agent - 评估与测试
 */
export class Evaluator extends Agent {
  constructor() {
    super({
      name: 'evaluator',
      description: '功能评估与测试',
      color: 'red',
      systemPrompt: `你是VoiceForge AI的Evaluator Agent，负责测试和评估Generator的产出。

评估维度：
1. 功能正确性 - 是否实现了要求的功能
2. 代码质量 - 是否符合规范
3. 测试通过率 - 自测是否通过
4. 边界处理 - 异常情况是否处理

输出格式：
{
  score: 0-100,
  passed: true/false,
  issues: ["问题1", "问题2"],
  feedback: "改进建议"
}`
    });
  }

  async evaluate(target, criteria = {}) {
    // 模拟评估
    const score = Math.floor(Math.random() * 20) + 80; // 80-100
    
    return {
      score,
      passed: score >= 70,
      issues: score >= 90 ? [] : ['建议增加更多测试用例'],
      feedback: score >= 90 ? '优秀' : '基本达标，可改进'
    };
  }
}


/**
 * 多Agent协调器
 */
export class AgentCoordinator {
  constructor() {
    this.agents = {
      master: new MasterAgent(),
      planner: new PlannerAgent(),
      generator: new GeneratorAgent(),
      evaluator: new Evaluator()
    };
    this.history = [];
  }

  // 协调处理用户输入
  async coordinate(input, context = {}) {
    const session = {
      id: Date.now().toString(),
      input,
      startTime: Date.now(),
      steps: []
    };

    // 1. Master决定调度
    const targetAgent = await this.agents.master.decide(input, context);
    session.steps.push({ agent: 'master', decision: targetAgent });

    let result;

    // 2. 执行目标Agent
    switch (targetAgent) {
      case 'planner':
        result = await this.agents.planner.plan(input);
        session.steps.push({ agent: 'planner', result });
        break;
        
      case 'generator':
        result = await this.agents.generator.generate(input, context);
        session.steps.push({ agent: 'generator', result });
        break;
        
      case 'evaluator':
        result = await this.agents.evaluator.evaluate(input, context);
        session.steps.push({ agent: 'evaluator', result });
        break;
        
      default:
        result = { response: `无法处理，调度到 ${targetAgent}` };
    }

    // 3. 记录历史
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    session.result = result;
    this.history.push(session);

    return result;
  }

  // 获取历史
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  // 清空历史
  clearHistory() {
    this.history = [];
  }
}


// 导出
export default {
  Agent,
  agentRegistry,
  MasterAgent,
  PlannerAgent,
  GeneratorAgent,
  Evaluator,
  AgentCoordinator
};