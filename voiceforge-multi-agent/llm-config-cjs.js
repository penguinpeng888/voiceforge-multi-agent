const LLMConfig = {
  textLLM: null,
  voiceLLM: null,
  customLLMs: {},

  builtin: {
    'minimax': { name: 'MiniMax', provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api: 'chat/completions', model: { id: 'minimaxai/minimax-m2.5', name: 'MiniMax M2.5' } },
    'step-3.5': { name: 'Step-3.5', provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api: 'chat/completions', model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5 Flash' } },
    'deepseek': { name: 'DeepSeek', provider: 'openai', base_url: 'https://api.deepseek.com/v1', api: 'chat/completions', model: { id: 'deepseek-chat', name: 'DeepSeek Chat' } },
    'qwen': { name: 'Qwen', provider: 'openai', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', api: 'chat/completions', model: { id: 'qwen-plus', name: 'Qwen Plus' } }
  },

  addLLM(config) {
    if (typeof config === 'string') {
      const builtin = this.builtin[config.toLowerCase()];
      if (!builtin) return { success: false, error: `Unknown builtin: ${config}` };
      config = { ...builtin };
    }
    const apiKey = config.api_key || config.apiKey || '';
    if (!apiKey) return { success: false, error: 'API Key required' };
    
    let modelId, modelName;
    if (typeof config.model === 'string') { modelId = config.model; modelName = config.model; }
    else if (config.model?.id) { modelId = config.model.id; modelName = config.model.name || config.model.id; }
    else { modelId = config.model_id || 'unknown'; modelName = modelId; }

    const llm = {
      name: config.name || modelName,
      provider: config.provider || 'openai',
      base_url: config.base_url || config.baseUrl || '',
      api: config.api || 'chat/completions',
      api_key: apiKey,
      model: { id: modelId, name: modelName },
      usage: config.usage || 'both'
    };

    if (!llm.base_url) return { success: false, error: 'Base URL required' };

    const id = llm.name.toLowerCase().replace(/\s+/g, '-');
    if (llm.usage === 'text' || llm.usage === 'both' || !this.textLLM) this.textLLM = llm;
    if (llm.usage === 'voice' || llm.usage === 'both' || !this.voiceLLM) this.voiceLLM = llm;
    this.customLLMs[id] = llm;
    return { success: true, id, name: llm.name };
  },

  setBuiltin(key, apiKey) {
    const builtin = this.builtin[key.toLowerCase()];
    if (!builtin) return { success: false, error: `Unknown builtin: ${key}` };
    return this.addLLM({ ...builtin, api_key: apiKey });
  },

  async _callAPI(llm, prompt) {
    const url = `${llm.base_url}/${llm.api}`;
    const isAnthropic = llm.provider === 'anthropic';
    const headers = {
      'Content-Type': 'application/json',
      ...(isAnthropic ? { 'x-api-key': llm.api_key } : { 'Authorization': `Bearer ${llm.api_key}` })
    };
    let body;
    if (llm.api === 'messages') body = { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 };
    else if (llm.api === 'completions') body = { model: llm.model.id, prompt, max_tokens: 50 };
    else body = { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 };

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (llm.api === 'messages') return data.content?.[0]?.text || 'OK';
    if (llm.api === 'completions') return data.choices?.[0]?.text || 'OK';
    return data.choices?.[0]?.message?.content || 'OK';
  },

  async testLLM(nameOrId) {
    const id = nameOrId.toLowerCase().replace(/\s+/g, '-');
    let llm = this.customLLMs[id] || this.textLLM || this.voiceLLM;
    if (!llm) return { success: false, error: 'No LLM configured' };
    try { const response = await this._callAPI(llm, 'Reply "OK"'); return { success: true, response: response?.substring(0, 100) }; }
    catch (e) { return { success: false, error: e.message }; }
  },

  async testTextLLM() { if (!this.textLLM) return { success: false, error: 'No text LLM' }; return this.testLLM(this.textLLM.name); },
  async testVoiceLLM() { if (!this.voiceLLM) return { success: false, error: 'No voice LLM' }; return this.testLLM(this.voiceLLM.name); },
  getTextLLM() { return this.textLLM; },
  getVoiceLLM() { return this.voiceLLM; },
  getStatus() { return { textLLM: this.textLLM ? { name: this.textLLM.name, model: this.textLLM.model.id } : null, voiceLLM: this.voiceLLM ? { name: this.voiceLLM.name, model: this.voiceLLM.model.id } : null, available: Object.keys(this.customLLMs), builtin: Object.keys(this.builtin) }; },
  getAvailable() { return Object.entries(this.builtin).map(([key, v]) => ({ id: key, name: v.name, model: v.model.id, type: 'builtin' })); }
};

module.exports = { LLMConfig };
