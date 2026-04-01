/**
 * VoiceForge 字幕导出模块
 * 功能：生成SRT/VTT字幕
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
const SUBTITLE_PORT = 3700;

app.use(cors());
app.use(bodyParser.json());

const outputDir = path.join(__dirname, 'subtitles');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 时间格式转换（秒 → SRT格式）
function secondsToSRTTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// 时间格式转换（秒 → VTT格式）
function secondsToVTTTime(seconds) {
  return secondsToSRTTime(seconds).replace(',', '.');
}

// 生成SRT字幕
function generateSRT(segments) {
  let srt = '';
  
  segments.forEach((seg, i) => {
    const start = seg.startTime || 0;
    const end = seg.endTime || (start + (seg.duration || 3));
    
    srt += `${i + 1}\n`;
    srt += `${secondsToSRTTime(start)} --> ${secondsToSRTTime(end)}\n`;
    srt += `${seg.text}\n\n`;
  });
  
  return srt;
}

// 生成VTT字幕
function generateVTT(segments) {
  let vtt = 'WEBVTT\n\n';
  
  segments.forEach((seg, i) => {
    const start = seg.startTime || 0;
    const end = seg.endTime || (start + (seg.duration || 3));
    
    vtt += `${i + 1}\n`;
    vtt += `${secondsToVTTTime(start)} --> ${secondsToVTTTime(end)}\n`;
    vtt += `${seg.text}\n\n`;
  });
  
  return vtt;
}

// 生成LRC歌词格式
function generateLRC(segments) {
  let lrc = '';
  
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  segments.forEach(seg => {
    const start = seg.startTime || 0;
    const mins = Math.floor(start / 60);
    const secs = Math.floor(start % 60);
    const ms = Math.floor((start % 1) * 100);
    
    const timeTag = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]`;
    lrc += `${timeTag}${seg.text}\n`;
  });
  
  return lrc;
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Subtitle Exporter",
    version: "1.0.0",
    formats: ["srt", "vtt", "lrc"]
  });
});

// 导出字幕
app.post('/api/subtitle/export', (req, res) => {
  const { segments, format = 'srt', filename } = req.body;
  
  if (!segments || segments.length === 0) {
    return res.status(400).json({ error: '请提供字幕段落' });
  }
  
  let content;
  let contentType;
  
  switch (format.toLowerCase()) {
    case 'srt':
      content = generateSRT(segments);
      contentType = 'srt';
      break;
    case 'vtt':
      content = generateVTT(segments);
      contentType = 'vtt';
      break;
    case 'lrc':
      content = generateLRC(segments);
      contentType = 'lrc';
      break;
    default:
      return res.status(400).json({ error: '不支持的格式' });
  }
  
  const outputFile = filename || `subtitle_${Date.now()}.${contentType}`;
  const outputPath = path.join(outputDir, outputFile);
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  res.json({
    success: true,
    file: `/subtitles/${outputFile}`,
    format: contentType,
    segments: segments.length
  });
});

// 获取字幕文件
app.get('/api/subtitle/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  res.download(filePath);
});

// 列出字幕文件
app.get('/api/subtitle/list', (req, res) => {
  const files = fs.readdirSync(outputDir).filter(f => 
    f.endsWith('.srt') || f.endsWith('.vtt') || f.endsWith('.lrc')
  );
  
  const list = files.map(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    return {
      name: f,
      size: stats.size,
      created: stats.birthtime
    };
  });
  
  res.json({ files: list });
});

// 删除字幕文件
app.delete('/api/subtitle/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  fs.unlinkSync(filePath);
  
  res.json({ success: true });
});

// 启动服务器
app.listen(SUBTITLE_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Subtitle Exporter running on http://0.0.0.0:${SUBTITLE_PORT}`);
});

export default app;