const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const novelWorkflow = require('./novel-workflow.js');

// 加载环境变量
require('dotenv').config();

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json({limit: "10mb"}));
app.use(novelWorkflow);
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 音色数据存储文件
const voicesFile = path.join(__dirname, 'voices.json');
const rolesFile = path.join(__dirname, 'roles.json');
const projectsFile = path.join(__dirname, 'projects.json');

// 初始化音色存储文件
if (!fs.existsSync(voicesFile)) {
  fs.writeFileSync(voicesFile, JSON.stringify([]));
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'voice-' + uniqueSuffix + ext);
  }
});

// 文件过滤和大小限制
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/x-wav', 'audio/wave'];
  const allowedExtensions = ['.wav', '.mp3'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式，请上传 WAV 或 MP3 格式'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// ============ API路由 ============

// API路由：上传参考音频（F001功能）
app.post('/api/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的音频文件' });
    }

    // 返回上传结果
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '上传失败：' + error.message });
  }
});

// API路由：音色克隆（F002功能）
app.post('/api/clone-voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传参考音频文件' });
    }

    const { name, description } = req.body;
    const audioPath = req.file.path;

    // 模拟音色克隆（MVP阶段）
    // 实际API调用将在后续阶段实现
    const mockVoiceId = 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 模拟克隆延迟（模拟API调用时间）
    await new Promise(resolve => setTimeout(resolve, 500));

    // 创建音色记录
    const voiceRecord = {
      id: mockVoiceId,
      name: name || '克隆音色 ' + new Date().toLocaleString('zh-CN'),
      description: description || '',
      audioFile: req.file.filename,
      audioPath: audioPath,
      createdAt: new Date().toISOString(),
      isCloned: true
    };

    // 保存到存储文件
    const voices = JSON.parse(fs.readFileSync(voicesFile, 'utf-8'));
    voices.push(voiceRecord);
    fs.writeFileSync(voicesFile, JSON.stringify(voices, null, 2));

    res.json({
      success: true,
      message: '音色克隆成功',
      data: {
        voice_id: mockVoiceId,
        name: voiceRecord.name,
        description: voiceRecord.description,
        createdAt: voiceRecord.createdAt
      }
    });
  } catch (error) {
    console.error('音色克隆失败:', error);
    res.status(500).json({ success: false, message: '音色克隆失败：' + error.message });
  }
});

// API路由：获取音色列表（F002功能）
app.get('/api/voices', (req, res) => {
  try {
    const voices = JSON.parse(fs.readFileSync(voicesFile, 'utf-8'));
    res.json({
      success: true,
      data: voices
    });
  } catch (error) {
    console.error('获取音色列表失败:', error);
    res.status(500).json({ success: false, message: '获取音色列表失败：' + error.message });
  }
});

// API路由：删除音色（F002功能）
app.delete('/api/voices/:voice_id', (req, res) => {
  try {
    const voiceId = req.params.voice_id;
    const voices = JSON.parse(fs.readFileSync(voicesFile, 'utf-8'));

    const voiceIndex = voices.findIndex(v => v.id === voiceId);
    if (voiceIndex === -1) {
      return res.status(404).json({ success: false, message: '音色不存在' });
    }

    const voice = voices[voiceIndex];

    // 如果有音频文件，删除它
    if (voice.audioPath && fs.existsSync(voice.audioPath)) {
      fs.unlinkSync(voice.audioPath);
    }

    // 从列表中移除
    voices.splice(voiceIndex, 1);
    fs.writeFileSync(voicesFile, JSON.stringify(voices, null, 2));

    res.json({
      success: true,
      message: '音色删除成功'
    });
  } catch (error) {
    console.error('删除音色失败:', error);
    res.status(500).json({ success: false, message: '删除音色失败：' + error.message });
  }
});

// 获取上传的文件列表
app.get('/api/uploads', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: '读取文件列表失败' });
    }

    const fileInfos = files.map(file => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      return {
        filename: file,
        size: stats.size,
        path: `/uploads/${file}`,
        created: stats.birthtime
      };
    });

    res.json({ success: true, data: fileInfos });
  });
});

