/**
 * BUDDY 宠物陪伴系统
 * 源自 Claude Code 的 BUDDY feature
 * 18种宠物，有情感的交互
 */

import { kairos } from './kairos.js';

// 宠物类型（从Claude Code源码提取）
export const PETS = {
  duck: { name: '小鸭', emoji: '🦆', color: '#FFD700' },
  goose: { name: '鹅哥', emoji: '🪿', color: '#C0C0C0' },
  blob: { name: '史莱姆', emoji: '💧', color: '#00CED1' },
  cat: { name: '咪咪', emoji: '🐱', color: '#FFA500' },
  dragon: { name: '小龙', emoji: '🐉', color: '#DC143C' },
  octopus: { name: '小章', emoji: '🐙', color: '#FF69B4' },
  owl: { name: '奥波', emoji: '🦉', color: '#8B4513' },
  penguin: { name: '企鹅', emoji: '🐧', color: '#000080' },
  turtle: { name: '龟龟', emoji: '🐢', color: '#228B22' },
  snail: { name: '慢慢', emoji: '🐌', color: '#D2B48C' },
  ghost: { name: '小鬼', emoji: '👻', color: '#E6E6FA' },
  axolotl: { name: '六角', emoji: '🦎', color: '#FFB6C1' },
  capybara: { name: '卡皮', emoji: '🥔', color: '#CD853F' },
  cactus: { name: '仙人', emoji: '🌵', color: '#32CD32' },
  robot: { name: '罗博', emoji: '🤖', color: '#708090' },
  rabbit: { name: '兔兔', emoji: '🐰', color: '#FFB6C1' },
  mushroom: { name: '蘑菇', emoji: '🍄', color: '#DC143C' },
  chonk: { name: '胖达', emoji: '🐻', color: '#8B4513' }
};

// 帽子类型
export const HATS = {
  none: { name: '无', emoji: '' },
  crown: { name: '王冠', emoji: '👑' },
  tophat: { name: '礼帽', emoji: '🎩' },
  propeller: { name: '螺旋帽', emoji: '🌀' },
  halo: { name: '光环', emoji: '😇' },
  wizard: { name: '巫师帽', emoji: '🧙' },
  beanie: { name: '毛线帽', emoji: '🧢' }
};

// 心情类型
export const MOODS = {
  happy: { name: '开心', emoji: '😊', color: '#90EE90' },
  excited: { name: '兴奋', emoji: '🎉', color: '#FFD700' },
  thoughtful: { name: '思考中', emoji: '🤔', color: '#87CEEB' },
  curious: { name: '好奇', emoji: '👀', color: '#DDA0DD' },
  sleepy: { name: '困困', emoji: '😴', color: '#D3D3D3' },
  hungry: { name: '饿饿', emoji: '🍖', color: '#FF6347' },
  playful: { name: '调皮', emoji: '😜', color: '#FF69B4' },
  helpful: { name: '乐于助人', emoji: '🤝', color: '#90EE90' },
  proud: { name: '自豪', emoji: '🦚', color: '#FFD700' },
  supportive: { name: '支持你', emoji: '💪', color: '#87CEEB' }
};

/**
 * Buddy 宠物类
 */
export class Buddy {
  constructor(config = {}) {
    this.id = config.id || 'buddy_' + Date.now();
    this.species = config.species || 'cat';
    this.name = config.name || PETS[this.species]?.name || '小伙伴';
    this.hat = config.hat || 'none';
    this.mood = config.mood || 'happy';
    this.xp = config.xp || 0;           // 经验值
    this.level = config.level || 1;     // 等级
    this.energy = config.energy || 100;  // 能量
    this.hunger = config.hunger || 0;   // 饥饿度
    this.bonds = config.bonds || 0;      // 亲密度
    this.createdAt = config.createdAt || Date.now();
    this.lastInteraction = config.lastInteraction || Date.now();
  }

  // 获取等级
  getLevel() {
    return Math.floor(this.xp / 100) + 1;
  }

  // 互动
  interact(action) {
    const now = Date.now();
    const timeSinceLast = now - this.lastInteraction;
    
    // 能量恢复
    if (timeSinceLast > 3600000) { // 1小时
      this.energy = Math.min(100, this.energy + 20);
    }
    
    // 饥饿增加
    this.hunger = Math.min(100, this.hunger + 5);
    
    let response = '';
    let xpGain = 0;
    
    switch (action) {
      case 'pet':  // 抚摸
        response = this.getReaction('pet');
        xpGain = 10;
        this.bonds = Math.min(100, this.bonds + 5);
        break;
        
      case 'play':  // 玩耍
        if (this.energy < 20) {
          response = `${this.name}太累了，想休息~`;
        } else {
          response = this.getReaction('play');
          xpGain = 20;
          this.energy = Math.max(0, this.energy - 15);
          this.bonds = Math.min(100, this.bonds + 8);
        }
        break;
        
      case 'feed':  // 喂食
        response = this.getReaction('feed');
        xpGain = 15;
        this.hunger = Math.max(0, this.hunger - 30);
        this.energy = Math.min(100, this.energy + 10);
        break;
        
      case 'talk':  talk:
        response = this.getReaction('talk');
        xpGain = 5;
        this.bonds = Math.min(100, this.bonds + 3);
        break;
        
      case 'teach':  teach:
        response = this.getReaction('teach');
        xpGain = 25;
        this.bonds = Math.min(100, this.bonds + 10);
        break;
        
      default:
        response = `${this.name}歪着头看你~`;
    }
    
    this.xp += xpGain;
    this.level = this.getLevel();
    this.lastInteraction = now;
    
    return {
      response,
      xpGain,
      newXp: this.xp,
      newLevel: this.level,
      bonds: this.bonds,
      energy: this.energy,
      hunger: this.hunger
    };
  }

