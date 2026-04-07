/**
 * VoiceForge Multi-Agent System
 * 入口文件 - 加载 CommonJS 模块
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 加载配置
const { LLMConfig } = require('./llm-config-cjs.js');

// 导出供其他模块使用
export { LLMConfig };
export default { LLMConfig };
