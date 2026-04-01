/**
 * KAIROS 持久化记忆系统
 * 源自 Claude Code 的 KAIROS feature
 * 跨会话记忆，不用每次从头开始
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 记忆存储目录
const MEMORY_DIR = path.join(__dirname, 'kairos-memory');

// 确保目录存在
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// 记忆类型
const MemoryType = {
  USER_PREFERENCE: 'user_preference',  // 用户偏好
  PROJECT_CONTEXT: 'project_context',   // 项目上下文
  CONVERSATION_SUMMARY: 'conversation_summary', // 会话摘要
  KEY_FACTS: 'key_facts',               // 关键事实
  RELATIONSHIPS: 'relationships',       // 人物关系
  SKILLS_LEARNED: 'skills_learned',     // 学到的技能
  TOOLS_CUSTOM: 'tools_custom',         // 自定义工具
  LONG_TERM: 'long_term'                // 长期记忆
};

/**
 * KAIROS Memory Core
 */
class KAIROSMemory {
  constructor() {
    this.shortTerm = new Map();     // 当前会话
    this.longTermCache = new Map(); // 长期记忆缓存
    this.dirty = new Set();         // 待写入
    
    // 加载长期记忆
    this.loadAll();
  }

  // 加载所有长期记忆
  loadAll() {
    const files = fs.readdirSync(MEMORY_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = JSON.parse(
            fs.readFileSync(path.join(MEMORY_DIR, file), 'utf-8')
          );
          this.longTermCache.set(data.id, data);
        } catch (e) {
          console.error(`Failed to load ${file}:`, e);
        }
      }
    }
    
    console.log(`KAIROS: Loaded ${this.longTermCache.size} memories`);
  }

  // 保存到长期记忆
  save(memory) {
    const filePath = path.join(MEMORY_DIR, `${memory.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
    this.longTermCache.set(memory.id, memory);
    this.dirty.delete(memory.id);
  }

  // 添加短期记忆
  addShortTerm(content, type = 'general', options = {}) {
    const id = `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memory = {
      id,
      type,
      content,
      keywords: this.extractKeywords(content),
      importance: options.importance || 5,
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      sessionId: options.sessionId || null,
      metadata: options.metadata || {}
    };
    
    this.shortTerm.set(id, memory);
    return memory;
  }

  // 提升为长期记忆
  promoteToLongTerm(memoryId, type = MemoryType.LONG_TERM) {
    const stMemory = this.shortTerm.get(memoryId);
    if (!stMemory) return null;
    
    const ltMemory = {
      ...stMemory,
      id: `lt_${Date.now()}`,
      type,
      promotedAt: Date.now()
    };
    
    this.save(ltMemory);
    this.shortTerm.delete(memoryId);
    
    return ltMemory;
  }

  // 提取关键词
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')  // 中文
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    return [...new Set(words)].slice(0, 20);
  }

  // 搜索记忆
  search(query, limit = 10) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    // 搜索短期记忆
    for (const [id, mem] of this.shortTerm) {
      const score = this.calculateRelevance(mem, queryLower);
      if (score > 0) {
        mem.accessCount++;
        mem.lastAccessed = Date.now();
        results.push({ memory: mem, score, source: 'shortTerm' });
      }
    }
    
    // 搜索长期记忆
    for (const [id, mem] of this.longTermCache) {
      const score = this.calculateRelevance(mem, queryLower);
      if (score > 0) {
        mem.accessCount++;
        mem.lastAccessed = Date.now();
        results.push({ memory: mem, score, source: 'longTerm' });
      }
    }
    
    // 排序返回
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 计算相关性分数
  calculateRelevance(memory, query) {
    let score = 0;
    const content = memory.content.toLowerCase();
    
    // 关键词匹配
    for (const kw of memory.keywords || []) {
      if (query.includes(kw)) score += 10;
    }
    
    // 内容匹配
    if (content.includes(query)) score += 20;
    
    // 重要性加权
    score += (memory.importance || 5);
    
    // 访问频率加权
    score += Math.min(memory.accessCount || 0, 10);
    
    return score;
  }

  // 获取用户偏好
  getPreferences(userId) {
    return this.search(`preference ${userId}`, 20)
      .map(r => r.memory);
  }

  // 保存用户偏好
  savePreference(key, value, userId = 'default') {
    const memory = this.addShortTerm(
      `${key}: ${value}`,
      MemoryType.USER_PREFERENCE,
      { importance: 8, metadata: { userId, key } }
    );
    
    this.promoteToLongTerm(memory.id, MemoryType.USER_PREFERENCE);
    return memory;
  }

  // 获取项目上下文
  getProjectContext(projectId) {
    return Array.from(this.longTermCache.values())
      .filter(m => m.type === MemoryType.PROJECT_CONTEXT && m.metadata?.projectId === projectId);
  }

  // 保存项目上下文
  saveProjectContext(projectId, context) {
    const memory = this.addShortTerm(
      context.substring(0, 5000),
      MemoryType.PROJECT_CONTEXT,
      { importance: 9, metadata: { projectId } }
    );
    
    this.promoteToLongTerm(memory.id, MemoryType.PROJECT_CONTEXT);
    return memory;
  }

  // 获取关键事实
  getKeyFacts() {
    return Array.from(this.longTermCache.values())
      .filter(m => m.type === MemoryType.KEY_FACTS)
      .sort((a, b) => b.importance - a.importance);
  }

  // 记住关键事实
  rememberFact(fact, importance = 7) {
    const memory = this.addShortTerm(
      fact,
      MemoryType.KEY_FACTS,
      { importance }
    );
    
    this.promoteToLongTerm(memory.id, MemoryType.KEY_FACTS);
    return memory;
  }

  // 获取所有相关记忆（构建context用）
  getRelevantContext(currentTask, limit = 5) {
    // 搜索相关记忆
    const results = this.search(currentTask, limit + 5);
    
    // 优先选择长期记忆和高重要性
    return results
      .sort((a, b) => {
        const aScore = (a.source === 'longTerm' ? 10 : 0) + a.memory.importance;
        const bScore = (b.source === 'longTerm' ? 10 : 0) + b.memory.importance;
        return bScore - aScore;
      })
      .slice(0, limit)
      .map(r => ({
        content: r.memory.content.substring(0, 200),
        type: r.memory.type,
        importance: r.memory.importance
      }));
  }

  // 自动压缩（类似Claude的compact）
  compact() {
    // 保留重要的
    const toKeep = [];
    const toPromote = [];
    
    for (const [id, mem] of this.shortTerm) {
      if (mem.importance >= 8 || mem.accessCount > 5) {
        toKeep.push(mem);
      } else if (mem.importance >= 5) {
        toPromote.push(mem);
      }
    }
    
    // 保留高频访问的
    this.shortTerm.clear();
    toKeep.forEach(m => this.shortTerm.set(m.id, m));
    
    // 提升重要的到长期
    for (const mem of toPromote) {
      this.promoteToLongTerm(mem.id);
    }
    
    console.log(`KAIROS compact: kept ${toKeep.length}, promoted ${toPromote.length}`);
  }

  // 获取统计
  getStats() {
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTermCache.size,
      total: this.shortTerm.size + this.longTermCache.size,
      byType: this.getTypeStats()
    };
  }

  getTypeStats() {
    const stats = {};
    for (const [id, mem] of this.longTermCache) {
      stats[mem.type] = (stats[mem.type] || 0) + 1;
    }
    return stats;
  }
}

// 单例
export const kairos = new KAIROSMemory();

export default { kairos, MemoryType };