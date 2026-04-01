/**
 * VoiceForge 视频对轨模块
 * 功能：音频匹配视频时间轴
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
const VIDEO_PORT = 3900;

app.use(cors());
app.use(bodyParser.json());

const videoDir = path.join(__dirname, 'video-output');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// 合成视频和音频
async function muxVideo(videoPath, audioPath, outputPath, offset = 0) {
  let cmd;
  
  if (offset !== 0) {
    // 音频偏移
    cmd = `ffmpeg -y -i "${videoPath}" -itsoffset ${offset} -i "${audioPath}" -c:v copy -c:a aac -strict experimental "${outputPath}"`;
  } else {
    cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -strict experimental "${outputPath}"`;
  }
  
  try {
    await execAsync(cmd);
    return outputPath;
  } catch (error) {
    throw error;
  }
}

// 获取视频信息
async function getVideoInfo(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    const info = JSON.parse(stdout);
    
    const videoStream = info.streams?.find(s => s.codec_type === 'video');
    const audioStream = info.streams?.find(s => s.codec_type === 'audio');
    
    return {
      duration: parseFloat(info.format?.duration || 0),
      videoCodec: videoStream?.codec_name,
      audioCodec: audioStream?.codec_name,
      width: videoStream?.width,
      height: videoStream?.height,
      fps: eval(videoStream?.r_frame_rate || '0')
    };
  } catch {
    return null;
  }
}

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge Video Sync",
    version: "1.0.0",
    features: ["视频合成", "音画同步", "偏移调整"]
  });
});

// 获取视频信息
app.get('/api/video/info', async (req, res) => {
  const { file } = req.query;
  
  if (!file) {
    return res.status(400).json({ error: '请提供视频文件路径' });
  }
  
  const info = await getVideoInfo(file);
  
  if (!info) {
    return res.status(404).json({ error: '无法读取视频信息' });
  }
  
  res.json(info);
});

// 合成视频和音频
app.post('/api/video/mux', async (req, res) => {
  const { videoFile, audioFile, offset = 0, filename } = req.body;
  
  if (!videoFile || !audioFile) {
    return res.status(400).json({ error: '请提供视频和音频文件' });
  }
  
  const outputFile = filename || `video_${Date.now()}.mp4`;
  const outputPath = path.join(videoDir, outputFile);
  
  try {
    await muxVideo(videoFile, audioFile, outputPath, offset);
    
    res.json({
      success: true,
      output: `/video-output/${outputFile}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 音频替换视频
app.post('/api/video/replace-audio', async (req, res) => {
  const { videoFile, newAudioFile, filename } = req.body;
  
  if (!videoFile || !newAudioFile) {
    return res.status(400).json({ error: '请提供视频和新音频文件' });
  }
  
  const outputFile = filename || `replaced_${Date.now()}.mp4`;
  const outputPath = path.join(videoDir, outputFile);
  
  const cmd = `ffmpeg -y -i "${videoFile}" -i "${newAudioFile}" -c:v copy -c:a aac -strict experimental -map 0:v:0 -map 1:a:0 "${outputPath}"`;
  
  try {
    await execAsync(cmd);
    
    res.json({
      success: true,
      output: `/video-output/${outputFile}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 列出输出文件
app.get('/api/video/list', (req, res) => {
  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
  const list = files.map(f => {
    const stats = fs.statSync(path.join(videoDir, f));
    return {
      name: f,
      size: stats.size,
      created: stats.birthtime
    };
  });
  
  res.json({ files: list });
});

// 启动服务器
app.listen(VIDEO_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge Video Sync running on http://0.0.0.0:${VIDEO_PORT}`);
});

export default app;