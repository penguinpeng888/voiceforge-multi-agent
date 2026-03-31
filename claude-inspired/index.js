/**
 * Claude-Inspired Architecture
 * 基于 Claude Code 源码提炼的系统架构
 *
 * @description 这是一个从 Claude Code 源码中提炼出来的核心架构
 *              包含工具系统、Agent系统、技能系统、任务系统、记忆系统等
 */

import { Tool, ToolRegistry, toolRegistry, tool, requiresPermission } from './core/Tool.js';
import {
  Agent,
  agentRegistry,
  MasterAgent,
  PlannerAgent,
  GeneratorAgent,
  Evaluator,
  AgentCoordinator
} from './core/Agent.js';
import { Skill, SkillLoader, SkillExecutor, bundledSkills, defaultSkillLoader } from './skills/SkillSystem.js';
import {
  Task,
  TaskManager,
  TaskExecutor,
  taskManager,
  TaskStatus,
  TaskPriority
} from './tasks/TaskManager.js';
import {
  Memory,
  MemoryManager,
  memoryManager,
  ContextBuilder,
  MemoryType
} from './memory/MemorySystem.js';
import {
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  WebFetchTool,
  TodoWriteTool,
  defaultTools
} from './tools/index.js';
import FeatureFlags from './core/FeatureFlags.js';

const { feature, getAllFeatures, enableFeature, disableFeature, registerIf, FEATURES } = FeatureFlags;

// 导出所有模块
export {
  // Core
  Tool,
  ToolRegistry,
  toolRegistry,
  tool,
  requiresPermission,

  // Agent
  Agent,
  agentRegistry,
  MasterAgent,
  PlannerAgent,
  GeneratorAgent,
  Evaluator,
  AgentCoordinator,

  // Skills
  Skill,
  SkillLoader,
  SkillExecutor,
  bundledSkills,
  defaultSkillLoader,

  // Tasks
  Task,
  TaskManager,
  TaskExecutor,
  taskManager,
  TaskStatus,
  TaskPriority,

  // Memory
  Memory,
  MemoryManager,
  memoryManager,
  ContextBuilder,
  MemoryType,

  // Tools
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  WebFetchTool,
  TodoWriteTool,
  defaultTools,

  // Features
  feature,
  getAllFeatures,
  enableFeature,
  disableFeature,
  registerIf,
  FEATURES
};

// 默认配置
export const config = {
  version: '1.0.0',
  name: 'claude-inspired',
  description: 'Claude Code inspired architecture',

  // 默认设置
  defaults: {
    maxConcurrentTasks: 3,
    memoryThreshold: 50,
    taskTimeout: 30000,
    maxHistoryLength: 100
  }
};

/**
 * 初始化系统
 */
export async function initialize(options = {}) {
  console.log('🚀 Initializing Claude-Inspired System...');

  // 1. 初始化工具
  const tools = options.tools || defaultTools;
  tools.forEach(t => toolRegistry.register(t));
  console.log(`✅ Registered ${tools.length} tools`);

  // 2. 初始化技能
  const skillLoader = options.skillLoader || defaultSkillLoader;
  await skillLoader.loadAll();
  console.log(`✅ Loaded ${skillLoader.getAll().length} skills`);

  // 3. 初始化记忆
  const memMgr = options.memoryManager || new MemoryManager();
  console.log(`✅ Memory system ready (${memMgr.getStats().total} items)`);

  // 4. 初始化任务
  const taskMgr = options.taskManager || new TaskManager();
  console.log(`✅ Task manager ready`);

  // 5. 初始化Agent协调器
  const coordinator = options.coordinator || new AgentCoordinator();
  console.log(`✅ Agent coordinator ready`);

  console.log('✨ System initialized!');

  return {
    toolRegistry,
    skillLoader,
    memoryManager: memMgr,
    taskManager: taskMgr,
    coordinator
  };
}

/**
 * 快速开始 - 创建完整的系统实例
 */
export async function createSystem(options = {}) {
  const initialized = await initialize(options);

  return {
    // 工具
    tools: {
      register: (tool) => toolRegistry.register(tool),
      get: (name) => toolRegistry.get(name),
      list: () => toolRegistry.getAll()
    },

    // Agent
    agents: {
      coordinator: initialized.coordinator,
      coordinate: (input, context) => initialized.coordinator.coordinate(input, context),
      list: () => Object.keys(initialized.coordinator.agents)
    },

    // Skill
    skills: {
      execute: async (name, input, context) => {
        const executor = new SkillExecutor(initialized.skillLoader);
        return executor.execute(name, input, context);
      },
      list: () => initialized.skillLoader.getAll().map(s => s.getDefinition()),
      search: (query) => initialized.skillLoader.search(query)
    },

    // Task
    tasks: {
      create: (config) => initialized.taskManager.create(config),
      get: (id) => initialized.taskManager.get(id),
      list: () => initialized.taskManager.getAll(),
      stats: () => initialized.taskManager.getStats()
    },

    // Memory
    memory: {
      add: (content, options) => initialized.memoryManager.addShortTerm(content, options),
      search: (query, options) => initialized.memoryManager.search(query, options),
      save: (memory) => initialized.memoryManager.saveToLongTerm(memory),
      stats: () => initialized.memoryManager.getStats()
    },

    // System
    config,
    features: getAllFeatures()
  };
}

export default {
  // 导出所有
  Tool,
  ToolRegistry,
  toolRegistry,
  Agent,
  MasterAgent,
  PlannerAgent,
  GeneratorAgent,
  Evaluator,
  AgentCoordinator,
  Skill,
  SkillLoader,
  SkillExecutor,
  Task,
  TaskManager,
  TaskExecutor,
  taskManager,
  Memory,
  MemoryManager,
  memoryManager,
  ContextBuilder,
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  WebFetchTool,
  TodoWriteTool,
  defaultTools,
  feature,
  getAllFeatures,
  config,
  initialize,
  createSystem
};