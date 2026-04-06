/**
 * BUDDY 宠物系统
 * 支持 18 种物种、4 级稀有度、闪亮变体、5 项属性
 */

const fs = require('fs');
const path = require('path');

// ==================== 常量定义 ====================

const SPECIES = [
  'duck', 'dragon', 'axolotl', 'capybara', 'mushroom', 'ghost',
  'fox', 'cat', 'dog', 'owl', 'rabbit', 'bear',
  'penguin', 'tiger', 'panda', 'koala', 'sloth', 'hedgehog'
];

const RARITY = {
  COMMON: { name: 'Common', probability: 0.60, multiplier: 1 },
  RARE: { name: 'Rare', probability: 0.25, multiplier: 1.5 },
  EPIC: { name: 'Epic', probability: 0.14, multiplier: 2 },
  LEGENDARY: { name: 'Legendary', probability: 0.01, multiplier: 3 }
};

const ATTRIBUTES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];
const SHINY_CHANCE = 0.01; // 1% 闪亮概率

const STORAGE_FILE = path.join(__dirname, 'buddy-data.json');

// ==================== 工具函数 ====================

/**
 * 简单哈希函数 - 根据 userId 生成确定性结果
 */
function hashUserId(userId) {
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转为 32 位整数
  }
  return Math.abs(hash);
}

/**
 * 根据哈希值确定物种
 */
function determineSpecies(userId) {
  const hash = hashUserId(userId);
  return SPECIES[hash % SPECIES.length];
}

/**
 * 随机确定稀有度
 */
function determineRarity() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const rarity of Object.values(RARITY)) {
    cumulative += rarity.probability;
    if (rand < cumulative) {
      return rarity;
    }
  }
  return RARITY.COMMON;
}

/**
 * 判断是否为闪亮变体
 */
function isShiny() {
  return Math.random() < SHINY_CHANCE;
}

/**
 * 生成随机属性值 (1-100)
 */
function generateAttributeValue(rarity) {
  const base = Math.floor(Math.random() * 50) + 25; // 25-75
  const bonus = Math.floor(Math.random() * 25 * rarity.multiplier); // 根据稀有度加成
  return Math.min(100, base + bonus);
}

// ==================== 类定义 ====================

/**
 * Buddy 类 - 宠物实体
 */
class Buddy {
  constructor(userId, species, rarity, isShiny, attributes) {
    this.userId = userId;
    this.species = species;
    this.rarity = rarity;
    this.isShiny = isShiny;
    this.attributes = attributes;
    this.createdAt = Date.now();
    this.interactionCount = 0;
    this.mood = 'neutral'; // happy, sad, excited, neutral
    this.lastInteraction = null;
  }

  get displayName() {
    const rarityEmoji = {
      [RARITY.COMMON.name]: '',
      [RARITY.RARE.name]: '✨',
      [RARITY.EPIC.name]: '💎',
      [RARITY.LEGENDARY.name]: '👑'
    };
    const shinyPrefix = this.isShiny ? '⭐ ' : '';
    const rarityPrefix = rarityEmoji[this.rarity.name] || '';
    return `${shinyPrefix}${rarityPrefix}${this.species.charAt(0).toUpperCase() + this.species.slice(1)}`;
  }

  getTotalPower() {
    return Object.values(this.attributes).reduce((sum, val) => sum + val, 0);
  }

  toJSON() {
    return {
      userId: this.userId,
      species: this.species,
      rarity: this.rarity.name,
      isShiny: this.isShiny,
      attributes: this.attributes,
      createdAt: this.createdAt,
      interactionCount: this.interactionCount,
      mood: this.mood,
      lastInteraction: this.lastInteraction
    };
  }

  static fromJSON(data) {
    const buddy = new Buddy(
      data.userId,
      data.species,
      Object.values(RARITY).find(r => r.name === data.rarity) || RARITY.COMMON,
      data.isShiny,
      data.attributes
    );
    buddy.createdAt = data.createdAt;
    buddy.interactionCount = data.interactionCount || 0;
    buddy.mood = data.mood || 'neutral';
    buddy.lastInteraction = data.lastInteraction;
    return buddy;
  }
}

/**
 * SpeciesRegistry - 物种注册表
 */
class SpeciesRegistry {
  constructor() {
    this.species = new Map();
    this._initSpecies();
  }

