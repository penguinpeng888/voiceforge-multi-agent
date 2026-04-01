/**
 * VoiceForge 实时预览模块
 * 功能：边编辑边听效果
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PREVIEW_PORT = 3600;

app.use(cors());
app.use(bodyParser.json());

// WebSocket连接管理
const clients = new Map();

// 预览会话
const sessions = new Map();

// 创建预览会话
function createPreviewSession(id) {
  const session = {
    id,
    text: '',
    voice: 'male_xuhan',
    params: { speed: 1.0, pitch: 0, vol: 1.0 },
    bgm: null,
    sfx: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  sessions.set(id, session);
  return session;
}

// 广播更新给客户端
function broadcast(sessionId, data) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  const message = JSON.stringify({
    type: 'update',
    sessionId,
    ...data
  });
  
  // 发送给所有订阅此session的客户端
  for (const [client, clientSessionId] of clients) {
    if (clientSessionId === sessionId && client.readyState === 1) {
      client.send(message);
    }
  }
}

// ============ HTTP API ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Real-time Preview",
    version: "1.0.0",
    ws: `ws://localhost:${PREVIEW_PORT}/ws`
  });
});

// 创建预览会话
app.post('/api/preview/session', (req, res) => {
  const sessionId = 'preview_' + Date.now();
  const session = createPreviewSession(sessionId);
  
  res.json({
    success: true,
    sessionId,
    session
  });
});

// 获取会话
app.get('/api/preview/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  
  res.json(session);
});

// 更新会话
app.put('/api/preview/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  
  // 更新字段
  const { text, voice, params, bgm, sfx } = req.body;
  
  if (text !== undefined) session.text = text;
  if (voice !== undefined) session.voice = voice;
  if (params !== undefined) session.params = { ...session.params, ...params };
  if (bgm !== undefined) session.bgm = bgm;
  if (sfx !== undefined) session.sfx = sfx;
  
  session.updatedAt = new Date().toISOString();
  
  // 广播更新
  broadcast(session.id, { session });
  
  res.json({ success: true, session });
});

// 生成预览（调用TTS）
app.post('/api/preview/generate', async (req, res) => {
  const { sessionId, text, voice, params } = req.body;
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  
  const previewText = text || session.text;
  const previewVoice = voice || session.voice;
  const previewParams = params || session.params;
  
  // 这里应该调用MiniMax TTS API
  // 模拟返回
  const result = {
    sessionId,
    text: previewText,
    voice: previewVoice,
    params: previewParams,
    audio: null, // 实际应该返回base64
    timestamp: new Date().toISOString()
  };
  
  // 广播音频给客户端
  broadcast(sessionId, { audio: result });
  
  res.json({
    success: true,
    result
  });
});

// 删除会话
app.delete('/api/preview/session/:id', (req, res) => {
  const sessionId = req.params.id;
  
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: '会话不存在' });
  }
  
  // 清理客户端连接
  for (const [client, clientSessionId] of clients) {
    if (clientSessionId === sessionId) {
      clients.delete(client);
    }
  }
  
  sessions.delete(sessionId);
  
  res.json({ success: true });
});

// 获取所有会话
app.get('/api/preview/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(s => ({
    id: s.id,
    textPreview: s.text.substring(0, 50),
    voice: s.voice,
    updatedAt: s.updatedAt
  }));
  
  res.json({ sessions: sessionList });
});

// ============ HTTP Server + WebSocket ============

const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          // 订阅会话
          if (data.sessionId) {
            clients.set(ws, data.sessionId);
            
            // 发送当前会话状态
            const session = sessions.get(data.sessionId);
            if (session) {
              ws.send(JSON.stringify({
                type: 'init',
                session
              }));
            }
          }
          break;
          
        case 'update':
          // 更新会话
          if (data.sessionId && sessions.has(data.sessionId)) {
            const session = sessions.get(data.sessionId);
            
            if (data.text !== undefined) session.text = data.text;
            if (data.voice !== undefined) session.voice = data.voice;
            if (data.params) session.params = { ...session.params, ...data.params };
            if (data.bgm !== undefined) session.bgm = data.bgm;
            if (data.sfx) session.sfx = data.sfx;
            
            session.updatedAt = new Date().toISOString();
            
            // 广播给所有订阅者
            broadcast(data.sessionId, { session });
          }
          break;
          
        case 'generate':
          // 请求生成预览
          if (data.sessionId && sessions.has(data.sessionId)) {
            const session = sessions.get(data.sessionId);
            
            // 这里应该调用TTS
            // 模拟
            const preview = {
              text: data.text || session.text,
              voice: data.voice || session.voice,
              params: data.params || session.params
            };
            
            // 广播生成的音频
            broadcast(data.sessionId, { 
              generating: true,
              text: preview.text
            });
            
            // 模拟延迟后返回
            setTimeout(() => {
              broadcast(data.sessionId, {
                generating: false,
                audio: { text: preview.text }
              });
            }, 500);
          }
          break;
          
        case 'unsubscribe':
          // 取消订阅
          clients.delete(ws);
          break;
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

// 启动服务器
server.listen(PREVIEW_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Real-time Preview running on http://0.0.0.0:${PREVIEW_PORT}`);
  console.log(`WebSocket: ws://localhost:${PREVIEW_PORT}/ws`);
});

export default app;