// 删除上传的文件
app.delete('/api/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: '文件删除成功' });
  } else {
    res.status(404).json({ success: false, message: '文件不存在' });
  }
});

// API路由：文本转语音（F004功能）& 语音参数调整（F005功能）
app.post('/api/synthesize', async (req, res) => {
  try {
    const { text, voice_id, speed, pitch, stability } = req.body;
    
    // F005: 记录语音参数到日志
    console.log('========== F005 语音参数 ==========');
    console.log('语速 (speed):', speed !== undefined ? speed : '1.0 (默认)');
    console.log('音调 (pitch):', pitch !== undefined ? pitch : '0.0 (默认)');
    console.log('稳定性 (stability):', stability !== undefined ? stability : '0.5 (默认)');
    console.log('====================================');
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: '请输入要转换的文本' });
    }
    
    if (!voice_id) {
      return res.status(400).json({ success: false, message: '请选择音色' });
    }
    
    // 获取音色信息
    const voices = JSON.parse(fs.readFileSync(voicesFile, 'utf-8'));
    const selectedVoice = voices.find(v => v.id === voice_id);
    
    if (!selectedVoice) {
      return res.status(404).json({ success: false, message: '音色不存在' });
    }
    
    // MVP阶段：生成模拟音频数据（模拟base64音频）
    // 实际ElevenLabs API调用将在后续阶段实现
    
    // 模拟处理延迟（根据文本长度，模拟处理时间）
    const textLength = text.length;
    const processingTime = Math.min(Math.max(textLength * 10, 500), 5000); // 100字约1秒，最多5秒
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // 生成模拟的音频数据（一个简短的白噪声模拟）
    // 实际应返回真实的音频base64或URL
    const mockAudioBase64 = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    
    res.json({
      success: true,
      message: '语音合成成功',
      data: {
        audio: mockAudioBase64,
        text: text,
        voice_id: voice_id,
        voice_name: selectedVoice.name,
        duration: Math.ceil(textLength / 3), // 估算时长（秒）
        char_count: textLength,
        // F005: 返回当前使用的参数
        params: {
          speed: speed !== undefined ? speed : 1.0,
          pitch: pitch !== undefined ? pitch : 0.0,
          stability: stability !== undefined ? stability : 0.5
        }
      }
    });
    
  } catch (error) {
    console.error('语音合成失败:', error);
    res.status(500).json({ success: false, message: '语音合成失败：' + error.message });
  }
});

// API路由：情感识别（F006功能）
app.post('/api/analyze-emotion', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: '请输入要分析的文本' });
    }

    // 使用 MiniMax API 进行情感分析
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
    
    if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
      // 如果没有配置API，返回模拟数据
      const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'calm'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      return res.json({
        success: true,
        data: {
          emotion: randomEmotion,
          confidence: 0.85,
          emotions: [
            { emotion: randomEmotion, confidence: 0.85 },
            { emotion: 'calm', confidence: 0.15 }
          ]
        }
      });
    }

    // 调用 MiniMax API
    const response = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${MINIMAX_GROUP_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个情感分析专家。请分析给定文本的情感，只返回JSON格式的结果，不要其他内容。'
          },
          {
            role: 'user',
            content: `分析以下文本的情感（只返回JSON）：\n\n"${text}"`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    // 解析API返回的情感
    let emotionResult = {
      emotion: 'calm',
      confidence: 0.9,
      emotions: [
        { emotion: 'calm', confidence: 0.9 }
      ]
    };

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      try {
        // 尝试解析JSON响应
        const parsed = JSON.parse(content);
        if (parsed.emotion) {
          emotionResult = {
            emotion: parsed.emotion,
            confidence: parsed.confidence || 0.9,
            emotions: parsed.all_emotions || [{ emotion: parsed.emotion, confidence: parsed.confidence || 0.9 }]
          };
        }
      } catch (e) {
        // 尝试从文本中提取情感关键词
        const emotionMap = {
          '喜': 'happy', '开心': 'happy', '高兴': 'happy', '快乐': 'happy', '愉快': 'happy',
          '怒': 'angry', '生气': 'angry', '愤怒': 'angry', '气愤': 'angry',
          '哀': 'sad', '悲伤': 'sad', '难过': 'sad', '伤心': 'sad', '痛苦': 'sad',
          '惊': 'surprise', '惊讶': 'surprise', '意外': 'surprise', '震惊': 'surprise',
          '惧': 'fear', '恐惧': 'fear', '害怕': 'fear', '担心': 'fear', '害怕': 'fear',
          '平静': 'calm', '冷静': 'calm', '安宁': 'calm', '平和': 'calm'
        };
        
        for (const [keyword, emotion] of Object.entries(emotionMap)) {
          if (content.includes(keyword)) {
            emotionResult = {
              emotion: emotion,
              confidence: 0.85,
              emotions: [{ emotion: emotion, confidence: 0.85 }]
            };
            break;
          }
        }
      }
    }

    res.json({ success: true, data: emotionResult });
  } catch (error) {
    console.error('情感分析失败:', error);
    res.status(500).json({ success: false, message: '情感分析失败：' + error.message });
  }
});


