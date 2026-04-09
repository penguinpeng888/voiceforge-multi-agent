# My Brain Is Full Crew 整合方案

> 参考: https://github.com/gnekt/My-Brain-Is-Full-Crew
> 整合日期: 2026-04-09

---

## 一、当前系统状态

### 现有模块
- **记忆系统**: MEMORY.md + memory/*.md
- **VoiceForge**: TTS多Agent系统
- **小说创作**: novel-workflow
- **MemPalace**: 记忆宫殿
- **Skills**: auto-skill-evolver, khazix-writer等

### 现有问题
- 缺乏统一的Agent调度
- 记忆捕获/检索/维护分散
- 多Agent协作依赖手动

---

## 二、整合目标

```
用户 → Dispatcher → Skills/Agents → 记忆/VoiceForge/小说
```

### 核心架构
- **Dispatcher**: 统一调度入口
- **Skills**: 复杂多步骤流程
- **Agents**: 快速响应任务

---

## 三、具体整合方案

### 3.1 创建Dispatcher (记忆系统核心)

位置: `~/.openclaw/agents/dispatcher.md`

```yaml
# 调度规则
## 技能路由表 (优先)
- /记忆捕获 → Scribe
- /记忆检索 → Seeker
- /知识图谱 → Connector
- /记忆健康 → Librarian

## Agent路由表
- capture (记忆捕获)
- search (搜索检索)
- connect (关联发现)
- maintain (维护健康)
- synthesize (语音合成)
- write (小说写作)
```

### 3.2 定义核心Agents

| Agent | 功能 | 工具 |
|-------|------|------|
| **MemoryScribe** | 记忆捕获+清理 | Read, Write, Glob |
| **MemorySeeker** | 记忆检索+合成 | Read, Grep, Glob |
| **MemoryConnector** | 知识图谱 | Read, Grep, Write |
| **MemoryLibrarian** | 记忆健康 | Read, Edit, Glob, Grep |
| **VoiceSynthesizer** | TTS合成 | 现有VoiceForge |
| **NovelWriter** | 小说写作 | 现有novel-workflow |

### 3.3 定义Skills (复杂流程)

| Skill | 功能 | 来源参考 |
|-------|------|----------|
| `/记忆初始化` | 首次设置记忆结构 | /onboarding |
| `/记忆分析` | 深度分析记忆模式 | /vault-audit |
| `/清理记忆` | 删除重复/断链 | /deep-clean |
| `/语音合成` | 批量TTS任务 | /meeting-prep改编 |
| `/小说创作` | 完整写作流程 | /create-agent改编 |

### 3.4 Agent协调机制

```markdown
### Suggested next agent
- **Agent**: MemoryConnector
- **Reason**: 发现新记忆与现有记忆有关联
- **Context**: "关于AI的笔记增加，需要更新知识图谱"
```

---

## 四、实施步骤

### Phase 1: 基础架构
- [ ] 创建dispatcher.md
- [ ] 定义4个核心Memory Agents
- [ ] 实现基础路由

### Phase 2: 功能实现
- [ ] MemoryScribe: 记忆捕获+清理
- [ ] MemorySeeker: 记忆检索+合成
- [ ] MemoryConnector: 知识图谱
- [ ] MemoryLibrarian: 健康检查

### Phase 3: 集成现有模块
- [ ] 集成VoiceForge TTS
- [ ] 集成novel-workflow
- [ ] 集成MemPalace

### Phase 4: 高级功能
- [ ] 多语言支持
- [ ] 自定义Agent
- [ ] 健康报告

---

## 五、文件结构

```
~/.openclaw/agents/
├── dispatcher.md          # 调度入口
├── skills/
│   ├── memory-init.md
│   ├── memory-audit.md
│   ├── memory-clean.md
│   └── voice-synthesize.md
└── agents/
    ├── memory-scribe.md
    ├── memory-seeker.md
    ├── memory-connector.md
    ├── memory-librarian.md
    ├── voice-synthesizer.md
    └── novel-writer.md
```

---

## 六、关键代码片段

### 6.1 调度入口示例
```yaml
# 当用户说"记住这件事"时
- 触发: "记住", "capture", "メモ"
- 调用: MemoryScribe agent
- 处理: 清理格式 → 分类 → 存储 → 建议下一步
```

### 6.2 协调建议示例
```yaml
# MemoryScribe输出
### Suggested next agent
- **Agent**: MemoryConnector
- **Reason**: 新记忆"AI研究"与已有"机器学习"相关
- **Context**: 建议创建wikilinks连接
```

---

## 七、预期效果

| 场景 | 之前 | 之后 |
|------|------|------|
| 记录新记忆 | 手动写入memory/ | 说"记住..."自动处理 |
| 搜索记忆 | grep搜索 | 自然语言问答 |
| 知识关联 | 手动创建链接 | 自动发现+建议 |
| 记忆健康 | 无检查 | 定期报告+修复 |

---

*持续更新中...*