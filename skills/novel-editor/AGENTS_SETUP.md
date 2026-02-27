# OpenClaw 代理配置指南

## 配置文件位置

```
/root/.openclaw/agents/
├── main/                    # 当前主代理配置
│   └── agent/
│       └── models.json      # 当前已配置
│
└── novel-editor/            # 新建校核代理（待创建）
    ├── agent/
    │   └── models.json      # 模型配置
    └── sessions/            # 会话记录
```

## 步骤1：创建代理目录

```bash
# 创建 novel-editor 代理目录
mkdir -p /root/.openclaw/agents/novel-editor/agent
mkdir -p /root/.openclaw/agents/novel-editor/sessions
```

## 步骤2：创建 models.json

```bash
# 进入代理目录
cd /root/.openclaw/agents/novel-editor/agent

# 创建 models.json
cat > models.json << 'EOF'
{
  "id": "novel-editor",
  "model": "nvidia/minimaxai/minimax-m2.1",
  "name": "文章/小说校核专家",
  "description": "负责检查小说章节的逻辑合理性、书写规范性、描写生动性",
  "systemPrompt": "你是文章/小说校核专家。你的任务是：\n\n1. **逻辑合理性检查** - 四大维度全面审核\n2. **书写规范性检查** - 语法、用词、标点、格式\n3. **描写生动性检查** - 环境、心理、战斗描写\n4. **符合性检查** - 与大纲一致、时间线合理\n5. **评分机制** - 9分以上可定稿\n\n## 四大核心检查维度\n\n### 一、内部逻辑：故事世界的自洽性\n- 规则的一致性（功法消耗、能力限制）\n- 设定的限制（强大能力的代价）\n- 社会与文化的合理性（修真体系自圆其说）\n\n### 二、外部逻辑：与现实世界的关联\n- 自然科学法则（受伤恢复符合常理）\n- 人类行为与心理（情感转变有铺垫）\n- 历史与社会常识（货币/资源体系合理）\n\n### 三、情节与人物逻辑\n- 人物动机与成长（有足够动机支撑）\n- 情节因果链（发展遵循因果关系）\n- 信息对称性（决策基于已知信息）\n\n### 四、叙事与结构逻辑\n- 时间线连贯（无时间矛盾）\n- 视角一致性（描写符合视角规则）\n- 伏笔与呼应（开篇结尾有交代）\n\n### 修真小说特有检查\n- 境界体系（炼气→筑基→金丹→元婴→化神→大乘→渡劫）\n- 功法体系（噬灵诀特点、杂灵根限制）\n- 战斗逻辑（等级压制、战斗消耗、以弱胜强）\n- 势力逻辑（血影殿 vs 御剑宗 vs 通宝商会）\n\n## 评分标准\n\n| 分数 | 等级 | 结论 |\n|------|------|------|\n| 9.0+ | 优秀 | 可定稿 |\n| 8.0-8.9 | 良好 | 稍作修改 |\n| 7.0-7.9 | 一般 | 需要修改 |\n| 6.0-6.9 | 及格 | 需要大改 |\n| <6.0 | 不及格 | 需重写 |\n\n## 输出格式\n- 五大维度分别评分\n- 总分及等级判定\n- 详细问题列表\n- 具体整改建议\n\n## 核心原则\n> 逻辑为故事服务\n> 不要因追求极致的逻辑而牺牲故事的戏剧性和情感力量。",
  "workspace": "/root/.openclaw/workspace/novel-editor-agent",
  "allowedTools": [
    "read",
    "write",
    "exec",
    "memory_search",
    "memory_get"
  ]
}
EOF

echo "✅ models.json 已创建"
```

## 步骤3：验证配置

```bash
# 检查文件是否存在
ls -la /root/.openclaw/agents/novel-editor/agent/

# 查看内容
cat /root/.openclaw/agents/novel-editor/agent/models.json
```

## 步骤4：重启 OpenClaw（如果需要）

```bash
openclaw gateway restart
```

## 使用方法

配置完成后，可以用 `sessions_spawn` 创建子代理：

```python
# 在主代理中调用
sessions_spawn(
    task="请检查第16章《正面交锋》的逻辑合理性...",
    label="校核专家-第16章",
    agentId="novel-editor",  # 或 model="default"
    cleanup="keep"
)
```

或者通过 `sessions_send` 给代理发消息：

```python
sessions_send(
    sessionKey="agent:novel-editor:main",
    message="请检查第16章..."
)
```

---

## 快速创建命令（复制粘贴执行）

```bash
# 1. 创建目录
mkdir -p /root/.openclaw/agents/novel-editor/agent
mkdir -p /root/.openclaw/agents/novel-editor/sessions

# 2. 进入目录
cd /root/.openclaw/agents/novel-editor/agent

# 3. 创建 models.json
cat > models.json << 'EOF'
{
  "id": "novel-editor",
  "model": "nvidia/minimaxai/minimax-m2.1",
  "name": "文章/小说校核专家",
  "description": "负责检查小说章节的逻辑合理性",
  "systemPrompt": "你是文章/小说校核专家...",
  "workspace": "/root/.openclaw/workspace/novel-editor-agent",
  "allowedTools": ["read", "write", "exec", "memory_search", "memory_get"]
}
EOF

# 4. 验证
echo "✅ 配置完成"
ls -la
```

---

## 如果遇到问题

```bash
# 查看 OpenClaw 状态
openclaw gateway status

# 查看代理列表
openclaw agents list
```

---

*创建时间：2026-02-24*
