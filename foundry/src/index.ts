/**
 * Foundry - 自我进化的模式系统
 * 从错误中学习，自动生成规则
 */

// 模式类型
export type PatternType = 'file_send' | 'command_run' | 'api_call' | 'memory_recall' | 'other';

// 失败模式
export interface FailurePattern {
  id: string;
  type: PatternType;
  description: string;
  trigger: string;
  wrongAction: string;
  correctAction: string;
  occurrence: number;
  fixed: boolean;
  createdAt: Date;
  fixedAt?: Date;
}

// 规则钩子
export interface Hook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  enabled: boolean;
  createdAt: Date;
}

// 已结晶的钩子（从模式中学习）
export const crystallizedHooks: Hook[] = [
  {
    id: 'hook-file-send',
    name: '文件发送规则',
    description: '发送文件给用户时，必须使用 message 功能，不能在对话中发送',
    trigger: '需要发送文件给用户',
    action: '调用 message 功能发送文件',
    enabled: true,
    createdAt: new Date('2026-02-27'),
  },
];

// 检查是否有匹配规则
export function checkHooks(trigger: string): Hook | null {
  for (const hook of crystallizedHooks) {
    if (hook.enabled && trigger.includes(hook.trigger)) {
      return hook;
    }
  }
  return null;
}

// 记录失败模式
const failurePatterns: FailurePattern[] = [];

// 添加失败模式
export function addFailurePattern(
  type: PatternType,
  description: string,
  trigger: string,
  wrongAction: string,
  correctAction: string
): FailurePattern {
  const pattern: FailurePattern = {
    id: `pattern-${Date.now()}`,
    type,
    description,
    trigger,
    wrongAction,
    correctAction,
    occurrence: 1,
    fixed: false,
    createdAt: new Date(),
  };
  failurePatterns.push(pattern);
  return pattern;
}

// 将模式结晶为钩子
export function crystallizePattern(pattern: FailurePattern): Hook {
  const hook: Hook = {
    id: `hook-${pattern.id}`,
    name: `${pattern.type} 规则`,
    description: pattern.description,
    trigger: pattern.trigger,
    action: pattern.correctAction,
    enabled: true,
    createdAt: new Date(),
  };
  crystallizedHooks.push(hook);
  pattern.fixed = true;
  pattern.fixedAt = new Date();
  return hook;
}

// 获取所有钩子
export function getHooks(): Hook[] {
  return crystallizedHooks;
}

// 获取所有失败模式
export function getFailurePatterns(): FailurePattern[] {
  return failurePatterns;
}
