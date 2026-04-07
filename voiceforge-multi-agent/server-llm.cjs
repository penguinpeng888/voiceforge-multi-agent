const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3100;

app.use(cors());
app.use(bodyParser.json());

// ============ Agent Prompts ============

const AGENT_PROMPTS = {
  master: `你是VoiceForge AI的多Agent系统Master，负责理解用户需求并调度其他Agent。

用户输入可能包括：
- 配音需求（旁白、角色对话、情感变化）
- 修改要求（语调、语速、情感）
- 新项目创建

你的任务：
1. 理解用户需求
2. 判断需要哪些Agent处理
3. 调度相应Agent
4. 汇总结果返回给用户

输出格式：
- 如果需要Planner：返回 {agent: "planner", input: "用户需求的扩展描述"}
- 如果需要Generator：返回 {agent: "generator", feature: "具体功能"}
- 如果需要Evaluator：返回 {agent: "evaluator", target: "待评估内容"}
- 如果可以直接回答：返回 {agent: "direct", response: "回答内容"}`,

  planner: `你是VoiceForge AI的Planner Agent，负责把用户需求扩展为完整的规格文档。

输入：用户的一句话需求
输出：详细的spec.txt + feature_list.json

你需要：
1. 分析用户需求意图
2. 扩展为完整的功能规格
3. 列出所有需要实现的功能点（features）
4. 确定优先级

输出格式：
{
  spec: "详细的需求规格描述",
  features: [
    {id: "f1", name: "功能名", description: "功能描述", priority: "high/medium/low"}
  ]
}`,

  generator: `你是VoiceForge AI的Generator Agent，负责实现具体功能。

输入：待实现的feature描述
输出：实现的代码 + 自测结果

你需要：
1. 理解feature需求
2. 实现代码
3. 自我测试
4. 产出符合contract的完成物

注意：你实现的代码会被Evaluator评估，所以要确保质量。`,

  evaluator: `你是VoiceForge AI的Evaluator Agent，负责测试和评估Generator的产出。

输入：待评估的实现 + feature contract
输出：评估报告

评估维度：
1. 功能正确性 - 是否实现了要求的功能
2. 代码质量 - 是否符合规范
3. 测试通过率 - 自测是否通过
4. 边界处理 - 异常情况是否处理

输出格式：
{
  score: 0-100,
  passed: true/false,
  issues: ["问题1", "问题2"],
  feedback: "改进建议"
}`
};

// ============ Artifacts Storage ============

const artifactsDir = path.join(__dirname, 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// ============ API Routes ============

// Health check
app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Multi-Agent System",
    version: "1.0.0",
    agents: ["master", "planner", "generator", "evaluator"],
    status: "running"
  });
});

// Chat with agents
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  
  // Master Agent decides which agent to use
  const masterResponse = await callAgent('master', message, context);
  
  res.json({
    message,
    response: masterResponse,
    agents: {
      master: { status: "completed", output: masterResponse }
    }
  });
});

// Call specific agent directly
app.post('/api/agents/:agentName', async (req, res) => {
  const { agentName } = req.params;
  const { input, context } = req.body;
  
  if (!AGENT_PROMPTS[agentName]) {
    return res.status(400).json({ error: `Unknown agent: ${agentName}` });
  }
  
  const response = await callAgent(agentName, input, context);
  res.json({ agent: agentName, response });
});

// Get all agents status
app.get('/api/status', (req, res) => {
  const files = fs.readdirSync(artifactsDir);
  res.json({
    artifacts: files,
    agents: Object.keys(AGENT_PROMPTS)
  });
});

// Clear artifacts
app.delete('/api/artifacts', (req, res) => {
  const files = fs.readdirSync(artifactsDir);
  files.forEach(f => fs.unlinkSync(path.join(artifactsDir, f)));
  res.json({ status: "cleared" });
});

// ============ Agent Execution ============

