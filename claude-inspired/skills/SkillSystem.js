/**
 * Claude Code inspired Skill System
 * 基于 Claude Code 源码中的 skills/ 目录简化实现
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Skill 定义
 */
export class Skill {
  constructor(config) {
    this.name = config.name;
    this.description = config.description || '';
    this.trigger = config.trigger || `/${config.name}`;
    this.prompt = config.prompt || '';
    this.tools = config.tools || [];
    this.enabled = config.enabled !== false;
    this.source = config.source || 'user'; // 'bundled' | 'user' | 'mcp'
  }

  // 获取Skill定义
  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      trigger: this.trigger,
      enabled: this.enabled,
      source: this.source
    };
  }

  // 启用/禁用
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  toggle() { this.enabled = !this.enabled; }
}


/**
 * Skill 加载器
 */
export class SkillLoader {
  constructor(skillDir) {
    this.skillDir = skillDir || path.join(process.cwd(), 'skills');
    this.skills = new Map();
  }

  // 加载单个Skill (从SKILL.md)
  async loadSkill(skillPath) {
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    
    if (!fs.existsSync(skillMdPath)) {
      return null;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const name = path.basename(skillPath);
    
    // 解析SKILL.md
    const skill = this.parseSkillMd(name, content);
    skill.source = 'user';
    
    return skill;
  }

  // 解析SKILL.md格式
  parseSkillMd(name, content) {
    const lines = content.split('\n');
    let description = '';
    let trigger = `/${name}`;
    let prompt = '';
    let readingPrompt = false;
    let promptLines = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // 忽略标题
        continue;
      }
      if (line.startsWith('Trigger:')) {
        trigger = line.replace('Trigger:', '').trim();
        continue;
      }
      if (line.startsWith('### ')) {
        if (line.includes('Prompt') || line.includes('Description')) {
          readingPrompt = true;
          continue;
        }
      }
      if (readingPrompt) {
        if (line.startsWith('#') || line.startsWith('##')) {
          readingPrompt = false;
          prompt = promptLines.join('\n').trim();
          promptLines = [];
        } else {
          promptLines.push(line);
        }
      }
      // 第一段非空非标题内容作为description
      if (!description && line.trim() && !line.startsWith('#')) {
        description = line.trim();
      }
    }

    if (promptLines.length > 0) {
      prompt = promptLines.join('\n').trim();
    }

    return new Skill({
      name,
      description,
      trigger,
      prompt,
      enabled: true
    });
  }

  // 加载所有Skills
  async loadAll() {
    if (!fs.existsSync(this.skillDir)) {
      console.log(`Skill directory does not exist: ${this.skillDir}`);
      return [];
    }

    const entries = fs.readdirSync(this.skillDir, { withFileTypes: true });
    const skills = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(this.skillDir, entry.name);
        const skill = await this.loadSkill(skillPath);
        if (skill) {
          this.skills.set(skill.name, skill);
          skills.push(skill);
        }
      }
    }

    return skills;
  }

  // 注册Skill
  register(skill) {
    if (skill instanceof Skill) {
      this.skills.set(skill.name, skill);
    }
  }

  // 获取Skill
  get(name) {
    return this.skills.get(name);
  }

  // 检查Skill是否存在
  has(name) {
    return this.skills.has(name);
  }

  // 获取所有Skills
  getAll() {
    return Array.from(this.skills.values());
  }

  // 获取启用的Skills
  getEnabled() {
    return this.getAll().filter(s => s.enabled);
  }

  // 搜索Skills
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
    );
  }
}


/**
 * 内置Skills (类似Claude Code的bundled skills)
 */
export const bundledSkills = [
  new Skill({
    name: 'batch',
    description: '批量处理多个任务',
    trigger: '/batch',
    prompt: '批量执行多个命令或任务',
    source: 'bundled'
  }),
  new Skill({
    name: 'debug',
    description: '调试模式和诊断',
    trigger: '/debug',
    prompt: '进入调试模式，帮助诊断问题',
    source: 'bundled'
  }),
  new Skill({
    name: 'remember',
    description: '记忆重要信息',
    trigger: '/remember',
    prompt: '记住重要信息到长期记忆',
    source: 'bundled'
  }),
  new Skill({
    name: 'verify',
    description: '验证实现是否正确',
    trigger: '/verify',
    prompt: '验证代码或功能的正确性',
    source: 'bundled'
  }),
  new Skill({
    name: 'stuck',
    description: '处理卡住的情况',
    trigger: '/stuck',
    prompt: '当任务卡住时提供帮助',
    source: 'bundled'
  }),
  new Skill({
    name: 'schedule',
    description: '安排定时任务',
    trigger: '/schedule',
    prompt: '创建和管理定时任务',
    source: 'bundled'
  })
];


/**
 * Skill执行器
 */
export class SkillExecutor {
  constructor(skillLoader) {
    this.skillLoader = skillLoader;
  }

  // 执行Skill
  async execute(skillName, input, context = {}) {
    const skill = this.skillLoader.get(skillName);
    
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    if (!skill.enabled) {
      throw new Error(`Skill is disabled: ${skillName}`);
    }

    // 执行Skill的prompt逻辑
    return {
      skill: skill.name,
      input,
      output: skill.prompt || `执行技能: ${skill.name}`,
      context
    };
  }

  // 匹配trigger
  matchTrigger(trigger) {
    const skills = this.skillLoader.getAll();
    return skills.find(s => s.trigger === trigger || s.name === trigger);
  }
}


// 默认Skill加载器
export const defaultSkillLoader = new SkillLoader();

// 加载内置Skills
bundledSkills.forEach(s => defaultSkillLoader.register(s));


export default {
  Skill,
  SkillLoader,
  SkillExecutor,
  bundledSkills,
  defaultSkillLoader
};