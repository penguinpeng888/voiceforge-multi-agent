# AI Humanizer

将 AI 生成的文本改写得更自然、像人类写的。

## 触发条件
- 用户要求"人性化"文本
- 去 AI 化
- 让内容听起来更自然

---

## Contracts

### Input
- AI 生成的文本

### Output
- 人类化的文本

### Validation
- 保留原意
- 去除 AI 模式

---

## Stage Structure

```
DETECT → PATTERN_REWRITE → NATURALIZE → OUTPUT
```

1. **DETECT** - 检测 AI 模式
2. **PATTERN_REWRITE** - 重写 AI 模式
3. **NATURALIZE** - 自然化
4. **OUTPUT** - 输出

---

## 24 个检测模式

1. 开头总起句
2. 首先/其次/最后
3. 然而/但是/不过
4. 总结性陈述
5. 列表格式化
6. 绝对化词汇
7. 不确定表达
8. 机械过渡
9. 情感缺失
10. 过度解释
11. 缺乏细节
12. 机械重复
13. 平衡观点
14. 空洞鼓励
15. 冗长解释
16. 缺乏例子
17. 正式过度
18. AI 词汇
19. 被动语态
20. 模板化
21. 缺乏个性
22. 过度礼貌
23. 总结优先
24. 逻辑过渡

---

## Failure Taxonomy

| 故障 | 恢复策略 |
|------|----------|
| text_too_short | 建议增加内容 |
| preserve_meaning_failed | 人工检查 |

---

## 评分指标

- Burstiness（句长变化）
- Type-Token Ratio
- 可读性分数

## 输出

返回改写后的文本和 AI 检测分数。
