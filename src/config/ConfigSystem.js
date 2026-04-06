/**
 * Config System - Claude Code 5层配置继承复刻
 * 
 * 优先级从低到高:
 * 1. 环境变量 (process.env)
 * 2. ~/.claude/settings.json (全局)
 * 3. .claude.json (项目根)
 * 4. .claude/settings.json (项目)
 * 5. .claude/settings.local.json (本地，优先级最高)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigSystem {
  constructor(options = {}) {
    this.options = {
      projectDir: options.projectDir || process.cwd(),
      homeDir: options.homeDir || os.homedir(),
      ...options
    };
    
    this.configDir = '.claude';
    this.loaded = false;
    this.config = {};
  }

  /**
   * 获取配置层级路径
   */
  getConfigPaths() {
    const { projectDir, homeDir } = this.options;
    
    return [
      // 1. 环境变量 (虚拟)
      { type: 'env', priority: 1 },
      // 2. 全局配置
      { type: 'global', priority: 2, path: path.join(homeDir, '.claude', 'settings.json') },
      // 3. 项目根配置
      { type: 'project', priority: 3, path: path.join(projectDir, '.claude.json') },
      // 4. 项目子目录配置
      { type: 'projectSettings', priority: 4, path: path.join(projectDir, this.configDir, 'settings.json') },
      // 5. 本地覆盖配置
      { type: 'local', priority: 5, path: path.join(projectDir, this.configDir, 'settings.local.json') }
    ];
  }

  /**
   * 加载所有配置
   */
  load() {
    const paths = this.getConfigPaths();
    this.config = {};
    
    // 按优先级从低到高加载
    for (const configPath of paths) {
      if (configPath.type === 'env') {
        // 加载环境变量
        this.mergeEnvConfig();
      } else if (fs.existsSync(configPath.path)) {
        try {
          const data = JSON.parse(fs.readFileSync(configPath.path, 'utf-8'));
          this.config[configPath.type] = { ...data };
          console.log(`[Config] Loaded ${configPath.type}: ${configPath.path}`);
        } catch (e) {
          console.error(`[Config] Failed to load ${configPath.path}:`, e.message);
        }
      }
    }
    
    this.loaded = true;
    return this.getMergedConfig();
  }

  /**
   * 合并环境变量
   */
  mergeEnvConfig() {
    const envPrefix = 'OPENCLAW_';
    const envConfig = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(envPrefix)) {
        const configKey = key.slice(envPrefix.length).toLowerCase();
        envConfig[configKey] = value;
      }
    }
    
    if (Object.keys(envConfig).length > 0) {
      this.config.env = envConfig;
    }
  }

  /**
   * 获取合并后的配置
   */
  getMergedConfig() {
    const merged = {};
    const paths = this.getConfigPaths();
    
    // 按优先级从低到高合并
    for (const configPath of paths) {
      const layerConfig = this.config[configPath.type] || {};
      Object.assign(merged, layerConfig);
    }
    
    // 添加元数据
    merged._metadata = {
      loaded: this.loaded,
      sources: Object.keys(this.config),
      projectDir: this.options.projectDir
    };
    
    return merged;
  }

  /**
   * 获取特定值
   */
  get(key, defaultValue = null) {
    if (!this.loaded) this.load();
    
    const paths = this.getConfigPaths();
    
    // 从高优先级到低优先级查找
    for (let i = paths.length - 1; i >= 0; i--) {
      const configPath = paths[i];
      const layerConfig = this.config[configPath.type];
      if (layerConfig && key in layerConfig) {
        return layerConfig[key];
      }
    }
    
    return defaultValue;
  }

  /**
   * 设置值（写入本地配置）
   */
  set(key, value) {
    const localPath = path.join(
      this.options.projectDir,
      this.configDir,
      'settings.local.json'
    );
    
    // 确保目录存在
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 读取现有配置
    let localConfig = {};
    if (fs.existsSync(localPath)) {
      try {
        localConfig = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
      } catch (e) {}
    }
    
    // 更新并保存
    localConfig[key] = value;
    fs.writeFileSync(localPath, JSON.stringify(localConfig, null, 2));
    
    // 重新加载
    this.load();
  }

  /**
   * 获取配置来源
   */
  getSource(key) {
    const paths = this.getConfigPaths();
    
    for (let i = paths.length - 1; i >= 0; i--) {
      const configPath = paths[i];
      const layerConfig = this.config[configPath.type];
      if (layerConfig && key in layerConfig) {
        return {
          key,
          value: layerConfig[key],
          source: configPath.type,
          path: configPath.path || 'environment variable'
        };
      }
    }
    
    return null;
  }

  /**
   * 获取所有配置来源
   */
  getAllSources() {
    const sources = [];
    const paths = this.getConfigPaths();
    
    for (const configPath of paths) {
      const layerConfig = this.config[configPath.type];
      if (layerConfig) {
        sources.push({
          type: configPath.type,
          priority: configPath.priority,
          path: configPath.path,
          keys: Object.keys(layerConfig)
        });
      }
    }
    
    return sources;
  }

  /**
   * 创建默认配置
   */
  createDefaults() {
    const defaults = {
      // 权限设置
      permissionMode: 'auto',
      // 模型设置
      model: 'claude-sonnet-4-20250514',
      maxTokens: 200000,
      // 工具设置
      allowedTools: [],
      blockedTools: [],
      // 记忆设置
      memoryEnabled: true,
      memoryLayers: ['user', 'project'],
      // 压缩设置
      compactionTrigger: 150000,
      // 主题
      theme: 'dark',
      // 语言
      language: 'zh-CN'
    };
    
    // 保存到项目配置
    const projectConfigPath = path.join(this.options.projectDir, '.claude.json');
    fs.writeFileSync(projectConfigPath, JSON.stringify(defaults, null, 2));
    console.log(`[Config] Created defaults at ${projectConfigPath}`);
    
    return defaults;
  }
}

