# 小说创作工具包 - 快速使用指南

## 新会话启动时自动执行

### 第一步：读取工具说明（必须）

```bash
# 按顺序读取以下文件
1. /root/.openclaw/workspace/skills/openclaw-writing-skills/SKILL.md
2. /root/.openclaw/workspace/skills/novel-logic-checker/SKILL.md
3. /root/.openclaw/workspace/skills/novel-workspace/CONFIG.md
```

**原因**：新会话不会自动扫描 skills 目录，必须主动读取。

---

## 工具清单

| 工具 | 用途 | 脚本路径 |
|------|------|----------|
| **openclaw-writing-skills** | 战斗/心理/环境描写技法 | 手动读取 SKILL.md |
| **novel-logic-checker** | 四大维度逻辑检查 | `python3 scripts/logic-checker.py --file <file> --chapter <n> --detail` |
| **novel-workspace** | 发送文件、配置 | `python3 scripts/send-chapter.py --file <file>` |
| **story-cog** | AI创意写作 | 需要时读取 |
| **writing-assistant** | 写作风格优化 | 需要时读取 |

---

## 写作流程（标准化）

```
1. 读取写作技法（openclaw-writing-skills/SKILL.md）
2. 规划章节内容
3. 书写章节（应用技法）
4. 保存文件（/root/.openclaw/workspace/剑起青云/第X章-标题.md）
5. 运行逻辑检查（novel-logic-checker）
6. 根据报告修改
7. 重新检查，直到9分以上
8. 发送文件给用户（novel-workspace/send-chapter.py）
```

---

## 常用命令速查

```bash
# 逻辑检查
python3 skills/novel-logic-checker/scripts/logic-checker.py \
    --file /root/.openclaw/workspace/剑起青云/第16章-正面交锋.md \
    --chapter 16 \
    --detail

# 发送文件
python3 skills/novel-workspace/scripts/send-chapter.py \
    --file /root/.openclaw/workspace/剑起青云/第16章-正面交锋.md \
    --chapter 16 \
    --title "正面交锋"
```

---

## 评分标准

| 分数 | 等级 | 行动 |
|------|------|------|
| 9.0+ | 优秀 | ✅ 定稿 |
| 8.0-8.9 | 良好 | 小改后定稿 |
| 7.0-7.9 | 一般 | 中改后重审 |
| 6.0-6.9 | 及格 | 大改后重审 |
| <6.0 | 不及格 | 重写 |

---

## 代理模式（未来可用）

当 `sessions_spawn` 可用时，可创建子代理：

```python
# 审核代理
sessions_spawn(
    task="你是文章/小说校核专家，检查第X章逻辑...",
    label="校核专家-第X章",
    model="default",
    cleanup="keep"
)
```

---

## 核心原则

> **逻辑为故事服务**
>
> 不要因追求极致的逻辑而牺牲故事的戏剧性和情感力量。

---

*本文件需要在新会话开始时读取，确保所有工具可用。*
