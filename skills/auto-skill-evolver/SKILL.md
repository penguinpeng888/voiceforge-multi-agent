# Auto Skill Evolver
通过 trace + 反馈持续改进 skills，支持自我进化的 AI Agent 系统。

## 核心架构（整合 HyperAgents）

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto Skill Evolver                        │
├─────────────────────────────────────────────────────────────┤
│  MONITOR → DETECT → EXTRACT → PROPOSE → VALIDATE → APPROVE  │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MetaAgent (自我改进)                     │    │
│  │  • 读取 skill 代码                                     │    │
│  │  • 分析问题/反馈                                       │    │
│  │  • 生成改进代码                                        │    │
│  │  • 写回文件                                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              TaskAgent (任务执行)                      │    │
│  │  • 执行 skill 任务                                     │    │
│  │  • 返回结果                                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Evaluation Loop                         │    │
│  │  • 评估结果质量                                        │    │
│  │  • 记录反馈                                            │    │
│  │  • 触发 MetaAgent 改进                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Contracts

### Input
- 要改进的 skill 或任务
- 反馈/错误信息
- 任务执行结果
- 评估分数

### Output
- 改进后的 skill / 新创建的 skill
- 状态报告
- 评估历史

---

## Stage Structure

```
MONITOR → DETECT → EXTRACT → PROPOSE → VALIDATE → APPROVE → APPLY
                         ↓
                    META_EVALUATE
                         ↓
                    META_IMPROVE
```

### 1. MONITOR
- 监控任务模式
- 记录用户任务类型
- 检测重复模式
- 统计频率

### 2. DETECT
- 检测可创建时机
- 同一类型任务出现 3+ 次
- 任务可以模板化
- 用户明确要求创建

### 3. EXTRACT
- 提取任务模式
- 从历史任务中提取通用流程
- 确定输入/输出格式
- 生成 Skill 模板

### 4. PROPOSE
- 告诉用户检测到的模式
- 提议创建 Skill
- 给出预览

### 5. VALIDATE
- 检查 Skill 完整性
- 测试可用性

### 6. APPROVE
- 用户确认创建/改进

### 7. APPLY
- 写入 Skill 文件
- 更新索引
- 通知用户

### 8. META_EVALUATE (新增)
- 执行任务并获取结果
- 计算评估分数
- 记录错误/反馈

### 9. META_IMPROVE (新增 - HyperAgents)
- 分析评估结果
- 读取当前代码
- 生成改进方案
- 写回代码

---

## 触发关键词

| 类型 | 关键词 |
|------|--------|
| 手动创建 | 创建 skill, make skill |
| 手动改进 | 训练技能, evolve skill, 改进 |
| 查看状态 | 查看训练状态, check status |
| 批准 | 批准, approve, 同意 |
| 自动检测 | (后台自动) |

---

## 自动创建流程

```
用户执行任务类型 A (第1次)
    ↓
记录到 task_patterns.json
    ↓
用户执行任务类型 A (第2次)
    ↓
用户执行任务类型 A (第3次)
    ↓
检测到重复模式！
    ↓
提取模式 → 生成 Skill 模板
    ↓
弹出建议："检测到你重复做 X，要我创建 Skill 吗？"
    ↓
用户同意 → 创建 Skill
```

---

## MetaAgent 自我改进流程

```python
# 1. Task Agent - 执行任务
result = task_agent.forward({
    "skill_name": "xxx",
    "inputs": {...}
})

# 2. 评估结果
score = evaluator.evaluate(result, expected)

# 3. 如果分数低，触发 MetaAgent
if score < threshold:
    improvements = meta_agent.forward(
        repo_path="skills/xxx/",
        eval_path="evaluation_results.json",
        feedback="问题描述..."
    )
    
# 4. 写回改进
for file_path, new_content in improvements:
    write_file(file_path, new_content)
```

---

## 任务模式记录

```json
{
  "patterns": [
    {
      "id": "pattern_001",
      "type": "pdf_summary",
      "description": "总结 PDF 文档",
      "count": 3,
      "first_seen": "2026-04-08",
      "last_seen": "2026-04-08",
      "can_skillify": true,
      "suggested_skill_name": "pdf-summarizer"
    }
  ]
}
```

---

## 评估历史记录

```json
{
  "evaluations": [
    {
      "id": "eval_001",
      "skill_name": "xxx",
      "timestamp": "2026-04-09T00:00:00Z",
      "input": {...},
      "output": {...},
      "score": 0.85,
      "feedback": "结果基本正确，但格式可以改进",
      "improvements": []
    }
  ]
}
```

---

## 生成的 Skill 模板

```yaml
---
name: pdf-summarizer
description: 自动总结 PDF 文档
trigger:
  - 总结 PDF
  - 提取 PDF 要点
---

## 工作流
1. 读取 PDF
2. 提取文本
3. 生成摘要
4. 保存结果
```

---

## 用户画像集成

自动创建的 Skill 可以读取用户偏好：
- 偏好的输出格式
- 偏好的详细程度
- 偏好的语言

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| skill_not_found | 提示名称 |
| validation_fail | 回退更改 |
| pattern_detect_fail | 继续监控 |
| user_reject | 取消创建，记录拒绝原因 |
| meta_improve_fail | 回退到手动改进 |

---

## 文件操作权限

MetaAgent 可以操作以下文件：
- `skills/*/` - 所有 skill 目录
- `skills/*/SKILL.md` - Skill 定义
- `skills/*/scripts/*.py` - Skill 脚本
- `skills/*/prompts/*.md` - Skill 提示词

禁止操作：
- 系统文件
- 密码/密钥文件
- 非 skill 目录

---

## 评估标准

| 分数范围 | 状态 | 动作 |
|----------|------|------|
| 0.9-1.0 | 优秀 | 记录成功模式 |
| 0.7-0.9 | 良好 | 可选改进 |
| 0.5-0.7 | 一般 | 建议改进 |
| <0.5 | 差 | 触发 MetaAgent |