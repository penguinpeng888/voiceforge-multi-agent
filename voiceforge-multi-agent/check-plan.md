
## 检查计划

### 文件优先级
1. **server-v2-fixed.cjs** (高) - 主入口，集成所有功能
2. **providers/LLMProviders.js** (高) - 核心 API 调用
3. **providers/TTSProviders.js** (中) - 外部服务集成
4. **agents/Coordinator.js** (中) - Agent 协调

### 检查重点

#### 1. server-v2-fixed.cjs
- LLMConfig 双重定义问题
- 模块导入混用（require vs import）
- API 路由安全
- 错误处理完整性

#### 2. LLMProviders.js
- API 密钥管理
- 请求重试机制
- 超时处理
- 响应解析

#### 3. TTSProviders.js
- 音频格式处理
- 大文件处理
- 异步流程

#### 4. Coordinator.js
- Agent 调度逻辑
- 状态管理
- 并发控制

### 验收标准
- [ ] 所有文件完成检查
- [ ] 每个问题有具体位置和修复建议
- [ ] 按严重程度分级（Critical/Major/Minor）
- [ ] 提供修复示例代码
