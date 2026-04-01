/**
 * VoiceForge 批量生成模块
 * 功能：一键生成所有段落
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
const BATCH_PORT = 3500;

app.use(cors());
app.use(bodyParser.json());

// 任务存储
const tasksDir = path.join(__dirname, 'batch-tasks');
if (!fs.existsSync(tasksDir)) {
  fs.mkdirSync(tasksDir, { recursive: true });
}

// 任务状态
const TaskStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// 模拟调用TTS
async function synthesizeParagraph(text, voice, params) {
  // 实际应该调用MiniMax API
  // 这里模拟返回
  return {
    success: true,
    text: text.substring(0, 20) + '...',
    voice,
    params,
    audio: null // 实际应该返回音频base64
  };
}

// 创建批量任务
async function createBatchTask(config) {
  const taskId = 'batch_' + Date.now();
  const { projectId, segments, voiceMapping = {}, params = {} } = config;
  
  // 创建任务文件
  const task = {
    id: taskId,
    projectId,
    totalSegments: segments.length,
    completedSegments: 0,
    failedSegments: 0,
    status: TaskStatus.PENDING,
    createdAt: new Date().toISOString(),
    results: []
  };
  
  fs.writeFileSync(
    path.join(tasksDir, `${taskId}.json`),
    JSON.stringify(task, null, 2)
  );
  
  return task;
}

// 执行批量任务
async function runBatchTask(taskId) {
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  
  task.status = TaskStatus.PROCESSING;
  task.startedAt = new Date().toISOString();
  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
  
  // 这里应该从数据库获取segments
  // 模拟处理每个段落
  const segments = []; // 从项目获取
  
  for (let i = 0; i < task.totalSegments; i++) {
    // 模拟处理
    await new Promise(resolve => setTimeout(resolve, 100));
    
    task.completedSegments++;
    task.results.push({
      segmentId: i,
      status: 'success',
      audio: `segment_${i}.mp3`
    });
    
    // 保存进度
    if (i % 5 === 0) {
      fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
    }
  }
  
  task.status = TaskStatus.COMPLETED;
  task.completedAt = new Date().toISOString();
  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
  
  return task;
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Batch Generator",
    version: "1.0.0",
    features: ["批量生成", "进度追踪", "失败重试"]
  });
});

// 创建批量任务
app.post('/api/batch/create', async (req, res) => {
  const { projectId, segments, voiceMapping, params } = req.body;
  
  if (!projectId || !segments || segments.length === 0) {
    return res.status(400).json({ error: '请提供项目ID和段落列表' });
  }
  
  const task = await createBatchTask({
    projectId,
    segments,
    voiceMapping,
    params
  });
  
  res.json({
    success: true,
    taskId: task.id,
    totalSegments: task.totalSegments
  });
});

// 启动批量任务
app.post('/api/batch/:taskId/start', async (req, res) => {
  const { taskId } = req.params;
  
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  // 后台执行
  runBatchTask(taskId).catch(console.error);
  
  res.json({
    success: true,
    message: '任务已启动',
    taskId
  });
});

// 获取任务状态
app.get('/api/batch/:taskId/status', (req, res) => {
  const { taskId } = req.params;
  
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  
  res.json({
    taskId: task.id,
    status: task.status,
    totalSegments: task.totalSegments,
    completedSegments: task.completedSegments,
    failedSegments: task.failedSegments,
    progress: task.totalSegments > 0 
      ? Math.round((task.completedSegments / task.totalSegments) * 100) 
      : 0,
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt
  });
});

// 获取所有任务
app.get('/api/batch/list', (req, res) => {
  const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
  const tasks = files.map(f => {
    const task = JSON.parse(fs.readFileSync(path.join(tasksDir, f), 'utf-8'));
    return {
      id: task.id,
      projectId: task.projectId,
      status: task.status,
      totalSegments: task.totalSegments,
      completedSegments: task.completedSegments,
      createdAt: task.createdAt
    };
  });
  
  res.json({ tasks });
});

// 暂停任务
app.post('/api/batch/:taskId/pause', (req, res) => {
  const { taskId } = req.params;
  
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  task.status = 'paused';
  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
  
  res.json({ success: true, message: '任务已暂停' });
});

// 重新尝试失败段落
app.post('/api/batch/:taskId/retry', async (req, res) => {
  const { taskId } = req.params;
  
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const task = JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  
  // 重置失败段落
  task.failedSegments = 0;
  task.status = TaskStatus.PENDING;
  
  // 重新运行
  runBatchTask(taskId).catch(console.error);
  
  res.json({ success: true, message: '开始重试' });
});

// 删除任务
app.delete('/api/batch/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  fs.unlinkSync(taskPath);
  
  res.json({ success: true, message: '任务已删除' });
});

// 清理已完成的任务
app.post('/api/batch/cleanup', (req, res) => {
  const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
  let deleted = 0;
  
  for (const f of files) {
    const task = JSON.parse(fs.readFileSync(path.join(tasksDir, f), 'utf-8'));
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      fs.unlinkSync(path.join(tasksDir, f));
      deleted++;
    }
  }
  
  res.json({ success: true, deleted });
});

// 启动服务器
app.listen(BATCH_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Batch Generator running on http://0.0.0.0:${BATCH_PORT}`);
});

export default app;