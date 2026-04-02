/**
 * VoiceForge 小说配音工作流 API
 * 完整流程：导入小说 → AI分析 → 角色分配 → 场景识别 → 合成配音
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const OUTPUT_DIR = path.join(__dirname, 'outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/novels')),
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ 第一步：导入小说 ============
router.post('/api/novel/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, message: '请上传小说文件' });

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const chapters = splitIntoChapters(content);
    
    const project = {
      id: 'novel_' + Date.now(),
      name: req.file.originalname,
      content,
      chapters,
      createdAt: new Date().toISOString(),
      status: 'imported',
      characters: [],
      scenes: []
    };
    
    fs.writeFileSync(path.join(OUTPUT_DIR, project.id + '.json'), JSON.stringify(project, null, 2));
    
    res.json({
      success: true,
      data: {
        projectId: project.id,
        name: project.name,
        totalChars: content.length,
        chapterCount: chapters.length
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/api/novel/text', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) return res.json({ success: false, message: '请提供小说内容' });
    
    const chapters = splitIntoChapters(content);
    const project = {
      id: 'novel_' + Date.now(),
      name: title || '未命名小说',
      content,
      chapters,
      createdAt: new Date().toISOString(),
      status: 'imported',
      characters: [],
      scenes: []
    };
    
    fs.writeFileSync(path.join(OUTPUT_DIR, project.id + '.json'), JSON.stringify(project, null, 2));
    
    res.json({
      success: true,
      data: {
        projectId: project.id,
        name: project.name,
        totalChars: content.length,
        chapterCount: chapters.length
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============ 第二步：AI分析 ============
router.post('/api/novel/analyze', async (req, res) => {
  try {
    const { projectId } = req.body;
    const projectPath = path.join(OUTPUT_DIR, projectId + '.json');
    
    if (!fs.existsSync(projectPath)) {
      return res.json({ success: false, message: '项目不存在' });
    }
    
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
    
    // 分析角色
    const characters = analyzeCharacters(project.chapters);
    project.characters = characters;
    
    // 分析场景
    const scenes = analyzeScenes(project.chapters);
    project.scenes = scenes;
    
    project.status = 'analyzed';
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    
    res.json({
      success: true,
      data: {
        characters: characters.map(c => ({ name: c.name, description: c.description, gender: c.gender })),
        scenes: scenes.map(s => ({ chapter: s.chapter, type: s.type, description: s.description }))
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============ 第三步：角色配音分配 ============
router.post('/api/novel/assign-voice', async (req, res) => {
  try {
    const { projectId, assignments } = req.body;
    const projectPath = path.join(OUTPUT_DIR, projectId + '.json');
    
    if (!fs.existsSync(projectPath)) {
      return res.json({ success: false, message: '项目不存在' });
    }
    
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
    
    for (const [charName, voiceId] of Object.entries(assignments || {})) {
      const char = project.characters.find(c => c.name === charName);
      if (char) char.voiceId = voiceId;
    }
    
    project.status = 'voice_assigned';
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    
    res.json({ success: true, message: '配音分配完成' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ============ 第四步：生成配音 ============
router.post('/api/novel/generate', async (req, res) => {
  try {
    const { projectId } = req.body;
    const projectPath = path.join(OUTPUT_DIR, projectId + '.json');
    
    if (!fs.existsSync(projectPath)) {
      return res.json({ success: false, message: '项目不存在' });
    }
    
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
    
    // 自动分配默认声音
    const voices = ['male_1', 'female_1', 'narrator'];
    project.characters.forEach((c, i) => {
      if (!c.voiceId) c.voiceId = voices[i % voices.length];
    });
    
    const results = [];
    for (const chapter of project.chapters) {
      const segments = generateChapterAudio(chapter, project.characters);
      
      // 为每个片段调用TTS生成音频
      for (const seg of segments) {
        try {
          const ttsRes = await fetch('http://localhost:3200/api/tts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              text: seg.text.substring(0, 200),  // 限制长度
              voice: seg.voiceId || 'male_xuhan'
            })
          });
          const ttsData = await ttsRes.json();
          if (ttsData.audioUrl) {
            seg.audioUrl = ttsData.audioUrl;
          } else if (ttsData.file) {
            seg.audioFile = ttsData.file;
          } else if (ttsData.error) {
            // TTS失败时使用浏览器TTS标记
            seg.needsBrowserTTS = true;
            seg.textForBrowser = seg.text.substring(0, 200);
            seg.error = ttsData.error;
          }
        } catch (e) {
          seg.error = e.message;
        }
      }
      
      results.push({ chapter: chapter.title, segments });
    }
    
    project.status = 'generated';
    project.audioFiles = results;
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2));
    
    res.json({
      success: true,
      data: {
        totalChapters: results.length,
        totalSegments: results.reduce((sum, r) => sum + r.segments.length, 0),
        outputDir: OUTPUT_DIR
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 获取预置声音
router.get('/api/novel/voices', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'male_1', name: '青年男声', gender: 'male' },
      { id: 'male_2', name: '成熟男声', gender: 'male' },
      { id: 'female_1', name: '少女声', gender: 'female' },
      { id: 'female_2', name: '成熟女声', gender: 'female' },
      { id: 'narrator', name: '旁白', gender: 'male' }
    ]
  });
});

// 获取项目
router.get('/api/novel/:projectId', async (req, res) => {
  const projectPath = path.join(OUTPUT_DIR, req.params.projectId + '.json');
  if (!fs.existsSync(projectPath)) {
    return res.json({ success: false, message: '项目不存在' });
  }
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
  res.json({ success: true, data: project });
});

router.get('/api/novels', async (req, res) => {
  if (!fs.existsSync(OUTPUT_DIR)) return res.json({ success: true, data: [] });
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  const projects = files.map(f => {
    const p = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8'));
    return { id: p.id, name: p.name, status: p.status, chapters: p.chapters?.length || 0 };
  });
  res.json({ success: true, data: projects });
});

// ============ 辅助函数 ============

function splitIntoChapters(content) {
  const chapters = [];
  const chapterPatterns = [
    /第([一二三四五六七八九十百千\d]+)章[：:\s]*(.*?)(?=第[一二三四五六七八九十百千\d]+章|$)/g,
    /Chapter\s*(\d+)[：:\s]*(.*?)(?=Chapter\s*\d+|$)/gi
  ];
  
  let matched = false;
  for (const pattern of chapterPatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      matches.forEach((m, i) => {
        chapters.push({ index: i + 1, title: m[2]?.trim() || `第${m[1]}章`, content: m[0] });
      });
      matched = true;
      break;
    }
  }
  
  if (!matched || chapters.length === 0) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chunkSize = 2;
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      chapters.push({
        index: Math.floor(i / chunkSize) + 1,
        title: `第${Math.floor(i / chunkSize) + 1}节`,
        content: paragraphs.slice(i, i + chunkSize).join('\n\n')
      });
    }
  }
  
  return chapters;
}

// LLM角色识别函数
async function extractCharactersWithLLM(text) {
  try {
    // 使用本地API进行分析
    const response = await fetch('http://localhost:3000/api/novel/extract-characters', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text: text.substring(0, 5000)})  // 限制长度
    });
    const data = await response.json();
    return data.characters || [];
  } catch (e) {
    console.log('LLM提取失败，回退到正则:', e.message);
    return null;
  }
}

// 改进的角色识别函数
function analyzeCharacters(chapters) {
  const fullText = chapters.map(c => c.content).join('\n');
  const speakers = new Set();
  
  // 方法1：简单匹配 xxx道：xxx说：
  const pattern = /([\u4e00-\u9fa5]{2,4})(道|说|曰|云)(：|:)/g;
  // 更全面的非人名过滤列表
  const notNames = ['出轨', '离婚', '结婚', '工作', '单位', '省委', '选调', '四级', '高材', '同志', '先生', '女士', 
    '太好笑了', '我不需要', '重回过去', '传闻仙门', '天下间有', '太好笑了', '这样', '那样', '什么', '怎么',
    '现在', '今天', '昨天', '这里', '那里', '这个', '那个', '如果', '因为', '所以', '但是', '然后', '于是',
    '听说', '据说', '原来', '其实', '不过', '然而', '只是', '就是', '或者', '而且', '虽然', '即使'];
  let match;
// 模式：」xxx道（书名号后的人名）
  const pattern1a = /」([\u4e00-\u9fa5]{2,4})(道|说|问|答)/g;
  // 模式：xxx道：「xxx」（人名在引号前）
  const pattern2b = /([\u4e00-\u9fa5]{2,3})(?:道|说|问|答)\s*[「『]/g;
  // 模式：找段落开头连续出现的2-3个字人名
  const pattern3 = /^([\u4e00-\u9fa5]{2,3})(?:在|于|被|将|把|对|向|说|道|问|答)/gm;
  // 处理新模式
    while ((match = pattern1a.exec(fullText)) !== null) {
      const name = match[1];
      if (name.length >= 2 && name.length <= 3 && !notNames.includes(name)) {
        speakers.add(name);
      }
    }
    // 处理pattern2
    while ((match = pattern2b.exec(fullText)) !== null) {
      const name = match[1];
      if (name.length >= 2 && name.length <= 3 && !notNames.includes(name)) {
        speakers.add(name);
      }
    }
    // 处理pattern3 - 从段落开头提取
    const lines = fullText.split(/[。！？\n]/);
    for (const line of lines) {
      const lineMatch = line.match(/^([\u4e00-\u9fa5]{2,3})(?:在|于|被|将|把|对|向|说|道|问|答)/);
      if (lineMatch && !notNames.includes(lineMatch[1])) {
        speakers.add(lineMatch[1]);
      }
    }
    
    while ((match = pattern.exec(fullText)) !== null) {
    const name = match[1];
    // 过滤掉以说/道/云/曰结尾的名字
    // 去掉以说/道/云/曰等结尾的名字的最后一个字符
    let cleanName = name;
    if (name.endsWith('说') || name.endsWith('道') || name.endsWith('云') || name.endsWith('曰')) {
      cleanName = name.slice(0, -1);
    }
    // 再次检查并过滤
    if (cleanName.length >= 2 && !cleanName.endsWith('笑') && !cleanName.endsWith('喊')) {
      speakers.add(cleanName);
    }
  }
  
  // 方法2：匹配 xxx 说道（中间有空格）
  const pattern2c = /([\u4e00-\u9fa5]{2,4})\s+(道|说|曰|云)(：|:|）)/g;
  while ((match = pattern2b.exec(fullText)) !== null) {
    const name = match[1];
    // 去掉以说/道/云/曰等结尾的名字的最后一个字符
    let cleanName = name;
    if (name.endsWith('说') || name.endsWith('道') || name.endsWith('云') || name.endsWith('曰')) {
      cleanName = name.slice(0, -1);
    }
    // 再次检查并过滤
    if (cleanName.length >= 2 && !cleanName.endsWith('笑') && !cleanName.endsWith('喊')) {
      speakers.add(cleanName);
    }
  }
  
  // 方法3：支持"xxx同志"格式
  const titlePattern = /([\u4e00-\u9fa5]{2,4})(?:同志|先生|女士)/g;
  while ((match = titlePattern.exec(fullText)) !== null) {
    speakers.add(match[1]);
  }
  
  // 方法4：从引号中提取说话人 - "xxx，跟..."
  const quotePattern = /"([\u4e00-\u9fa5]{2,4})，/g;
  while ((match = quotePattern.exec(fullText)) !== null) {
    speakers.add(match[1]);
  }
  
  // 方法5：识别"xxx道："后面的直接引用的说话人
  const quoteSpeakerPattern = /[“”"]([一-龥]{2,4})(?:同志|先生|女士|老婆|老公)?[，,]?/g;
  while ((match = quoteSpeakerPattern.exec(fullText)) !== null) {
    if (match[1].length >= 2) {
      speakers.add(match[1]);
    }
  }

// 6. "xxx站在..."描述性句子中的主角
const p6 = /([\u4e00-\u9fa5]{2,4})站在/g;
while ((match = p6.exec(fullText)) !== null) { speakers.add(match[1]); }

// 7. "xxx心中..."心理描写
const p7 = /([\u4e00-\u9fa5]{2,4})心中/g;
while ((match = p7.exec(fullText)) !== null) { speakers.add(match[1]); }

// 8. "xxx浑身..."身体描述
const p8 = /([\u4e00-\u9fa5]{2,4})浑身/g;
while ((match = p8.exec(fullText)) !== null) { speakers.add(match[1]); }

// 9. 从"妻子/老婆"推断角色
if (fullText.includes("妻子背着") || fullText.includes("老婆")) speakers.add("妻子");
  // Remove duplicates and short/invalid names
  // First get unique names
  let uniqueNames = [...new Set(speakers)].filter(n => {
    if (n.length < 2 || n.length > 4) return false;
    if (n.includes('说') || n.includes('道') || n.includes('云') || n.includes('曰')) return false;
    const notNames = ['出轨', '离婚', '结婚', '工作', '单位', '省委', '选调', '四级', '高材', '同志', '先生', '女士'];
    if (notNames.some(w => n.includes(w))) return false;
    return true;
  });
  
  // Remove names that are substrings of other names (keep longer valid names)
  uniqueNames = uniqueNames.filter(n1 => !uniqueNames.some(n2 => n2 !== n1 && n2.includes(n1)));
  return uniqueNames = uniqueNames.slice(0, 10).map(name => ({
    name,
    description: '从小说对话中识别的角色',
    gender: 'unknown',
    voiceId: null
  }));
}

function analyzeScenes(chapters) {
  const scenes = [];
  const sceneKeywords = {
    '室内': ['屋', '房', '室', '内', '厅', '堂', '殿', '楼'],
    '室外': ['山', '水', '林', '河', '湖', '海', '城', '街', '道', '野外'],
    '战斗': ['杀', '打', '斗', '战', '砍', '劈', '法宝', '灵气', '金丹', '元婴'],
    '对话': ['道', '说', '问', '答', '曰', '云', '笑道', '问道'],
    '心理': ['想', '心', '思', '念', '忆', '梦', '心中', '暗道']
  };
  
  for (const chapter of chapters) {
    const content = chapter.content;
    let maxScore = 0;
    let sceneType = '叙事';
    
    for (const [type, keywords] of Object.entries(sceneKeywords)) {
      const score = keywords.filter(k => content.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        sceneType = type;
      }
    }
    
    scenes.push({
      chapter: chapter.index,
      type: sceneType,
      description: `${chapter.title} - ${sceneType}场景`
    });
  }
  
  return scenes;
}

function generateChapterAudio(chapter, characters) {
  const segments = [];
  const paragraphs = chapter.content.split(/\n\n+/).filter(p => p.trim());
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.length < 10) continue;
    
    let speaker = '旁白';
    let dialogue = para;
    
    const speakMatch = para.match(/([\u4e00-\u9fa5]{2,4})(?:道|说|曰|云)(：|:)["'](.+?)["']/);
    if (speakMatch) {
      speaker = speakMatch[1];
      dialogue = speakMatch[2];
    }
    
    const char = characters.find(c => c.name === speaker);
    let voiceId = 'narrator';
    if (char && char.voiceId) voiceId = char.voiceId;
    else if (characters.length > 0 && i < characters.length) voiceId = characters[i % characters.length].voiceId || 'narrator';
    
    segments.push({
      index: i + 1,
      speaker,
      text: dialogue.substring(0, 200),
      voiceId,
      audioUrl: null
    });
  }
  
  return segments;
}


// ============ LLM角色提取 ============
router.post('/api/novel/extract-characters', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.json({ success: false, message: '请提供文本' });
    
    // 提取前5000字符进行分析
    const analysisText = text.substring(0, 5000);
    
    // 构建提示词
    const prompt = `请从以下小说片段中提取所有角色名称，只返回角色列表，用逗号分隔。

文本：${analysisText}

角色列表（只返回名字，用中文逗号分隔）：`;
    
    // 这里可以使用任意LLM API，为了简单先用本地处理
    // 实际项目中应该调用 OpenAI/MiniMax 等API
    const fullText = analysisText;
    const speakers = new Set();
    
    // 模式1: xxx道/说
    const p1 = /([一-龥]{2,4})(?:道|说|曰|云)(：|:|，)/g;
    let m;
    while ((m = p1.exec(fullText)) !== null) {
      if (m[1].length >= 2) speakers.add(m[1]);
    }
    
    // 模式2: 「xxx」或"xxx"
    const p2 = /[「""'']([一-龥]{2,4})[，,，、]/g;
    while ((m = p2.exec(fullText)) !== null) {
      if (m[1].length >= 2) speakers.add(m[1]);
    }
    
    // 模式3: 陆少蘅道
    const p3 = /([一-龥]{2,4})(?:问道|回道|答道|喊到|笑道)/g;
    while ((m = p3.exec(fullText)) !== null) {
      if (m[1].length >= 2) speakers.add(m[1]);
    }
    
    // 模式4: 直接出现在引号后的名字
    const p4 = /[「""'']([一-龥]{2,4})在/g;
    while ((m = p4.exec(fullText)) !== null) {
      if (m[1].length >= 2) speakers.add(m[1]);
    }
    
    // 模式5: 「xxx」书名号格式 - 捕获引号中的角色
    const p5 = /「([^」]{2,10}?)」/g;
    while ((m = p5.exec(fullText)) !== null) {
      const inner = m[1];
      // 检查是否像对话（以问号、感叹号结尾，或是短句）
      if (inner.length <= 15 && (inner.includes('？') || inner.includes('？') || inner.includes('!') || inner.includes('！'))) {
        // 这可能是角色说的话，但需要上下文确定说话人
      }
    }
    
    // 模式6: 陆少蘅道/陆少蘅问 - 直接名字+动词
    const p6 = /([一-龥]{2,4})(?:道|说|问|答|喊|笑|怒|哭|叹|喝)(：|:|，|。)/g;
    while ((m = p6.exec(fullText)) !== null) {
      if (m[1].length >= 2 && !['但是','于是','然后','如果','因为','所以'].includes(m[1])) {
        speakers.add(m[1]);
      }
    }
    
    // 模式7: 提取段落开头连续出现的人名（可能是主角）
    const lines = fullText.split(/[。！？\n]/);
    for (const line of lines.slice(0, 20)) {
      const firstNameMatch = line.match(/^([一-龥]{2,3})(?:在|于|被|将|把|对|向)/);
      if (firstNameMatch) {
        speakers.add(firstNameMatch[1]);
      }
    }
    
    // 过滤并返回
    const filtered = [...speakers].filter(n => 
      n.length >= 2 && n.length <= 4 &&
      !['笑道','说道','问道','答道','又说','继续','告诉','告诉','告诉'].includes(n)
    );
    
    res.json({ success: true, characters: filtered });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
// ============ 导出完整音频 ============
router.get('/api/novel/export/:projectId', async (req, res) => {
  try {
    const projectPath = path.join(OUTPUT_DIR, req.params.projectId + '.json');
    if (!fs.existsSync(projectPath)) {
      return res.json({ success: false, message: '项目不存在' });
    }
    
    const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
    
    if (!project.audioFiles) {
      return res.json({ success: false, message: '请先生成配音' });
    }
    
    // 收集所有音频文件
    const audioFiles = [];
    for (const chapter of project.audioFiles) {
      for (const seg of chapter.segments) {
        if (seg.audioUrl || seg.audioFile || seg.needsBrowserTTS) {
          audioFiles.push({
            chapter: chapter.chapter,
            speaker: seg.speaker,
            voiceId: seg.voiceId,
            text: seg.text.substring(0, 50),
            audioUrl: seg.audioUrl,
            audioFile: seg.audioFile,
            needsBrowserTTS: seg.needsBrowserTTS || false,
            textForBrowser: seg.textForBrowser || seg.text.substring(0, 200)
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        projectId: project.id,
        projectName: project.name,
        totalSegments: audioFiles.length,
        audioFiles
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
