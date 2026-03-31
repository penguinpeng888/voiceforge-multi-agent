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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Multi-Agent System running on http://0.0.0.0:${PORT}`);
  console.log(`Agents: ${Object.keys(AGENT_PROMPTS).join(', ')}`);
});