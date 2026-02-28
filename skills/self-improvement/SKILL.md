---
name: self-improvement
description: 自我进化的模式系统 - 从错误中学习，自动生成规则，避免重复犯错
---

# Foundry - 自我进化模式系统

## 用途
记录工作中的错误，从错误中学习，自动生成规则避免重复犯错。

## 核心概念

### 1. 失败模式 (FailurePattern)
记录犯过的错误，包括：
- 类型 (type)
- 描述 (description)
- 触发场景 (trigger)
- 错误行为 (wrongAction)
- 正确行为 (correctAction)
- 发生次数 (occurrence)
- 是否已修复 (fixed)

### 2. 规则钩子 (Hook)
从错误中学习的规则，自动执行：
- 名称 (name)
- 描述 (description)
- 触发条件 (trigger)
- 正确行动 (action)
- 是否启用 (enabled)

### 3. 已结晶的规则
从错误中总结出的经验：

#### 规则1：文件发送
- **触发**：需要发送文件给用户
- **行动**：必须使用 message 功能，不能在对话中发送
- **原因**：文件太大时对话会刷屏，用户体验差

#### 规则2：写作检查 - 战力设定
- **触发**：写战斗场面时
- **行动**：检查与前文战力设定是否一致
- **原因**：避免战力崩坏，越级挑战要有合理理由

#### 规则3：写作检查 - 修为层级
- **触发**：修炼章节
- **行动**：确认当前修为层级，不能突然升级
- **原因**：第19章写炼气六层，但第18章结尾是炼气五层

#### 规则4：写作检查 - 重复内容
- **触发**：写战斗时
- **行动**：避免重复使用同一套路
- **原因**：第20章蛇战不要重复狼战的写法

#### 规则5：写作检查 - 妖兽设定
- **触发**：遇到新妖兽
- **行动**：新妖兽技能要提前铺垫，不能凭空出现
- **原因**：青鳞蛇的毒雾、妖狼的狼嚎术需要提前展示

## 使用方法

### 记录错误
当发现犯错时，调用 addFailurePattern():
```typescript
addFailurePattern(
  'file_send',           // 类型
  '文件用对话发送',      // 描述
  '用户要文件',          // 触发场景
  '在对话中发送文件',    // 错误行为
  '用message功能发送'   // 正确行为
);
```

### 结晶规则
当某个错误模式重复多次后，调用 crystallizePattern() 将其升级为规则。

### 触发检查
每次执行前调用 checkHooks() 检查是否有对应规则：
```typescript
const hook = checkHooks('需要发送文件给用户');
if (hook) {
  // 按规则执行
  message({action: 'send', path: 'xxx'});
}
```

## 安装方法

1. 复制 `foundry/src/index.ts` 到你的项目
2. 在代码中引入：
```typescript
import { addFailurePattern, checkHooks, crystallizePattern } from './foundry';
```

3. 在关键操作前调用 checkHooks()

## 文件位置
- 源代码：`/workspace/foundry/src/index.ts`
- 错误记录：`/workspace/memory/errors.json`
- 规则配置：`/workspace/foundry/hooks.json`

## 更新日志
- 2026-02-27: 创建基础框架
- 添加文件发送规则
- 添加写作一致性检查（战力、修为、重复内容、妖兽设定）