// API路由：情感标注（F007功能）- 分段情感分析
app.post('/api/analyze-emotion-segments', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: '请输入要分析的文本' });
    }

    // 将文本按句子分割
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [text];
    
    // 对每个句子进行情感分析
    const segments = await Promise.all(sentences.map(async (sentence) => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return null;
      
      // 简单的关键词匹配情感识别
      const emotionResult = analyzeEmotionSimple(trimmedSentence);
      
      return {
        text: trimmedSentence,
        emotion: emotionResult.emotion,
        confidence: emotionResult.confidence
      };
    }));
    
    // 过滤空段落
    const validSegments = segments.filter(s => s !== null);
    
    res.json({
      success: true,
      data: {
        segments: validSegments,
        totalSegments: validSegments.length
      }
    });
  } catch (error) {
    console.error('情感标注失败:', error);
    res.status(500).json({ success: false, message: '情感标注失败：' + error.message });
  }
});

// 简单的情感分析函数（关键词匹配）
function analyzeEmotionSimple(text) {
  const emotionKeywords = {
    happy: ['开心', '高兴', '快乐', '愉快', '喜悦', '喜', '好', '棒', '赞', '太好了', '喜欢', '爱', '幸福', '欢乐'],
    sad: ['悲伤', '难过', '伤心', '痛苦', '哀', '哭', '泪', '伤心', '绝望', '沮丧', '失望', '无奈'],
    angry: ['生气', '愤怒', '气愤', '怒', '恼火', '讨厌', '恨', '可恶', '过分', '岂有此理'],
    fear: ['害怕', '恐惧', '担心', '惧', '可怕', '恐怖', '惊慌', '慌张', '紧张', '发抖'],
    surprise: ['惊讶', '意外', '震惊', '吃惊', '惊', '没想到', '居然', '竟然', '居然', '突然'],
    calm: ['平静', '冷静', '安宁', '平和', '平静', '舒缓', '放松', '安静', '祥和']
  };
  
  let scores = {};
  let totalMatches = 0;
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    scores[emotion] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[emotion]++;
        totalMatches++;
      }
    }
  }
  
  // 找出最高分的情感
  let maxEmotion = 'calm';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }
  
  // 计算置信度
  const confidence = totalMatches > 0 
    ? Math.min(0.5 + (maxScore / totalMatches) * 0.5, 0.95) 
    : 0.6;
  
  return {
    emotion: maxEmotion,
    confidence: confidence
  };
}


// ============ F008 角色管理 API ============
// 获取角色列表
app.get('/api/roles', (req, res) => {
  try {
    const roles = JSON.parse(fs.readFileSync(rolesFile || path.join(__dirname, 'roles.json'), 'utf-8'));
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json({ success: false, message: '获取角色列表失败' });
  }
});

