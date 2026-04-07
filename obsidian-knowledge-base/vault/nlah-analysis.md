---
title: NLAH 精髓分析 - Harness Engineer 实践指南
date: 2026-04-07
source: arXiv 2603.25723 分析
tags: ["harness", "engineering", "architecture", "self-improvement"]
---

# NLAH 精髓分析 - Harness Engineer 实践指南

## 一、核心洞察

### 问题现状
- Harness 逻辑散落在 controller code、framework defaults、tool adapters 中
- 难以迁移、比较、ablation
- 评估变成了 controller-bundle 对比，而非模块级证据

### 解决思路
- 把 harness 设计成**显式的、可移植的、可执行的**对象
- 用自然语言表达，用运行时解释执行

## 二、Harness 的 6 大核心组件

### 1. Contracts（合约）
**是什么**：输入输出规范、验证门、停止规则
```
Contract: code_file
- Input: task description
- Output: valid Python file at solution.py
- Validation: must pass all tests
- Stop: 3 retries then fail
```

### 2. Roles（角色）
**是什么**：每个阶段的不同角色，各司其职
- Planner: 制定计划
- Solver: 生成代码
- Verifier: 验证结果
- Debugger: 修复错误
- Researcher: 研究问题

### 3. Stage Structure（阶段结构）
**是什么**：显式的工作流拓扑
```
PLAN → EXECUTE → VERIFY → REPAIR
   ↓         ↓        ↓        ↓
 计划      执行     验证     修复
```

### 4. Adapters（适配器）
**是什么**：确定性钩子
- tests: 测试
- linters: 代码检查
- verifiers: 验证器
- scrapers: 抓取器

### 5. State Semantics（状态语义）
**是什么**：跨步骤持久化的状态
- 文件持久化
- 路径寻址
- 压缩稳定（重启后仍可用）

### 6. Failure Taxonomy（故障分类）
**是什么**：命名故障模式驱动恢复
- format_error → 重新生成
- test_failure → 进入 REPAIR
- tool_error → 重试一次

## 三、对 OpenClaw 的启示

### 当前状态
- Skill 系统 ≈ 简化版 NLAH
- 但缺少：Contracts、Failure Taxonomy、State Semantics

### 改进方向
1. **为 Skill 增加 Contract**
   - 明确输入输出格式
   - 验证门
   - 停止条件

2. **增加 Failure 处理**
   - 定义常见失败模式
   - 自动恢复策略

3. **强化 State 持久化**
   - Skill 执行状态保存
   - 支持断点续传

4. **显式 Stage Structure**
   - 每个 Skill 明确阶段
   - 阶段间清晰跳转

## 四、实践模板

### 标准 Skill 格式（增强版）
```markdown
# Skill Name

## Contracts
- Input: ...
- Output: ...
- Validation: ...
- Stop conditions: ...

## Roles
- Role1: 职责描述
- Role2: 职责描述

## Stages
1. STAGE1 - 做什么
2. STAGE2 - 做什么
...

## Adapters
- test: ...
- verify: ...

## State
- persist: ...
- resume from: ...

## Failure Taxonomy
- error_type → recovery_action
- error_type2 → recovery_action2
```
