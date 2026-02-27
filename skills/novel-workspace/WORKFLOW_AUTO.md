# 小说创作自动工作流

## 概述

本工作流整合了写作、审核、进化、遗传四个阶段，实现了小说创作的闭环自动化。

```
┌─────────────────────────────────────────────────────────────────────┐
│                         小说创作自动工作流                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │   写作阶段     │       │   审核阶段     │       │   进化阶段     │
    │ novel-writer  │ ───▶  │ novel-editor  │ ───▶  │ novel-evomap  │
    └───────────────┘       └───────────────┘       └───────────────┘
            │                       │                       │
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    ▼
                          ┌───────────────┐
                          │   遗传阶段     │
                          │ 经验库更新     │
                          └───────────────┘
                                    │
                                    ▼
                          ┌───────────────┐
                          │   下一章      │
                          │ (继承经验)     │
                          └───────────────┘
```

---

## 阶段一：写作阶段

### 输入
- 上一章信息（可选，用于继承）
- 当前章节大纲/要点
- 写作技法选择

### 输出
- 章节初稿文件

### 使用方法

```bash
# 基本用法
python scripts/novel-workflow.py write "第18章-修炼突破" "修炼、突破、猪恢复"

# 继承上一章经验
python scripts/novel-workflow.py write "第18章" "修炼" --inherit

# 指定技法
python scripts/novel-workflow.py write "第18章" "战斗" --techniques "感官轰炸,镜头切换"
```

### 继承机制

写作前会自动从EvoMap继承相关经验：

1. 检索相关胶囊（相同类型章节）
2. 获取推荐基因（高分技法）
3. 生成写作提示

---

## 阶段二：审核阶段

### 自动调用审核代理

```bash
# 审核章节
python scripts/novel-workflow.py review 第18章-修炼突破.md
```

### 审核维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 内部逻辑 | 20% | 自洽性、无矛盾 |
| 外部逻辑 | 20% | 与前文/世界观一致性 |
| 情节人物 | 25% | 因果链、人物动机 |
| 叙事结构 | 15% | 节奏、连贯性 |
| 修真特有 | 20% | 境界体系、功法逻辑 |

### 评分标准

| 评分 | 等级 | 说明 |
|------|------|------|
| 9.0+ | A+ | 优秀，可作为典范 |
| 8.0-8.9 | A | 良好，可定稿 |
| 7.0-7.9 | B+ | 小修后可定稿 |
| 6.0-6.9 | B | 需要修改 |
| <6.0 | C | 需大幅重写 |

---

## 阶段三：进化阶段

### 根据审核结果进化

```bash
# 审核后自动进化
python scripts/novel-workflow.py evolve "第18章" 7.5 "问题1,问题2"
```

### 进化操作

1. **胶囊封装**
   - 提取关键场景
   - 记录使用的技法
   - 保存创新点

2. **基因生成**
   - 从问题生成解决方案
   - 保存为新基因
   - 更新基因库

3. **事件记录**
   - 记录进化事件
   - 追踪历史

---

## 阶段四：遗传阶段

### 更新经验库

```bash
# 更新经验库
python scripts/novel-workflow.py inherit
```

### 遗传内容

- 成功胶囊 → 进入候选池
- 新生成基因 → 加入基因库
- 评分提升 → 标记为优质基因

---

## 完整工作流示例

```bash
# 1. 写作（继承上一章经验）
python scripts/novel-workflow.py write "第18章-修炼突破" "修炼、突破、猪恢复" --inherit

# 2. 审核
python scripts/novel-workflow.py review "第18章-修炼突破.md"

# 3. 根据审核结果修改后，再次审核
python scripts/novel-workflow.py review "第18章-修炼突破.md"

# 4. 进化（审核通过后）
python scripts/novel-workflow.py evolve "第18章" 8.0

# 5. 遗传（更新经验库）
python scripts/novel-workflow.py inherit

# 6. 继续下一章
python scripts/novel-workflow.py write "第19章" "战斗" --inherit
```

---

## 一键执行完整工作流

```bash
# 写+审+进化（不修改直接进）
python scripts/novel-workflow.py run "第18章-修炼突破.md"

# 完整流程（写→审→改→审→进化）
python scripts/novel-workflow.py full "第18章" "修炼、突破"
```

---

## 与现有系统集成

### 文件结构

```
skills/novel-workspace/
├── SYSTEM_STATUS.md       # 系统状态
├── CONFIG.md              # 配置
├── scripts/
│   ├── novel-workflow.py  # 主工作流脚本
│   └── send-chapter.py    # 发送章节
│
skills/novel-evomap/       # 进化系统
├── genes/                 # 基因库
├── capsules/              # 胶囊库
└── scripts/
    ├── inheritance.py     # 继承器
    └── evolution_engine.py # 进化引擎
```

### 依赖关系

```
novel-workflow.py
    ├── novel-evomap/      # 继承、进化
    │   ├── inheritance.py
    │   └── evolution_engine.py
    ├── novel-editor/      # 审核
    │   └── agent-prompt.md
    └── novel-logic-checker/ # 逻辑检查
        └── scripts/logic-checker.py
```

---

## 配置项

在 `CONFIG.md` 中配置：

```yaml
workflow:
  auto_review: true        # 自动审核
  auto_evolve: true        # 自动进化
  inherit_enabled: true    # 启用继承
  quality_gate: 7.0        # 质量门控

paths:
  novel_dir: "/root/.openclaw/workspace/剑起青云"
  evomap_dir: "/root/.openclaw/workspace/skills/novel-evomap"
```

---

## 使用建议

1. **先继承再写**：使用 `--inherit` 获取上一章经验
2. **多次审核**：初稿→修改→终稿，确保评分达标
3. **记录问题**：审核时记录问题，进化时生成解决方案
4. **定期清理**：清理低分胶囊，保持基因库质量

---

## 监控命令

```bash
# 查看系统状态
python scripts/novel-workflow.py status

# 查看进化历史
python scripts/novel-evomap/scripts/evolution_engine.py stats

# 查看基因库
python scripts/novel-evomap/scripts/inheritance.py list
```

---

*最后更新：2026-02-24*
