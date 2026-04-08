# Auto Skill Evolver

通过 trace + 反馈持续改进 skills，检测重复任务并自动创建新 skill。

## 触发条件
- 训练/改进 skill
- 查看训练状态
- 重复任务模式检测
- 自动创建 skill

---

## Contracts

### Input
- 要改进的 skill
- 反馈/错误信息
- 任务模式数据

### Output
- 改进后的 skill / 新创建的 skill
- 状态报告

---

## Stage Structure

```
MONITOR → DETECT → EXTRACT → PROPOSE → VALIDATE → APPROVE → APPLY
```

### 1. MONITOR - 监控任务模式
- 记录用户任务类型
- 检测重复模式
- 统计频率

### 2. DETECT - 检测可创建时机
- 同一类型任务出现 3+ 次
- 任务可以模板化
- 用户明确要求创建

### 3. EXTRACT - 提取任务模式
- 从历史任务中提取通用流程
- 确定输入/输出格式
- 生成 Skill 模板

### 4. PROPOSE - 提出建议
- 告诉用户检测到的模式
- 提议创建 Skill
- 给出预览

### 5. VALIDATE - 验证
- 检查 Skill 完整性
- 测试可用性

### 6. APPROVE - 批准
- 用户确认创建

### 7. APPLY - 应用
- 写入 Skill 文件
- 更新索引
- 通知用户

---

## 触发关键词

| 类型 | 关键词 |
|------|--------|
| 手动创建 | 创建 skill, make skill |
| 手动改进 | 训练技能, evolve skill |
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
