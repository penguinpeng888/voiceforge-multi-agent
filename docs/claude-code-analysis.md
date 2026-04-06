# Claude Code 架构分析报告

> 基于 512,000 行泄露源码分析
> 来源: https://github.com/mehmoodosman/claude-code

---

## 一、核心数据

| 指标 | 数值 |
|------|------|
| 代码行数 | 512,000+ TypeScript |
| 文件数 | ~1,900 |
| 运行时 | Bun |
| UI框架 | React + Ink (终端UI) |
| 发布日期 | 2026-03-31 泄露 |

---

## 二、十大架构秘密

### 1. Claude.md 注入每一轮对话
- CLAUDE.md 文件被注入到每个提示轮次
- 40,000 字符空间来塑造 Claude 在项目中的行为
- 应该包含：编码标准、架构约定、团队规范

### 2. 原生并行支持
支持三种子代理执行模型：
- **Fork**: 继承父上下文，缓存优化
- **Teammate**: 单独的 tmux/iTerm 面板，通过文件邮箱通信
- **Worktree**: 独立的 git worktree，每个代理有独立分支

子代理共享提示缓存，并行几乎零成本。

### 3. 智能权限系统
三种权限模式：
- **Bypass**: 无检查，最快但危险
- **Allow Edits**: 自动允许编辑工作目录
- **Auto**: LLM 分类器预测是否批准（最佳平衡点）

### 4. 五级内存压缩
1. **Micro compact**: 基于时间的旧工具结果清理
2. **Context collapse**: 总结对话片段
3. **Session memory**: 提取关键上下文到文件
4. **Full compact**: 总结整个历史
5. **PTL truncation**: 丢弃最旧的Message组

### 5. 66个内置工具
分为两类：
- **并发工具** (只读): read, grep, glob 等，可并行
- **串行工具** (写入): edit, write, bash 等，顺序执行

### 6. Hooks 系统
完整钩子系统：
- pre-tool use / post-tool use
- user prompt submit
- session start / session end
- 返回值控制：0=允许, 2=阻止, 其他=警告但继续

### 7. 四层持久记忆
1. **User memories**: 你的角色、专业技能、工作风格
2. **Feedback memories**: 纠正和确认的方法（不重复犯错）
3. **Project memories**: 截止日期、决策、团队上下文
4. **Reference memories**: 外部资源指针（Linear, Grafana, Slack）

### 8. 五级配置层
优先级从低到高：
1. 环境变量
2. ~/.claude/settings.json (全局)
3. .claude.json (项目根)
4. .claude/settings.json (项目)
5. .claude/settings.local.json (本地，优先级最高)

### 9. 七阶段启动管线
1. **Prefetch**: 缓存数据、项目扫描、密钥预取
2. **Warnings & Guards**: 安全检查
3. **CLI Parse & Trust Gate**: 参数解析、信任验证
4. **Setup + Tool Loading**: 并行加载命令和工具
5. **Deferred Init**: 插件、技能、MCP服务器（信任门控）
6. **Mode Routing**: local/remote/SSH/teleport/deep-link
7. **Query Engine Loop**: 查询引擎循环

### 10. 四种专业子代理
- **Explore Agent**: 快速代码库搜索发现
- **Plan Agent**: 设计实现策略
- **General Agent**: 处理复杂多步骤任务
- **Guide Agent**: 回答功能问题

---

## 三、目录结构

