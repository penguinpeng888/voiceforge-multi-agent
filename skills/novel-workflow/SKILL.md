# Novel Workflow

小说创作自动工作流。写作 → 审核 → 进化 → 遗传。

## 触发条件
- 创作新章节
- 审核章节
- 进化改进
- 继承基因

---

## 工作流

```
WRITE → REVIEW → EVOLVE → INHERIT
```

### Write
`python scripts/novel-workflow.py write <章节> <大纲>`

### Review
`python scripts/novel-workflow.py review <文件>`

### Evolve
`python scripts/novel-workflow.py evolve <章节> <评分>`

### Inherit
`python scripts/novel-workflow.py inherit`

---

## 基因库继承

- EvoMap 胶囊库
- 经验遗传库
- 自动生成写作提示
