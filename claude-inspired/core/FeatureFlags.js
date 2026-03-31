/**
 * Claude Code inspired Feature Flags
 * 基于 Claude Code 源码中的 feature() 实现
 */

// Feature Flag 配置
const FEATURES = {
  // Agent相关
  AGENT_TRIGGERS: process.env.FEATURE_AGENT_TRIGGERS === 'true',
  AGENT_TRIGGERS_REMOTE: process.env.FEATURE_AGENT_TRIGGERS_REMOTE === 'true',
  AGENT_SWARMS: process.env.FEATURE_AGENT_SWARMS === 'true',
  
  // 工具相关
  MONITOR_TOOL: process.env.FEATURE_MONITOR_TOOL === 'true',
  REPL_TOOL: process.env.FEATURE_REPL_TOOL === 'true',
  
  // 模式相关
  PROACTIVE: process.env.FEATURE_PROACTIVE === 'true',
  KAIROS: process.env.FEATURE_KAIROS === 'true',
  COORDINATOR_MODE: process.env.FEATURE_COORDINATOR_MODE === 'true',
  
  // 压缩相关
  REACTIVE_COMPACT: process.env.FEATURE_REACTIVE_COMPACT === 'true',
  CONTEXT_COLLAPSE: process.env.FEATURE_CONTEXT_COLLAPSE === 'true',
  
  // 实验性功能
  EXPERIMENTAL_SKILL_SEARCH: process.env.FEATURE_EXPERIMENTAL_SKILL_SEARCH === 'true',
  TEMPLATES: process.env.FEATURE_TEMPLATES === 'true',
  
  // MCP相关
  KAIROS_GITHUB_WEBHOOKS: process.env.FEATURE_KAIROS_GITHUB_WEBHOOKS === 'true',
  KAIROS_PUSH_NOTIFICATION: process.env.FEATURE_KAIROS_PUSH_NOTIFICATION === 'true',
  
  // 用户类型
  USER_TYPE: process.env.USER_TYPE || 'user' // 'user' | 'ant'
};

/**
 * 检查feature是否启用
 */
export function feature(name) {
  if (!(name in FEATURES)) {
    console.warn(`Unknown feature: ${name}`);
    return false;
  }
  return FEATURES[name];
}

/**
 * 获取所有features
 */
export function getAllFeatures() {
  return { ...FEATURES };
}

/**
 * 启用feature
 */
export function enableFeature(name) {
  if (name in FEATURES) {
    FEATURES[name] = true;
  }
}

/**
 * 禁用feature
 */
export function disableFeature(name) {
  if (name in FEATURES) {
    FEATURES[name] = false;
  }
}

/**
 * 条件注册工具 (类似Claude Code的实现)
 */
export function registerIf(condition, tool, registry) {
  if (condition) {
    registry.register(tool);
  }
}

/**
 * 条件编译装饰器
 */
export function featureFlag(featureName) {
  return function(target, propertyKey, descriptor) {
    const original = descriptor.value;
    descriptor.value = function(...args) {
      if (!feature(featureName)) {
        return {
          success: false,
          error: `Feature ${featureName} is not enabled`
        };
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
}

export default {
  feature,
  getAllFeatures,
  enableFeature,
  disableFeature,
  registerIf,
  featureFlag,
  FEATURES
};