// 创建角色
app.post('/api/roles', (req, res) => {
  try {
    const { name, voice_id, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '请输入角色名称' });
    }
    
    if (!voice_id) {
      return res.status(400).json({ success: false, message: '请选择音色' });
    }
    
    // 获取音色信息
    const voices = JSON.parse(fs.readFileSync(voicesFile, 'utf-8'));
    const selectedVoice = voices.find(v => v.id === voice_id);
    
    if (!selectedVoice) {
      return res.status(404).json({ success: false, message: '音色不存在' });
    }
    
    const roleId = 'role_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const newRole = {
      id: roleId,
      name: name.trim(),
      voice_id: voice_id,
      voice_name: selectedVoice.name,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    const roles = JSON.parse(fs.readFileSync(rolesFile || path.join(__dirname, 'roles.json'), 'utf-8'));
    roles.push(newRole);
    fs.writeFileSync(rolesFile || path.join(__dirname, 'roles.json'), JSON.stringify(roles, null, 2));
    
    res.json({ success: true, message: '角色创建成功', data: newRole });
  } catch (error) {
    console.error('创建角色失败:', error);
    res.status(500).json({ success: false, message: '创建角色失败：' + error.message });
  }
});

// 更新角色
app.put('/api/roles/:role_id', (req, res) => {
  try {
    const roleId = req.params.role_id;
    const { name, voice_id, description } = req.body;
    
    const roles = JSON.parse(fs.readFileSync(rolesFile || path.join(__dirname, 'roles.json'), 'utf-8'));
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.status(404).json({ success: false, message: '角色不存在' });
    }
    
    // 如果更换音色，验证新音色存在
    if (voice_id && voice_id !== roles[roleIndex].voice_id) {
      const voices = JSON.parse(fs.readFileSync(voicesFile, 'utf-8'));
      const selectedVoice = voices.find(v => v.id === voice_id);
      if (!selectedVoice) {
        return res.status(404).json({ success: false, message: '音色不存在' });
      }
      roles[roleIndex].voice_id = voice_id;
      roles[roleIndex].voice_name = selectedVoice.name;
    }
    
    if (name) roles[roleIndex].name = name.trim();
    if (description !== undefined) roles[roleIndex].description = description;
    roles[roleIndex].updatedAt = new Date().toISOString();
    
    fs.writeFileSync(rolesFile || path.join(__dirname, 'roles.json'), JSON.stringify(roles, null, 2));
    
    res.json({ success: true, message: '角色更新成功', data: roles[roleIndex] });
  } catch (error) {
    console.error('更新角色失败:', error);
    res.status(500).json({ success: false, message: '更新角色失败：' + error.message });
  }
});

// 删除角色
app.delete('/api/roles/:role_id', (req, res) => {
  try {
    const roleId = req.params.role_id;
    const roles = JSON.parse(fs.readFileSync(rolesFile || path.join(__dirname, 'roles.json'), 'utf-8'));
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      return res.status(404).json({ success: false, message: '角色不存在' });
    }
    
    roles.splice(roleIndex, 1);
    fs.writeFileSync(rolesFile || path.join(__dirname, 'roles.json'), JSON.stringify(roles, null, 2));
    
    res.json({ success: true, message: '角色删除成功' });
  } catch (error) {
    console.error('删除角色失败:', error);
    res.status(500).json({ success: false, message: '删除角色失败：' + error.message });
  }
});