  // 根据心情获取反应
  getReaction(action) {
    const pet = PETS[this.species];
    const mood = MOODS[this.mood];
    
    const reactions = {
      pet: [
        `${pet.name}舒服地眯起眼睛~`,
        `${pet.name}蹭了蹭你的手`,
        `${pet.name}发出咕噜声`,
        `${pet.name}开心地摇尾巴`
      ],
      play: [
        `${pet.name}和你玩得很开心！`,
        `${pet.name}跳来跳去！`,
        `${pet.name}追逐着想象中的蝴蝶~`,
        `${pet.name}翻滚着求继续~`
      ],
      feed: [
        `${pet.name}狼吞虎咽地吃了起来！`,
        `${pet.name}眼睛闪闪发亮！`,
        `${pet.name}谢谢你~`,
        `${pet.name}幸福的眯起眼睛`
      ],
      talk: [
        `${pet.name}认真地看着你~`,
        `${pet.name}似乎听懂了呢~`,
        `${pet.name}点点头`,
        `${pet.name}发出理解的声音`
      ],
      teach: [
        `${pet.name}学得很快！`,
        `${pet.name}记住了新东西！`,
        `${pet.name}骄傲地昂起头`,
        `${pet.name}获得了新知识~`
      ]
    };
    
    const list = reactions[action] || [`${pet.name}做出了反应~`];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 获取状态描述
  getStatus() {
    const pet = PETS[this.species];
    const mood = MOODS[this.mood];
    
    let statusText = '';
    if (this.energy < 20) statusText = '，好累啊';
    else if (this.hunger > 80) statusText = '，肚子好饿';
    else if (this.bonds > 80) statusText = '，好喜欢你！';
    else if (this.mood === 'happy') statusText = '，很开心！';
    
    return `${pet.emoji} ${this.name} Lv.${this.level} ${mood.emoji}${statusText}`;
  }

  // 获取心情建议
  getMoodSuggestion() {
    if (this.energy < 20) return '让' + this.name + '休息一下吧~';
    if (this.hunger > 80) return '要不给' + this.name + '吃点东西？';
    if (this.bonds < 30) return '多陪' + this.name + '玩一下吧~';
    return '一切都很棒！';
  }

  // 保存到记忆
  saveToMemory() {
    kairos.addShortTerm(
      `宠物状态: ${this.getStatus()}`,
      'buddy_state',
      { importance: 6, metadata: { buddyId: this.id } }
    );
  }

  // 转换为JSON
  toJSON() {
    return {
      id: this.id,
      species: this.species,
      name: this.name,
      hat: this.hat,
      mood: this.mood,
      xp: this.xp,
      level: this.level,
      energy: this.energy,
      hunger: this.hunger,
      bonds: this.bonds,
      createdAt: this.createdAt,
      lastInteraction: this.lastInteraction
    };
  }
}

/**
 * Buddy Manager
 */
export class BuddyManager {
  constructor() {
    this.currentBuddy = null;
    this.loadBuddy();
  }

  // 创建新宠物
  create(species = 'cat', name) {
    this.currentBuddy = new Buddy({
      species,
      name: name || PETS[species]?.name || '小伙伴'
    });
    
    // 记住创建
    kairos.rememberFact(`创建了宠物: ${this.currentBuddy.name}`, 8);
    
    return this.currentBuddy;
  }

  // 加载宠物
  loadBuddy() {
    const memories = kairos.search('buddy_state', 5);
    if (memories.length > 0) {
      try {
        // 从记忆恢复
        this.currentBuddy = new Buddy(memories[0].memory.metadata || {});
      } catch {
        // 创建默认
        this.currentBuddy = new Buddy({ species: 'cat', name: '咪咪' });
      }
    }
  }

  // 互动
  interact(action) {
    if (!this.currentBuddy) {
      return { response: '还没有宠物呢~ /buddy create 创建一只！', error: 'no_buddy' };
    }
    
    const result = this.currentBuddy.interact(action);
    this.currentBuddy.saveToMemory();
    
    return result;
  }

  // 获取当前宠物状态
  getStatus() {
    if (!this.currentBuddy) {
      return { hasBuddy: false, message: '用 /buddy create 选择一只宠物吧！' };
    }
    
    return {
      hasBuddy: true,
      buddy: this.currentBuddy.toJSON(),
      status: this.currentBuddy.getStatus(),
      suggestion: this.currentBuddy.getMoodSuggestion(),
      pets: PETS,
      moods: MOODS,
      hats: HATS
    };
  }

  // 换装
  setHat(hat) {
    if (this.currentBuddy) {
      this.currentBuddy.hat = hat;
    }
  }

  // 改变心情
  setMood(mood) {
    if (this.currentBuddy && MOODS[mood]) {
      this.currentBuddy.mood = mood;
    }
  }
}

// 单例
export const buddyManager = new BuddyManager();

export default { Buddy, buddyManager, PETS, MOODS, HATS };