async function callAgent(agentName, input, context = {}) {
  const prompt = AGENT_PROMPTS[agentName];
  
  // Build full prompt
  const fullPrompt = `${prompt}

---

当前上下文：
${JSON.stringify(context, null, 2)}

---

用户输入：
${input}

---

请按照你的角色处理这个请求，直接返回结果（JSON格式）。`;

  // Simulate agent response (in production, this would call actual LLM)
  return simulateAgentResponse(agentName, input, context);
}

function simulateAgentResponse(agentName, input, context) {
  // This is a placeholder - in production, call actual LLM API
  switch (agentName) {
    case 'master':
      return {
        agent: "master",
        understanding: input,
        decision: "planner",
        reason: "需要先扩展需求为完整规格"
      };
    
    case 'planner':
      return {
        agent: "planner",
        spec: `VoiceForge AI配音系统需求规格：
- 用户输入：${input}
- 需要支持多角色配音
- 需要支持情感控制
- 需要支持语速调节`,
        features: [
          { id: "f1", name: "多角色管理", description: "支持创建、编辑、删除配音角色", priority: "high" },
          { id: "f2", name: "情感控制", description: "支持开心、悲伤、愤怒等情感", priority: "high" },
          { id: "f3", name: "语速调节", description: "支持0.5x-2x语速", priority: "medium" },
          { id: "f4", name: "项目保存", description: "保存和加载配音项目", priority: "medium" }
        ]
      };
    
    case 'generator':
      return {
        agent: "generator",
        feature: input,
        status: "implemented",
        tests: ["角色创建通过", "情感设置通过"]
      };
    
    case 'evaluator':
      return {
        agent: "evaluator",
        target: input,
        score: 85,
        passed: true,
        issues: [],
        feedback: "基本功能完整，建议增加更多情感选项"
      };
    
    default:
      return { error: "Unknown agent" };
  }
}


