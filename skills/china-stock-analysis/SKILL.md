---
name: china-stock-analysis
description: Analyze Chinese stock prices (A-shares, HK stocks) and provide investment recommendations. Use when the user asks about stock analysis for Chinese companies, including buying/selling recommendations and market trends.
---

# 股票分析

分析股票价格走势并提供投资建议。

## 触发条件
- 用户询问中国股票分析
- 需要买入/卖出建议
- 了解市场趋势

---

## Contracts（合约）

### Input
- 股票代码或名称（如 600519.SH、0700.HK）
- 分析类型（技术面、基本面、短线、长线）

### Output
- 股价数据表格
- 技术面分析
- 投资建议

### Validation
- 股票代码格式正确
- 数据来源可靠

### Stop Conditions
- 用户明确停止
- 股票代码无效
- 数据获取失败

---

## Roles（角色）

| 角色 | 职责 |
|------|------|
| DataCollector | 收集股价数据和市场信息 |
| Analyst | 分析技术面和基本面 |
| Advisor | 给出投资建议 |

---

## Stage Structure（阶段结构）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   FETCH     │────▶│   ANALYZE   │────▶│   ADVISE    │────▶│   OUTPUT    │
│   获取数据   │     │   分析判断   │     │   投资建议   │     │   输出结果   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  搜索股价数据          技术分析            买入/持有/卖出        格式化输出
  获取新闻              基本面分析          风险提示
```

---

## Adapters（适配器）

| 适配器 | 作用 |
|--------|------|
| web_search | 搜索股价数据 |
| news_collector | 收集相关新闻 |
| data_parser | 解析股价数据 |

---

## State Semantics（状态缓存）

- 缓存股价数据 5 分钟
- 记录分析历史

---

## Failure Taxonomy（故障分类）

| 故障类型 | 恢复策略 |
|----------|----------|
| invalid_code | 提示正确的代码格式 |
| data_not_found | 尝试备用数据源 |
| network_error | 重试 3 次 |

---

## 支持市场

| 市场 | 代码格式 | 示例 |
|------|----------|------|
| A股（上海）| XXXXXX.SH | 600519.SH (茅台) |
| A股（深圳）| XXXXXX.SZ | 000001.SZ (平安) |
| 港股 | XXXX.HK | 0700.HK (腾讯) |
| 美股 | TICKER | AAPL, TSLA, NVDA |

---

## 分析工作流

### 1. 获取数据
搜索股价："{股票名称} 股价 今日"

### 2. 收集信息
- 最新新闻
- 行业趋势
- 市场情绪

### 3. 格式化输出
```
## 📊 {股票名称}({代码}) 股价分析

### 📈 核心数据
| 指标 | 数值 | 变化 |
|------|------|------|
| 收盘价 | XXX | +XX% |
| 涨跌幅 | XX% | 🔴/🟢 |

### 技术面分析
- 短期趋势：...
- 关键支撑/压力位：...

### 💡 投资建议
**建议：买入/持有/卖出**
- 理由：...
- 风险提示：...
```

---

## 风险提示
分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。

---

## 常用股票代码参考

See [references/china-stocks.md](references/china-stocks.md) for popular Chinese stock codes.
