# Agent Browser

快速的头像浏览器自动化 CLI。Rust 编写，有 Node.js 回退。

## 触发条件
- 需要自动化网页操作
- 截图、点击、输入
- 抓取数据

---

## Contracts

### Input
- 操作指令
- 目标 URL

### Output
- 执行结果
- 截图

---

## Stage Structure

```
LAUNCH → NAVIGATE → ACTION → CAPTURE → RESULT
```

---

## 支持操作

- 导航 (navigate)
- 点击 (click)
- 输入 (type)
- 截图 (snapshot)
- 等待 (wait)
- 评估 (eval)

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| page_load_fail | 重试 + 等待 |
| element_not_found | 等待后重试 |
| timeout | 增加超时时间 |
