# DuckDuckGo Web Search

使用 DuckDuckGo 进行网页搜索，无需 API Key。

## 触发条件
- 需要搜索网页内容
- 没有其他搜索 API 可用
- 需要快速获取信息

---

## Contracts

### Input
- 搜索关键词
- 结果数量（默认 10）

### Output
- 搜索结果列表（标题、URL、摘要）

### Stop Conditions
- 搜索结果为空
- 网络错误

---

## Stage Structure

```
QUERY → SEARCH → FORMAT → OUTPUT
```

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| network_error | 重试 |
| no_results | 尝试其他关键词 |

---

## 使用示例

```python
web_search(query="OpenClaw AI agent", count=10)
```

返回：
```json
[
  {"title": "...", "url": "...", "snippet": "..."}
]
```
