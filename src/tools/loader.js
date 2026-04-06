/**
 * Tools Loader - 工具加载器
 * 
 * 批量注册工具到 OpenClaw
 */

const allTools = require('./index');

/**
 * 加载所有工具到 OpenClaw 实例
 */
function loadAllTools(openclaw) {
  for (const [name, tool] of Object.entries(allTools)) {
    openclaw.registerTool({
      name,
      description: tool.description,
      execute: tool.execute,
      concurrent: tool.concurrent,
      serial: tool.serial
    });
  }
  return openclaw;
}

/**
 * 按类别获取工具
 */
function getToolsByCategory(category) {
  const categories = {
    file: ['read', 'write', 'edit', 'delete', 'mkdir', 'cp', 'mv', 'stat'],
    search: ['glob', 'grep', 'find', 'ls'],
    git: ['git-status', 'git-log', 'git-diff', 'git-branch'],
    network: ['web-search', 'web-fetch', 'http'],
    system: ['bash', 'env', 'ps'],
    dev: ['npm', 'test', 'build', 'lint']
  };
  
  return categories[category] || [];
}

/**
 * 获取工具列表
 */
function getToolList() {
  return Object.entries(allTools).map(([name, tool]) => ({
    name,
    description: tool.description,
    category: getToolCategory(name),
    type: tool.concurrent ? 'concurrent' : 'serial'
  }));
}

/**
 * 获取工具类别
 */
function getToolCategory(name) {
  const categories = {
    read: 'file', write: 'file', edit: 'file', delete: 'file', mkdir: 'file', cp: 'file', mv: 'file', stat: 'file',
    glob: 'search', grep: 'search', find: 'search', ls: 'search',
    'git-status': 'git', 'git-log': 'git', 'git-diff': 'git', 'git-branch': 'git',
    'web-search': 'network', 'web-fetch': 'network', http: 'network',
    bash: 'system', env: 'system', ps: 'system',
    npm: 'dev', test: 'dev', build: 'dev', lint: 'dev',
    'tasks-list': 'task', 'tasks-add': 'task', 'tasks-update': 'task', 'tasks-delete': 'task',
    'docker-ps': 'container', 'docker-images': 'container', 'docker-run': 'container', 'docker-stop': 'container', 'docker-compose': 'container',
    'mongo-query': 'db', 'pg-query': 'db', 'redis': 'db', 'db-backup': 'db',
    aws: 'cloud', vercel: 'cloud', netlify: 'cloud', fly: 'cloud',
    encrypt: 'security', decrypt: 'security', 'security-scan': 'security', 'generate-password': 'security',
    embed: 'ai', 'sentiment-analyze': 'ai', translate: 'ai', summarize: 'ai',
    'system-info': 'monitoring', 'cpu-usage': 'monitoring', 'memory-usage': 'monitoring', 'disk-usage': 'monitoring', 'network-stats': 'monitoring', 'monitor': 'monitoring', 'health-check': 'monitoring',
    screenshot: 'terminal', notify: 'terminal', 'open-url': 'terminal', beep: 'terminal', 'clipboard-read': 'terminal', 'clipboard-write': 'terminal',
    rest: 'api', graphql: 'api', webhook: 'api', 'api-key': 'api', jwt: 'api', 'json-validate': 'api',
    'json-format': 'data', 'json-minify': 'data', csv: 'data', base64: 'data', hash: 'data', uuid: 'data', url: 'data', date: 'data'
  };
  return categories[name] || 'other';
}

/**
 * 获取统计
 */
function getStats() {
  const tools = getToolList();
  const byCategory = {};
  const byType = { concurrent: 0, serial: 0 };
  
  for (const tool of tools) {
    byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
    byType[tool.type]++;
  }
  
  return {
    total: tools.length,
    byCategory,
    byType
  };
}

module.exports = {
  loadAllTools,
  getToolsByCategory,
  getToolList,
  getToolCategory,
  getStats,
  ...allTools
};