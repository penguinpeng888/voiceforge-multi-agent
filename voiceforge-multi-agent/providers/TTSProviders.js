/**
 * TTS Providers - 多后端语音合成
 * 支持不同配置下使用不同TTS引擎
 */

import { feature } from '../core/FeatureFlags.js';

/**
 * TTS Provider 基类
 */
class TTSProvider {
  constructor(name) {
    this.name = name;
  }

  async synthesize(text, options = {}) {
    throw new Error(`${this.name} must implement synthesize()`);
  }

  async cloneVoice(referenceAudio, text, options = {}) {
    throw new Error(`${this.name} must implement cloneVoice()`);
  }

  isAvailable() {
    return false;
  }
}

/**
 * MiniMax TTS (当前使用)
 */
class MiniMaxTTS extends TTSProvider {
  constructor() {
    super('MiniMax');
    this.apiKey = process.env.MINIMAX_API_KEY || '';
    this.baseUrl = 'https://api.minimax.chat/v1/t2a_v2';
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async synthesize(text, options = {}) {
    const { voice, speed, vol, pitch, bitrate, sampleRate, format } = options;
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model: 'speech-01-turbo',
        voice_setting: {
          voice_id: voice || 'male-qn-qingse',
          speed,
          vol,
          pitch,
          bitrate,
          sample_rate: sampleRate,
          format
        }
      })
    });

    const data = await response.json();
    return {
      provider: 'MiniMax',
      audio: data.data?.audio,
      format: format || 'mp3'
    };
  }

  async cloneVoice(referenceAudio, text, options) {
    // MiniMax不支持零样本克隆，需要微调
    return { error: 'MiniMax不支持语音克隆，需微调' };
  }
}

/**
 * Coqui XTTS-v2 (需GPU)
 */
class XTTSTTS extends TTSProvider {
  constructor() {
    super('XTTS-v2');
    this.modelPath = process.env.XTTS_MODEL_PATH || 'coqui/tts';
    this.gpuRequired = true;
    this.minMemory = 6; // GB
  }

  isAvailable() {
    // 检查GPU和内存
    if (typeof window === 'undefined') {
      // 服务端检查
      try {
        const os = require('os');
        const totalMem = os.totalmem() / (1024**3);
        return totalMem >= this.minMemory;
      } catch {
        return false;
      }
    }
    return false;
  }

  async synthesize(text, options = {}) {
    // 实际需要用TTS库
    const { language, speed } = options;
    
    return {
      provider: 'XTTS-v2',
      status: 'not_implemented',
      message: '需要加载TTS库，参考: pip install TTS'
    };
  }

  async cloneVoice(referenceAudio, text, options = {}) {
    // XTTS-v2核心功能：用6秒音频克隆
    /* 实际代码:
    from TTS.api import TTS
    tts = TTS("coqui/tts", gpu=True)
    tts.tts_to_file(
      text=text,
      speaker_wav=referenceAudio,
      language=options.language || "zh-cn",
      file_output="output.wav"
    )
    */
    
    return {
      provider: 'XTTS-v2',
      reference: referenceAudio,
      text,
      language: options.language || 'zh-cn',
      status: 'ready_to_implement'
    };
  }

  getRequirements() {
    return {
      gpu: '6GB+ VRAM (RTX 3060)',
      ram: '8GB+',
      storage: '10GB+'
    };
  }
}

/**
 * Browser Web Speech API (无需服务器)
 */
class BrowserTTS extends TTSProvider {
  constructor() {
    super('Browser');
    this.synth = null;
    this.voices = [];
  }

  isAvailable() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return true;
    }
    return false;
  }

  async synthesize(text, options = {}) {
    const { voice, rate, pitch, volume } = options;
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) utterance.voice = voice;
      if (rate) utterance.rate = rate;
      if (pitch) utterance.pitch = pitch;
      if (volume) utterance.volume = volume;

      utterance.onend = () => resolve({ provider: 'Browser', status: 'done' });
      utterance.onerror = (e) => resolve({ provider: 'Browser', error: e.error });
      
      if (typeof window !== 'undefined') {
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  async cloneVoice(referenceAudio, text, options) {
    // 浏览器TTS不支持语音克隆
    return { error: 'Browser TTS不支持语音克隆' };
  }

  async getVoices() {
    if (typeof window !== 'undefined') {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }
}

/**
 * Pocket TTS (低配置)
 */
class PocketTTS extends TTSProvider {
  constructor() {
    super('PocketTTS');
  }

  isAvailable() {
    // 需要单独安装pocketsphinx或类似
    return false;
  }

  getRequirements() {
    return {
      gpu: '不需要',
      ram: '2GB+',
      storage: '500MB+'
    };
  }

  async synthesize(text, options = {}) {
    return {
      provider: 'PocketTTS',
      status: 'not_implemented',
      message: '需安装: pip install pocketsphinx'
    };
  }

  async cloneVoice(referenceAudio, text, options) {
    return { error: 'Pocket TTS不支持语音克隆' };
  }
}

/**
 * TTS Provider 管理器
 */
class TTSManager {
  constructor() {
    this.providers = {
      minimax: new MiniMaxTTS(),
      xtts: new XTTSTTS(),
      browser: new BrowserTTS(),
      pocket: new PocketTTS()
    };
    
    this.activeProvider = 'minimax';
  }

  // 获取可用的provider
  getAvailable() {
    const available = [];
    for (const [name, provider] of Object.entries(this.providers)) {
      if (provider.isAvailable()) {
        available.push(name);
      }
    }
    return available;
  }

  // 设置active provider
  setProvider(name) {
    if (this.providers[name]) {
      this.activeProvider = name;
      return true;
    }
    return false;
  }

  // 自动选择最佳provider
  autoSelect() {
    const available = this.getAvailable();
    if (available.length === 0) {
      // 强制使用browser作为fallback
      this.activeProvider = 'browser';
      return 'browser';
    }
    
    // 优先级: minimax > xtts > browser
    if (available.includes('minimax')) {
      this.activeProvider = 'minimax';
      return 'minimax';
    }
    if (available.includes('xtts')) {
      this.activeProvider = 'xtts';
      return 'xtts';
    }
    if (available.includes('browser')) {
      this.activeProvider = 'browser';
      return 'browser';
    }
    
    return available[0];
  }

  // 合成语音
  async synthesize(text, options = {}) {
    const provider = this.providers[this.activeProvider];
    return provider.synthesize(text, options);
  }

  // 克隆语音
  async cloneVoice(referenceAudio, text, options = {}) {
    // 克隆需要XTTS
    if (this.providers.xtts.isAvailable()) {
      return this.providers.xtts.cloneVoice(referenceAudio, text, options);
    }
    
    // fallback
    return { error: '无可用语音克隆provider' };
  }

  // 获取当前provider信息
  getInfo() {
    const provider = this.providers[this.activeProvider];
    return {
      active: this.activeProvider,
      available: this.getAvailable(),
      requirements: provider.getRequirements ? provider.getRequirements() : null
    };
  }
}

// 导出
export const ttsManager = new TTSManager();
export default { ttsManager, MiniMaxTTS, XTTSTTS, BrowserTTS, PocketTTS };