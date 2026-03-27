const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 加载环境变量
require('dotenv').config();

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 音色数据存储文件
const voicesFile = path.join(__dirname, 'voices.json');

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