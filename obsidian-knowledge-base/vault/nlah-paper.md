---
title: Natural-Language Agent Harnesses (NLAH)
date: 2026-03-26
source: arXiv 2603.25723
tags: ["agent", "harness", "architecture", "research"]
authors: Linyue Pan, Lexiao Zou, Shuo Guo, Jingchen Ni, Hai-Tao Zheng
---

# Natural-Language Agent Harnesses (NLAH)

## 核心概念
- **NLAH**: 用自然语言表达的 agent 控制逻辑
- **IHR**: Intelligent Harness Runtime，执行 NLAH 的共享运行时
- 目的：让 harness 设计变成可移植、可执行的分析对象

## 关键组件
1. **Contracts**: 必需的输入输出、验证门、停止规则
2. **Roles**: 角色提示（solver, verifier, researcher）
3. **Stage structure**: 显式工作拓扑（plan→execute→verify→repair）
4. **Adapters**: 确定性钩子（测试、验证器）
5. **State semantics**: 跨步骤持久化的状态
6. **Failure taxonomy**: 命名故障模式驱动恢复

## 与 OpenClaw 的关联
- OpenClaw 的 Skill 系统与 NLAH 理念相似
- Skill = 可执行的控制知识
- IHR ≈ OpenClaw 的运行时

## 实验结果
- SWE-bench: 代码修复
- OSWorld: 计算机使用
- 结论：显式 harness 可迁移、可组合、可 ablation

## 引用
@arXiv{2603.25723,
  author = {Linyue Pan and Lexiao Zou and Shuo Guo and Jingchen Ni and Hai-Tao Zheng},
  title = {Natural-Language Agent Harnesses},
  year = {2026},
  eprint = {2603.25723},
  archivePrefix = {arXiv}
}
