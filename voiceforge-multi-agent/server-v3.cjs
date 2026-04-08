/**
 * VoiceForge Multi-Agent System
 * 修复版 v3 - 统一 CommonJS + 统一 LLMConfig
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ============ 统一 LLMConfig ============
const LLMConfig = {
  textLLM: null,
  voiceLLM: null,
  customLLMs: {},
  
  builtin: {
    'minimax': {
      name: 'MiniMax',
      provider: 'nvidia',
      base_url: 'https://integrate.api.nvidia.com/v1',
      api: 'chat/completions',
      model: { id: 'minimaxai/minimax-m2.5', name: 'MiniMax M2.5' }
    },
    'step-3.5': {
      name: 'Step-3.5',
      provider: 'nvidia',
      base_url: 'https://integrate.api.nvidia.com/v1',
      api: 'chat/completions',
      model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5 Flash' }
    },
    'deepseek': {
      name: 'DeepSeek',
      provider: 'openai',
      base_url: 'https://api.deepseek.com/v1',
      api: 'chat/completions',
      model: { id: 'deepseek-chat', name: 'DeepSeek Chat' }
    },
    'qwen': {
      name: 'Qwen',
      provider: 'openai',
      base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      api: 'chat/completions',
      model: { id: 'qwen-plus', name: 'Qwen Plus' }
    }
  },

  addLLM(config) {
    if (typeof config === 'string') {
      const b = this.builtin[config.toLowerCase()];
      if (!b) return { success: false, error: `Unknown: ${config}` };
      config = { ...b };
    }
    
    const apiKey = config.api_key || config.apiKey || '';
    if (!apiKey) return { success: false, error: 'API Key required' };
    
    let modelId = typeof config.model === 'string' ? config.model : (config.model?.id || config.model_id || 'unknown');
    let modelName = typeof config.model === 'string' ? config.model : (config.model?.name || modelId);
    
    const llm = {
      name: config.name || modelName,
      provider: config.provider || 'openai',
      base_url: config.base_url || '',
      api: config.api || 'chat/completions',
      api_key: apiKey,
      model: { id: modelId, name: modelName },
      usage: config.usage || 'both'
    };
    
    if (!llm.base_url) return { success: false, error: 'Base URL required' };
    
    const id = llm.name.toLowerCase().replace(/\s+/g, '-');
    if (llm.usage === 'text' || llm.usage === 'both' || !this.textLLM) this.textLLM = llm;
    if (llm.usage === 'voice' || llm.usage === 'both' || !this.voiceLLM) this.voiceLLM = llm;
    this.customLLMs[id] = llm;
    
    return { success: true, id, name: llm.name };
  },

  setBuiltin(key, apiKey) {
    const b = this.builtin[key.toLowerCase()];
    if (!b) return { success: false, error: `Unknown: ${key}` };
    return this.addLLM({ ...b, api_key: apiKey });
  },

  // 统一 API 调用（带超时 + 重试）
  async _callAPIWithRetry(llm, prompt, options = {}) {
    const { maxRetries = 3, timeout = 30000 } = options;
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = `${llm.base_url}/${llm.api}`;
        const isAnthropic = llm.provider === 'anthropic';
        
        const headers = {
          'Content-Type': 'application/json',
          ...(isAnthropic ? { 'x-api-key': llm.api_key } : { 'Authorization': `Bearer ${llm.api_key}` })
        };
        
        const body = llm.api === 'messages' 
          ? { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 }
          : { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 };
        
        // 带超时的 fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`API Error ${res.status}`);
        const data = await res.json();
        
        return llm.api === 'messages' 
          ? (data.content?.[0]?.text || '') 
          : (data.choices?.[0]?.message?.content || '');
          
      } catch (e) {
        lastError = e;
        console.log(`[LLM] Attempt ${attempt + 1} failed: ${e.message}`);
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // 指数退避
        }
      }
    }
    throw lastError;
  },

  async testLLM(nameOrId) {
    const id = nameOrId.toLowerCase().replace(/\s+/g, '-');
    let llm = this.customLLMs[id] || this.textLLM || this.voiceLLM;
    if (!llm) return { success: false, error: 'No LLM configured' };
    
    try {
      const r = await this._callAPIWithRetry(llm, 'Say OK');
      return { success: true, response: r?.substring(0, 50) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async testTextLLM() {
    return this.textLLM ? this.testLLM(this.textLLM.name) : { success: false, error: 'No text LLM' };
  },

  async testVoiceLLM() {
    return this.voiceLLM ? this.testLLM(this.voiceLLM.name) : { success: false, error: 'No voice LLM' };
  },

  getTextLLM() { return this.textLLM; },
  getVoiceLLM() { return this.voiceLLM; },

  getStatus() {
    return {
      textLLM: this.textLLM ? { name: this.textLLM.name, model: this.textLLM.model.id } : null,
      voiceLLM: this.voiceLLM ? { name: this.voiceLLM.name, model: this.voiceLLM.model.id } : null,
      available: Object.keys(this.customLLMs),
      builtin: Object.keys(this.builtin)
    };
  },

  getAvailable() {
    return Object.entries(this.builtin).map(([k, v]) => ({ id: k, name: v.name, model: v.model.id, type: 'builtin' }));
  }
};

// ============ Express 应用 ============
const app = express();
const PORT = process.env.PORT || 3100;

// P1 修复: 限制 CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// P0 修复: API Key 启动校验
if (!process.env.LLM_API_KEY) {
  console.warn('⚠️ 警告: LLM_API_KEY 未配置，部分功能可能不可用');
}

// ============ 项目存储 ============
const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// ============ 统一错误处理中间件 ============
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message, code: 'INTERNAL_ERROR' });
});

// ============ Agent Prompts ============
const AGENT_PROMPTS = {
  master: `你是VoiceForge AI的多Agent系统Master，负责理解用户需求并调度其他Agent。...`,
  planner: `你是VoiceForge AI的Planner Agent，负责把用户需求扩展为完整的配音项目规格。...`,
  generator: `你是VoiceForge AI的Generator Agent，负责根据规格创建实际的配音项目。...`,
  evaluator: `你是VoiceForge AI的Evaluator Agent，负责评估配音项目质量。...`
};

// ============ Agent 类 ============
class Agent {
  constructor(name, prompt, llmCall) {
    this.name = name;
    this.prompt = prompt;
    this.llmCall = llmCall;
  }
  
  async run(input, context = {}) {
    const fullPrompt = `${this.prompt}\n\n---\n用户输入: ${input}\n\n上下文: ${JSON.stringify(context)}\n\n---`;
    if (this.llmCall) return await this.llmCall(fullPrompt);
    return { agent: this.name, input, response: 'API未配置' };
  }
}

// 创建 Agent 实例（需要 LLMConfig 的方法）
const agents = {
  master: new Agent('master', AGENT_PROMPTS.master, (p) => LLMConfig.textLLM ? LLMConfig._callAPIWithRetry(LLMConfig.textLLM, p) : Promise.resolve({ error: 'No LLM' })),
  planner: new Agent('planner', AGENT_PROMPTS.planner, (p) => LLMConfig.textLLM ? LLMConfig._callAPIWithRetry(LLMConfig.textLLM, p) : Promise.resolve({ error: 'No LLM' })),
  generator: new Agent('generator', AGENT_PROMPTS.generator, (p) => LLMConfig.textLLM ? LLMConfig._callAPIWithRetry(LLMConfig.textLLM, p) : Promise.resolve({ error: 'No LLM' })),
  evaluator: new Agent('evaluator', AGENT_PROMPTS.evaluator, (p) => LLMConfig.textLLM ? LLMConfig._callAPIWithRetry(LLMConfig.textLLM, p) : Promise.resolve({ error: 'No LLM' }))
};

// ============ API Routes ============
app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Multi-Agent System",
    version: "3.0.0",
    status: "running",
    llm: LLMConfig.getStatus(),
    design: "Linear/Claude 风格"
  });
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { message, context = {} } = req.body;
    const decision = await agents.master.run(message, context);
    res.json({ message, response: decision });
  } catch (e) { next(e); }
});

app.post('/api/agents/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { input, context = {} } = req.body;
    const agent = agents[name];
    if (!agent) return res.status(400).json({ error: `Unknown agent: ${name}` });
    const result = await agent.run(input, context);
    res.json({ agent: name, result });
  } catch (e) { next(e); }
});

// P2 修复: 输入验证
app.post('/api/project', async (req, res, next) => {
  try {
    const { name, description, script, roles = [] } = req.body;
    
    // 输入验证
    if (!name || typeof name !== 'string' || name.length > 100) {
      return res.status(400).json({ error: '项目名称必填，长度不超过100字符' });
    }
    if (description && typeof description !== 'string') {
      return res.status(400).json({ error: '描述必须是字符串' });
    }
    
    const project = {
      id: 'proj_' + Date.now(),
      name: name.trim(),
      description: description?.trim() || '',
      script: script || '',
      roles,
      createdAt: new Date().toISOString(),
      status: 'created'
    };
    
    const projectPath = path.join(projectsDir, `${project.id}.json`);
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    res.json({ success: true, project });
  } catch (e) { next(e); }
});

app.get('/api/projects', (req, res) => {
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'));
  const projects = files.map(f => JSON.parse(fs.readFileSync(path.join(projectsDir, f), 'utf-8')));
  res.json({ projects });
});

app.get('/api/status', (req, res) => {
  res.json({
    agents: Object.keys(agents),
    llm: LLMConfig.getStatus(),
    projects: fs.readdirSync(projectsDir).length
  });
});

// ============ LLM 配置 API ============
app.post('/api/llm/add', (req, res) => {
  try {
    const result = LLMConfig.addLLM(req.body);
    res.json(result);
  } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/api/llm/set-builtin', (req, res) => {
  const { key, apiKey } = req.body;
  const result = LLMConfig.setBuiltin(key, apiKey);
  res.json(result);
});

app.post('/api/llm/test', async (req, res) => {
  const result = await LLMConfig.testLLM(req.body.name || 'text');
  res.json(result);
});

app.get('/api/llm/status', (req, res) => {
  res.json(LLMConfig.getStatus());
});

app.get('/api/llm/available', (req, res) => {
  res.json(LLMConfig.getAvailable());
});

// ============ 启动 ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Multi-Agent System v3.0 running on http://0.0.0.0:${PORT}`);
  console.log(`LLM: ${LLMConfig.getStatus().textLLM?.name || '未配置'}`);
  console.log(`Design: Linear/Claude 风格`);
});

module.exports = app;