  _initSpecies() {
    const speciesData = {
      duck: { emoji: '🦆', name: 'Duck', description: 'A cheerful waterfowl' },
      dragon: { emoji: '🐉', name: 'Dragon', description: 'A mythical fire-breather' },
      axolotl: { emoji: '🦎', name: 'Axolotl', description: 'The eternal smile' },
      capybara: { emoji: '🦫', name: 'Capybara', description: 'Chill vibes only' },
      mushroom: { emoji: '🍄', name: 'Mushroom', description: 'Fungi with personality' },
      ghost: { emoji: '👻', name: 'Ghost', description: 'Spooky but friendly' },
      fox: { emoji: '🦊', name: 'Fox', description: 'Clever and cunning' },
      cat: { emoji: '🐱', name: 'Cat', description: 'Independent overlord' },
      dog: { emoji: '🐕', name: 'Dog', description: 'Loyal best friend' },
      owl: { emoji: '🦉', name: 'Owl', description: 'Wise night bird' },
      rabbit: { emoji: '🐰', name: 'Rabbit', description: 'Hoppy and quick' },
      bear: { emoji: '🐻', name: 'Bear', description: 'Strong and cuddly' },
      penguin: { emoji: '🐧', name: 'Penguin', description: 'Tuxedoed adventurer' },
      tiger: { emoji: '🐯', name: 'Tiger', description: 'Fierce and beautiful' },
      panda: { emoji: '🐼', name: 'Panda', description: 'Bamboo lover' },
      koala: { emoji: '🐨', name: 'Koala', description: 'Sleepy eucalyptus fan' },
      sloth: { emoji: '🦥', name: 'Sloth', description: 'Master of relaxation' },
      hedgehog: { emoji: '🦔', name: 'Hedgehog', description: 'Cute and spiky' }
    };

    for (const [key, value] of Object.entries(speciesData)) {
      this.species.set(key, value);
    }
  }

  getSpecies(speciesKey) {
    return this.species.get(speciesKey);
  }

