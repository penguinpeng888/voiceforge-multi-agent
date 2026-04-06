/**
 * Persistent Memory System - 4层持久记忆复刻
 * 
 * 4层记忆类型:
 * 1. User memories - 用户角色、专业技能、工作风格
 * 2. Feedback memories - 纠正和确认的方法
 * 3. Project memories - 截止日期、决策、团队上下文
 * 4. Reference memories - 外部资源指针
 */

const fs = require('fs');
const path = require('path');

class PersistentMemory {
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || './memory';
    this.userId = options.userId || 'default';
    
    // 4层记忆
    this.layers = {
      user: new Map(),      // 用户记忆
      feedback: new Map(),  // 反馈记忆
      project: new Map(),   // 项目记忆
      reference: new Map()  // 引用记忆
    };
    
    this.load();
  }

  /**
   * 获取记忆文件路径
   */
  getMemoryPath(type) {
    return path.join(this.memoryDir, `${this.userId}_${type}.json`);
  }

  /**
   * 加载所有记忆
   */
  load() {
    for (const type of Object.keys(this.layers)) {
      const filePath = this.getMemoryPath(type);
      try {
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          this.layers[type] = new Map(Object.entries(data));
        }
      } catch (e) {
        console.error(`Failed to load ${type} memory:`, e);
      }
    }
  }

  /**
   * 保存记忆到文件
   */
  save(type) {
    const filePath = this.getMemoryPath(type);
    const data = Object.fromEntries(this.layers[type]);
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // ============ User Memories ============
  
  /**
   * 设置用户信息
   */
  setUserInfo(key, value) {
    this.layers.user.set(key, {
      value,
      updatedAt: Date.now()
    });
    this.save('user');
  }

  /**
   * 获取用户信息
   */
  getUserInfo(key) {
    return this.layers.user.get(key)?.value;
  }

  /**
   * 获取所有用户信息
   */
  getAllUserInfo() {
    return Object.fromEntries(this.layers.user);
  }

  // ============ Feedback Memories ============

  /**
   * 添加反馈记忆（纠正）
   */
  addFeedback(correction) {
    const id = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.layers.feedback.set(id, {
      type: 'correction',
      original: correction.original,
      corrected: correction.corrected,
      context: correction.context,
      confirmed: false,
      createdAt: Date.now()
    });
    this.save('feedback');
    return id;
  }

  /**
   * 确认反馈（用户确认后）
   */
  confirmFeedback(id) {
    const feedback = this.layers.feedback.get(id);
    if (feedback) {
      feedback.confirmed = true;
      feedback.confirmedAt = Date.now();
      this.save('feedback');
    }
  }

  /**
   * 检查是否犯过同样错误
   */
  checkPastMistakes(query) {
    const mistakes = [];
    for (const [id, fb] of this.layers.feedback) {
      if (fb.type === 'correction' && fb.confirmed) {
        // 简单关键词匹配
        const keywords = fb.original.toLowerCase().split(' ');
        const match = keywords.some(k => query.toLowerCase().includes(k));
        if (match) {
          mistakes.push(fb);
        }
      }
    }
    return mistakes;
  }

  // ============ Project Memories ============

  /**
   * 添加项目记忆
   */
  addProjectMemory(key, value) {
    this.layers.project.set(key, {
      value,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    this.save('project');
  }

  /**
   * 获取项目记忆
   */
  getProjectMemory(key) {
    return this.layers.project.get(key)?.value;
  }

  /**
   * 列出所有项目记忆键
   */
  listProjectKeys() {
    return Array.from(this.layers.project.keys());
  }

  // ============ Reference Memories ============

  /**
   * 添加引用（外部资源指针）
   */
  addReference(type, name, url, description = '') {
    const id = `ref_${Date.now()}`;
    this.layers.reference.set(id, {
      type, // linear, grafana, slack, notion, etc.
      name,
      url,
      description,
      createdAt: Date.now()
    });
    this.save('reference');
    return id;
  }

  /**
   * 按类型获取引用
   */
  getReferencesByType(type) {
    const refs = [];
    for (const ref of this.layers.reference.values()) {
      if (ref.type === type) {
        refs.push(ref);
      }
    }
    return refs;
  }

  /**
   * 搜索引用
   */
  searchReferences(query) {
    const results = [];
    for (const ref of this.layers.reference.values()) {
      const text = `${ref.name} ${ref.description} ${ref.type}`.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        results.push(ref);
      }
    }
    return results;
  }

  // ============ 记忆整合（类似 KAIROS autoDream） ============

  /**
   * 记忆整合 - 清理和压缩
   */
  consolidate() {
    const now = Date.now();
    const thirtyDaysAgo = 30 * 24 * 60 * 60 * 1000;
    
    // 清理旧的未确认反馈（超过30天）
    for (const [id, fb] of this.layers.feedback) {
      if (!fb.confirmed && (now - fb.createdAt) > thirtyDaysAgo) {
        this.layers.feedback.delete(id);
      }
    }
    
    // 清理旧的引用（超过90天）
    const ninetyDaysAgo = 90 * 24 * 60 * 60 * 1000;
    for (const [id, ref] of this.layers.reference) {
      if ((now - ref.createdAt) > ninetyDaysAgo) {
        this.layers.reference.delete(id);
      }
    }
    
    // 保存所有
    for (const type of Object.keys(this.layers)) {
      this.save(type);
    }
    
    return {
      feedbackCount: this.layers.feedback.size,
      referenceCount: this.layers.reference.size
    };
  }

  /**
   * 获取所有记忆（用于注入上下文）
   */
  getAllForContext() {
    return {
      user: Object.fromEntries(this.layers.user),
      feedback: Array.from(this.layers.feedback.values()).filter(f => f.confirmed),
      project: Object.fromEntries(this.layers.project),
      references: Array.from(this.layers.reference.values())
    };
  }

  /**
   * 生成记忆摘要
   */
  generateSummary() {
    return {
      userInfo: this.layers.user.size + ' 项',
      feedback: this.layers.feedback.size + ' 条（' + 
        Array.from(this.layers.feedback.values()).filter(f => f.confirmed).length + ' 已确认）',
      project: this.layers.project.size + ' 项',
      references: this.layers.reference.size + ' 个外部资源'
    };
  }
}

module.exports = PersistentMemory;