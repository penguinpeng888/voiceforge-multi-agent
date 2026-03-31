/**
 * Claude Code inspired Tools
 * 基于 Claude Code 源码中的 tools/ 目录简化实现
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const execAsync = promisify(exec);

/**
 * Base64 编解码工具
 */
export const Base64Tool = {
  encode: (str) => Buffer.from(str).toString('base64'),
  decode: (str) => Buffer.from(str, 'base64').toString('utf-8')
};

/**
 * Bash Tool - 执行shell命令
 */
export class BashTool {
  constructor() {
    this.name = 'bash';
    this.description = 'Execute shell commands';
    this.timeout = 30000;
  }

  async execute(input, context = {}) {
    const { command, timeout = this.timeout } = input;
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout,
        cwd: context.cwd || process.cwd()
      });
      
      return {
        success: true,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        timedOut: error.killed
      };
    }
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          timeout: { type: 'number', description: 'Timeout in milliseconds' }
        },
        required: ['command']
      }
    };
  }
}


/**
 * FileRead Tool - 读取文件
 */
export class FileReadTool {
  constructor() {
    this.name = 'read';
    this.description = 'Read file contents';
  }

  async execute(input, context = {}) {
    const { path: filePath, offset, limit } = input;
    const fullPath = path.resolve(context.cwd || process.cwd(), filePath);
    
    try {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // 行号偏移
      if (offset) {
        const lines = content.split('\n');
        content = lines.slice(offset - 1).join('\n');
      }
      
      // 限制行数
      if (limit) {
        const lines = content.split('\n');
        content = lines.slice(0, limit).join('\n');
      }
      
      return {
        success: true,
        content,
        path: filePath,
        size: fs.statSync(fullPath).size
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      };
    }
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' },
          offset: { type: 'number', description: 'Line offset to start from' },
          limit: { type: 'number', description: 'Maximum lines to read' }
        },
        required: ['path']
      }
    };
  }
}


/**
 * FileWrite Tool - 写入文件
 */
export class FileWriteTool {
  constructor() {
    this.name = 'write';
    this.description = 'Create or overwrite file';
  }

  async execute(input, context = {}) {
    const { path: filePath, content } = input;
    const fullPath = path.resolve(context.cwd || process.cwd(), filePath);
    
    try {
      // 确保目录存在
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      
      return {
        success: true,
        path: filePath,
        bytes: Buffer.byteLength(content, 'utf-8')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      };
    }
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['path', 'content']
      }
    };
  }
}


/**
 * FileEdit Tool - 编辑文件
 */
export class FileEditTool {
  constructor() {
    this.name = 'edit';
    this.description = 'Edit file by string replacement';
  }

  async execute(input, context = {}) {
    const { path: filePath, oldString, newString } = input;
    const fullPath = path.resolve(context.cwd || process.cwd(), filePath);
    
    try {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // 检查是否找到目标字符串
      if (!content.includes(oldString)) {
        return {
          success: false,
          error: 'Target string not found',
          path: filePath
        };
      }
      
      // 替换
      content = content.replace(oldString, newString);
      fs.writeFileSync(fullPath, content, 'utf-8');
      
      return {
        success: true,
        path: filePath,
        replacements: 1
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: filePath
      };
    }
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to edit' },
          oldString: { type: 'string', description: 'Text to replace' },
          newString: { type: 'string', description: 'Replacement text' }
        },
        required: ['path', 'oldString', 'newString']
      }
    };
  }
}


/**
 * Glob Tool - 文件模式匹配
 */
export class GlobTool {
  constructor() {
    this.name = 'glob';
    this.description = 'Find files by pattern';
  }

  async execute(input, context = {}) {
    const { pattern, cwd = context.cwd || process.cwd() } = input;
    
    try {
      // 简单的glob实现
      const results = await this.glob(pattern, cwd);
      
      return {
        success: true,
        files: results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        pattern
      };
    }
  }

