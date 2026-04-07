/**
 * VoiceForge LLM Providers - 兼容多种格式的自定义 LLM
 * 支持 OpenClaw 格式、内置模型、灵活配置
 */

class LLMManager {
  constructor() {
    this.textLLM = null;
    this.voiceLLM = null;
    this.customLLMs = {};
    this.builtinLLMs = this._getBuiltinLLMs();
  }

  /**
   * 内置 LLM 配置
   */
  _getBuiltinLLMs() {
    return {
      'minimax': {
        name: 'MiniMax',
        provider: 'nvidia',
        base_url: 'https://integrate.api.nvidia.com/v1',
        api: 'chat/completions',
        api_key: '',
        model: { id: 'minimaxai/minimax-m2.5', name: 'MiniMax M2.5' }
      },
      'step-3.5': {
        name: 'Step-3.5 Flash',
        provider: 'nvidia',
        base_url: 'https://integrate.api.nvidia.com/v1',
        api: 'chat/completions',
        api_key: '',
        model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5 Flash' }
      },
      'deepseek': {
        name: 'DeepSeek',
        provider: 'openai',
        base_url: 'https://api.deepseek.com/v1',
        api: 'chat/completions',
        api_key: '',
        model: { id: 'deepseek-chat', name: 'DeepSeek Chat' }
      },
      'qwen': {
        name: 'Qwen',
        provider: 'openai',
        base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        api: 'chat/completions',
        api_key: '',
        model: { id: 'qwen-plus', name: 'Qwen Plus' }
      },
      'gpt-4o': {
        name: 'GPT-4O',
        provider: 'openai',
        base_url: 'https://api.openai.com/v1',
        api: 'chat/completions',
        api_key: '',
        model: { id: 'gpt-4o', name: 'GPT-4O' }
      },
      'claude': {
        name: 'Claude',
        provider: 'anthropic',
        base_url: 'https://api.anthropic.com/v1',
        api: 'messages',
        api_key: '',
        model: { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5' }
      }
    };
  }

  /**
   * 标准化配置 - 兼容各种输入格式
   */
  _normalizeConfig(config) {
    // 处理字符串格式的 model (如 "gpt-4o")
    let model = config.model;
    if (typeof model === 'string') {
      model = { id: model, name: model };
    }

    // 处理 model.id 可能是字符串
    const modelId = model?.id || model || config.model_name || 'unknown';

    // 兼容不同 API 字段名
    const apiKey = config.api_key || config.apiKey || config.API_KEY || '';
    const baseUrl = config.base_url || config.baseUrl || config.BASE_URL || '';
    const api = config.api || config.api_type || config.endpoint || 'chat/completions';
    const provider = config.provider || 'openai';

    // 处理 usage
    const usage = config.usage || config.type || 'both';

    return {
      name: config.name || config.model?.name || model?.name || modelId,
      provider,
      base_url: baseUrl,
      api,
      api_key: apiKey,
      model: { id: modelId, name: model?.name || modelId },
      usage
    };
  }

  /**
   * 添加自定义 LLM (兼容多种格式)
   */
  addLLM(config) {
    // 如果是字符串，可能是 builtin key
    if (typeof config === 'string') {
      const builtin = this.builtinLLMs[config.toLowerCase()];
      if (builtin) {
        config = { ...builtin };
      } else {
        return { error: `Unknown LLM: ${config}` };
      }
    }

    const normalized = this._normalizeConfig(config);

    // 验证必要字段
    if (!normalized.api_key) {
      return { error: 'API Key is required' };
    }
    if (!normalized.base_url) {
      return { error: 'Base URL is required' };
    }

    const llm = new FlexibleLLM(normalized);
    const id = normalized.name.toLowerCase().replace(/\s+/g, '-');

    // 设置用途
    if (normalized.usage === 'text' || normalized.usage === 'both') {
      if (!this.textLLM) this.textLLM = llm;
    }
    if (normalized.usage === 'voice' || normalized.usage === 'both') {
      if (!this.voiceLLM) this.voiceLLM = llm;
    }

    this.customLLMs[id] = llm;
    return { success: true, id, name: normalized.name };
  }

  /**
   * 设置内置 LLM (通过 API Key)
   */
  setBuiltinLLM(key, apiKey) {
    const builtin = this.builtinLLMs[key.toLowerCase()];
    if (!builtin) {
      return { error: `Unknown builtin: ${key}. Available: ${Object.keys(this.builtinLLMs).join(', ')}` };
    }
    
    const config = { ...builtin, api_key: apiKey };
    return this.addLLM(config);
  }

  /**
   * 测试 LLM
   */
  async testLLM(idOrName) {
    const id = idOrName.toLowerCase().replace(/\s+/g, '-');
    let llm = this.customLLMs[id];
    
    // 尝试匹配 textLLM 或 voiceLLM
    if (!llm && this.textLLM?.name === idOrName) llm = this.textLLM;
    if (!llm && this.voiceLLM?.name === idOrName) llm = this.voiceLLM;
    if (!llm && this.textLLM?.id === id) llm = this.textLLM;
    if (!llm && this.voiceLLM?.id === id) llm = this.voiceLLM;
    
    if (!llm) {
      return { success: false, error: 'LLM not found' };
    }

    try {
      const result = await llm.complete([
        { role: 'user', content: 'Say "OK" in one word' }
      ], { maxTokens: 10 });
      return { success: true, response: result.content?.trim() };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async testTextLLM() {
    if (!this.textLLM) return { success: false, error: 'No text LLM configured' };
    return this.testLLM(this.textLLM.name);
  }

  async testVoiceLLM() {
    if (!this.voiceLLM) return { success: false, error: 'No voice LLM configured' };
    return this.testLLM(this.voiceLLM.name);
  }

  getTextLLM() { return this.textLLM; }
  getVoiceLLM() { return this.voiceLLM; }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      textLLM: this.textLLM ? {
        name: this.textLLM.name,
        model: this.textLLM.model.id,
        provider: this.textLLM.provider
      } : null,
      voiceLLM: this.voiceLLM ? {
        name: this.voiceLLM.name,
        model: this.voiceLLM.model.id,
        provider: this.voiceLLM.provider
      } : null,
      available: Object.keys(this.customLLMs),
      builtin: Object.keys(this.builtinLLMs)
    };
  }

  /**
   * 获取可用 LLM 列表
   */
  getAvailableLLMs() {
    return Object.entries(this.builtinLLMs).map(([key, cfg]) => ({
      id: key,
      name: cfg.name,
      model: cfg.model.id,
      type: 'builtin'
    }));
  }
}

/**
 * 灵活的 LLM 实现 - 兼容各种 API
 */
class FlexibleLLM {
  constructor(config) {
    this.id = config.name.toLowerCase().replace(/\s+/g, '-');
    this.name = config.name;
    this.provider = config.provider;
    this.baseUrl = config.base_url;
    this.api = config.api;
    this.apiKey = config.api_key;
    this.model = config.model;
  }

