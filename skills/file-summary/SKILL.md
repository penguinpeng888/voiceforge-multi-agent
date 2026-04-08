# File Summary

本地文档摘要工具。支持 txt/docx/pdf/xlsx 等格式。

## 触发条件
- 用户要求总结文件
- 需要提取文档关键信息

---

## Contracts

### Input
- 文件路径
- 摘要长度（可选）

### Output
- 文档摘要
- 关键信息提取

### Stop Conditions
- 文件不存在
- 不支持的格式

---

## Stage Structure

```
READ → PARSE → EXTRACT → SUMMARIZE → OUTPUT
```

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| file_not_found | 提示检查路径 |
| unsupported_format | 列出支持的格式 |
| parse_error | 尝试备用解析器 |

---

## 支持格式

- TXT: 纯文本
- DOCX: Word 文档
- PDF: PDF 文件
- XLSX: Excel 文件
