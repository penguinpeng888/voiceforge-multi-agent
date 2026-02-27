# Novel Workspace - 多代理创作系统

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   主代理（写作代理）                      │
│  · 规划章节内容                                           │
│  · 书写章节正文                                           │
│  · 调用写作技法（openclaw-writing-skills）                │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓ 调用
┌─────────────────────────────────────────────────────────┐
│                   审核代理（校核专家）                    │
│  · 逻辑合理性检查                                         │
│  · 书写规范性检查                                         │
│  · 描写生动性检查                                         │
│  · 符合性检查（与大纲一致）                               │
│  · 评分机制（9分以上可定稿）                              │
│  · 调用逻辑检查（novel-logic-checker）                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓ 返回
┌─────────────────────────────────────────────────────────┐
│                   主代理（修改）                          │
│  · 根据审核建议修改                                       │
│  · 重新提交审核                                           │
│  · 直到9分以上定稿                                        │
└─────────────────────────────────────────────────────────┘
```

## 组件列表

| 组件 | 目录 | 用途 |
|------|------|------|
| 写作技法 | `openclaw-writing-skills/` | 战斗、心理、环境描写技法 |
| 逻辑检查 | `novel-logic-checker/` | 四大维度逻辑检查 |
| 审核代理 | `novel-editor/` | 代理提示词配置 |
| 自动化脚本 | `novel-workspace/` | 统一启动入口 |

## 使用方法

### 方法1：手动启动（当前支持）

```bash
# 1. 写作代理写完章节后，保存到文件
# 2. 运行逻辑检查
python3 skills/novel-logic-checker/scripts/logic-checker.py \
    --file /path/to/chapter.md \
    --chapter 16 \
    --detail

# 3. 根据报告修改
# 4. 重新检查，直到9分以上
```

### 方法2：代理模式（需要模型支持）

```python
# 主代理中调用
from message import send, action

# 写完章节后
chapters = {
    "file": "/root/.openclaw/workspace/剑起青云/第16章-正面交锋.md",
    "chapter": 16,
    "title": "正面交锋"
}

# 调用审核代理
sessions_spawn(
    task=f"""你是文章/小说校核专家。
请检查{chapters['title']}的逻辑合理性。

文件路径：{chapters['file']}

请按照以下维度检查：
1. 内部逻辑：规则一致性、设定限制、社会合理性
2. 外部逻辑：科学法则、人物心理、历史常识
3. 情节人物逻辑：动机、因果链、信息对称性
4. 叙事结构逻辑：时间线、视角、伏笔
5. 修真特有逻辑：境界/功法/战斗/势力

输出要求：
- 五大维度分别评分
- 总分及等级（9分以上可定稿）
- 详细问题列表
- 具体整改建议""",
    label=f"校核专家-{chapters['title']}",
    model="default",
    cleanup="keep"
)
```

### 方法3：自动化工作流（未来）

```bash
# 一键完成写作-审核-修改循环
python3 skills/novel-workspace/workflow.py \
    --chapter 16 \
    --title "正面交锋" \
    --auto-revise
```

## 评分标准

| 分数 | 等级 | 结论 | 行动 |
|------|------|------|------|
| 9.0+ | 优秀 | 可定稿 | ✅ 完成 |
| 8.0-8.9 | 良好 | 稍作修改 | 小改后定稿 |
| 7.0-7.9 | 一般 | 需要修改 | 中改后重审 |
| 6.0-6.9 | 及格 | 需要大改 | 大改后重审 |
| 6.0- | 不及格 | 需重写 | 重写后重审 |

## 文件结构

```
novel-workspace/
├── CONFIG.md              # 本配置文件
├── README.md              # 使用说明
├── scripts/
│   ├── auto-workflow.py   # 自动化工作流（未来）
│   └── send-chapter.py    # 发送章节文件
├── templates/
│   └── audit-report.md    # 审核报告模板
└── logs/
    └── audit-history.json # 审核历史
```

## 核心原则

> **逻辑为故事服务**
>
> 不要因追求极致的逻辑而牺牲故事的戏剧性和情感力量。一个充满情感、能打动人的故事，即便有一点小瑕疵，也远比逻辑完美但枯燥的作品更受欢迎。

---

## 快速开始

```bash
# 1. 写完章节后保存到剑起青云目录
# 2. 运行逻辑检查
python3 skills/novel-logic-checker/scripts/logic-checker.py \
    --file /root/.openclaw/workspace/剑起青云/第16章-正面交锋.md \
    --chapter 16 \
    --detail

# 3. 查看报告，修改问题
# 4. 重新检查，直到9分以上
# 5. 使用 --send 参数发送文件
python3 skills/novel-workspace/scripts/send-chapter.py \
    --file /root/.openclaw/workspace/剑起青云/第16章-正面交锋.md
```
