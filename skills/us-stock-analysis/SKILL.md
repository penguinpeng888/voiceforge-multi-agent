# US Stock Analysis

美股分析工具。包含基本面、技术面、股票比较。

## 触发条件
- 用户要求分析美股
- 比较股票
- 生成投资报告

---

## Contracts

### Input
- 股票代码（如 AAPL, TSLA, NVDA）
- 分析类型

### Output
- 投资报告
- 技术分析
- 估值建议

---

## Stage Structure

```
FETCH → ANALYZE → COMPARE → REPORT
```

---

## 分析维度

### 基本面分析
- 财务指标
- 业务质量
- 估值

### 技术分析
- 指标
- 图表模式
- 支撑/压力位

### 股票比较
- 对比多只股票
- 相对强弱

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| invalid_ticker | 检查代码 |
| data_error | 使用备用源 |
