/**
 * VoiceForge 历史版本模块
 * 功能：项目修改记录
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
const HISTORY_PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// 版本存储目录
const versionsDir = path.join(__dirname, 'versions');
if (!fs.existsSync(versionsDir)) {
  fs.mkdirSync(versionsDir, { recursive: true });
}

// 项目版本
function saveVersion(projectId, data, description = '') {
  const projectVersionsDir = path.join(versionsDir, projectId);
  if (!fs.existsSync(projectVersionsDir)) {
    fs.mkdirSync(projectVersionsDir, { recursive: true });
  }
  
  const versionId = 'v_' + Date.now();
  const version = {
    id: versionId,
    projectId,
    data,  // 项目完整数据快照
    description,
    createdAt: new Date().toISOString(),
    size: JSON.stringify(data).length
  };
  
  const versionPath = path.join(projectVersionsDir, `${versionId}.json`);
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
  
  // 更新版本索引
  const indexPath = path.join(projectVersionsDir, 'index.json');
  let index = { versions: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }
  index.versions.unshift({
    id: versionId,
    description,
    createdAt: version.createdAt,
    size: version.size
  });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  return version;
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge History",
    version: "1.0.0",
    features: ["版本保存", "版本回滚", "差异对比"]
  });
});

// 保存版本
app.post('/api/history/save', (req, res) => {
  const { projectId, data, description } = req.body;
  
  if (!projectId || !data) {
    return res.status(400).json({ error: '请提供项目ID和数据' });
  }
  
  const version = saveVersion(projectId, data, description);
  
  res.json({
    success: true,
    versionId: version.id,
    createdAt: version.createdAt
  });
});

// 获取项目版本列表
app.get('/api/history/:projectId', (req, res) => {
  const { projectId } = req.params;
  const indexPath = path.join(versionsDir, projectId, 'index.json');
  
  if (!fs.existsSync(indexPath)) {
    return res.json({ versions: [] });
  }
  
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  res.json(index);
});

// 获取特定版本
app.get('/api/history/:projectId/:versionId', (req, res) => {
  const { projectId, versionId } = req.params;
  const versionPath = path.join(versionsDir, projectId, `${versionId}.json`);
  
  if (!fs.existsSync(versionPath)) {
    return res.status(404).json({ error: '版本不存在' });
  }
  
  const version = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
  res.json(version);
});

// 回滚到指定版本
app.post('/api/history/:projectId/:versionId/rollback', (req, res) => {
  const { projectId, versionId } = req.params;
  const versionPath = path.join(versionsDir, projectId, `${versionId}.json`);
  
  if (!fs.existsSync(versionPath)) {
    return res.status(404).json({ error: '版本不存在' });
  }
  
  const version = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
  
  // 保存当前状态为新版本（以便恢复）
  const currentData = req.body.currentData;
  if (currentData) {
    saveVersion(projectId, currentData, '回滚前备份');
  }
  
  res.json({
    success: true,
    data: version.data,
    message: `已回滚到版本 ${versionId}`
  });
});

// 删除版本
app.delete('/api/history/:projectId/:versionId', (req, res) => {
  const { projectId, versionId } = req.params;
  const versionPath = path.join(versionsDir, projectId, `${versionId}.json`);
  
  if (!fs.existsSync(versionPath)) {
    return res.status(404).json({ error: '版本不存在' });
  }
  
  fs.unlinkSync(versionPath);
  
  // 更新索引
  const indexPath = path.join(versionsDir, projectId, 'index.json');
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    index.versions = index.versions.filter(v => v.id !== versionId);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
  
  res.json({ success: true });
});

// 清理旧版本（保留最近N个）
app.post('/api/history/:projectId/cleanup', (req, res) => {
  const { projectId } = req.params;
  const { keep = 10 } = req.body;
  
  const indexPath = path.join(versionsDir, projectId, 'index.json');
  if (!fs.existsSync(indexPath)) {
    return res.json({ deleted: 0 });
  }
  
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const toDelete = index.versions.slice(keep);
  
  let deleted = 0;
  for (const v of toDelete) {
    const versionPath = path.join(versionsDir, projectId, `${v.id}.json`);
    if (fs.existsSync(versionPath)) {
      fs.unlinkSync(versionPath);
      deleted++;
    }
  }
  
  // 更新索引
  index.versions = index.versions.slice(0, keep);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  res.json({ deleted, kept: keep });
});

// 获取存储使用情况
app.get('/api/history/stats', (req, res) => {
  const projects = fs.readdirSync(versionsDir).filter(f => {
    return fs.statSync(path.join(versionsDir, f)).isDirectory();
  });
  
  let totalSize = 0;
  let totalVersions = 0;
  
  const projectStats = projects.map(p => {
    const indexPath = path.join(versionsDir, p, 'index.json');
    let size = 0;
    let versions = 0;
    
    if (fs.existsSync(indexPath)) {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      versions = index.versions.length;
      totalVersions += versions;
      
      for (const v of index.versions) {
        size += v.size || 0;
      }
    }
    
    totalSize += size;
    
    return {
      projectId: p,
      versions,
      size
    };
  });
  
  res.json({
    totalSize,
    totalVersions,
    projects: projectStats
  });
});

// 启动服务器
app.listen(HISTORY_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge History running on http://0.0.0.0:${HISTORY_PORT}`);
});

export default app;