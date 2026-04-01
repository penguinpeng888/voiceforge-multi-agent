/**
 * VoiceForge TTS增强模块
 * 方向B：TTS后端增强
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
const TTS_PORT = 3200;

app.use(cors());
app.use(bodyParser.json());

// ============ 预设音色库 ============

const PRESET_VOICES = {
  // 男声
  'male_baijing': {
    name: '白衣卿相',
    description: '温润公子音',
    style: '温柔、优雅',
    params: { speed: 1.0, pitch: 0, vol: 1.0 }
  },
  'male_xuhan': {
    name: '徐寒',
    description: '冷峻剑客音',
    style: '冷酷、果断',
    params: { speed: 1.1, pitch: -1, vol: 1.0 }
  },
  'male_cangyao': {
    name: '苍遥',
    description: '豪放侠客音',
    style: '豪爽、气场',
    params: { speed: 0.95, pitch: 1, vol: 1.1 }
  },
  'male_shanyin': {
    name: '山隐',
    description: '沉稳老者音',
    style: '沧桑、睿智',
    params: { speed: 0.9, pitch: -2, vol: 0.95 }
  },
  'male_xuanqing': {
    name: '玄青',
    description: '清冷仙长音',
    style: '淡漠、超然',
    params: { speed: 1.0, pitch: -1, vol: 0.9 }
  },
  
  // 女声
  'female_biyun': {
    name: '碧云',
    description: '灵动少女音',
    style: '活泼甜美',
    params: { speed: 1.1, pitch: 2, vol: 1.0 }
  },
  'female_xueman': {
    name: '雪曼',
    description: '冰山美人音',
    style: '冷艳、高贵',
    params: { speed: 1.0, pitch: 1, vol: 0.95 }
  },
  'female_changming': {
    name: '长鸣',
    description: '温柔邻家音',
    style: '亲切、柔和',
    params: { speed: 1.0, pitch: 1, vol: 1.0 }
  },
  'female_guiyuan': {
    name: '归原',
    description: '沧桑女子音',
    style: '悲伤、成熟',
    params: { speed: 0.95, pitch: 0, vol: 0.9 }
  },
  'female_xiannv': {
    name: '仙女',
    description: '空灵仙音',
    style: '飘渺、梦幻',
    params: { speed: 0.9, pitch: 3, vol: 0.85 }
  },
  
  // 特殊
  'elder_man': {
    name: '老者',
    description: '老年男声',
    style: '沧桑、虚弱',
    params: { speed: 0.85, pitch: -3, vol: 0.9 }
  },
  'child_girl': {
    name: '女童',
    description: '小女孩',
    style: '稚嫩、可爱',
    params: { speed: 1.2, pitch: 4, vol: 1.0 }
  },
  'child_boy': {
    name: '男童',
    description: '小男孩',
    style: '活泼、俏皮',
    params: { speed: 1.15, pitch: 3, vol: 1.0 }
  },
  'demon_lord': {
    name: '魔主',
    description: '低沉威严',
    style: '霸道、邪魅',
    params: { speed: 0.85, pitch: -4, vol: 1.2 }
  },
  'god_voice': {
    name: '天神',
    description: '神圣空灵',
    style: '庄严、慈悲',
    params: { speed: 0.9, pitch: 0, vol: 1.0 }
  }
};

// ============ MiniMax TTS ============

const MINIMAX_CONFIG = {
  apiKey: process.env.MINIMAX_API_KEY || '',
  groupId: process.env.MINIMAX_GROUP_ID || ''
};

async function callMiniMaxTTS(text, voiceId, options = {}) {
  if (!MINIMAX_CONFIG.apiKey || !MINIMAX_CONFIG.groupId) {
    return { error: 'MiniMax API未配置' };
  }

  const url = `https://api.minimax.chat/v1/t2a_v2?GroupId=${MINIMAX_CONFIG.groupId}`;
  
  const body = {
    text,
    model: 'speech-01-turbo',
    voice_setting: {
      voice_id: voiceId,
      speed: options.speed || 1.0,
      vol: options.vol || 1.0,
      pitch: options.pitch || 0,
      bitrate: 128000,
      sample_rate: 32000,
      format: 'mp3'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if (data.base_resp?.status_code === 0) {
    return {
      success: true,
      audio: data.data?.audio,
      format: 'mp3'
    };
  }
  
  return { error: data.base_resp?.status_msg || 'TTS调用失败' };
}

// ============ 音频处理 ============

// 音频后处理选项
const AUDIO_EFFECTS = {
  'normal': { reverb: 0, echo: 0, fade_in: 0, fade_out: 0 },
  'cave': { reverb: 0.5, echo: 0.3, fade_in: 0, fade_out: 0 },
  'hall': { reverb: 0.7, echo: 0.1, fade_in: 0, fade_out: 0 },
  'soft': { reverb: 0.2, echo: 0, fade_in: 0.5, fade_out: 0.5 },
  'cinematic': { reverb: 0.6, echo: 0.2, fade_in: 1, fade_out: 1 }
};

// ============ API Routes ============

app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge TTS Enhancement",
    version: "1.0.0",
    presets: Object.keys(PRESET_VOICES).length,
    effects: Object.keys(AUDIO_EFFECTS)
  });
});

// 预设音色的示例文本
const VOICE_SAMPLES = {
  'male_baijing': '各位听众朋友们，大家好，欢迎收听今天的节目。',
  'male_xuhan': '既然你已经决定了，那我便不再多说，好自为之。',
  'male_cangyao': '哈哈哈痛快！今日能与各位英雄豪杰一决高下，实乃人生一大快事！',
  'male_shanyin': '孩子，你要记住，做人要有担当，不可投机取巧。',
  'male_xuanqing': '大道五十，天衍四十九，缺一不可。',
  'female_biyun': '哎呀，你就别取笑人家了羞死人了',
  'female_xueman': '哼既然你这么说，那便按你说的去做吧。',
  'female_changming': '你先别急，慢慢说到底发生什么事了？',
  'female_guiyuan': '都过去了还有什么好说的呢？',
  'female_xiannv': '凡人终究是凡人又岂能明白天道的奥秘。',
  'elder_man': '咳年纪大了不中用了你们这些年轻人哪',
  'child_girl': '叔叔叔叔你快看那边有蝴蝶呀',
  'child_boy': '我以后也要像父亲一样成为大侠！',
  'demon_lord': '既然你们自寻死路那就别怪本座心狠手辣了！',
  'god_voice': '一切皆有定数，一切皆因缘而生，罢了罢了。'
};

// 获取所有预设音色
app.get('/api/voices', (req, res) => {
  const voices = Object.entries(PRESET_VOICES).map(([id, v]) => ({
    id,
    ...v,
    sampleText: VOICE_SAMPLES[id] || '你好，欢迎使用语音合成系统。'
  }));
  res.json({ voices });
});

// 获取单个音色详情
app.get('/api/voices/:id', (req, res) => {
  const voice = PRESET_VOICES[req.params.id];
  if (!voice) {
    return res.status(404).json({ error: '音色不存在' });
  }
  res.json({ id: req.params.id, ...voice });
});

// 合成语音 (使用预设音色)
app.post('/api/synthesize', async (req, res) => {
  const { text, voice_id, effect = 'normal', options = {} } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: '请输入文本' });
  }
  
  // 获取音色参数
  const voice = PRESET_VOICES[voice_id] || PRESET_VOICES['male_xuhan'];
  const voiceParams = { ...voice.params, ...options };
  
  // 调用TTS
  const result = await callMiniMaxTTS(text, voice_id, voiceParams);
  
  res.json({
    voice_id,
    voice_name: voice.name,
    effect,
    text: text.substring(0, 50) + '...',
    ...result
  });
});

// 获取可用音效
app.get('/api/effects', (req, res) => {
  res.json({ effects: AUDIO_EFFECTS });
});

// 配置API
app.post('/api/config', (req, res) => {
  const { apiKey, groupId } = req.body;
  
  if (apiKey) MINIMAX_CONFIG.apiKey = apiKey;
  if (groupId) MINIMAX_CONFIG.groupId = groupId;
  
  res.json({ 
    success: true, 
    configured: !!(MINIMAX_CONFIG.apiKey && MINIMAX_CONFIG.groupId) 
  });
});

// XTTS预留接口
app.post('/api/xtts/clone', (req, res) => {
  res.json({
    status: 'not_available',
    message: 'XTTS-v2需要GPU环境，当前不可用',
    requirements: {
      gpu: '6GB+ VRAM',
      ram: '8GB+'
    }
  });
});

// 生成音色示例音频
app.post('/api/voices/:id/sample', async (req, res) => {
  const voiceId = req.params.id;
  const voice = PRESET_VOICES[voiceId];
  
  if (!voice) {
    return res.status(404).json({ error: '音色不存在' });
  }
  
  const sampleText = VOICE_SAMPLES[voiceId] || '你好，欢迎使用语音合成系统。';
  
  // 调用TTS生成示例
  const result = await callMiniMaxTTS(sampleText, voiceId, voice.params);
  
  res.json({
    voiceId,
    voiceName: voice.name,
    sampleText,
    ...result
  });
});

// 语音合成(支持参数)
app.post('/api/tts', async (req, res) => {
  const { text, voice, speed = 1.0, pitch = 0, vol = 1.0, format = 'mp3' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: '请输入文本' });
  }
  
  // 使用自定义参数或预设
  const result = await callMiniMaxTTS(text, voice || 'male-qn-qingse', {
    speed, pitch, vol, format
  });
  
  res.json({
    text,
    voice,
    params: { speed, pitch, vol },
    ...result
  });
});

// 启动服务器
app.listen(TTS_PORT, '0.0.0.0', () => {
  console.log(`VoiceForge TTS Enhancement running on http://0.0.0.0:${TTS_PORT}`);
  console.log(`预设音色: ${Object.keys(PRESET_VOICES).length}个`);
  console.log(`MiniMax配置: ${!!(MINIMAX_CONFIG.apiKey && MINIMAX_CONFIG.groupId)}`);
});

export default app;