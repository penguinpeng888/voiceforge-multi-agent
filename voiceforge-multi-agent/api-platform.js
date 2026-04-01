/**
 * VoiceForge API开放平台
 * 功能：供第三方调用
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_PORT = 4100;

app.use(cors());
app.use(express.json());

// API密钥存储
const keysFile = path.join(__dirname, 'api-keys.json');
let apiKeys = {};

// 加载API密钥
if (fs.existsSync(keysFile)) {
  apiKeys = JSON.parse(fs.readFileSync(keysFile, 'utf-8'));
}

function saveKeys() {
  fs.writeFileSync(keysFile, JSON.stringify(apiKeys, null, 2));
}

// 生成API密钥
function generateKey() {
  return 'vk_' + crypto.randomBytes(16).toString('hex');
}

// 验证API密钥
function verifyKey(key) {
  return apiKeys[key] && apiKeys[key].active;
}

// 速率限制
const rateLimit = new Map();

function checkRateLimit(key, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const keyData = rateLimit.get(key) || { count: 0, reset: now + windowMs };
  
  if (now > keyData.reset) {
    keyData.count = 0;
    keyData.reset = now + windowMs;
  }
  
  keyData.count++;
  rateLimit.set(key, keyData);
  
  return keyData.count <= limit;
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge API Platform",
    version: "1.0.0",
    docs: "/api/docs",
    status: "running"
  });
});

// 获取API文档
app.get('/api/docs', (req, res) => {
  res.json({
    title: "VoiceForge API",
    version: "1.0.0",
    baseUrl: `http://localhost:${API_PORT}`,
    endpoints: [
      {
        path: '/api/tts/synthesize',
        method: 'POST',
        description: '语音合成',
        params: { text: 'string', voice: 'string', speed: 'number' }
      },
      {
        path: '/api/projects/list',
        method: 'GET',
        description: '获取项目列表'
      },
      {
        path: '/api/projects/:id',
        method: 'GET',
        description: '获取项目详情'
      },
      {
        path: '/api/novel/analyze',
        method: 'POST',
        description: '分析小说内容',
        params: { content: 'string' }
      }
    ]
  });
});

// 创建API密钥
app.post('/api/keys', (req, res) => {
  const { name, limits = {} } = req.body;
  
  const key = generateKey();
  apiKeys[key] = {
    name: name || 'API Key',
    active: true,
    createdAt: new Date().toISOString(),
    rateLimit: limits.rateLimit || 100,
    dailyLimit: limits.dailyLimit || 1000,
    usage: { requests: 0, today: 0 }
  };
  
  saveKeys();
  
  res.json({
    success: true,
    key,
    message: '请妥善保存密钥，忘记无法找回'
  });
});

// 获取密钥列表
app.get('/api/keys', (req, res) => {
  const keys = Object.entries(apiKeys).map(([key, data]) => ({
    key: key.substring(0, 8) + '...',
    name: data.name,
    active: data.active,
    createdAt: data.createdAt,
    usage: data.usage
  }));
  
  res.json({ keys });
});

// 删除API密钥
app.delete('/api/keys/:key', (req, res) => {
  const { key } = req.params;
  
  if (!apiKeys[key]) {
    return res.status(404).json({ error: '密钥不存在' });
  }
  
  delete apiKeys[key];
  saveKeys();
  
  res.json({ success: true });
});

// 中间件：API密钥验证
app.use('/api/', (req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.api_key;
  
  if (!key) {
    return res.status(401).json({ error: '请提供API密钥' });
  }
  
  if (!verifyKey(key)) {
    return res.status(403).json({ error: '无效的API密钥' });
  }
  
  // 速率限制
  const keyData = apiKeys[key];
  if (!checkRateLimit(key, keyData.rateLimit)) {
    return res.status(429).json({ error: '请求过于频繁' });
  }
  
  // 更新使用统计
  apiKeys[key].usage.requests++;
  apiKeys[key].usage.today++;
  saveKeys();
  
  next();
});

// 语音合成API
app.post('/api/tts/synthesize', async (req, res) => {
  const { text, voice, speed, pitch } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: '请提供文本' });
  }
  
  // 实际应该调用TTS服务
  // 这里模拟返回
  res.json({
    success: true,
    text,
    voice: voice || 'male_xuhan',
    params: { speed: speed || 1.0, pitch: pitch || 0 },
    message: '需要配置TTS服务'
  });
});

// 项目列表API
app.get('/api/projects', (req, res) => {
  // 实际应该从数据库获取
  res.json({
    success: true,
    projects: []
  });
});

// 项目详情API
app.get('/api/projects/:id', (req, res) => {
  res.json({
    success: true,
    project: { id: req.params.id }
  });
});

// 小说分析API
app.post('/api/novel/analyze', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: '请提供内容' });
  }
  
  // 简单分析
  const words = content.length;
  const sentences = content.split(/[。！？]/).length;
  
  res.json({
    success: true,
    analysis: {
      wordCount: words,
      sentenceCount: sentences,
      characters: [...new Set(content)].length
    }
  });
});

// 使用统计
app.get('/api/stats', (req, res) => {
  const totalRequests = Object.values(apiKeys).reduce((sum, k) => sum + (k.usage?.requests || 0), 0);
  
  res.json({
    totalKeys: Object.keys(apiKeys).length,
    totalRequests,
    activeKeys: Object.values(apiKeys).filter(k => k.active).length
  });
});

// 启动服务器
app.listen(API_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge API Platform running on http://0.0.0.0:${API_PORT}`);
});

export default app;