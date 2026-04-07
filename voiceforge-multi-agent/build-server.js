const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const lines = code.split('\n');
const listenIdx = lines.findIndex(l => l.includes('app.listen'));
if (listenIdx > 0) {
  const before = lines.slice(0, listenIdx).join('\n');
  
  const llmCode = `

// ============ LLM API (兼容 OpenClaw 格式) ============
const LLMConfig = {
  textLLM: null, voiceLLM: null, customLLMs: {},
  builtin: {
    'minimax': { name: 'MiniMax', provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api: 'chat/completions', model: { id: 'minimaxai/minimax-m2.5', name: 'MiniMax M2.5' } },
    'step-3.5': { name: 'Step-3.5', provider: 'nvidia', base_url: 'https://integrate.api.nvidia.com/v1', api: 'chat/completions', model: { id: 'stepfun-ai/step-3.5-flash', name: 'Step-3.5 Flash' } },
    'deepseek': { name: 'DeepSeek', provider: 'openai', base_url: 'https://api.deepseek.com/v1', api: 'chat/completions', model: { id: 'deepseek-chat', name: 'DeepSeek Chat' } },
    'qwen': { name: 'Qwen', provider: 'openai', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', api: 'chat/completions', model: { id: 'qwen-plus', name: 'Qwen Plus' } }
  },
  addLLM(config) {
    if (typeof config === 'string') { const b = this.builtin[config.toLowerCase()]; if (!b) return { success: false, error: 'Unknown: ' + config }; config = { ...b }; }
    const apiKey = config.api_key || ''; if (!apiKey) return { success: false, error: 'API Key required' };
    const modelId = typeof config.model === 'string' ? config.model : (config.model?.id || 'unknown');
    const modelName = typeof config.model === 'string' ? config.model : (config.model?.name || modelId);
    const llm = { name: config.name || modelName, provider: config.provider || 'openai', base_url: config.base_url || '', api: config.api || 'chat/completions', api_key: apiKey, model: { id: modelId, name: modelName }, usage: config.usage || 'both' };
    if (!llm.base_url) return { success: false, error: 'Base URL required' };
    const id = llm.name.toLowerCase().replace(/\s+/g, '-');
    if (llm.usage === 'text' || llm.usage === 'both' || !this.textLLM) this.textLLM = llm;
    if (llm.usage === 'voice' || llm.usage === 'both' || !this.voiceLLM) this.voiceLLM = llm;
    this.customLLMs[id] = llm;
    return { success: true, id, name: llm.name };
  },
  setBuiltin(key, apiKey) { const b = this.builtin[key.toLowerCase()]; if (!b) return { success: false, error: 'Unknown: ' + key }; return this.addLLM({ ...b, api_key: apiKey }); },
  async _callAPI(llm, prompt) {
    const url = llm.base_url + '/' + llm.api;
    const isAnthropic = llm.provider === 'anthropic';
    const headers = { 'Content-Type': 'application/json', ...(isAnthropic ? { 'x-api-key': llm.api_key } : { 'Authorization': 'Bearer ' + llm.api_key }) };
    const body = { model: llm.model.id, messages: [{ role: 'user', content: prompt }], max_tokens: 50 };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('API Error ' + res.status);
    const data = await res.json();
    return data.choices ? data.choices[0]?.message?.content || '' : '';
  },
  async testLLM(nameOrId) {
    const id = nameOrId.toLowerCase().replace(/\s+/g, '-');
    let llm = this.customLLMs[id] || this.textLLM || this.voiceLLM;
    if (!llm) return { success: false, error: 'No LLM configured' };
    try { const r = await this._callAPI(llm, 'Say OK'); return { success: true, response: r?.substring(0, 50) }; } catch (e) { return { success: false, error: e.message }; }
  },
  async testTextLLM() { return this.textLLM ? this.testLLM(this.textLLM.name) : { success: false, error: 'No text LLM' }; },
  getTextLLM() { return this.textLLM; },
  getVoiceLLM() { return this.voiceLLM; },
  getStatus() { return { textLLM: this.textLLM ? { name: this.textLLM.name, model: this.textLLM.model.id } : null, voiceLLM: this.voiceLLM ? { name: this.voiceLLM.name, model: this.voiceLLM.model.id } : null, available: Object.keys(this.customLLMs), builtin: Object.keys(this.builtin) }; },
  getAvailable() { return Object.entries(this.builtin).map(([k, v]) => ({ id: k, name: v.name, model: v.model.id, type: 'builtin' })); }
};

app.post('/api/llm/add', (req, res) => { res.json(LLMConfig.addLLM(req.body)); });
app.post('/api/llm/set-builtin', (req, res) => { const { key, apiKey } = req.body; res.json(LLMConfig.setBuiltin(key, apiKey)); });
app.post('/api/llm/test', async (req, res) => { const { name } = req.body; res.json(await LLMConfig.testLLM(name || 'text')); });
app.get('/api/llm/status', (req, res) => { res.json(LLMConfig.getStatus()); });
app.get('/api/llm/available', (req, res) => { res.json(LLMConfig.getAvailable()); });
`;

  fs.writeFileSync('server-with-llm.js', before + llmCode + '\n\n' + lines.slice(listenIdx).join('\n'));
}
console.log('Done - server-with-llm.js created');