```
src/
├── main.tsx              # 入口点
├── QueryEngine.ts        # 查询引擎
├── Task.ts               # 任务定义
├── Tool.ts               # 工具基类
├── commands.ts           # 命令注册
├── context.ts            # 上下文管理
├── cost-tracker.ts       # 成本跟踪
├── dialogLaunchers.tsx   # 对话框
├── history.ts            # 历史记录
├── ink.ts                # Ink UI
├── query.ts              # 查询处理
├── replLauncher.tsx      # REPL启动器
├── setup.ts              # 设置
├── tasks.ts              # 任务管理
├── tools.ts              # 工具管理
│
├── assistant/            # 助手模式
├── bootstrap/            # 启动引导
├── bridge/               # 桥接层
├── buddy/                # 伙伴模式
├── cli/                  # CLI参数解析
├── commands/             # 子命令
├── components/           # UI组件
├── constants/            # 常量
├── context/              # 上下文
├── coordinator/          # 多代理协调
├── entrypoints/          # 入口
├── hooks/                # 钩子系统
├── ink/                  # Ink组件
├── keybindings/          # 快捷键
├── memdir/               # 内存目录
├── migrations/           # 迁移
├── moreright/            # 右键菜单
├── native-ts/            # 原生TS
├── outputStyles/         # 输出样式
├── plugins/              # 插件系统
├── query/                # 查询
├── remote/               # 远程
├── schemas/              # 数据模式
├── screens/              # 屏幕
├── server/               # 服务
├── services/             # 服务层
│   ├── api/              # HTTP客户端
│   ├── mcp/              # Model Context Protocol
│   ├── compact/          # 内存压缩
│   └── lsp/              # LSP集成
├── skills/               # 技能系统
├── state/                # 状态管理
├── tasks/                # 任务
├── tools/                # 工具实现
├── types/                # 类型定义
├── upstreamproxy/        # 上游代理
├── utils/                # 工具函数
├── vim/                  # Vim集成
└── voice/                # 语音
```

---

## 四、OpenClaw 对比分析

| 特性 | Claude Code | OpenClaw | 差距 |
|------|-------------|----------|------|
| 工具数量 | 66 | ~20 | -46 |
| 子代理类型 | 4种 | 1种 | -3 |
| 内存压缩 | 5级 | 1级 | -4 |
| 持久记忆 | 4层 | 1层 | -3 |
| 配置层级 | 5级 | 2级 | -3 |
| Hooks | 完整 | 基础 | 差距大 |
| 并行执行 | 原生 | 基础 | 差距大 |
| MCP支持 | 完整 | 无 | 需开发 |

---

## 五、复刻路线图

### Phase 1: 核心引擎 (1周)
- [ ] QueryEngine 重构
- [ ] Tool 抽象层增强
- [ ] 内存压缩系统 (5级)
- [ ] 并行执行框架

### Phase 2: 工具系统 (1周)
- [ ] 新增40+工具
- [ ] 工具分类（并发/串行）
- [ ] 工具权限系统
- [ ] Hooks 完整实现

### Phase 3: 记忆系统 (1周)
- [ ] User memories
- [ ] Feedback memories
- [ ] Project memories
- [ ] Reference memories

### Phase 4: 子代理 (1周)
- [ ] Explore Agent
- [ ] Plan Agent
- [ ] General Agent
- [ ] Fork/Teammate/Worktree 模式

### Phase 5: 配置系统 (3天)
- [ ] 5层配置继承
- [ ] 环境变量支持
- [ ] .claude.json 解析

### Phase 6: MCP集成 (1周)
- [ ] MCP服务器连接
- [ ] OAuth支持
- [ ] 工具暴露给MCP

---

## 六、核心文件分析

### main.tsx
CLI入口，使用Commander注册子命令和全局选项。

### QueryEngine.ts
查询循环的核心，管理多轮对话和工具调用。

### services/compact/
内存压缩服务，包含5种压缩策略。

### services/mcp/
Model Context Protocol 实现，MCP服务器管理。

### tools/
66个工具实现，包括：
- bash, read, write, edit
- grep, glob, find
- web-fetch, web-search
- tasks, todos
- git相关工具

### utils/swarm/
多代理编排，支持tmux/iTerm/进程内运行。

---

## 七、关键实现细节

### 工具并发执行
```typescript
// 只读工具并行执行
const concurrentTools = ['read', 'grep', 'glob', 'web-fetch'];
const isConcurrent = concurrentTools.includes(tool.name);
if (isConcurrent) {
  // 并行执行
} else {
  // 串行执行
}
```

### 权限检查
```typescript
const permissionModes = {
  bypass: (action) => true,
  allowEdits: (action) => action.type === 'edit' && isInWorkingDir(action.path),
  auto: (action) => llmClassifier.predict(action) > 0.8
};
```

