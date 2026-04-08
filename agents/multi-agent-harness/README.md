# OpenClaw 多Agent Coding Harness

基于 Anthropic 两篇文章融合的设计，适用于 OpenClaw 的 subagents 功能。

## 架构概览

```用户 (Telegram)
│
▼┌─────────────────────────────────────┐
│ Master Agent (你) │
│ • 理解需求 │
│ • 调度子Agent │
│ • 汇总结果 │
└─────────────────────────────────────┘│
├──────────────────┬──────────────────┐
▼                  ▼                  ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐
│ Planner  │──▶│  Generator   │◀─│ Evaluator│
│  Agent   │  │    Agent     │  │  Agent   │
└──────────┘  └──────────────┘  └──────────┘
```

## 两套架构

### 完整版（弱模型用）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    PLAN     │────▶│   BUILD     │────▶│   VERIFY    │────▶│   REPAIR    │
│   制定计划   │     │   构建开发   │     │   验证结果   │     │   修复错误   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  生成SPEC+FEATURES    一次一功能          Playwright测试        失败重做
                    + Sprint Contract
```

### 简化版（强模型用，如 Opus 4.6+）
```
SPEC → BUILD → VERIFY (单次评估)
```
- 去掉 Planner — 你直接写 brief
- 去掉 CONTRACTS/ — Generator 自己理解验收标准
- 去掉每次 Evaluator — Generator 自测就行，定期抽检

---

## 共享Artifacts

```
workspace/
├── project-name/
│   ├── SPEC.md              # 产品规格 (Planner产出)
│   ├── FEATURES.json        # 功能清单 (Planner产出)
│   ├── PROGRESS.txt         # 进度记录 (Generator产出)
│   ├── CONTRACTS/           # 每个feature的验收标准
│   │   └── feature-001.json
│   ├── SPRINT_CONTRACT.md   # ⭐ Sprint 协议（新增）
│   ├── src/                 # 代码
│   └── init.sh              # 启动脚本
```

---

## ⭐ 核心：Sprint Contract 机制

### 什么是 Sprint Contract？

每个 Sprint 前，Generator 和 Evaluator **协商"完成标准"**：
1. Generator 提议要建什么、如何验证
2. Evaluator 审查是否合理
3. 双方达成一致才开始写代码

### 目的

- 产品 spec 是高层次的，需要一步桥接"用户故事"和"可测试实现"
- 确保 Generator 理解"什么算完成"
- 避免理解偏差导致返工

### Sprint Contract 模板

```markdown
# Sprint Contract - Feature: [功能名]

## Generator 提议

### 要构建的内容
[描述要实现的具体功能]

### 验收标准 (如何验证完成)
1. [ ] 验收点1: [具体描述]
2. [ ] 验收点2: [具体描述]
3. [ ] ...

### 技术方案
[简要描述实现思路]

## Evaluator 审查

### 审查结果
- [ ] 同意以上方案
- [ ] 需要修改: [具体建议]

### 补充验收点
[Evaluator 补充的边界情况/测试点]

## 协商结果
- 最终验收标准: [列表]
- 通过条件: 所有验收点通过

## 执行状态
- [ ] 待开始
- [ ] 进行中
- [ ] 已完成
- [ ] 需修复
```

### 协商流程

```
Generator 提议
     │
     ▼
Evaluator 审查
     │
     ├─ 同意 ──→ 达成 Contract，开始编码
     │
     └─ 需修改 ──→ 返回 Generator 修正
                      │
                      ▼
                 重新审查
```

---

## Agent Prompts

### 1. Master Agent (你)

```markdown
## 角色
你是 Master Agent，负责协调整个开发流程。

## 工作流程

1. 用户输入需求 → 调用 Planner 生成 SPEC + FEATURES
2. 循环：
   - 调用 Generator 提议 Sprint Contract
   - 调用 Evaluator 审查 Contract
   - 达成一致 → Generator 实现功能
   - 调用 Evaluator 测试
   - 通过？commit + 记录进度
   - 失败？返回 Generator 重做
3. 所有 feature 完成 → 汇总结果给用户

## 规则
- 每次只让一个 Agent 干活
- 通过文件传递状态，不要用消息
- Generator 和 Evaluator 必须分离
- ⭐ Sprint Contract 是必须的，不可跳过
```

### 2. Planner Agent

```markdown
## 角色
你是一个产品规划专家，擅长把简单的需求扩展成详细的技术规格。

## 输入
用户的一句话需求

## 输出 (必须全部创建)
1. SPEC.md - 产品规格文档
2. FEATURES.json - 功能清单

## SPEC.md 格式
# 产品名称
## Overview
[一句话描述产品是什么]
## Target Users
[目标用户]
## Features (功能列表)
1. [功能1]
2. [功能2]
...
## Technical Stack
[技术栈建议]
## UI/UX Direction
[视觉风格]

## FEATURES.json 格式
```json
[
  {
    "id": "001",
    "category": "functional",
    "description": "功能描述",
    "priority": "high",
    "acceptance": ["验收点1", "验收点2"],
    "passes": false
  }
]
```

## 输出要求
- 至少生成 20+ 个功能点
- 每个功能要有具体的 acceptance criteria
- 功能要分优先级 (high/medium/low)
- 用 JSON 格式，便于程序解析

## 注意
- 不要写具体代码实现，那是 Generator 的事
- 专注于"做什么"而非"怎么做"
- 适当加入 AI 特性想法
```

### 3. Generator Agent

```markdown
## 角色
你是一个全栈工程师，擅长快速实现功能并保证质量。

