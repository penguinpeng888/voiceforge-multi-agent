/**
 * OpenClaw Gateway API - 对接主系统的 HTTP 服务
 */

const http = require('http');
const { createOpenClaw } = require('./OpenClaw');
const { loadAllTools } = require('./tools/loader');

class OpenClawAPI {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.oc = null;
    this.server = null;
  }

  async init() {
    this.oc = createOpenClaw({
      workspaceDir: process.cwd(),
      maxWorkers: 5
    });
    
    await this.oc.init();
    loadAllTools(this.oc);
    
    console.log('OpenClaw initialized');
    console.log('Tools:', this.oc.getTools().length);
    console.log('LLM:', this.oc.llm.model);
  }

  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, this.host, () => {
      console.log(`🚀 OpenClaw API running at http://${this.host}:${this.port}`);
    });
  }

  async handleRequest(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method;

    try {
      if (path === '/health' && method === 'GET') {
        this.json(res, { status: 'ok', uptime: process.uptime() });
      } 
      else if (path === '/status' && method === 'GET') {
        this.json(res, this.oc.getStatus());
      } 
      else if (path === '/query' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { prompt } = JSON.parse(body);
            if (!prompt) {
              this.json(res, { error: 'prompt is required' }, 400);
              return;
            }
            const result = await this.oc.query(prompt);
            this.json(res, { 
              response: result.response?.content || '', 
              toolCalls: result.toolResults?.length || 0, 
              finish_reason: result.response?.finish_reason 
            });
          } catch (e) {
            this.json(res, { error: e.message }, 500);
          }
        });
        return;
      } 
      else if (path === '/chat' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { prompt } = JSON.parse(body);
            if (!prompt) {
              this.json(res, { error: 'prompt is required' }, 400);
              return;
            }
            const llmResult = await this.oc.llm.complete([{ role: 'user', content: prompt }], { maxTokens: 2000 });
            this.json(res, { response: llmResult.content, finish_reason: llmResult.finish_reason });
          } catch (e) {
            this.json(res, { error: e.message }, 500);
          }
        });
        return;
      } 
      else if (path === '/tools' && method === 'GET') {
        this.json(res, { 
          total: this.oc.getTools().length,
          tools: this.oc.getTools().map(t => ({ name: t.name, description: t.description }))
        });
      } 
      else if (path === '/tools/execute' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { tool, input } = JSON.parse(body);
            if (!tool) {
              this.json(res, { error: 'tool name is required' }, 400);
              return;
            }
            const results = await this.oc.queryEngine.executeTools([{ name: tool, input: input || {} }]);
            this.json(res, { tool, result: results[0]?.result });
          } catch (e) {
            this.json(res, { error: e.message }, 500);
          }
        });
        return;
      } 
      else if (path === '/memory' && method === 'GET') {
        this.json(res, this.oc.memory.getAllForContext());
      } 
      else if (path === '/llm' && method === 'GET') {
        this.json(res, this.oc.llm.getStatus());
      } 
      else if (path === '/llm/test' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { prompt } = JSON.parse(body);
            const result = await this.oc.llm.complete([{ role: 'user', content: prompt || 'Hello' }], { maxTokens: 100 });
            this.json(res, { response: result.content, finish_reason: result.finish_reason });
          } catch (e) {
            this.json(res, { error: e.message }, 500);
          }
        });
        return;
      }
      // ============ New Endpoints ============
      else if (path === '/buddy' && method === 'GET') {
        const url = new URL(req.url, 'http://localhost');
        const userId = url.searchParams.get('userId') || 'default';
        const buddy = this.oc.buddy?.getOrCreateBuddy?.(userId);
        this.json(res, buddy || { error: 'No buddy found', userId });
      }
      else if (path === '/buddy/all-species' && method === 'GET') {
        const species = this.oc.buddy?.getSpeciesList?.() || [];
        this.json(res, species);
      }
      else if (path === '/kairos/status' && method === 'GET') {
        const status = this.oc.kairos?.getStatus?.() || { error: 'Not initialized' };
        this.json(res, status);
      }
      else if (path === '/telegram/start' && method === 'POST') {
      try {
        const result = await this.oc.telegram.start();
        this.json(res, { success: result, message: result ? 'Telegram bot started' : 'Failed to start' });
      } catch (e) {
        this.json(res, { error: e.message }, 500);
      }
      return;
    } else if (path === '/coordinator/status' && method === 'GET') {
        const status = this.oc.coordinator?.getStats?.() || {};
        this.json(res, status);
      }
      else {
        this.json(res, { error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Error:', error);
      this.json(res, { error: error.message }, 500);
    }
  }

  json(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

// 启动服务
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000');
  const api = new OpenClawAPI({ port });
  api.init().then(() => {
    api.start();
  }).catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

module.exports = { OpenClawAPI };