// ============ LLM API (兼容 OpenClaw 格式) ============
const LLMConfig = {
  textLLM: null,
  voiceLLM: null,
  customLLMs: {},
  builtin: {
    'minimax': { name: 'MiniMax', provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api: 'chat/completions', model: { id: 'minimaxai/minimax-m2.5', name: 'MiniMax M2.5' } },
    'step-3.5': { name: 'Step-3.5', provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api: 'chat/completions', model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5 Flash' } },
    'deepseek': { name: 'DeepSeek', provider: 'openai', base_url: 'https://api.deepseek.com/v1', api: 'chat/completions', model: { id: 'deepseek-chat', name: 'DeepSeek Chat' } },
    'qwen': { name: 'Qwen', provider: 'openai', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', api: 'chat/completions', model: { id: 'qwen-plus', name: 'Qwen Plus' } }
  },

  addLLM(config) {
    if (typeof config === 'string') { const b = this.builtin[config.toLowerCase()]; if (!b) return { success: false, error: `Unknown: ${config}` }; config = { ...b }; }
    const apiKey = config.api_key || config.apiKey || ''; if (!apiKey) return { success: false, error: 'API Key required' };
    let modelId = typeof config.model === 'string' ? config.model : (config.model?.id || config.model_id || 'unknown');
    let modelName = typeof config.model === 'string' ? config.model : (config.model?.name || modelId);
    const llm = { name: config.name || modelName, provider: config.provider || 'openai', base_url: config.base_url || '', api: config.api || 'chat/completions', api_key: apiKey, model: { id: modelId, name: modelName }, usage: config.usage || 'both' };
    if (!llm.base_url) return { success: false, error: 'Base URL required' };
    const id = llm.name.toLowerCase().replace(/\s+/g, '-');
    if (llm.usage === 'text' || llm.usage === 'both' || !this.textLLM) this.textLLM = llm;
    if (llm.usage === 'voice' || llm.usage === 'both' || !this.voiceLLM) this.voiceLLM = llm;
    this.customLLMs[id] = llm;
    return { success: true, id, name: llm.name };
  },

  setBuiltin(key, apiKey) { const b = this.builtin[key.toLowerCase()]; if (!b) return { success: false, error: `Unknown: ${key}` }; return this.addLLM({ ...b, api_key: apiKey }); },

  async _callAPI(llm, prompt) {
    const url = `${llm.base_url}/${llm.api}`;
    const isAnthropic = llm.provider === 'anthropic';
    const headers = { 'Content-Type': 'application/json', ...(isAnthropic ? { 'x-api-key': llm.api_key } : { 'Authorization': `Bearer ${llm.api_key}` }) };
    let body = llm.api === 'messages' ? { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 } : (llm.api === 'completions' ? { model: llm.model.id, prompt, max_tokens: 50 } : { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 });
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const data = await res.json();
    return llm.api === 'messages' ? (data.content?.[0]?.text || '') : (llm.api === 'completions' ? (data.choices?.[0]?.text || '') : (data.choices?.[0]?.message?.content || ''));
  },

  async testLLM(nameOrId) {
    const id = nameOrId.toLowerCase().replace(/\s+/g, '-');
    let llm = this.customLLMs[id] || this.textLLM || this.voiceLLM;
    if (!llm) return { success: false, error: 'No LLM configured' };
    try { const r = await this._callAPI(llm, 'Say OK'); return { success: true, response: r?.substring(0, 50) }; } catch (e) { return { success: false, error: e.message }; }
  },

  async testTextLLM() { return this.textLLM ? this.testLLM(this.textLLM.name) : { success: false, error: 'No text LLM' }; },
  async testVoiceLLM() { return this.voiceLLM ? this.testLLM(this.voiceLLM.name) : { success: false, error: 'No voice LLM' }; },
  getTextLLM() { return this.textLLM; },
  getVoiceLLM() { return this.voiceLLM; },
  getStatus() { return { textLLM: this.textLLM ? { name: this.textLLM.name, model: this.textLLM.model.id } : null, voiceLLM: this.voiceLLM ? { name: this.voiceLLM.name, model: this.voiceLLM.model.id } : null, available: Object.keys(this.customLLMs), builtin: Object.keys(this.builtin) }; },
  getAvailable() { return Object.entries(this.builtin).map(([k, v]) => ({ id: k, name: v.name, model: v.model.id, type: 'builtin' })); }
};

// 添加 API 路由
app.post('/api/llm/add', (req, res) => { res.json(LLMConfig.addLLM(req.body)); });
app.post('/api/llm/set-builtin', (req, res) => { const { key, apiKey } = req.body; res.json(LLMConfig.setBuiltin(key, apiKey)); });
app.post('/api/llm/test', async (req, res) => { const { name } = req.body; res.json(await LLMConfig.testLLM(name || 'text')); });
app.post('/api/llm/test-text', async (req, res) => { res.json(await LLMConfig.testTextLLM()); });
app.post('/api/llm/test-voice', async (req, res) => { res.json(await LLMConfig.testVoiceLLM()); });
app.get('/api/llm/status', (req, res) => { res.json(LLMConfig.getStatus()); });
app.get('/api/llm/available', (req, res) => { res.json(LLMConfig.getAvailable()); });

app.post('/api/llm/analyze', async (req, res) => {
  const { prompt } = req.body;
  const llm = LLMConfig.getTextLLM();
  if (!llm) return res.json({ success: false, error: 'No text LLM configured' });
  try { res.json({ success: true, response: await LLMConfig._callAPI(llm, prompt) }); } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/api/llm/voice-process', async (req, res) => {
  const { prompt } = req.body;
  const llm = LLMConfig.getVoiceLLM();
  if (!llm) return res.json({ success: false, error: 'No voice LLM configured' });
  try { res.json({ success: true, response: await LLMConfig._callAPI(llm, prompt) }); } catch (e) { res.json({ success: false, error: e.message }); }
});

// Start server
