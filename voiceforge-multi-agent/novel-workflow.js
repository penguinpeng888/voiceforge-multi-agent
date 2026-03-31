/**
 * VoiceForge 小说配音工作流
 * 方向C：小说文本导入 → 自动分角色 → 批量生成
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
const PORT = 3300;

app.use(cors());
app.use(bodyParser.json());

// ============ 角色模板 ============

const ROLE_TEMPLATES = {
  'protagonist': { name: '主角', defaultVoice: 'male_xuhan', emotions: ['平静', '愤怒', '悲伤', '激动'] },
  'antagonist': { name: '反派', defaultVoice: 'demon_lord', emotions: ['阴冷', '狂妄', '愤怒'] },
  'elder': { name: '长辈', defaultVoice: 'male_shanyin', emotions: ['慈祥', '严肃', '沧桑'] },
  'lover': { name: '恋人', defaultVoice: 'female_biyun', emotions: ['温柔', '害羞', '深情'] },
  'friend': { name: '朋友', defaultVoice: 'male_cangyao', emotions: ['豪爽', '调笑', '认真'] },
  'mentor': { name: '师父', defaultVoice: 'male_xuanqing', emotions: ['严厉', '慈爱', '从容'] },
  'child': { name: '儿童', defaultVoice: 'child_boy', emotions: ['活泼', '害怕', '开心'] },
  'goddess': { name: '仙女', defaultVoice: 'female_xiannv', emotions: ['空灵', '冷漠', '慈悲'] },
  'demon': { name: '妖魔', defaultVoice: 'demon_lord', emotions: ['凶残', '狂妄', '阴冷'] },
  'narrator': { name: '旁白', defaultVoice: 'male_baijing', emotions: ['平静', '叙述', '感慨'] }
};

// ============ 文本分析 ============

// 简单角色识别 (基于台词前缀)
function detectRoles(script) {
  const lines = script.split('\n').filter(l => l.trim());
  const roles = new Set();
  
  // 常见角色识别模式: "张三:" "【张三】" "张三说道："
  const patterns = [
    /^【(.+?)】/,  // 【张三】
    /^(.+?)[:：]/,  // 张三:
    /^(.+?)说/,   // 张三说
    /^(.+?)道/    // 张三道
  ];
  
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1].length < 10) {
        roles.add(match[1].trim());
      }
    }
  }
  
  return Array.from(roles);
}

// 情感分析 (简化版)
function analyzeEmotions(text) {
  const emotionPatterns = {
    '愤怒': ['愤怒', '生气', '怒吼', '咆哮', '气愤'],
    '悲伤': ['悲伤', '伤心', '流泪', '哭泣', '痛心'],
    '喜悦': ['开心', '高兴', '喜悦', '大笑', '欢笑'],
    '恐惧': ['害怕', '恐惧', '颤抖', '惊恐', '胆怯'],
    '惊讶': ['惊讶', '震惊', '意外', '吃惊', '错愕'],
    '平静': ['平静', '冷静', '淡然', '从容', '安静']
  };
  
  const emotions = [];
  for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        emotions.push(emotion);
        break;
      }
    }
  }
  
  return emotions.length > 0 ? emotions : ['平静'];
}

// 文本分段
function segmentScript(script) {
  const segments = [];
  const lines = script.split('\n').filter(l => l.trim());
  
  let currentRole = '旁白';
  let currentContent = [];
  
  for (const line of lines) {
    // 检测角色
    let isDialogue = false;
    const roleMatch = line.match(/^(.+?)[:：]/);
    
    if (roleMatch) {
      // 保存之前的段落
      if (currentContent.length > 0) {
        segments.push({
          role: currentRole,
          content: currentContent.join(' '),
          emotions: analyzeEmotions(currentContent.join(' '))
        });
      }
      
      currentRole = roleMatch[1].trim();
      currentContent = [line.replace(roleMatch[0], '').trim()];
      isDialogue = true;
    } else if (!isDialogue) {
      currentContent.push(line.trim());
    }
  }
  
  // 最后一个段落
  if (currentContent.length > 0) {
    segments.push({
      role: currentRole,
      content: currentContent.join(' '),
      emotions: analyzeEmotions(currentContent.join(' '))
    });
  }
  
  return segments;
}

// ============ 项目存储 ============

const novelsDir = path.join(__dirname, 'novels');
if (!fs.existsSync(novelsDir)) {
  fs.mkdirSync(novelsDir, { recursive: true });
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge 小说配音工作流",
    version: "1.0.0",
    endpoints: {
      import: "POST /api/novel/import",
      analyze: "POST /api/novel/analyze",
      generate: "POST /api/novel/generate",
      project: "GET/POST /api/project"
    }
  });
});

// 获取角色模板
app.get('/api/roles/templates', (req, res) => {
  res.json({ templates: ROLE_TEMPLATES });
});

// 导入小说
app.post('/api/novel/import', (req, res) => {
  const { title, content, author = '未知' } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '请提供标题和内容' });
  }
  
  const novel = {
    id: 'novel_' + Date.now(),
    title,
    author,
    content,
    wordCount: content.length,
    importedAt: new Date().toISOString(),
    status: 'imported'
  };
  
  // 保存
  const filePath = path.join(novelsDir, `${novel.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(novel, null, 2));
  
  res.json({
    success: true,
    novel: {
      id: novel.id,
      title: novel.title,
      author: novel.author,
      wordCount: novel.wordCount
    }
  });
});

// 分析小说 (角色、情感、分段)
app.post('/api/novel/analyze', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: '请提供文本内容' });
  }
  
  // 1. 角色识别
  const detectedRoles = detectRoles(content);
  
  // 2. 文本分段
  const segments = segmentScript(content);
  
  // 3. 统计
  const roleStats = {};
  for (const seg of segments) {
    roleStats[seg.role] = (roleStats[seg.role] || 0) + 1;
  }
  
  // 4. 情感统计
  const emotionStats = {};
  for (const seg of segments) {
    for (const e of seg.emotions) {
      emotionStats[e] = (emotionStats[e] || 0) + 1;
    }
  }
  
  res.json({
    roles: detectedRoles,
    roleStats,
    segments: segments.length,
    emotionStats,
    sampleSegments: segments.slice(0, 5)
  });
});

// 批量生成 (预留接口)
app.post('/api/novel/generate', (req, res) => {
  const { novelId, voiceMapping = {}, options = {} } = req.body;
  
  // 读取小说
  const filePath = path.join(novelsDir, `${novelId}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '小说不存在' });
  }
  
  const novel = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const segments = segmentScript(novel.content);
  
  // 生成任务
  const tasks = segments.map((seg, i) => ({
    taskId: `task_${i}`,
    role: seg.role,
    content: seg.content,
    emotions: seg.emotions,
    voice: voiceMapping[seg.role] || 'male_xuhan',
    status: 'pending'
  }));
  
  res.json({
    novelId,
    totalSegments: tasks.length,
    tasks: tasks.slice(0, 10), // 返回前10个
    message: `共${tasks.length}段，已创建生成任务`
  });
});

// 获取项目列表
app.get('/api/projects', (req, res) => {
  const files = fs.readdirSync(novelsDir).filter(f => f.endsWith('.json'));
  const projects = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(novelsDir, f), 'utf-8'));
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      wordCount: data.wordCount,
      importedAt: data.importedAt
    };
  });
  res.json({ projects });
});

// 获取单个项目
app.get('/api/project/:id', (req, res) => {
  const filePath = path.join(novelsDir, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VoiceForge 小说工作流 running on http://0.0.0.0:${PORT}`);
  console.log(`角色模板: ${Object.keys(ROLE_TEMPLATES).length}个`);
});

export default app;