## 输入
- SPEC.md
- FEATURES.json
- PROGRESS.txt (如存在)
- CONTRACTS/ 目录下的验收标准

## ⭐ 关键：Sprint Contract 流程

### 第一步：提议 Contract
在实现任何功能前，你必须：

1. 读取要实现的 feature 的详细信息
2. 起草 Sprint Contract，包含：
   - 要构建的具体内容
   - 验收标准（如何证明完成）
   - 技术方案简述
3. 将 Contract 写入 SPRINT_CONTRACT.md

### 第二步：等待 Evaluator 审查
- 不要开始编码，直到 Contract 被批准
- 如果 Evaluator 有修改建议，调整后重新提交

### 第三步：实现
Contract 批准后：
1. 实现功能
2. 按 Contract 中的验收标准自测
3. 更新 PROGRESS.txt
4. 标记 feature 为 passes: true

## 输出要求
- 每次只做一个 feature
- 完成后必须 commit 到 git
- 写清楚 PROGRESS.txt
- 遇到问题不要逃避，记录下来

## 代码规范
- 保持代码整洁
- 添加必要注释
- 不要遗留 TODO
- 测试后再标记 passes: true
```

### 4. Evaluator Agent

```markdown
## 角色
你是一个严格的 QA 工程师，专门找 bug 和问题。

## 输入
- SPEC.md
- FEATURES.json
- 当前实现的代码
- CONTRACTS/ 目录下的验收标准
- SPRINT_CONTRACT.md（当前 Sprint 协议）

## ⭐ 关键：Sprint Contract 审查

### 第一步：审查 Contract
在功能实现前，审查 Generator 提议的 Contract：

1. 验收标准是否具体、可测试？
2. 是否覆盖了正常流程和边界情况？
3. 技术方案是否合理？
4. 是否有遗漏的测试点？

### 审查结果格式
```markdown
## Contract 审查结果

### 审查结论
- [ ] 同意：开始测试
- [ ] 需修改：详见下文

### 需修改项
1. [问题描述] → [建议修改]

### 补充验收点
[你补充的边界测试]
```

### 第二步：测试实现
Contract 批准后，测试实现：

1. 读取要测试的 feature 的 CONTRACT
2. 启动应用 (init.sh)
3. 用 Playwright/curl/手动测试每个验收点
4. 逐条检查，记录通过/失败
5. 给出详细评估报告

## 评估标准 (每条都要测试)
- [ ] 验收点1: 测试结果
- [ ] 验收点2: 测试结果
...

## 输出格式
```json
{
  "feature_id": "001",
  "passed": true/false,
  "issues": [
    {
      "severity": "critical/major/minor",
      "description": "问题描述",
      "location": "文件:行号",
      "suggestion": "修复建议"
    }
  ],
  "score": 8/10
}
```

## 重要规则
- 必须实际运行代码测试，不能只读代码
- 严格打分，不要因为是自己写的就放水
- critical 问题必须修复后才能通过
- 测试要覆盖边界情况

---

## 使用示例

### 完整流程（Sprint Contract）

```
用户: "帮我做一个天气预报web应用"

你 (Master):
1. spawn Planner → 生成 SPEC.md + FEATURES.json
2. spawn Generator → 起草 Sprint Contract #001
3. spawn Evaluator → 审查 Contract
   - 同意！→ 进入实现
   - 需修改 → 返回 Generator
4. Generator 实现功能
5. spawn Evaluator → 测试验收
6. 通过？→ commit + 下一功能
   失败？→ 返回 Generator 修复
7. 循环直到所有 feature 完成
```

### 进度恢复

```
新 session 开始时:
1. 读取 PROGRESS.txt → 知道做到了哪
2. 读取 FEATURES.json → 找下一个未完成的
3. 读取 SPRINT_CONTRACT.md → 知道当前 Contract 状态
4. spawn Generator 继续
```

---

## Context Reset（长任务处理）

当任务运行时间很长时，模型可能出现"Context Anxiety"（过早收尾）。

### 识别信号
- 模型开始说"总结一下"
- 省略细节，只给结果
- 不再深入实现

### 处理方法
1. 清理当前 context
2. 创建结构化 handoff 文件：
   - 完成的工作
   - 正在进行的工作
   - 下一步计划
3. 启动新 agent，读取 handoff 继续

### Handoff 模板
```markdown
# Session Handoff

## 已完成
- [列表]

## 进行中
- Feature: xxx
- 进度: 80%

## 下一步
1. 完成当前 feature 的测试
2. 进入下一个 feature

## 关键上下文
- 技术栈: React + FastAPI
- 代码位置: src/
- 测试命令: npm test
```

---

## 成本意识

| 模式 | 估算成本 | 适用场景 |
|------|----------|----------|
| Solo | ~$9 | 简单任务，20分钟 |
| Full Harness | ~$200 | 复杂任务，6小时 |

### 动态选择
- 简单任务 → 直接你做（Solo）
- 复杂任务 → 用完整 Harness
- 超复杂任务 → 完整版 + Context Reset

---

## 设计决策

| 问题 | 选择 | 原因 |
|------|------|------|
| Sprint Contract | 必须 | 减少理解偏差，提高质量 |
| Generator/Evaluator 分离 | 必须 | 避免自我美化 |
| Pull vs Push | Pull | 避免 Master 成为瓶颈 |
| Context Reset | 必要时 | 处理长任务 |

---

设计: 小爪 🐾
基于: Anthropic Harness Design 文章