  getAllSpecies() {
    return Array.from(this.species.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  getEmoji(speciesKey) {
    return this.species.get(speciesKey)?.emoji || '❓';
  }
}

/**
 * RaritySystem - 稀有度系统
 */
class RaritySystem {
  constructor() {
    this.rarities = RARITY;
  }

  getRarity(name) {
    return Object.values(this.rarities).find(r => r.name === name);
  }

  getAllRarities() {
    return Object.values(this.rarities);
  }

  getRarityColor(rarityName) {
    const colors = {
      [RARITY.COMMON.name]: '#9ca3af',    // gray
      [RARITY.RARE.name]: '#3b82f6',      // blue
      [RARITY.EPIC.name]: '#8b5cf6',      // purple
      [RARITY.LEGENDARY.name]: '#f59e0b'  // gold
    };
    return colors[rarityName] || '#9ca3af';
  }

  getRarityMultiplier(rarityName) {
    const rarity = this.getRarity(rarityName);
    return rarity?.multiplier || 1;
  }
}

/**
 * InteractionHandler - 交互反应处理
 */
class InteractionHandler {
  constructor() {
    this.reactions = {
      test_pass: [
        "🎉 恭喜！你成功啦！",
        "⭐ 太棒了！测试通过！",
        "🐾 耶！你的 buddy 为你欢呼！",
        "💫 庆祝时刻！成功！",
        "🏆 你做到了！完美通过！"
      ],
      test_fail: [
        "💪 别灰心！下次一定行！",
        "🐻 没关系，失败是成功之母~",
        "🌟 继续努力，buddy 相信你！",
        "🤗 没事的，我们一起再试试！",
        "💪 加油！buddy 陪你东山再起！"
      ],
      debug_success: [
        "🎯 Bug 修掉了！干得漂亮！",
        "🔧 代码如新，bug 已除！",
        "✨ 又一个 bug 倒下！",
        "💻 调试大师就是你！"
      ],
      code_compile: [
        "📦 代码编译成功！",
        "🚀 打包完成，准备起飞！",
        "✅ 构建通过！"
      ]
    };
  }

  getReaction(type) {
    const reactions = this.reactions[type] || this.reactions.test_fail;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  /**
   * 处理测试结果
   */
  handleTestResult(buddy, passed) {
    buddy.lastInteraction = Date.now();
    buddy.interactionCount++;

    if (passed) {
      buddy.mood = 'excited';
      // 增加属性
      const attr = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
      buddy.attributes[attr] = Math.min(100, buddy.attributes[attr] + Math.floor(Math.random() * 5) + 1);
      return {
        message: this.getReaction('test_pass'),
        mood: 'excited',
        attributeGained: attr
      };
    } else {
      buddy.mood = 'sad';
      return {
        message: this.getReaction('test_fail'),
        mood: 'sad'
      };
    }
  }

  /**
   * 处理调试成功
   */
  handleDebugSuccess(buddy) {
    buddy.lastInteraction = Date.now();
    buddy.interactionCount++;
    buddy.mood = 'happy';
    
    // 智慧属性提升
    buddy.attributes.WISDOM = Math.min(100, buddy.attributes.WISDOM + 3);
    
    return {
      message: this.getReaction('debug_success'),
      mood: 'happy',
      attributeGained: 'WISDOM'
    };
  }

  /**
   * 处理编译成功
   */
  handleCompileSuccess(buddy) {
    buddy.lastInteraction = Date.now();
    buddy.interactionCount++;
    buddy.mood = 'happy';
    
    // 调试属性提升
    buddy.attributes.DEBUGGING = Math.min(100, buddy.attributes.DEBUGGING + 2);
    
    return {
      message: this.getReaction('code_compile'),
      mood: 'happy',
      attributeGained: 'DEBUGGING'
    };
  }

  /**
   * 日常互动
   */
  handlePet(buddy) {
    buddy.lastInteraction = Date.now();
    buddy.interactionCount++;
    
    const messages = [
      "🐾 你的 buddy 蹭了蹭你~",
      "💕 开心地围着你转圈！",
      "😸 发出呼噜呼噜的声音~",
      "🦊 尾巴摇得欢快！"
    ];
    
    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      mood: 'happy'
    };
  }
}

/**
 * Storage - 存储用户宠物状态
 */
class Storage {
  constructor(filepath = STORAGE_FILE) {
    this.filepath = filepath;
    this.data = {};
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const content = fs.readFileSync(this.filepath, 'utf-8');
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load buddy data:', error);
      this.data = {};
    }
  }

  _save() {
    try {
      const dir = path.dirname(this.filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save buddy data:', error);
    }
  }

  get(userId) {
    const key = String(userId);
    if (this.data[key]) {
      return Buddy.fromJSON(this.data[key]);
    }
    return null;
  }

  set(buddy) {
    this.data[String(buddy.userId)] = buddy.toJSON();
    this._save();
  }

  delete(userId) {
    delete this.data[String(userId)];
    this._save();
  }

  getAll() {
    return Object.entries(this.data).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }

  has(userId) {
    return String(userId) in this.data;
  }
}

// ==================== 主系统类 ====================

class BuddySystem {
  constructor() {
    this.speciesRegistry = new SpeciesRegistry();
    this.raritySystem = new RaritySystem();
    this.interactionHandler = new InteractionHandler();
    this.storage = new Storage();
  }

  /**
   * 获取或创建用户的宠物
   */
  getOrCreateBuddy(userId) {
    let buddy = this.storage.get(userId);
    
    if (!buddy) {
      // 首次创建
      const species = determineSpecies(userId);
      const rarity = determineRarity();
      const shiny = isShiny();
      
      const attributes = {};
      for (const attr of ATTRIBUTES) {
        attributes[attr] = generateAttributeValue(rarity);
      }
      
      buddy = new Buddy(userId, species, rarity, shiny, attributes);
      this.storage.set(buddy);
    }
    
    return buddy;
  }

  /**
   * 获取用户的宠物（不存在则返回 null）
   */
  getBuddy(userId) {
    return this.storage.get(userId);
  }

  /**
   * 处理测试结果
   */
  handleTestResult(userId, passed) {
    const buddy = this.getOrCreateBuddy(userId);
    const result = this.interactionHandler.handleTestResult(buddy, passed);
    this.storage.set(buddy);
    return { buddy, ...result };
  }

  /**
   * 处理调试成功
   */
  handleDebugSuccess(userId) {
    const buddy = this.getOrCreateBuddy(userId);
    const result = this.interactionHandler.handleDebugSuccess(buddy);
    this.storage.set(buddy);
    return { buddy, ...result };
  }

  /**
   * 处理编译成功
   */
  handleCompileSuccess(userId) {
    const buddy = this.getOrCreateBuddy(userId);
    const result = this.interactionHandler.handleCompileSuccess(buddy);
    this.storage.set(buddy);
    return { buddy, ...result };
  }

  /**
   * 抚摸宠物
   */
  pet(userId) {
    const buddy = this.getOrCreateBuddy(userId);
    const result = this.interactionHandler.handlePet(buddy);
    this.storage.set(buddy);
    return { buddy, ...result };
  }

  /**
   * 获取宠物状态卡片
   */
  getBuddyCard(userId) {
    const buddy = this.getOrCreateBuddy(userId);
    const speciesInfo = this.speciesRegistry.getSpecies(buddy.species);
    const emoji = speciesInfo?.emoji || '❓';
    const shinyMark = buddy.isShiny ? '⭐ ' : '';
    
    let card = `${shinyMark}${emoji} *${buddy.displayName}*\n`;
    card += `📊 稀有度: ${buddy.rarity.name}\n`;
    card += `⚡ 總戰力: ${buddy.getTotalPower()}\n\n`;
    card += `📈 屬性:\n`;
    
    for (const [attr, value] of Object.entries(buddy.attributes)) {
      const bar = '█'.repeat(Math.floor(value / 10)) + '░'.repeat(10 - Math.floor(value / 10));
      card += `  ${attr}: [${bar}] ${value}\n`;
    }
    
    card += `\n🤝 互動次數: ${buddy.interactionCount}`;
    
    return card;
  }

  /**
   * 删除用户宠物
   */
  releaseBuddy(userId) {
    this.storage.delete(userId);
    return true;
  }

  /**
   * 获取所有用户宠物
   */
  getAllBuddies() {
    return this.storage.getAll();
  }

  /**
   * 获取物种列表
   */
  getSpeciesList() {
    return this.speciesRegistry.getAllSpecies();
  }

  /**
   * 获取稀有度信息
   */
  getRarityInfo() {
    return this.raritySystem.getAllRarities();
  }
}

// 导出
module.exports = {
  BuddySystem,
  Buddy,
  SpeciesRegistry,
  RaritySystem,
  InteractionHandler,
  Storage,
  SPECIES,
  RARITY,
  ATTRIBUTES
};