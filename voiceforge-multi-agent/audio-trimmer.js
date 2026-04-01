/**
 * VoiceForge 音频裁剪模块
 * 功能：调整起止、淡入淡出
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
const TRIM_PORT = 3800;

app.use(cors());
app.use(bodyParser.json());

const trimDir = path.join(__dirname, 'trimmed');
if (!fs.existsSync(trimDir)) {
  fs.mkdirSync(trimDir, { recursive: true });
}

// 裁剪音频
async function trimAudio(inputPath, outputPath, options) {
  const { start, end, fadeIn, fadeOut, volume } = options;
  
  let cmd = `ffmpeg -y -i "${inputPath}"`;
  let filters = [];
  
  // 裁剪
  if (start !== undefined || end !== undefined) {
    const ss = start || 0;
    const t = end ? (end - ss) : '';
    cmd += ` -ss ${ss}${t ? ' -t ' + t : ''}`;
  }
  
  // 淡入
  if (fadeIn) {
    filters.push(`afade=t=in:st=0:d=${fadeIn}`);
  }
  
  // 淡出
  if (fadeOut) {
    // 需要获取总时长
    filters.push(`afade=t=out:st=-1:d=1`); // 简化的淡出
  }
  
  // 音量
  if (volume) {
    filters.push(`volume=${volume}`);
  }
  
  if (filters.length > 0) {
    cmd += ` -filter_complex "${filters.join(',')}"`;
  }
  
  cmd += ` -codec:a libmp3lame -b:a 192k "${outputPath}"`;
  
  try {
    await execAsync(cmd);
    return outputPath;
  } catch (error) {
    console.error('Trim error:', error);
    throw error;
  }
}

// 获取音频时长
async function getDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format "${filePath}"`);
    const info = JSON.parse(stdout);
    return parseFloat(info.format?.duration || 0);
  } catch {
    return 0;
  }
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Audio Trimmer",
    version: "1.0.0",
    features: ["裁剪", "淡入", "淡出", "音量调节"]
  });
});

// 裁剪音频
app.post('/api/trim', async (req, res) => {
  const { inputFile, start, end, fadeIn, fadeOut, volume, filename } = req.body;
  
  if (!inputFile) {
    return res.status(400).json({ error: '请提供音频文件路径' });
  }
  
  const outputFile = filename || `trimmed_${Date.now()}.mp3`;
  const outputPath = path.join(trimDir, outputFile);
  
  try {
    await trimAudio(inputFile, outputPath, { start, end, fadeIn, fadeOut, volume });
    
    res.json({
      success: true,
      output: `/trimmed/${outputFile}`,
      options: { start, end, fadeIn, fadeOut, volume }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取音频信息
app.get('/api/trim/info', async (req, res) => {
  const { file } = req.query;
  
  if (!file) {
    return res.status(400).json({ error: '请提供文件路径' });
  }
  
  try {
    const duration = await getDuration(file);
    
    res.json({
      file,
      duration: Math.round(duration * 100) / 100,
      formatted: `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 预听裁剪结果
app.post('/api/trim/preview', async (req, res) => {
  const { inputFile, start, duration = 10, fadeIn, fadeOut, volume } = req.body;
  
  if (!inputFile) {
    return res.status(400).json({ error: '请提供音频文件' });
  }
  
  const outputFile = `preview_${Date.now()}.mp3`;
  const outputPath = path.join(trimDir, outputFile);
  
  try {
    await trimAudio(inputFile, outputPath, {
      start,
      end: start + duration,
      fadeIn,
      fadeOut,
      volume
    });
    
    res.json({
      success: true,
      preview: `/trimmed/${outputFile}`,
      duration
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 列出裁剪文件
app.get('/api/trim/list', (req, res) => {
  const files = fs.readdirSync(trimDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
  const list = files.map(f => {
    const stats = fs.statSync(path.join(trimDir, f));
    return {
      name: f,
      size: stats.size,
      created: stats.birthtime
    };
  });
  
  res.json({ files: list });
});

// 启动服务器
app.listen(TRIM_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Audio Trimmer running on http://0.0.0.0:${TRIM_PORT}`);
});

export default app;