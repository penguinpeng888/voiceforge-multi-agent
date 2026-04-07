/**
 * VoiceForge LLM 配置管理器 - 兼容 OpenClaw 格式
 * 支持内置模型、自定义配置、文本/语音分离
 * 
 * 使用方法:
 *   const { LLMConfig } = require('./llm-config.js');
 *   
 *   // 添加自定义 LLM (OpenClaw 格式)
 *   LLMConfig.addLLM({
 *     provider: 'nvidia',
 *     base_url: 'https://integrate.api.nvidia.com/v1',
 *     api: 'chat/completions',
 *     api_key: 'nvapi-xxx',
 *     model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5' },
 *     usage: 'text'
 *   });
 *   
 *   // 测试
 *   const result = await LLMConfig.testTextLLM();
 */

const LLMConfig = {
  textLLM: null,
  voiceLLM: null,
  customLLMs: {},

  // 内置模型
  builtin: {
    'minimax': {
      name: 'MiniMax',
      provider: 'nvidia',
      base_url: 'https://integrate.api.nvidia.com/v1',
      api: 'chat/completions',
      model: { id: 'minimaxai/minimax-m2.5', name: 'MiniMax M2.5' }
    },
    'step-3.5': {
      name: 'Step-3.5',
      provider: 'nvidia', 
      base_url: 'https://integrate.api.nvidia.com/v1',
      api: 'chat/completions',
      model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5 Flash' }
    },
    'deepseek': {
      name: 'DeepSeek',
      provider: 'openai',
      base_url: 'https://api.deepseek.com/v1',
      api: 'chat/completions',
      model: { id: 'deepseek-chat', name: 'DeepSeek Chat' }
    },
    'qwen': {
      name: 'Qwen',
      provider: 'openai',
      base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      api: 'chat/completions',
      model: { id: 'qwen-plus', name: 'Qwen Plus' }
    }
  },

  /**
   * 添加 LLM - 兼容多种格式
   * 支持格式:
   *   1. { model: "deepseek-chat", api_key: "xxx" }  // 简化
   *   2. { model: { id: "xxx", name: "yyy" }, api_key: "xxx", base_url: "xxx" }  // 完整
   *   3. { provider, base_url, api, api_key, model, usage }  // OpenClaw 格式
   */
  addLLM(config) {
    // 处理 builtin 名称
    if (typeof config === 'string') {
      const builtin = this.builtin[config.toLowerCase()];
      if (!builtin) {
        return { success: false, error: `Unknown builtin: ${config}. Available: ${Object.keys(this.builtin).join(', ')}` };
      }
      config = { ...builtin };
    }

    // 标准化配置
    const apiKey = config.api_key || config.apiKey || '';
    if (!apiKey) {
      return { success: false, error: 'API Key is required' };
    }

    // 处理 model 字段
    let modelId, modelName;
    if (typeof config.model === 'string') {
      modelId = config.model;
      modelName = config.model;
    } else if (config.model?.id) {
      modelId = config.model.id;
      modelName = config.model.name || config.model.id;
    } else {
      modelId = config.model_id || config.modelName || 'unknown';
      modelName = modelId;
    }

    // 构建标准化配置
    const llm = {
      name: config.name || modelName,
      provider: config.provider || 'openai',
      base_url: config.base_url || config.baseUrl || '',
      api: config.api || config.api_type || 'chat/completions',
      api_key: apiKey,
      model: { id: modelId, name: modelName },
      usage: config.usage || config.type || 'both'
    };

    if (!llm.base_url) {
      return { success: false, error: 'Base URL is required' };
    }

    const id = llm.name.toLowerCase().replace(/\s+/g, '-');

    // 设置用途
    if (llm.usage === 'text' || llm.usage === 'both' || !this.textLLM) {
      this.textLLM = llm;
    }
    if (llm.usage === 'voice' || llm.usage === 'both' || !this.voiceLLM) {
      this.voiceLLM = llm;
    }

    this.customLLMs[id] = llm;
    
    return { success: true, id, name: llm.name };
  },

  /**
   * 设置内置模型
   */
  setBuiltin(key, apiKey) {
    const builtin = this.builtin[key.toLowerCase()];
    if (!builtin) {
      return { success: false, error: `Unknown builtin: ${key}` };
    }
    return this.addLLM({ ...builtin, api_key: apiKey });
  },

  /**
   * 测试 LLM
   */
  async _callAPI(llm, prompt) {
    const url = `${llm.base_url}/${llm.api}`;
    const isAnthropic = llm.provider === 'anthropic';
    
    const headers = {
      'Content-Type': 'application/json',
      ...(isAnthropic ? { 'x-api-key': llm.api_key } : { 'Authorization': `Bearer ${llm.api_key}` })
    };

    let body;
    if (llm.api === 'messages') {
      body = { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 };
    } else if (llm.api === 'completions') {
      body = { model: llm.model.id, prompt, max_tokens: 50 };
    } else {
      body = { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    
    if (llm.api === 'messages') {
      return data.content?.[0]?.text || 'OK';
    } else if (llm.api === 'completions') {
      return data.choices?.[0]?.text || 'OK';
    }
    return data.choices?.[0]?.message?.content || 'OK';
  },

  async testLLM(nameOrId) {
    const id = nameOrId.toLowerCase().replace(/\s+/g, '-');
    let llm = this.customLLMs[id] || this.textLLM || this.voiceLLM;
    
    if (!llm) {
      return { success: false, error: 'No LLM configured' };
    }

    try {
      const response = await this._callAPI(llm, 'Reply "OK"');
      return { success: true, response: response?.substring(0, 100) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async testTextLLM() {
    if (!this.textLLM) return { success: false, error: 'Text LLM not configured' };
    return this.testLLM(this.textLLM.name);
  },

  async testVoiceLLM() {
    if (!this.voiceLLM) return { success: false, error: 'Voice LLM not configured' };
    return this.testLLM(this.voiceLLM.name);
  },

  getTextLLM() { return this.textLLM; },
  getVoiceLLM() { return this.voiceLLM; },

  getStatus() {
    return {
      textLLM: this.textLLM ? { name: this.textLLM.name, model: this.textLLM.model.id } : null,
      voiceLLM: this.voiceLLM ? { name: this.voiceLLM.name, model: this.voiceLLM.model.id } : null,
      available: Object.keys(this.customLLMs),
      builtin: Object.keys(this.builtin)
    };
  },

  getAvailable() {
    return Object.entries(this.builtin).map(([key, v]) => ({
      id: key, name: v.name, model: v.model.id, type: 'builtin'
    }));
  }
};

module.exports = { LLMConfig };