  async glob(pattern, cwd) {
    const results = [];
    const normalizedPattern = pattern.replace(/\//g, path.sep);
    
    // 解析pattern
    const parts = normalizedPattern.split('**');
    let baseDir = cwd;
    let globPart = '';
    
    if (parts.length > 1) {
      baseDir = path.join(cwd, parts[0] || '.');
      globPart = parts[1];
    } else {
      const lastSep = normalizedPattern.lastIndexOf(path.sep);
      if (lastSep > 0) {
        baseDir = path.join(cwd, normalizedPattern.substring(0, lastSep));
        globPart = normalizedPattern.substring(lastSep + 1);
      } else {
        globPart = normalizedPattern;
      }
    }
    
    // 递归搜索
    await this.searchDir(baseDir, globPart, results);
    
    return results;
  }

  async searchDir(dir, pattern, results) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const regex = this.patternToRegex(pattern);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await this.searchDir(fullPath, pattern, results);
      } else if (entry.isFile() && regex.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  patternToRegex(pattern) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'File pattern (e.g., **/*.js)' },
          cwd: { type: 'string', description: 'Working directory' }
        },
        required: ['pattern']
      }
    };
  }
}


/**
 * Grep Tool - 内容搜索
 */
export class GrepTool {
  constructor() {
    this.name = 'grep';
    this.description = 'Search file contents';
  }

  async execute(input, context = {}) {
    const { pattern, path: searchPath, cwd = context.cwd || process.cwd() } = input;
    
    try {
      const results = await this.grep(pattern, searchPath, cwd);
      
      return {
        success: true,
        matches: results,
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        pattern
      };
    }
  }

  async grep(pattern, searchPath, cwd) {
    const results = [];
    const targetPath = path.resolve(cwd, searchPath || '.');
    const regex = new RegExp(pattern, 'gi');
    
    await this.searchFile(targetPath, regex, results);
    
    return results;
  }

  async searchFile(filePath, regex, results) {
    if (!fs.existsSync(filePath)) return;
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(filePath);
      for (const entry of entries) {
        if (!entry.startsWith('.')) {
          await this.searchFile(path.join(filePath, entry), regex, results);
        }
      }
    } else if (stat.isFile()) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({
            file: filePath,
            line: i + 1,
            content: lines[i].trim()
          });
          regex.lastIndex = 0; // 重置regex
        }
      }
    }
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search pattern (regex)' },
          path: { type: 'string', description: 'Path to search' },
          cwd: { type: 'string', description: 'Working directory' }
        },
        required: ['pattern']
      }
    };
  }
}


/**
 * WebFetch Tool - 获取网页内容
 */
export class WebFetchTool {
  constructor() {
    this.name = 'webfetch';
    this.description = 'Fetch URL content';
  }

  async execute(input, context = {}) {
    const { url, maxChars = 5000 } = input;
    
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
          if (data.length > maxChars * 2) {
            req.destroy();
          }
        });
        
        res.on('end', () => {
          if (data.length > maxChars) {
            data = data.substring(0, maxChars) + '...[truncated]';
          }
          
          resolve({
            success: true,
            url,
            content: data,
            size: data.length
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          url,
          error: error.message
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          url,
          error: 'Timeout'
        });
      });
    });
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' },
          maxChars: { type: 'number', description: 'Maximum characters' }
        },
        required: ['url']
      }
    };
  }
}


/**
 * TodoWrite Tool - 写TODO
 */
export class TodoWriteTool {
  constructor() {
    this.name = 'todo';
    this.description = 'Write todo items';
  }

  async execute(input, context = {}) {
    const { content, file = 'TODO.md' } = input;
    const todoPath = path.resolve(context.cwd || process.cwd(), file);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const todoLine = `- [ ] ${content} (${timestamp})`;
    
    try {
      let existing = '';
      if (fs.existsSync(todoPath)) {
        existing = fs.readFileSync(todoPath, 'utf-8');
      }
      
      fs.writeFileSync(todoPath, existing + '\n' + todoLine, 'utf-8');
      
      return {
        success: true,
        todo: todoLine,
        file
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getSpec() {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Todo content' },
          file: { type: 'string', description: 'Todo file path' }
        },
        required: ['content']
      }
    };
  }
}


/**
 * 工具集合
 */
export const defaultTools = [
  new BashTool(),
  new FileReadTool(),
  new FileWriteTool(),
  new FileEditTool(),
  new GlobTool(),
  new GrepTool(),
  new WebFetchTool(),
  new TodoWriteTool()
];


export default {
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  WebFetchTool,
  TodoWriteTool,
  defaultTools
};