### 内存压缩触发
```typescript
const compactionTriggers = [
  { type: 'micro', tokens: 8000 },
  { type: 'context', tokens: 40000 },
  { type: 'session', tokens: 80000 },
  { type: 'full', tokens: 150000 }
];
```

---

## 八、结论

Claude Code 是一个极其复杂的 AI 编程代理框架，512K 行代码包含了：
- 成熟的多代理系统
- 精细的内存管理
- 完整的权限控制
- 灵活的配置体系
- 强大的插件系统

OpenClaw 要达到类似水平需要大量工作，但可以通过：
1. 逐步增加工具数量
2. 实现多级内存压缩
3. 添加持久记忆系统
4. 支持子代理并行

来逐步缩小差距。

---

*分析时间: 2026-04-06*
*来源: GitHub mehmoodosman/claude-code*
---

## 九、44个隐藏功能标志（未发布）

> 源码泄露揭示44个已开发但未发布的功能

### 顶级隐藏功能

| 功能 | 说明 | 状态 |
|------|------|------|
| **KAIROS** | 始终在线的后台守护进程，记忆整合（autoDream） | 已完成，未发布 |
| **BUDDY** | 终端宠物系统，18种物种 | 计划4月1-7日测试，5月发布 |
| **COORDINATOR** | 多代理编排，一个主Agent管理多个Worker | 已完成 |
| **ULTRAPLAN** | 远程多Agent规划会话，最长30分钟 | 已完成 |

### BUDDY 详细规格
- **18种物种**: duck, dragon, axolotl, capybara, mushroom, ghost 等
- **稀有度等级**: Common → Legendary (1%掉落率)，还有闪亮变体
- **5项属性**: DEBUGGING / PATIENCE / CHAOS / WISDOM / SNARK
- **机制**: 物种由 userId 哈希决定（相同用户总是孵化相同宠物）
- **交互**: 测试通过时庆祝，失败时不同反应
- **装饰**: 帽子等装饰物品

### KAIROS 详细规格
- **守护进程模式**: 独立于终端会话运行
- **记忆整合 (autoDream)**: 夜间自动整合和修剪记忆
- **主动行为**: 基于观察触发主动行动
- **日志**: 仅追加的每日观察日志

### COORDINATOR 模式
- 主Agent维护任务图
- 同时管理多个Worker子代理
- 任务分解、分配、进度监控、结果合并
- 支持并行执行和依赖管理

### ULTRAPLAN 模式
- 10-30分钟的规划窗口
- 多Agent协作战略决策
- 远程/异步执行
- 夜间自动运行

### 其他隐藏功能标志
- **VOICE_MODE**: 语音交互
- **WEB_BROWSER_TOOL**: 浏览器内访问
- **DAEMON**: 后台进程模式
- **AGENT_TRIGGERS**: 自动化事件触发Agent
- **Undercover Mode**: 隐藏Anthropic员工身份
  - 注入系统提示"不要暴露你是AI"
  - 移除Co-Authored-By元数据

### 功能标志统计
- 44个功能标志
- 26个隐藏斜杠命令
- 108个门控模块
- KAIROS在代码中出现150+次

---

## 十、复刻优先级建议

### P0 - 必须实现（核心差距）
1. **QueryEngine 重构** - 46K行核心引擎
2. **5级内存压缩** - Micro/Context/Session/Full/PTL
3. **工具分类** - 并发vs串行执行
4. **权限系统** - Bypass/Allow/Auto

### P1 - 重要功能（体验提升）
5. **4层持久记忆** - User/Feedback/Project/Reference
6. **5层配置继承** - 环境→全局→项目→本地
7. **Hooks系统** - 完整生命周期钩子
8. **多子代理模式** - Fork/Teammate/Worktree

### P2 - 差异化功能（长期目标）
9. **KAIROS守护进程** - 始终在线+记忆整合
10. **COORDINATOR多代理** - 任务图+并行Worker
11. **BUDDY宠物系统** - 18物种+交互反馈
12. **MCP完整集成** - OAuth+服务管理

*最后更新: 2026-04-06*
