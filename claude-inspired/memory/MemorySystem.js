/**
 * Claude Code inspired Memory System
 * 基于 Claude Code 源码中的 memdir/ 目录简化实现
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Memory 类型
 */
export const MemoryType = {
  SHORT_TERM: 'short_term',   // 短期记忆 (当前会话)
  LONG_TERM: 'long_term',     // 长期记忆 (MEMORY.md)
  WORKING: 'working',         // 工作记忆 (当前任务)
  EPISODIC: 'episodic',       // 情景记忆 (事件序列)
  SEMANTIC: 'semantic'        // 语义记忆 (知识)
};

/**
 * Memory 条目
 */
export class Memory {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.type = config.type || MemoryType.SHORT_TERM;
    this.content = config.content || '';
    this.keywords = config.keywords || [];
    this.importance = config.importance || 1; // 1-10
    this.createdAt = config.createdAt || Date.now();
    this.accessedAt = config.accessedAt || Date.now();
    this.accessCount = config.accessCount || 0;
    this.tags = config.tags || [];
    this.metadata = config.metadata || {};
    this.sessionId = config.sessionId || null;
  }

  generateId() {
    return 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 访问
  access() {
    this.accessedAt = Date.now();
    this.accessCount++;
    return this;
  }

  // 更新内容
  update(content) {
    this.content = content;
    return this;
  }

  // 获取摘要
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      preview: this.content.substring(0, 100),
      importance: this.importance,
      createdAt: this.createdAt,
      accessCount: this.accessCount
    };
  }
}


/**
 * Memory 管理器
 */
export class MemoryManager {
  constructor(options = {}) {
    this.shortTerm = new Map();    // 当前会话
    this.longTermFile = options.longTermFile || path.join(process.cwd(), 'MEMORY.md');
    this.workspace = options.workspace || process.cwd();
    
    // 配置
    this.maxShortTerm = options.maxShortTerm || 100;
    this.autoCompactThreshold = options.autoCompactThreshold || 50;
    this.importanceThreshold = options.importanceThreshold || 5;
    
    // 加载长期记忆
    this.longTerm = [];
    this.loadLongTerm();
  }

  // 加载长期记忆
  loadLongTerm() {
    if (fs.existsSync(this.longTermFile)) {
      const content = fs.readFileSync(this.longTermFile, 'utf-8');
      // 解析MEMORY.md格式
      this.longTerm = this.parseMemoryFile(content);
    }
  }