// API路由：角色分配（F009功能）- 根据情感推荐角色
app.post('/api/recommend-roles', async (req, res) => {
  try {
    const { text, exclude_role_ids } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: '请输入要分析的文本' });
    }
    
    // 分析整体情感
    const emotionResult = analyzeEmotionSimple(text);
    const primaryEmotion = emotionResult.emotion;
    
    // 情感到角色类型的映射
    const emotionToType = {
      'happy': ['主角', '正面', '青年', '男性'],
      'sad': ['配角', '深沉', '中年'],
      'angry': ['反派', '强势', '男性'],
      'fear': ['配角', '紧张', '青年'],
      'surprise': ['主角', '活泼', '青年'],
      'calm': ['旁白', '温和', '女性']
    };
    
    const preferredTypes = emotionToType[primaryEmotion] || ['主角'];
    
    // 获取所有角色
    const roles = JSON.parse(fs.readFileSync(rolesFile, 'utf-8'));
    
    // 过滤要排除的角色
    let availableRoles = roles;
    if (exclude_role_ids && exclude_role_ids.length > 0) {
      availableRoles = roles.filter(r => !exclude_role_ids.includes(r.id));
    }
    
    // 简单评分：匹配关键词的角色得分更高
    const scoredRoles = availableRoles.map(role => {
      let score = 50; // 基础分
      const roleInfo = (role.name + ' ' + (role.description || '')).toLowerCase();
      
      for (const keyword of preferredTypes) {
        if (roleInfo.includes(keyword.toLowerCase())) {
          score += 20;
        }
      }
      
      return { ...role, score };
    });
    
    // 按得分排序，取前3个
    scoredRoles.sort((a, b) => b.score - a.score);
    const recommendations = scoredRoles.slice(0, 3).map(r => ({
      role_id: r.id,
      role_name: r.name,
      voice_name: r.voice_name,
      score: r.score,
      reason: getRecommendReason(primaryEmotion, r)
    }));
    
    res.json({
      success: true,
      data: {
        emotion: primaryEmotion,
        confidence: emotionResult.confidence,
        recommendations: recommendations
      }
    });
  } catch (error) {
    console.error('角色推荐失败:', error);
    res.status(500).json({ success: false, message: '角色推荐失败：' + error.message });
  }
});

function getRecommendReason(emotion, role) {
  const reasons = {
    'happy': '适合欢快、积极的场景',
    'sad': '适合深沉、悲伤的情感表达',
    'angry': '适合表达愤怒、强势的情绪',
    'fear': '适合紧张、恐惧的氛围',
    'surprise': '适合意外、惊讶的情节',
    'calm': '适合平静、叙述性的内容'
  };
  return reasons[emotion] || '通用角色';
}


// ============ F010 项目管理 API ============
// 获取项目列表（F011 支持搜索和排序）
app.get('/api/projects', (req, res) => {
  try {
    const { search, sort, order } = req.query;
    let projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    
    // F011: 名称搜索
    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }
    
    // F011: 排序（按创建时间）
    const sortBy = sort || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    projects.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder * a.name.localeCompare(b.name);
      }
      return sortOrder * (new Date(a[sortBy]) - new Date(b[sortBy]));
    });
    
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
});

// 创建项目
app.post('/api/projects', (req, res) => {
  try {
    const { name, script, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '请输入项目名称' });
    }
    
    const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const newProject = {
      id: projectId,
      name: name.trim(),
      script: script || '',
      description: description || '',
      roles: [],
      bgm: null,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    projects.push(newProject);
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
    
    res.json({ success: true, message: '项目创建成功', data: newProject });
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ success: false, message: '创建项目失败：' + error.message });
  }
});

// 获取项目详情
app.get('/api/projects/:project_id', (req, res) => {
  try {
    const projectId = req.params.project_id;
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    res.status(500).json({ success: false, message: '获取项目详情失败' });
  }
});

// 更新项目
app.put('/api/projects/:project_id', (req, res) => {
  try {
    const projectId = req.params.project_id;
    const { name, script, description, roles, bgm, status } = req.body;
    
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    if (name) projects[projectIndex].name = name.trim();
    if (script !== undefined) projects[projectIndex].script = script;
    if (description !== undefined) projects[projectIndex].description = description;
    if (roles !== undefined) projects[projectIndex].roles = roles;
    if (bgm !== undefined) projects[projectIndex].bgm = bgm;
    if (status) projects[projectIndex].status = status;
    projects[projectIndex].updatedAt = new Date().toISOString();
    
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
    
    res.json({ success: true, message: '项目更新成功', data: projects[projectIndex] });
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ success: false, message: '更新项目失败：' + error.message });
  }
});

// 删除项目
app.delete('/api/projects/:project_id', (req, res) => {
  try {
    const projectId = req.params.project_id;
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    projects.splice(projectIndex, 1);
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
    
    res.json({ success: true, message: '项目删除成功' });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ success: false, message: '删除项目失败' });
  }
});


