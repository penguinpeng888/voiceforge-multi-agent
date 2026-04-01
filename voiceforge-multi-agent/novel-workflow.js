/**
 * VoiceForge 小说配音工作流 - 增强版
 * 新增：环境音效识别、BGM推荐
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

// ============ 音效库 ============

const SOUND_EFFECTS = {
  // 自然环境
  'rain': { name: '雨声', category: '自然', icon: '🌧️', description: '小雨/大雨/暴雨' },
  'thunder': { name: '雷声', category: '自然', icon: '⛈️', description: '雷鸣电闪' },
  'wind': { name: '风声', category: '自然', icon: '💨', description: '微风/狂风/呼啸' },
  'water': { name: '水声', category: '自然', icon: '💧', description: '流水/瀑布/海浪' },
  'fire': { name: '火声', category: '自然', icon: '🔥', description: '柴火/燃烧' },
  'bird': { name: '鸟鸣', category: '自然', icon: '🐦', description: '清晨鸟叫' },
  'wolf': { name: '狼嚎', category: '自然', icon: '🐺', description: '荒野狼嚎' },
  'cricket': { name: '虫鸣', category: '自然', icon: '🦗', description: '夜晚虫鸣' },
  
  // 场景环境
  'battle': { name: '战斗', category: '场景', icon: '⚔️', description: '刀剑/法术/喊杀' },
  'horse': { name: '马蹄', category: '场景', icon: '🐎', description: '马蹄声' },
  'footstep': { name: '脚步', category: '场景', icon: '👣', description: '脚步/走路' },
  'door': { name: '开门', category: '场景', icon: '🚪', description: '开门/关门' },
  'sword': { name: '剑鸣', category: '场景', icon: '🗡️', description: '剑出鞘/碰撞' },
  'magic': { name: '法术', category: '场景', icon: '✨', description: '魔法效果' },
  'explosion': { name: '爆炸', category: '场景', icon: '💥', description: '爆炸/轰鸣' },
  'crowd': { name: '人群', category: '场景', icon: '👥', description: '喧哗/议论' },
  
  // 情感氛围
  'tense': { name: '紧张', category: '氛围', icon: '😰', description: '悬疑/紧张' },
  'peaceful': { name: '宁静', category: '氛围', icon: '😌', description: '平静/安详' },
  'sad': { name: '悲伤', category: '氛围', icon: '😢', description: '哀伤/凄凉' },
  'mysterious': { name: '神秘', category: '氛围', icon: '🔮', description: '诡异/神秘' },
  'grand': { name: '宏大', category: '氛围', icon: '🏰', description: '史诗/恢弘' },
  'romantic': { name: '浪漫', category: '氛围', icon: '💕', description: '温馨/浪漫' }
};

// ============ BGM库 ============

const BGM_CATEGORIES = {
  'xianxia': { name: '仙侠', icon: '🗡️', description: '御剑飞行、修真世界' },
  'wuxia': { name: '武侠', icon: '🥋', description: '江湖恩怨、刀光剑影' },
  'battle': { name: '战斗', icon: '⚔️', description: '激烈战斗、紧张刺激' },
  'peaceful': { name: '宁静', icon: '🌲', description: '田园生活、平静祥和' },
  'sad': { name: '悲伤', icon: '💔', description: '生离死别、感人至深' },
  'romantic': { name: '浪漫', icon: '💕', description: '花前月下、情意绵绵' },
  'mysterious': { name: '神秘', icon: '🔮', description: '诡异氛围、未知危险' },
  'grand': { name: '宏大', icon: '🏰', description: '史诗战场、王者归来' },
  'forest': { name: '森林', icon: '🌲', description: '深山老林、鸟语花香' },
  'desert': { name: '沙漠', icon: '🏜️', description: '大漠孤烟、荒凉戈壁' },
  'ocean': { name: '海洋', icon: '🌊', description: '波涛汹涌、海浪拍岸' },
  'night': { name: '夜晚', icon: '🌙', description: '夜色宁静、星空灿烂' },
  'morning': { name: '清晨', icon: '🌅', description: '日出东方、万物苏醒' },
  'temple': { name: '寺庙', icon: '🏯', description: '钟声悠扬、禅意绵绵' },
  'palace': { name: '宫殿', icon: '🏰', description: '金碧辉煌、气势恢宏' }
};

// ============ 环境分析函数 ============

// 基于关键词的环境识别
function detectEnvironments(text) {
  const envKeywords = {
    'rain': ['雨', '下雨', '降雨', '雨水', '倾盆', '暴雨', '细雨', '蒙蒙细雨'],
    'thunder': ['雷', '打雷', '雷鸣', '闪电', '霹雳', '电闪雷鸣'],
    'wind': ['风', '刮风', '呼啸', '狂风', '微风', '大风', '风沙'],
    'water': ['水', '河流', '瀑布', '大海', '海洋', '浪', '涛声', '溪流'],
    'fire': ['火', '火焰', '燃烧', '火光', '篝火', '炉火'],
    'battle': ['战斗', '杀', '斩', '法宝', '灵力', '真气', '金丹', '元婴', '修炼', '斗法'],
    'horse': ['马', '骏马', '马蹄', '骑马', '奔腾'],
    'sword': ['剑', '剑鸣', '出鞘', '剑光', '剑气'],
    'magic': ['法术', '灵气', '光芒', '法诀', '咒语', '阵法'],
    'night': ['夜', '夜晚', '深夜', '月光', '星空', '漆黑'],
    'morning': ['晨', '清晨', '日出', '朝阳', '黎明', '曙光'],
    'forest': ['森林', '树林', '深山', '山谷', '丛林', '古木'],
    'temple': ['寺庙', '道观', '古刹', '钟声', '和尚', '道士'],
    'palace': ['宫殿', '大殿', '王府', '皇宫', '府邸']
  };

  const detected = [];
  const textLower = text.toLowerCase();

  for (const [env, keywords] of Object.entries(envKeywords)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        detected.push(env);
        break;
      }
    }
  }

  return [...new Set(detected)];
}

// 情感分析
function analyzeEmotions(text) {
  const emotionPatterns = {
    '愤怒': ['愤怒', '生气', '怒吼', '咆哮', '气愤', '暴怒', '杀意'],
    '悲伤': ['悲伤', '伤心', '流泪', '哭泣', '痛心', '哀伤', '凄凉'],
    '喜悦': ['开心', '高兴', '喜悦', '大笑', '欢笑', '兴奋'],
    '恐惧': ['害怕', '恐惧', '颤抖', '惊恐', '胆怯', '惊慌'],
    '惊讶': ['惊讶', '震惊', '意外', '吃惊', '错愕', '震撼'],
    '平静': ['平静', '冷静', '淡然', '从容', '安宁', '祥和'],
    '紧张': ['紧张', '危急', '紧急', '危险', '紧迫', '焦虑'],
    '温馨': ['温暖', '温馨', '幸福', '甜蜜', '和睦']
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

  return emotions.length > 0 ? [...new Set(emotions)] : ['平静'];
}

// 场景分类
function classifyScene(text) {
  const scenePatterns = {
    'xianxia': ['修仙', '修真', '灵气', '功法', '金丹', '元婴', '渡劫', '飞升', '灵根'],
    'wuxia': ['江湖', '武林', '门派', '掌门', '内力', '轻功', '招式', '比武'],
    'battle': ['战斗', '杀敌', '交锋', '对决', '激战', '冲锋'],
    'peaceful': ['宁静', '平静', '安居', '隐居', '田园', '生活'],
    'romantic': ['爱情', '心动', '相依', '陪伴', '表白', '思念'],
    'mysterious': ['神秘', '诡异', '奇怪', '未知', '危险', '神秘'],
    'grand': ['王者', '皇帝', '统一', '天下', '霸业', '辉煌']
  };

  for (const [scene, keywords] of Object.entries(scenePatterns)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return scene;
      }
    }
  }

  return 'peaceful';
}

// 角色识别
function detectRoles(script) {
  const lines = script.split('\n').filter(l => l.trim());
  const roles = new Set();
  
  const patterns = [
    /^【(.+?)】/,
    /^(.+?)[:：]/,
    /^(.+?)说/,
    /^(.+?)道/,
    /^(.+?)问/,
    /^(.+?)答/
  ];
  
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1].length < 10 && !['旁白', '系统', '提示'].includes(match[1].trim())) {
        roles.add(match[1].trim());
      }
    }
  }
  
  return Array.from(roles);
}

// 文本分段
function segmentScript(script) {
  const segments = [];
  const lines = script.split('\n').filter(l => l.trim());
  
  let currentRole = '旁白';
  let currentContent = [];
  
  for (const line of lines) {
    const roleMatch = line.match(/^(.+?)[:：]/);
    
    if (roleMatch) {
      if (currentContent.length > 0) {
        segments.push({
          role: currentRole,
          content: currentContent.join(' '),
          emotions: analyzeEmotions(currentContent.join(' ')),
          environments: detectEnvironments(currentContent.join(' '))
        });
      }
      
      currentRole = roleMatch[1].trim();
      currentContent = [line.replace(roleMatch[0], '').trim()];
    } else {
      currentContent.push(line.trim());
    }
  }
  
  if (currentContent.length > 0) {
    segments.push({
      role: currentRole,
      content: currentContent.join(' '),
      emotions: analyzeEmotions(currentContent.join(' ')),
      environments: detectEnvironments(currentContent.join(' '))
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
    name: "VoiceForge 小说配音工作流 v2.0",
    version: "2.0.0",
    newFeatures: [
      "环境音效识别",
      "BGM推荐",
      "场景分类"
    ]
  });
});

// 获取音效库
app.get('/api/sounds', (req, res) => {
  res.json({ sounds: SOUND_EFFECTS });
});

// 获取BGM分类
app.get('/api/bgm', (req, res) => {
  res.json({ bgm: BGM_CATEGORIES });
});

// 获取角色模板
app.get('/api/roles/templates', (req, res) => {
  res.json({ 
    templates: {
      protagonist: { name: '主角' },
      antagonist: { name: '反派' },
      elder: { name: '长辈' },
      lover: { name: '恋人' },
      friend: { name: '朋友' },
      mentor: { name: '师父' },
      narrator: { name: '旁白' }
    }
  });
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

// 增强版分析 - 包含环境音效和BGM
app.post('/api/novel/analyze', (req, res) => {
  const { content, mode = 'enhanced' } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: '请提供文本内容' });
  }

  // 基础分析
  const detectedRoles = detectRoles(content);
  const segments = segmentScript(content);
  const emotions = analyzeEmotions(content);
  const scene = classifyScene(content);
  
  // 环境音效分析 - 遍历所有段落
  const envCounts = {};
  for (const seg of segments) {
    for (const env of seg.environments || []) {
      envCounts[env] = (envCounts[env] || 0) + 1;
    }
  }
  
  // 情感分布
  const emotionCounts = {};
  for (const seg of segments) {
    for (const e of seg.emotions) {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    }
  }

  // 音效建议（基于环境出现频率）
  const topEnvs = Object.entries(envCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([env]) => ({
      id: env,
      ...SOUND_EFFECTS[env] || { name: env, icon: '🔊' }
    }));

  // BGM推荐（基于场景和情感）
  const recommendedBGM = [];
  
  // 场景BGM
  if (BGM_CATEGORIES[scene]) {
    recommendedBGM.push({ ...BGM_CATEGORIES[scene], reason: '匹配场景类型' });
  }
  
  // 情感BGM
  if (emotions.includes('悲伤')) {
    recommendedBGM.push({ ...BGM_CATEGORIES['sad'], reason: '匹配情感' });
  } else if (emotions.includes('紧张') || emotions.includes('战斗')) {
    recommendedBGM.push({ ...BGM_CATEGORIES['battle'], reason: '匹配情感' });
  } else if (emotions.includes('平静')) {
    recommendedBGM.push({ ...BGM_CATEGORIES['peaceful'], reason: '匹配情感' });
  }

  // 去重
  const seen = new Set();
  const uniqueBgm = recommendedBGM.filter(bgm => {
    if (seen.has(bgm.name)) return false;
    seen.add(bgm.name);
    return true;
  });

  res.json({
    // 基础信息
    roles: detectedRoles,
    rolesCount: detectedRoles.length,
    segmentsCount: segments.length,
    wordCount: content.length,
    
    // 场景与情感
    scene,
    sceneInfo: BGM_CATEGORIES[scene] || { name: scene, icon: '📝' },
    emotions,
    emotionCounts,
    
    // 环境音效
    environments: Object.keys(envCounts),
    envCounts,
    soundSuggestions: topEnvs,
    
    // BGM推荐
    bgmSuggestions: uniqueBgm.slice(0, 5),
    
    // 详细分段（示例）
    sampleSegments: segments.slice(0, 10).map(s => ({
      role: s.role,
      preview: s.content.substring(0, 50) + '...',
      emotions: s.emotions,
      environments: s.environments
    }))
  });
});

// 批量生成 (预留接口)
app.post('/api/novel/generate', (req, res) => {
  const { novelId, voiceMapping = {}, bgmEnabled = true, soundEnabled = true } = req.body;
  
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
    environments: seg.environments,
    voice: voiceMapping[seg.role] || 'male_xuhan',
    sound: seg.environments?.[0] ? SOUND_EFFECTS[seg.environments[0]] : null,
    status: 'pending'
  }));
  
  res.json({
    novelId,
    totalSegments: tasks.length,
    bgmEnabled,
    soundEnabled,
    tasks: tasks.slice(0, 10),
    message: `共${tasks.length}段，已创建生成任务${soundEnabled ? '（含音效）' : ''}${bgmEnabled ? '（含BGM）' : ''}`
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
  console.log(`VoiceForge 小说工作流 v2.0 running on http://0.0.0.0:${PORT}`);
  console.log(`音效库: ${Object.keys(SOUND_EFFECTS).length}个`);
  console.log(`BGM分类: ${Object.keys(BGM_CATEGORIES).length}类`);
});

export default app;