// ============ 演示 ============

function demo() {
  console.log('=== Config System Demo ===\n');
  
  const config = new ConfigSystem({
    projectDir: '/tmp/test-project',
    homeDir: os.homedir()
  });
  
  // 创建测试目录
  const testDir = '/tmp/test-project';
  const claudeDir = path.join(testDir, '.claude');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
  
  // 2. 全局配置
  fs.writeFileSync(path.join(os.homedir(), '.claude', 'settings.json'), JSON.stringify({
    model: 'claude-3-opus',
    theme: 'light'
  }, null, 2));
  
  // 3. 项目配置
  fs.writeFileSync(path.join(testDir, '.claude.json'), JSON.stringify({
    model: 'claude-3-sonnet',
    maxTokens: 100000
  }, null, 2));
  
  // 5. 本地配置（最高优先级）
  fs.writeFileSync(path.join(claudeDir, 'settings.local.json'), JSON.stringify({
    permissionMode: 'bypass',
    customSetting: 'local-only-value'
  }, null, 2));
  
  console.log('--- Loading config ---');
  const merged = config.load();
  console.log('Merged config:', merged);
  
  console.log('\n--- Getting specific values ---');
  console.log('model:', config.get('model'));
  console.log('theme:', config.get('theme'));
  console.log('permissionMode:', config.get('permissionMode'));
  console.log('customSetting:', config.get('customSetting'));
  
  console.log('\n--- Config sources ---');
  console.log(config.getAllSources());
  
  console.log('\n--- Source of "model" ---');
  console.log(config.getSource('model'));
  
  console.log('\n--- Setting a value ---');
  config.set('newFeature', 'enabled');
  console.log('newFeature:', config.get('newFeature'));
  console.log('source:', config.getSource('newFeature'));
}

if (require.main === module) {
  demo().catch(console.error);
}

module.exports = ConfigSystem;