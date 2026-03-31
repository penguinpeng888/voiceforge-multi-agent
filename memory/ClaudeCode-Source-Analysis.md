# Claude Code 源码分析报告

> 来源: https://github.com/instructkr/claude-code
> 下载时间: 2026-03-31
> 规模: 43MB, 1884文件, ~29K行代码

## 一、整体架构

```
main.tsx (4683行) ← CLI入口
    │
    ├── query.ts (1729行) ← 查询核心
    ├── QueryEngine.ts (1295行) ← LLM引擎
    ├── Tool.ts (792行) ← 工具类型定义
    │
    ├── commands/ (207文件) ← Slash命令
    ├── tools/ (184文件) ← Agent工具
    ├── components/ (389文件) ← Ink UI组件
    ├── services/ (130文件) ← API/外部服务
    ├── hooks/ (104文件) ← React钩子
    │
    ├── coordinator/ ← 多Agent协调
    ├── skills/ ← 技能系统
    ├── tasks/ ← 任务管理
    ├── memdir/ ← 持久化记忆
    └── plugins/ ← 插件系统
```

## 二、核心文件

| 文件 | 行数 | 作用 |
|------|------|------|
| main.tsx | 4683 | CLI入口，命令注册，启动逻辑 |
| query.ts | 1729 | 查询管道，消息处理 |
| QueryEngine.ts | 1295 | LLM调用引擎 |
| Tool.ts | 792 | 工具类型定义 |
| tools.ts | ~300 | 工具注册 |
| interactiveHelpers.tsx | ~800 | 交互式UI帮助 |

## 三、工具系统 (tools/)

### 核心工具 (40+)
| 类别 | 工具 |
|------|------|
| 文件操作 | BashTool, FileReadTool, FileWriteTool, FileEditTool, GlobTool, GrepTool |
| 网络 | WebFetchTool, WebSearchTool |
| Agent | AgentTool, TeamCreateTool, TeamDeleteTool, SendMessageTool |
| 任务 | TaskCreateTool, TaskUpdateTool, TaskStopTool, TaskOutputTool |
| 技能 | SkillTool, ToolSearchTool |
| 计划 | EnterPlanModeTool, ExitPlanModeTool |
| 工作树 | EnterWorktreeTool, ExitWorktreeTool |
| MCP | MCPTool, ListMcpResourcesTool, ReadMcpResourceTool, LSPTool |
| 其他 | REPLTool, NotebookEditTool, TodoWriteTool, AskUserQuestionTool |

### 条件编译工具 (Feature Flags)
- `REPLTool` - ANT_ONLY
- `SleepTool` - PROACTIVE | KAIROS
- `RemoteTriggerTool` - AGENT_TRIGGERS_REMOTE
- `MonitorTool` - MONITOR_TOOL
- `PushNotificationTool` - KAIROS | KAIROS_PUSH_NOTIFICATION

## 四、命令系统 (commands/)

207个命令文件，包括:
- `/help`, `/compact`, `/model` - 内置命令
- `/doctor` - 诊断
- `/resume` - 恢复会话
- `/break` - 中断
- `/context` - 上下文管理
- 等等...

## 五、技能系统 (skills/)

### 内置技能 (bundled/)
- batch.ts - 批量处理
- claudeApi.ts - API调用
- debug.ts - 调试
- remember.ts - 记忆
- scheduleRemoteAgents.ts - 远程调度
- verify.ts - 验证
- 等等...

### 加载机制
- loadSkillsDir.ts (34KB) - 技能目录加载
- mcpSkillBuilders.ts - MCP技能构建

## 六、多Agent协调 (coordinator/)

- coordinatorMode.ts (19KB) - 协调模式实现
- 支持团队协作、远程会话

## 七、任务系统 (tasks/)

- LocalMainSessionTask.ts - 本地主会话
- LocalAgentTask - 本地Agent任务
- RemoteAgentTask - 远程Agent任务
- InProcessTeammateTask - 队友任务
- DreamTask - 梦境任务

## 八、记忆系统 (memdir/)

- memdir.ts - 记忆目录核心
- findRelevantMemories.ts - 记忆检索
- memoryScan.ts - 记忆扫描
- teamMemPaths.ts - 团队记忆路径
- teamMemPrompts.ts - 团队记忆提示

## 九、服务层 (services/)

### API服务 (api/)
- claude.ts - Claude API调用
- bootstrap.ts - 启动数据
- errors.ts - 错误处理
- usage.ts - 用量跟踪
- sessionIngress.ts - 会话入口
- filesApi.ts - 文件API

### MCP服务 (mcp/)
- MCP服务器连接
- 官方注册表
- 客户端实现

### 分析服务 (analytics/)
- GrowthBook集成
- 事件追踪
- 使用统计

### 压缩服务 (compact/)
- autoCompact.ts - 自动压缩
- compact.ts - 上下文压缩
- reactiveCompact.ts - 响应式压缩

## 十、UI组件 (components/)

389个React组件，包括:
- App.tsx - 主应用
- 各种对话框
- 进度条
- 输入组件
- Agent相关UI

### 终端UI
- 使用 Ink (React for CLI)
- 支持交互式界面

## 十一、配置与状态

### 状态管理 (state/)
- AppState.ts - 应用状态
- 各种状态钩子

### 配置 (utils/)
- config.ts - 全局配置
- model/model.ts - 模型配置
- platform.ts - 平台检测

## 十二、关键设计模式

### 1. Feature Flags
```typescript
const REPLTool = process.env.USER_TYPE === 'ant' ? require(...) : null
const cronTools = feature('AGENT_TRIGGERS') ? [...] : []
```

### 2. 懒加载
```typescript
const getTeamCreateTool = () => require('./...').TeamCreateTool
```

### 3. 工具注册
```typescript
import { AgentTool, BashTool, FileReadTool, ... } from './tools.js'
```

### 4. 权限模型
- Tool级别权限控制
- MCP服务器审批
- 策略限制

## 十三、后续关注

1. **持续关注是否有更多源码放出**
2. **分析具体工具实现细节**
3. **学习其Agent协作机制**
4. **借鉴其技能系统设计**

## 十四、相关链接

- 原始泄露: https://x.com/Fried_rice/status/2038894956459290963
- GitHub镜像: https://github.com/instructkr/claude-code
- 分析文档: (本文档)