// API路由：场景分类（F013功能）
app.post('/api/classify-scene', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: '请输入要分析的文本' });
    }
    
    // 场景关键词匹配
    const sceneKeywords = {
      '战斗': ['战斗', '打架', '杀', '攻击', '敌人', '妖兽', '法宝', '灵气', '修炼', '突破', '危机', '逃跑', '追杀'],
      '温馨': ['温暖', '幸福', '甜蜜', '温馨', '在一起', '陪伴', '家人', '朋友', '相聚', '欢笑', '开心'],
      '悬疑': ['神秘', '奇怪', '可疑', '阴谋', '秘密', '隐藏', '真相', '调查', '疑惑', '不安', '紧张'],
      '浪漫': ['爱', '喜欢', '心动', '浪漫', '拥抱', '亲吻', '表白', '深情', '温柔', '甜蜜'],
      '悲伤': ['悲伤', '伤心', '痛苦', '离别', '失去', '死亡', '哭泣', '眼泪', '绝望', '无奈']
    };
    
    // 统计各场景关键词出现次数
    let scores = {};
    for (const [scene, keywords] of Object.entries(sceneKeywords)) {
      scores[scene] = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          scores[scene]++;
        }
      }
    }
    
    // 找出最高分的场景
    let maxScene = '温馨';
    let maxScore = 0;
    for (const [scene, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxScene = scene;
      }
    }
    
    const confidence = maxScore > 0 ? Math.min(0.5 + maxScore * 0.15, 0.95) : 0.5;
    
    res.json({
      success: true,
      data: {
        scene: maxScene,
        confidence: confidence,
        allScenes: Object.entries(scores).map(([s, c]) => ({ scene: s, count: c })).sort((a,b) => b.count - a.count)
      }
    });
  } catch (error) {
    console.error('场景分类失败:', error);
    res.status(500).json({ success: false, message: '场景分类失败：' + error.message });
  }
});


// API路由：BGM推荐（F014功能）
app.post('/api/recommend-bgm', (req, res) => {
  try {
    const { scene } = req.body;
    
    if (!scene) {
      return res.status(400).json({ success: false, message: '请指定场景类型' });
    }
    
    // 场景到BGM风格的映射
    const sceneToBgm = {
      '战斗': [
        { name: '战斗BGM1', style: '激烈', duration: '3:30', mood: '紧张刺激' },
        { name: '战斗BGM2', style: '热血', duration: '4:00', mood: '激情澎湃' },
        { name: '战斗BGM3', style: '史诗', duration: '5:00', mood: '宏大战斗' }
      ],
      '温馨': [
        { name: '温馨BGM1', style: '舒缓', duration: '3:00', mood: '温暖舒适' },
        { name: '温馨BGM2', style: '轻快', duration: '2:30', mood: '阳光愉快' },
        { name: '温馨BGM3', style: '平静', duration: '4:00', mood: '宁静祥和' }
      ],
      '悬疑': [
        { name: '悬疑BGM1', style: '紧张', duration: '3:30', mood: '神秘诡异' },
        { name: '悬疑BGM2', style: '低沉', duration: '4:00', mood: '压抑不安' },
        { name: '悬疑BGM3', style: '电子', duration: '3:00', mood: '科技感' }
      ],
      '浪漫': [
        { name: '浪漫BGM1', style: '抒情', duration: '3:30', mood: '甜蜜温柔' },
        { name: '浪漫BGM2', style: '钢琴', duration: '4:00', mood: '唯美浪漫' },
        { name: '浪漫BGM3', style: '弦乐', duration: '4:30', mood: '深情款款' }
      ],
      '悲伤': [
        { name: '悲伤BGM1', style: '抒情', duration: '3:30', mood: '凄美动人' },
        { name: '悲伤BGM2', style: '钢琴', duration: '4:00', mood: '悲伤舒缓' },
        { name: '悲伤BGM3', style: '弦乐', duration: '5:00', mood: '深情哀婉' }
      ]
    };
    
    const bgmList = sceneToBgm[scene] || sceneToBgm['温馨'];
    
    res.json({
      success: true,
      data: {
        scene: scene,
        bgmList: bgmList.map((bgm, i) => ({
          id: `bgm_${scene}_${i+1}`,
          ...bgm
        }))
      }
    });
  } catch (error) {
    console.error('BGM推荐失败:', error);
    res.status(500).json({ success: false, message: 'BGM推荐失败：' + error.message });
  }
});


