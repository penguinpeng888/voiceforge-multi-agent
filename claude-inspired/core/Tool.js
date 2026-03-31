/**
 * Claude Code inspired Tool System
 * 基于 Claude Code 源码中的 Tool.ts (792行) 简化实现
 */

// 工具输入参数schema
export const toolInputSchema = {
  type: 'object',
  properties: {
    // 由具体工具定义
  },
  required: []
};

/**
 * 工具基类
 */
export class Tool {
  constructor(name, description, inputSchema = toolInputSchema) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
  }

  // 执行工具的核心方法，子类必须实现
  async execute(input, context = {}) {
    throw new Error(`${this.name} must implement execute()`);
  }

  // 权限检查
  async canUse(context) {
    return true; // 默认允许
  }

  // 获取工具描述
  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: this.inputSchema
    };
  }
}

/**
 * 工具注册表
 */
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.aliases = new Map();
  }

  // 注册工具
  register(tool) {
    if (tool && tool.name && tool.execute) {
      this.tools.set(tool.name, tool);
    } else if (tool instanceof Tool) {
      this.tools.set(tool.name, tool);
    } else {
      throw new Error(`Invalid tool: ${tool}`);
    }
  }

  // 批量注册
  registerMany(tools) {
    tools.forEach(t => this.register(t));
  }

  // 工具别名
  alias(name, target) {
    this.aliases.set(name, target);
  }

  // 获取工具
  get(name) {
    const target = this.aliases.get(name) || name;
    return this.tools.get(target);
  }

  // 检查工具是否存在
  has(name) {
    return this.tools.has(name) || this.aliases.has(name);
  }

  // 获取所有工具
  getAll() {
    return Array.from(this.tools.values());
  }

  // 条件注册 (Feature Flags)
  registerIf(condition, tool) {
    if (condition) {
      this.register(tool);
    }
  }

  // 懒加载注册
  registerLazy(name, description, loader) {
    const self = this;
    const proxy = new Proxy({}, {
      get(_, prop) {
        if (prop === 'execute') {
          // 首次执行时真正加载工具
          const realTool = loader();
          self.tools.set(name, realTool);
          return realTool.execute.bind(realTool);
        }
        return () => {};
      }
    });
    
    const lazyTool = new Tool(name, description);
    lazyTool.execute = async function(input, context) {
      const realTool = loader();
      return realTool.execute(input, context);
    };
    
    this.tools.set(name, lazyTool);
    return lazyTool;
  }
}

// 默认工具注册表
export const toolRegistry = new ToolRegistry();

// 工具装饰器
export function tool(name, description, inputSchema) {
  return function(target) {
    target.prototype.name = name;
    target.prototype.description = description;
    target.prototype.inputSchema = inputSchema || toolInputSchema;
    return target;
  };
}

// 权限装饰器
export function requiresPermission(permission) {
  return function(target, propertyKey, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function(...args) {
      const context = args[1] || {};
      if (context.permissions && !context.permissions.includes(permission)) {
        throw new Error(`Missing permission: ${permission}`);
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
}

export default { Tool, ToolRegistry, toolRegistry, tool, requiresPermission };