  async complete(messages, options = {}) {
    const { maxTokens = 1000, temperature = 0.7, stream = false } = options;
    
    let body;
    let url = `${this.baseUrl}/${this.api}`;

    // 根据 API 类型构建请求
    if (this.api === 'messages') {
      // Anthropic 格式
      body = {
        model: this.model.id,
        messages: messages.filter(m => m.role !== 'system'),
        max_tokens: maxTokens,
        temperature
      };
    } else if (this.api === 'completions') {
      // 旧版 completions
      body = {
        model: this.model.id,
        prompt: messages[0]?.content,
        max_tokens: maxTokens,
        temperature
      };
    } else {
      // 默认 ChatCompletions
      body = {
        model: this.model.id,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream
      };
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // 根据 provider 添加认证
    if (this.provider === 'anthropic') {
      headers['x-api-key'] = this.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error ${response.status}: ${err}`);
    }

    const data = await response.json();

    // 解析响应
    if (this.api === 'messages') {
      return { content: data.content?.[0]?.text, finish_reason: data.stop_reason };
    } else if (this.api === 'completions') {
      return { content: data.choices?.[0]?.text, finish_reason: data.choices?.[0]?.finish_reason };
    } else {
      return { 
        content: data.choices?.[0]?.message?.content, 
        finish_reason: data.choices?.[0]?.finish_reason 
      };
    }
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      model: this.model.id,
      provider: this.provider,
      baseUrl: this.baseUrl
    };
  }
}

export default LLMManager;