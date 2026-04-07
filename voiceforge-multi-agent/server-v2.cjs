/**
 * VoiceForge Multi-Agent System
 * 方向A：接入真实LLM，让AI帮你创建配音项目
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3100;

app.use(cors());
app.use(bodyParser.json());

// ============ LLM API 配置 ============

const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'minimax', // minimax / deepseek / openai
  apiKey: process.env.LLM_API_KEY || '',
  baseUrl: process.env.LLM_BASE_URL || 'https://api.minimax.chat/v1'
};

// MiniMax API 调用
async function callMiniMax(prompt, options = {}) {
  const { model = 'abab6.5s-chat', temperature = 0.7 } = options;
  
  const response = await fetch(`${LLM_CONFIG.baseUrl}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 4096
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// DeepSeek API 调用
async function callDeepSeek(prompt, options = {}) {
  const { model = 'deepseek-chat', temperature = 0.7 } = options;
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 4096
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 通用LLM调用
async function callLLM(prompt, options = {}) {
  if (!LLM_CONFIG.apiKey) {
    return { error: 'LLM API Key未配置' };
  }
  
  switch (LLM_CONFIG.provider) {
    case 'minimax':
      return await callMiniMax(prompt, options);
    case 'deepseek':
      return await callDeepSeek(prompt, options);
    default:
      return { error: `未知provider: ${LLM_CONFIG.provider}` };
  }
}

// ============ Agent Prompts ============

const AGENT_PROMPTS = {
  master: `你是VoiceForge AI的多Agent系统Master，负责理解用户需求并调度其他Agent。

当前系统能力：
- 语音合成：支持文本转语音，多种音色
- 语音克隆：基于参考音频克隆音色（需要长音频）
- 情感识别：分析文本情感
- 角色管理：创建配音角色
- 项目管理：创建和管理配音项目
- 背景音乐：根据场景推荐BGM
- 音频导出：MP3/WAV格式

用户输入可能是：
- 配音需求（旁白、角色对话、情感变化）
- 修改要求（语调、语速、情感）
- 新项目创建
- 问题咨询

你的任务：
1. 理解用户需求
2. 判断需要哪些Agent处理
3. 调度相应Agent
4. 汇总结果返回给用户

决策规则：
- 如果需求模糊或不完整 → 调度Planner扩展需求
- 如果有具体功能需要实现 → 调度Generator
- 如果需要评估/测试 → 调度Evaluator
- 如果是简单问题 → 直接回答`,

  planner: `你是VoiceForge AI的Planner Agent，负责把用户需求扩展为完整的配音项目规格。

分析用户需求后，你需要输出：
1. 项目类型：小说配音/广告配音/短视频配音/其他
2. 角色列表：需要哪些角色，每个角色的特点
3. 情感基调：整体情感走向
4. 场景描述：需要什么背景音乐/音效
5. 技术参数：语速、音调等建议

输出JSON格式：
{
  "projectType": "小说配音",
  "roles": [{"name": "角色名", "description": "特点", "voice": "推荐音色"}],
  "emotions": ["情感1", "情感2"],
  "scenes": [{"type": "场景", "bgm": "推荐BGM"}],
  "params": {"speed": 1.0, "pitch": 0}
}`,

  generator: `你是VoiceForge AI的Generator Agent，负责根据规格创建实际的配音项目。

你需要：
1. 创建项目结构
2. 配置角色
3. 生成配音脚本
4. 设置参数

输入是Planner的输出，执行后返回项目创建结果。`,

  evaluator: `你是VoiceForge AI的Evaluator Agent，负责评估配音项目质量。

检查维度：
1. 角色配置是否完整
2. 情感标注是否合理
3. 技术参数是否合适
4. 是否有遗漏的内容

输出评估报告和改进建议。`
};

// ============ Agent 实现 ============

class Agent {
  constructor(name, prompt, llmCall) {
    this.name = name;
    this.prompt = prompt;
    this.llmCall = llmCall;
  }

  async run(input, context = {}) {
    const fullPrompt = `${this.prompt}\n\n---\n用户输入: ${input}\n\n上下文: ${JSON.stringify(context)}\n\n---\n请按照你的角色处理，直接返回结果。`;
    
    if (this.llmCall) {
      return await this.llmCall(fullPrompt);
    }
    
    // 模拟响应（无API时）
    return this.simulate(input);
  }

  simulate(input) {
    // 简单的模拟响应
    return { agent: this.name, input, response: 'API未配置，无法生成真实响应' };
  }
}

// 创建Agent实例
const agents = {
  master: new Agent('master', AGENT_PROMPTS.master, callLLM),
  planner: new Agent('planner', AGENT_PROMPTS.planner, callLLM),
  generator: new Agent('generator', AGENT_PROMPTS.generator, callLLM),
  evaluator: new Agent('evaluator', AGENT_PROMPTS.evaluator, callLLM)
};

// ============ 项目存储 ============

const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// ============ API Routes ============

// 健康检查
app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Multi-Agent System",
    version: "2.0.0",
    status: "running",
    llm: {
      provider: LLM_CONFIG.provider,
      configured: !!LLM_CONFIG.apiKey
    },
    endpoints: {
      chat: "POST /api/chat",
      agents: "POST /api/agents/:name",
      project: "POST /api/project",
      status: "GET /api/status"
    }
  });
});

// 对话接口 (Master Agent调度)
app.post('/api/chat', async (req, res) => {
  const { message, context = {} } = req.body;
  
  try {
    // Master决定调度
    const decision = await agents.master.run(message, context);
    
    let result;
    let usedAgent = 'master';
    
    // 解析决策并调度
    const decisionStr = JSON.stringify(decision).toLowerCase();
    
    if (decisionStr.includes('planner') || decisionStr.includes('需要') || decisionStr.includes('分析')) {
      result = await agents.planner.run(message, context);
      usedAgent = 'planner';
    } else if (decisionStr.includes('generator') || decisionStr.includes('实现') || decisionStr.includes('创建')) {
      result = await agents.generator.run(message, context);
      usedAgent = 'generator';
    } else if (decisionStr.includes('evaluator') || decisionStr.includes('评估') || decisionStr.includes('检查')) {
      result = await agents.evaluator.run(message, context);
      usedAgent = 'evaluator';
    } else {
      result = decision;
    }
    
    res.json({
      message,
      usedAgent,
      decision: decisionStr.substring(0, 100),
      response: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 直接调用某个Agent
app.post('/api/agents/:name', async (req, res) => {
  const { name } = req.params;
  const { input, context = {} } = req.body;
  
  const agent = agents[name];
  if (!agent) {
    return res.status(400).json({ error: `Unknown agent: ${name}` });
  }
  
  try {
    const result = await agent.run(input, context);
    res.json({ agent: name, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建项目
app.post('/api/project', async (req, res) => {
  const { name, description, script, roles = [] } = req.body;
  
  const project = {
    id: 'proj_' + Date.now(),
    name,
    description,
    script,
    roles,
    createdAt: new Date().toISOString(),
    status: 'created'
  };
  
  // 保存项目
  const projectPath = path.join(projectsDir, `${project.id}.json`);
  fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
  
  res.json({ success: true, project });
});

// 获取项目列表
app.get('/api/projects', (req, res) => {
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'));
  const projects = files.map(f => {
    const data = fs.readFileSync(path.join(projectsDir, f), 'utf-8');
    return JSON.parse(data);
  });
  
  res.json({ projects });
});

// 系统状态
app.get('/api/status', (req, res) => {
  res.json({
    agents: Object.keys(agents),
    llm: {
      provider: LLM_CONFIG.provider,
      configured: !!LLM_CONFIG.apiKey
    },
    projects: fs.readdirSync(projectsDir).length
  });
});

// 配置LLM
app.post('/api/config/llm', (req, res) => {
  const { provider, apiKey, baseUrl } = req.body;
  
  if (provider) LLM_CONFIG.provider = provider;
  if (apiKey) LLM_CONFIG.apiKey = apiKey;
  if (baseUrl) LLM_CONFIG.baseUrl = baseUrl;
  
  res.json({ success: true, config: LLM_CONFIG });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Multi-Agent System v2.0 running on http://0.0.0.0:${PORT}`);
  console.log(`LLM Provider: ${LLM_CONFIG.provider}`);
  console.log(`API Configured: ${!!LLM_CONFIG.apiKey}`);
});

export default app;
// ============ 新版 LLM 配置 API (兼容 OpenClaw 格式) ============

// 添加自定义 LLM
app.post('/api/llm/add', (req, res) => {
  try {
    const result = LLMConfig.addLLM(req.body);
    res.json(result);
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 设置内置 LLM
app.post('/api/llm/set-builtin', (req, res) => {
  const { key, apiKey } = req.body;
  const result = LLMConfig.setBuiltin(key, apiKey);
  res.json(result);
});

// 测试 LLM
app.post('/api/llm/test', async (req, res) => {
  const { name } = req.body;
  const result = await LLMConfig.testLLM(name || 'text');
  res.json(result);
});

// 测试文本 LLM
app.post('/api/llm/test-text', async (req, res) => {
  const result = await LLMConfig.testTextLLM();
  res.json(result);
});

// 测试语音 LLM
app.post('/api/llm/test-voice', async (req, res) => {
  const result = await LLMConfig.testVoiceLLM();
  res.json(result);
});

// 获取 LLM 状态
app.get('/api/llm/status', (req, res) => {
  res.json(LLMConfig.getStatus());
});

// 获取可用 LLM 列表
app.get('/api/llm/available', (req, res) => {
  res.json(LLMConfig.getAvailable());
});

// 文本分析 (使用文本 LLM)
app.post('/api/llm/analyze', async (req, res) => {
  const { prompt } = req.body;
  const llm = LLMConfig.getTextLLM();
  if (!llm) {
    return res.json({ success: false, error: 'No text LLM configured' });
  }
  try {
    const response = await LLMConfig._callAPI(llm, prompt);
    res.json({ success: true, response });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 语音处理 (使用语音 LLM)
app.post('/api/llm/voice-process', async (req, res) => {
  const { prompt } = req.body;
  const llm = LLMConfig.getVoiceLLM();
  if (!llm) {
    return res.json({ success: false, error: 'No voice LLM configured' });
  }
  try {
    const response = await LLMConfig._callAPI(llm, prompt);
    res.json({ success: true, response });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