  // 解析MEMORY.md
  parseMemoryFile(content) {
    const memories = [];
    const lines = content.split('\n');
    let currentMem = null;
    let readingContent = false;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // 新的记忆条目
        if (currentMem) memories.push(currentMem);
        currentMem = new Memory({
          type: MemoryType.LONG_TERM,
          content: line.replace('## ', '').trim(),
          importance: 5
        });
        readingContent = true;
      } else if (readingContent && line.startsWith('- **')) {
        // 提取元数据
        if (line.includes('重要性')) {
          const match = line.match(/(\d+)/);
          if (match) currentMem.importance = parseInt(match[1]);
        }
      } else if (readingContent && line.trim() === '') {
        readingContent = false;
      } else if (readingContent && currentMem) {
        currentMem.content += '\n' + line;
      }
    }
    
    if (currentMem) memories.push(currentMem);
    return memories;
  }

  // 保存到长期记忆
  saveToLongTerm(memory) {
    // 如果是短期记忆，转为长期
    if (memory.type === MemoryType.SHORT_TERM) {
      memory.type = MemoryType.LONG_TERM;
    }
    
    // 检查是否已存在
    const existing = this.longTerm.find(m => m.id === memory.id);
    if (existing) {
      Object.assign(existing, memory);
    } else {
      this.longTerm.push(memory);
    }
    
    // 保存到文件
    this.persistLongTerm();
  }

  // 持久化长期记忆
  persistLongTerm() {
    const lines = ['# 长期记忆\n'];
    
    for (const mem of this.longTerm) {
      lines.push(`## ${mem.content.split('\n')[0].substring(0, 100)}`);
      lines.push(`- 类型: ${mem.type}`);
      lines.push(`- 重要性: ${mem.importance}`);
      lines.push(`- 创建: ${new Date(mem.createdAt).toISOString()}`);
      lines.push('');
      lines.push(mem.content);
      lines.push('');
    }
    
    fs.writeFileSync(this.longTermFile, lines.join('\n'), 'utf-8');
  }

  // 添加短期记忆
  addShortTerm(content, options = {}) {
    const memory = new Memory({
      type: MemoryType.SHORT_TERM,
      content,
      keywords: options.keywords || this.extractKeywords(content),
      importance: options.importance || 5,
      tags: options.tags || [],
      sessionId: options.sessionId || null
    });
    
    this.shortTerm.set(memory.id, memory);
    
    // 检查是否需要压缩
    if (this.shortTerm.size > this.autoCompactThreshold) {
      this.compact();
    }
    
    return memory;
  }

  // 提取关键词
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    // 去重并返回前10个
    return [...new Set(words)].slice(0, 10);
  }

  // 搜索记忆
  search(query, options = {}) {
    const results = [];
    const queryLower = query.toLowerCase();
    const searchShortTerm = options.shortTerm !== false;
    const searchLongTerm = options.longTerm !== false;
    const limit = options.limit || 10;

    // 搜索短期记忆
    if (searchShortTerm) {
      for (const mem of this.shortTerm.values()) {
        const score = this.calculateRelevance(mem, queryLower);
        if (score > 0) {
          results.push({ memory: mem.access(), score });
        }
      }
    }

    // 搜索长期记忆
    if (searchLongTerm) {
      for (const mem of this.longTerm) {
        const score = this.calculateRelevance(mem, queryLower);
        if (score > 0) {
          results.push({ memory: mem, score });
        }
      }
    }

    // 排序并返回
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.memory);
  }

  // 计算相关性得分
  calculateRelevance(memory, query) {
    let score = 0;
    
    // 内容匹配
    if (memory.content.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // 关键词匹配
    for (const kw of memory.keywords) {
      if (query.includes(kw)) score += 5;
    }
    
    // 标签匹配
    for (const tag of memory.tags) {
      if (query.includes(tag)) score += 3;
    }
    
    // 重要性加权
    score += memory.importance;
    
    // 访问频率加权
    score += Math.min(memory.accessCount, 10);
    
    return score;
  }

  // 获取相关记忆
  getRelevantMemories(context, limit = 5) {
    // 提取上下文关键词
    const keywords = this.extractKeywords(JSON.stringify(context));
    
    // 搜索
    const results = [];
    const allMemories = [...this.shortTerm.values(), ...this.longTerm];
    
    for (const mem of allMemories) {
      let score = 0;
      for (const kw of keywords) {
        if (mem.keywords.includes(kw)) score += 3;
        if (mem.content.toLowerCase().includes(kw)) score += 1;
      }
      
      if (score > 0) {
        results.push({ memory: mem, score });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.memory);
  }

  // 压缩短期记忆
  compact() {
    // 保留重要和频繁访问的
    const toKeep = [];
    const toPromote = [];
    
    for (const mem of this.shortTerm.values()) {
      if (mem.importance >= this.importanceThreshold || mem.accessCount > 5) {
        toKeep.push(mem);
      } else if (mem.importance >= 3) {
        toPromote.push(mem);
      }
    }
    
    // 清除并重建
    this.shortTerm.clear();
    toKeep.forEach(m => this.shortTerm.set(m.id, m));
    
    // 将重要的转为长期记忆
    for (const mem of toPromote) {
      this.saveToLongTerm(mem);
    }
    
    console.log(`Memory compacted: kept ${toKeep.length}, promoted ${toPromote.length}`);
  }

  // 获取统计
  getStats() {
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTerm.length,
      total: this.shortTerm.size + this.longTerm.length
    };
  }

  // 清理
  clear() {
    this.shortTerm.clear();
  }
}

// 默认Memory管理器
export const memoryManager = new MemoryManager();


/**
 * Context Builder - 构建prompt上下文
 */
export class ContextBuilder {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.systemPrompt = '';
    this.relevantMemories = [];
    this.recentHistory = [];
  }

  // 添加系统提示
  addSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    return this;
  }

  // 添加相关记忆
  addRelevantMemories(context, limit = 5) {
    this.relevantMemories = this.memoryManager.getRelevantMemories(context, limit);
    return this;
  }

  // 添加历史记录
  addHistory(messages, limit = 10) {
    this.recentHistory = messages.slice(-limit);
    return this;
  }

  // 构建完整上下文
  build() {
    const parts = [];
    
    // 系统提示
    if (this.systemPrompt) {
      parts.push(this.systemPrompt);
    }
    
    // 相关记忆
    if (this.relevantMemories.length > 0) {
      parts.push('\n### 相关记忆');
      for (const mem of this.relevantMemories) {
        parts.push(`- ${mem.content.substring(0, 200)}`);
      }
    }
    
    // 历史记录
    if (this.recentHistory.length > 0) {
      parts.push('\n### 最近对话');
      for (const msg of this.recentHistory) {
        const role = msg.role || 'user';
        const content = typeof msg.content === 'string' 
          ? msg.content.substring(0, 100) 
          : JSON.stringify(msg.content).substring(0, 100);
        parts.push(`${role}: ${content}`);
      }
    }
    
    return parts.join('\n\n');
  }

  // 重置
  reset() {
    this.systemPrompt = '';
    this.relevantMemories = [];
    this.recentHistory = [];
    return this;
  }
}


export default {
  Memory,
  MemoryManager,
  memoryManager,
  ContextBuilder,
  MemoryType
};