// API路由：音效添加（F015功能）
app.post('/api/sound-effects', (req, res) => {
  try {
    const { project_id, effects } = req.body;
    
    // 预设音效库
    const soundEffectLibrary = {
      '脚步声': ['轻步', '重步', '跑步', '奔跑'],
      '自然声': ['雨声', '风声', '雷声', '鸟鸣', '流水'],
      '战斗': ['刀剑', '撞击', '爆炸', '喝斥'],
      '室内': ['敲门', '开关门', '家具', '茶具'],
      '交通': ['马车', '轿子', '飞行']
    };
    
    // 如果只请求音效库
    if (!effects) {
      return res.json({ success: true, data: soundEffectLibrary });
    }
    
    // 添加音效到项目
    if (project_id) {
      const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
      const project = projects.find(p => p.id === project_id);
      if (project) {
        project.effects = project.effects || [];
        project.effects.push(...effects);
        project.updatedAt = new Date().toISOString();
        fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
      }
    }
    
    res.json({ success: true, message: '音效添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// F016 音频导出 API
app.post('/api/export-audio', (req, res) => {
  try {
    const { project_id, format, include_bgm, include_effects } = req.body;
    
    if (!project_id) {
      return res.status(400).json({ success: false, message: '请指定项目' });
    }
    
    // 读取项目
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    const project = projects.find(p => p.id === project_id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    // 模拟导出（实际需要调用音频合成服务）
    const exportData = {
      project_id: project.id,
      project_name: project.name,
      format: format || 'mp3',
      include_bgm: include_bgm !== false,
      include_effects: include_effects !== false,
      export_at: new Date().toISOString(),
      // 模拟下载链接
      download_url: '/exports/' + project.id + '_' + Date.now() + '.' + (format || 'mp3')
    };
    
    res.json({ success: true, message: '导出准备完成', data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

// F020 API配置
app.get('/api/settings', (req, res) => {
  try {
    const settings = {
      minimax_api_key: process.env.MINIMAX_API_KEY ? '****' + process.env.MINIMAX_API_KEY.slice(-4) : null,
      minimax_group_id: process.env.MINIMAX_GROUP_ID ? '****' + process.env.MINIMAX_GROUP_ID.slice(-4) : null,
      elevenlabs_api_key: process.env.ELEVENLABS_API_KEY ? '已设置' : null,
      default_speed: 1.0,
      default_pitch: 0.0,
      default_stability: 0.5
    };
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { minimax_api_key, minimax_group_id, elevenlabs_api_key, default_speed, default_pitch, default_stability } = req.body;
    
    // 更新环境变量（仅当前进程生效）
    if (minimax_api_key) process.env.MINIMAX_API_KEY = minimax_api_key;
    if (minimax_group_id) process.env.MINIMAX_GROUP_ID = minimax_group_id;
    if (elevenlabs_api_key) process.env.ELEVENLABS_API_KEY = elevenlabs_api_key;
    
    res.json({ success: true, message: '设置已保存（仅当前进程有效）' });
  } catch (error) {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// F021 默认参数设置（与F020合并）

// F022 数据备份
app.get('/api/backup', (req, res) => {
  try {
    const backup = {
      voices: JSON.parse(fs.readFileSync(voicesFile, 'utf-8')),
      roles: JSON.parse(fs.readFileSync(rolesFile, 'utf-8')),
      projects: JSON.parse(fs.readFileSync(projectsFile, 'utf-8')),
      backup_at: new Date().toISOString()
    };
    res.json({ success: true, data: backup });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// F024 预设音色
app.get('/api/preset-voices', (req, res) => {
  try {
    const presets = [
      { id: 'preset_male_1', name: '成熟男声', gender: 'male', age: 'adult', description: '沉稳有力的成年男性声音' },
      { id: 'preset_male_2', name: '青年男声', gender: 'male', age: 'young', description: '清亮的年轻男性声音' },
      { id: 'preset_female_1', name: '成熟女声', gender: 'female', age: 'adult', description: '温柔的女性声音' },
      { id: 'preset_female_2', name: '少女声', gender: 'female', age: 'young', description: '活泼的女性声音' },
      { id: 'preset_child', name: '儿童声', gender: 'child', age: 'child', description: '可爱的儿童声音' },
      { id: 'preset_elder', name: '老人声', gender: 'male', age: 'elder', description: '沧桑的老人声音' }
    ];
    res.json({ success: true, data: presets });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ============ LLM 配置 API ============
const llmConfigFile = path.join(__dirname, 'config', 'llm.json');

// 读取LLM配置
function getLLMConfig() {
  if (!fs.existsSync(llmConfigFile)) {
    const defaultConfig = {
      textLLM: { provider: 'minimax', base_url: 'https://api.minimax.chat/v1', api_key: '', model: { id: 'abab6.5s-chat', name: 'MiniMax 文本模型' }, group_id: '' },
      voiceLLM: { provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api_key: '', model: { id: 'meta/llama-3.1-70b-instruct', name: 'NVIDIA 语音模型' } },
      customLLMs: []
    };
    fs.mkdirSync(path.dirname(llmConfigFile), { recursive: true });
    fs.writeFileSync(llmConfigFile, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(llmConfigFile, 'utf-8'));
}

// 获取LLM配置
app.get('/api/llm-config', (req, res) => {
  try {
    const config = getLLMConfig();
    // 隐藏API Key
    const safeConfig = JSON.parse(JSON.stringify(config));
    if (safeConfig.textLLM.api_key) safeConfig.textLLM.api_key = '****' + safeConfig.textLLM.api_key.slice(-4);
    if (safeConfig.voiceLLM.api_key) safeConfig.voiceLLM.api_key = '****' + safeConfig.voiceLLM.api_key.slice(-4);
    safeConfig.customLLMs = safeConfig.customLLMs.map(llm => ({
      ...llm, api_key: llm.api_key ? '****' + llm.api_key.slice(-4) : ''
    }));
    res.json({ success: true, data: safeConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 保存LLM配置
app.post('/api/llm-config', (req, res) => {
  try {
    const { textLLM, voiceLLM, customLLMs } = req.body;
    const config = getLLMConfig();
    if (textLLM) config.textLLM = textLLM;
    if (voiceLLM) config.voiceLLM = voiceLLM;
    if (customLLMs) config.customLLMs = customLLMs;
    fs.writeFileSync(llmConfigFile, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'LLM配置已保存' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 测试LLM连接
app.post('/api/test-llm', async (req, res) => {
  try {
    const { provider, base_url, api_key, model, group_id } = req.body;
    if (!api_key) {
      return res.json({ success: false, message: '请提供API Key' });
    }
    // 构建测试请求
    let testUrl, testBody, headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api_key}` };
    if (provider === 'minimax') {
      testUrl = `${base_url}/text/chatcompletion_v2?GroupId=${group_id}`;
      testBody = { model: model.id, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 };
    } else {
      // OpenAI兼容API
      testUrl = `${base_url}/chat/completions`;
      testBody = { model: model.id, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 };
    }
    const response = await fetch(testUrl, { method: 'POST', headers, body: JSON.stringify(testBody) });
    const data = await response.json();
    if (response.ok && !data.error) {
      res.json({ success: true, message: `连接成功！模型: ${model.name || model.id}` });
    } else {
      res.json({ success: false, message: data.error?.message || '连接失败' });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 获取当前使用的LLM（文本或语音）
app.get('/api/llm/:type', (req, res) => {
  try {
    const { type } = req.params; // 'text' or 'voice'
    const config = getLLMConfig();
    const llm = type === 'voice' ? config.voiceLLM : config.textLLM;
    res.json({ success: true, data: llm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件大小超过50MB限制' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`VoiceForge AI 服务已启动: http://localhost:${PORT}`);
  console.log(`上传目录: ${uploadsDir}`);
});