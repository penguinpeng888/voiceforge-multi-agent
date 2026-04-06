/**
 * LLM Provider - 对接 OpenClaw 现有模型配置
 * 
 * 支持:
 * - MiniMax (通过 NVIDIA API)
 * - OpenAI 兼容 API
 * - Anthropic 兼容 API
 */

const https = require('https');
const http = require('http');

// 加载 OpenClaw 配置
function loadOpenClawConfig() {
  try {
    const fs = require('fs');
    const configPath = '/root/.openclaw/openclaw.json';
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return null;
}

class LLMProvider {
  constructor(options = {}) {
    this.config = options.config || loadOpenClawConfig();
    this.model = options.model || 'minimaxai/minimax-m2.5';
    this.maxTokens = options.maxTokens || 200000;
    this.temperature = options.temperature || 0.7;
    
    // 从配置获取 API
    this.apiKey = null;
    this.baseUrl = 'https://integrate.api.nvidia.com/v1';
    this._initFromConfig();
  }

  _initFromConfig() {
    if (!this.config?.models?.providers) return;
    
    const providers = this.config.models.providers;
    
    // NVIDIA / MiniMax
    if (providers.nvidia) {
      this.apiKey = providers.nvidia.apiKey;
      this.baseUrl = providers.nvidia.baseUrl || this.baseUrl;
      // 优先使用配置中的模型
      const modelConfig = providers.nvidia.models?.[0];
      if (modelConfig?.id) {
        this.model = modelConfig.id;
      }
    }
    
    // OpenAI
    if (providers.openai) {
      this.apiKey = providers.openai.apiKey;
      this.baseUrl = providers.openai.baseUrl || 'https://api.openai.com/v1';
    }
  }

  /**
   * 调用 LLM
   */
  async complete(messages, options = {}) {
    // 使用配置的模型ID
    let model = options.model || this.model;
    // 确保使用正确的模型格式
    if (!model.includes('/') && this.config?.models?.providers?.nvidia?.models?.[0]) {
      model = this.config.models.providers.nvidia.models[0].id;
    }
    
    const { temperature, maxTokens, tools } = {
      temperature: options.temperature || this.temperature,
      maxTokens: options.maxTokens || this.maxTokens,
      tools: options.tools || null,
      ...options
    };

    // 构建请求
    const payload = {
      model,
      messages: this._formatMessages(messages),
      temperature,
      max_tokens: maxTokens
    };

    if (tools && tools.length > 0) {
      payload.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.schema || { type: 'object', properties: {} }
        }
      }));
    }

    const response = await this._request('/chat/completions', payload);
    return this._parseResponse(response);
  }

  /**
   * 流式调用
   */
  async *completeStream(messages, options = {}) {
    const { model, temperature, maxTokens } = {
      model: options.model || this.model,
      temperature: options.temperature || this.temperature,
      maxTokens: options.maxTokens || this.maxTokens,
      ...options
    };

    const payload = {
      model,
      messages: this._formatMessages(messages),
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

    const response = await this._requestStream('/chat/completions', payload);
    
    for await (const chunk of response) {
      const parsed = this._parseStreamChunk(chunk);
      if (parsed) yield parsed;
    }
  }

  /**
   * 格式化消息
   */
  _formatMessages(messages) {
    return messages.map(m => {
      if (typeof m === 'string') {
        return { role: 'user', content: m };
      }
      if (m.isSummary) {
        return { role: 'system', content: `[摘要] ${m.content}` };
      }
      // Preserve tool-related fields
      const msg = { role: m.role };
      if (m.content) msg.content = m.content;
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      return msg;
    });
  }

  /**
   * HTTP 请求
   */
  _request(endpoint, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * 流式请求
   */
  _requestStream(endpoint, payload) {
    const url = new URL(this.baseUrl + endpoint);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      };

      const req = client.request(options, (res) => {
        resolve(this._createStreamIterator(res));
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * 创建流迭代器
   */
  _createStreamIterator(stream) {
    let buffer = '';
    const chunks = [];

    stream.on('data', chunk => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            chunks.push(null);
          } else {
            try {
              chunks.push(JSON.parse(data));
            } catch (e) {}
          }
        }
      }
    });

    return {
      [Symbol.asyncIterator]() {
        let i = 0;
        return {
          next() {
            if (i >= chunks.length) {
              return Promise.resolve({ done: true });
            }
            return Promise.resolve({ value: chunks[i++], done: false });
          }
        };
      }
    };
  }

  /**
   * 解析响应
   */
  _parseResponse(response) {
    const choice = response.choices?.[0];
    if (!choice) {
      return { content: '', finish_reason: 'empty' };
    }

    const message = choice.message;
    return {
      content: message.content || '',
      role: message.role,
      finish_reason: choice.finish_reason,
      tool_calls: message.tool_calls?.map(tc => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })) || [],
      usage: response.usage
    };
  }

  /**
   * 解析流式块
   */
  _parseStreamChunk(chunk) {
    if (!chunk?.choices?.[0]?.delta) return null;
    
    const delta = chunk.choices[0].delta;
    return {
      content: delta.content || '',
      tool_calls: delta.tool_calls?.map(tc => ({
        name: tc.function?.name,
        arguments: tc.function?.arguments
      })) || [],
      done: chunk.choices[0].finish_reason === 'stop'
    };
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      model: this.model,
      baseUrl: this.baseUrl,
      configured: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none'
    };
  }
}

/**
 * 工厂函数
 */
function createLLMProvider(options) {
  return new LLMProvider(options);
}

module.exports = { LLMProvider, createLLMProvider };