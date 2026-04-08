# Skill Vetter

AI Agent 的安全优先 skill 审查。安装前检查风险。

## 触发条件
- 安装新 skill
- 审查现有 skill
- 安全审计

---

## Contracts

### Input
- Skill 路径或名称

### Output
- 审计报告
- 风险评级
- 建议

### Validation
- 权限检查
- 可疑模式检测

---

## Stage Structure

```
SCAN → ANALYZE → REPORT → DECIDE
```

1. **SCAN** - 扫描文件
2. **ANALYZE** - 分析风险
3. **REPORT** - 生成报告
4. **DECIDE** - 建议是否安装

---

## 检查项

### 权限范围
- 文件系统访问
- 网络访问
- 进程控制
- 敏感操作

### 可疑模式
- 恶意命令
- 数据外泄风险
- 权限提升尝试
- 隐藏操作

### 代码质量
- 安全性
- 依赖检查

---

## 风险评级

| 级别 | 说明 |
|------|------|
| ✅ SAFE | 可安全安装 |
| ⚠️ CAUTION | 需注意 |
| 🔴 DANGER | 不建议安装 |

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| scan_error | 跳过并警告 |
| false_positive | 人工复核 |
