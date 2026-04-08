---
title: Anthropic Harness 设计精髓 - GAN 风格多 Agent 架构
date: 2026-04-08
source: anthropic.com/engineering/harness-design-long-running-apps
tags: ["harness", "multi-agent", "anthropic", "gan", "architecture"]
---

# Anthropic Harness 设计精髓

## 核心灵感：GAN 风格

从 **生成对抗网络 (GAN)** 汲取：
- **Generator（生成者）**：生成代码/设计
- **Evaluator（评判者）**：独立评判输出质量
- 分离"干活的人"和"评判的人"避免自我美化

## 架构：三 Agent 系统

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PLANNER   │────▶│  GENERATOR  │────▶│  EVALUATOR  │
│   规划者     │     │   生成者     │     │   评判者     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  扩展简单prompt       一次一功能(Sprint)    Playwright实测
  为完整spec          每次自评后交付         独立评判
```

## 1. Planner（规划者）

- 输入：1-4 句简单 prompt
- 输出：完整产品规格（16 功能，10 个 sprint）
- 职责：
  - 保持产品上下文
  - 高层次技术设计
  - 不纠结实现细节
  - 寻找 AI 集成机会

## 2. Generator（生成者）

- 一次开发一个功能（Sprint）
- 每次 Sprint 后自评
- 技术栈：React + Vite + FastAPI + PostgreSQL
- 使用 Git 版本控制

## 3. Evaluator（评判者）

- **核心**：独立于 Generator
- 使用 Playwright MCP 交互测试
- 验收标准评分（产品深度、功能、视觉、代码质量）
- 关键：调优独立 Evaluator 比让 Generator 自我批判更容易

## 两个核心问题与解决

### 1. Context Anxiety（上下文焦虑）
- **现象**：模型接近上下文限制时过早收尾
- **解决**：Context Reset（清理上下文 + 结构化 handoff）
- **注意**：增加延迟和 token 开销
- **进展**：Opus 4.6 大幅改善，可省略

### 2. Self-Evaluation（自我美化）
- **现象**：Agent 评价自己的作品时倾向美化
- **解决**：独立 Evaluator + 迭代 prompt 调优
- **调优方法**：
  1. 读 Evaluator 日志
  2. 找判断与期望不符的例子
  3. 更新 Evaluator prompt
  4. 重复直到合理

## 设计质量评分标准（4 维度）

1. **Design Quality**：整体感、颜色/排版/布局一致性
2. **Originality**：原创性，惩罚 AI 模板（如紫色渐变白卡片）
3. **Craft**：技术执行（排版层级、间距、对比）
4. **Functionality**：可用性

## Sprint Contract（关键！）

每个 Sprint 前，Generator 和 Evaluator 协商"完成标准"：
1. Generator 提议要建什么、如何验证
2. Evaluator 审查是否合理
3. 双方达成一致才开始写代码

## 实验结果

| 模式 | 时长 | 成本 | 质量 |
|------|------|------|------|
| Solo | 20 min | $9 | 核心功能损坏 |
| Full Harness | 6 hr | $200 | 完整可运行 |

**结论**：质量差异远超成本差异！

## 迭代优化

### V1（Opus 4.5）
- 需要 Sprint 分解
- 需要 Context Reset
- 需要每 Sprint 评估

### V2（Opus 4.6）
- 去掉 Sprint 分解（模型更强）
- 去掉 Context Reset
- 只在最后一次性评估
- 成本从 $200 降到 $124

## 关键教训

> "找到最简单的解决方案，只在需要时增加复杂度"

1. **假设会过时**：每个组件都代表"模型做不了的假设"，需定期压力测试
2. **模型进步 = Harness 简化**：模型变强，需要的 scaffold 减少
3. **边界动态**：任务超出模型能力时，Evaluator 仍有价值
4. **简单优先**：先尝试简单的，不行再增加复杂度

## 与 NLAH 关系

| 组件 | Anthropic 实践 |
|------|----------------|
| Contracts | Sprint Contract |
| Roles | Planner/Generator/Evaluator |
| Stage Structure | SPEC → BUILD → VERIFY |
| Adapters | Playwright MCP |
| State | 文件化 artifacts |
| Failure | Evaluator 反馈循环 |
