/**
 * VoiceForge 音频混音模块
 * 功能：语音+BGM+音效混合输出
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const app = express();
const MIX_PORT = 3400;

app.use(cors());
app.use(bodyParser.json());

// 混音目录
const mixDir = path.join(__dirname, 'mix');
const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');

[mixDir, inputDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// BGM素材库（预设）
const BGM_LIBRARY = [
  { id: 'bgm_peaceful', name: '宁静', file: null, description: '平静祥和', category: 'ambient' },
  { id: 'bgm_battle', name: '战斗', file: null, description: '激烈战斗', category: 'action' },
  { id: 'bgm_sad', name: '悲伤', file: null, description: '感人至深', category: 'emotion' },
  { id: 'bgm_mysterious', name: '神秘', file: null, description: '诡异氛围', category: 'atmosphere' },
  { id: 'bgm_grand', name: '宏大', file: null, description: '史诗战场', category: 'epic' },
  { id: 'bgm_romantic', name: '浪漫', file: null, description: '花前月下', category: 'emotion' },
  { id: 'bgm_forest', name: '森林', file: null, description: '深山老林', category: 'ambient' },
  { id: 'bgm_night', name: '夜晚', file: null, description: '夜色宁静', category: 'ambient' },
  { id: 'bgm_temple', name: '寺庙', file: null, description: '钟声悠扬', category: 'ambient' },
  { id: 'bgm_xianxia', name: '仙侠', file: null, description: '御剑飞行', category: 'xianxia' }
];

// 音效库
const SFX_LIBRARY = {
  rain: { name: '雨声', description: '小雨/大雨' },
  thunder: { name: '雷声', description: '雷鸣电闪' },
  wind: { name: '风声', description: '微风/狂风' },
  water: { name: '水声', description: '流水/海浪' },
  battle: { name: '战斗', description: '刀剑/法术' },
  horse: { name: '马蹄', description: '马蹄声' },
  footstep: { name: '脚步', description: '走路声' },
  door: { name: '开门', description: '开关门' },
  sword: { name: '剑鸣', description: '剑出鞘' },
  fire: { name: '火声', description: '柴火/燃烧' },
  crowd: { name: '人群', description: '喧哗/议论' }
};

// 使用ffmpeg混合音频
async function mixAudio(tracks, outputPath) {
  // tracks: [{file, volume, startTime, fadeIn, fadeOut}]
  
  // 如果只有一个轨道，直接复制
  if (tracks.length === 1) {
    fs.copyFileSync(tracks[0].file, outputPath);
    return outputPath;
  }
  
  // 构建ffmpeg filter complex
  let inputs = '';
  let filterParts = [];
  let mixInputs = '';
  
  // 准备每个输入
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const inputFile = track.file.replace(/'/g, "'\\''"); // 转义单引号
    
    // 添加输入
    inputs += `-i '${inputFile}' `;
    
    // 音量调整和淡入淡出
    let filters = `volume=${track.volume || 1}`;
    
    if (track.fadeIn) {
      filters += `,afade=t=in:st=0:d=${track.fadeIn}`;
    }
    if (track.fadeOut) {
      // 需要获取音频时长
      filters += `,afade=t=out:st=-${track.fadeOut}:d=${track.fadeOut}`;
    }
    
    filterParts.push(`[${i}:a]${filters}[a${i}]`);
    mixInputs += `[a${i}]`;
  }
  
  // 混合所有轨道
  filterParts.push(`${mixInputs}amix=inputs=${tracks.length}:duration=longest[aout]`);
  
  const filterComplex = filterParts.join(';');
  const cmd = `ffmpeg -y ${inputs}-filter_complex "${filterComplex}" -map "[aout]" -codec:a libmp3lame -b:a 192k "${outputPath}"`;
  
  try {
    await execAsync(cmd);
    return outputPath;
  } catch (error) {
    console.error('Mix error:', error);
    throw error;
  }
}

// 简单的音频混合（不改变时长）
async function simpleMix(voicePath, bgmPath, sfxPath, outputPath, voiceVol = 1.0, bgmVol = 0.3) {
  let cmd;
  
  if (sfxPath) {
    // 三层混合：语音 + BGM + 音效
    // 简化：只混合语音和BGM（音效需要更复杂处理）
    cmd = `ffmpeg -y -i '${voicePath}' -i '${bgmPath}' -filter_complex "[0:a]volume=${voiceVol}[voice];[1:a]volume=${bgmVol}[bgm];[voice][bgm]amix=inputs=2:duration=longest[aout]" -map "[aout]" -codec:a libmp3lame -b:a 192k "${outputPath}"`;
  } else if (bgmPath) {
    // 两层混合：语音 + BGM
    cmd = `ffmpeg -y -i '${voicePath}' -i '${bgmPath}' -filter_complex "[0:a]volume=${voiceVol}[voice];[1:a]volume=${bgmVol}[bgm];[voice][bgm]amix=inputs=2:duration=longest[aout]" -map "[aout]" -codec:a libmp3lame -b:a 192k "${outputPath}"`;
  } else {
    // 只复制语音
    cmd = `ffmpeg -y -i '${voicePath}' -codec:a libmp3lame -b:a 192k "${outputPath}"`;
  }
  
  try {
    await execAsync(cmd);
    return outputPath;
  } catch (error) {
    console.error('Mix error:', error);
    throw error;
  }
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Audio Mixer",
    version: "1.0.0",
    features: ["音频混合", "音量调节", "淡入淡出", "BGM叠加"]
  });
});

// 获取BGM库
app.get('/api/bgm', (req, res) => {
  res.json({ bgm: BGM_LIBRARY });
});

// 获取音效库
app.get('/api/sfx', (req, res) => {
  res.json({ sfx: SFX_LIBRARY });
});

// 简单混音接口
app.post('/api/mix', async (req, res) => {
  const { voiceFile, bgmFile, sfxFile, voiceVolume = 1.0, bgmVolume = 0.3, outputName } = req.body;
  
  if (!voiceFile) {
    return res.status(400).json({ error: '请提供语音文件路径' });
  }
  
  const outputFile = outputName || `mix_${Date.now()}.mp3`;
  const outputPath = path.join(outputDir, outputFile);
  
  try {
    // 处理文件路径
    const voicePath = voiceFile.startsWith('/') ? voiceFile : path.join(inputDir, voiceFile);
    const bgmPath = bgmFile ? (bgmFile.startsWith('/') ? bgmFile : path.join(inputDir, bgmFile)) : null;
    
    await simpleMix(voicePath, bgmPath, sfxFile, outputPath, voiceVolume, bgmVolume);
    
    res.json({
      success: true,
      output: `/mix/${outputFile}`,
      outputPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 高级混音接口（支持多轨道）
app.post('/api/mix/advanced', async (req, res) => {
  const { tracks, outputName } = req.body;
  
  if (!tracks || tracks.length === 0) {
    return res.status(400).json({ error: '请提供混音轨道' });
  }
  
  const outputFile = outputName || `mix_${Date.now()}.mp3`;
  const outputPath = path.join(outputDir, outputFile);
  
  try {
    const validTracks = tracks.map(t => ({
      ...t,
      file: t.file.startsWith('/') ? t.file : path.join(inputDir, t.file)
    }));
    
    await mixAudio(validTracks, outputPath);
    
    res.json({
      success: true,
      output: `/mix/${outputFile}`,
      tracks: tracks.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取音频信息
app.get('/api/audio/info', async (req, res) => {
  const { file } = req.query;
  
  if (!file) {
    return res.status(400).json({ error: '请提供文件路径' });
  }
  
  const filePath = file.startsWith('/') ? file : path.join(inputDir, file);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    const info = JSON.parse(stdout);
    
    const audioStream = info.streams?.find(s => s.codec_type === 'audio');
    
    res.json({
      file,
      duration: info.format?.duration,
      format: info.format?.format_name,
      codec: audioStream?.codec_name,
      sampleRate: audioStream?.sample_rate,
      channels: audioStream?.channels,
      bitrate: info.format?.bit_rate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 上传文件到input目录
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, inputDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }
  
  res.json({
    success: true,
    file: `/input/${req.file.filename}`,
    filename: req.file.filename
  });
});

// 获取output目录文件
app.get('/api/outputs', (req, res) => {
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
  const outputs = files.map(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    return {
      name: f,
      size: stats.size,
      created: stats.birthtime
    };
  });
  res.json({ files: outputs });
});

// 启动服务器
app.listen(MIX_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Audio Mixer running on http://0.0.0.0:${MIX_PORT}`);
  console.log(`BGM库: ${BGM_LIBRARY.length}个`);
  console.log(`音效库: ${Object.keys(SFX_LIBRARY).length}个`);
});

export default app;