/**
 * OpenClaw Telegram Bot - 宠物陪伴机器人
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = '8224727514:AAGOTULkZd3MGN53eyaixsKgPWftIFk2r8A';
const OPENCLAW_URL = 'http://localhost:3000';

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 OpenClaw Telegram Bot started!');

// Handle /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    // Get or create buddy
    const response = await axios.get(`${OPENCLAW_URL}/buddy?userId=${userId}`);
    const buddy = response.data;
    
    const emoji = getBuddyEmoji(buddy.species);
    const attributes = formatAttributes(buddy.attributes);
    
    await bot.sendMessage(chatId, 
      `🦄 欢迎来到 OpenClaw 宠物世界！\n\n` +
      `你的宠物: ${emoji} *${buddy.species}*\n` +
      `稀有度: ${buddy.rarity}\n` +
      `闪亮: ${buddy.isShiny ? '✨ 是' : '❌ 否'}\n\n` +
      `📊 属性:\n${attributes}\n\n` +
      `使用 /buddy 查看宠物\n` +
      `使用 /species 查看所有宠物\n` +
      `使用 /feed 喂养宠物`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    await bot.sendMessage(chatId, `❌ 错误: ${e.message}`);
  }
});

// Handle /buddy
bot.onText(/\/buddy/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    const response = await axios.get(`${OPENCLAW_URL}/buddy?userId=${userId}`);
    const buddy = response.data;
    
    const emoji = getBuddyEmoji(buddy.species);
    const attributes = formatAttributes(buddy.attributes);
    
    await bot.sendMessage(chatId,
      `${emoji} *${buddy.species.toUpperCase()}*\n\n` +
      `⭐ 稀有度: ${buddy.rarity}\n` +
      `✨ 闪亮: ${buddy.isShiny ? '是' : '否'}\n` +
      `💬 心情: ${buddy.mood}\n` +
      `📊 互动: ${buddy.interactionCount}次\n\n` +
      `📈 属性:\n${attributes}`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    await bot.sendMessage(chatId, `❌ 错误: ${e.message}`);
  }
});

// Handle /species - show all available species
bot.onText(/\/species/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${OPENCLAW_URL}/buddy/all-species`);
    const species = response.data;
    
    let text = '🦁 *18种宠物一览*\n\n';
    species.forEach((s, i) => {
      text += `${i+1}. ${s.emoji} ${s.name}\n`;
    });
    
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) {
    await bot.sendMessage(chatId, `❌ 错误: ${e.message}`);
  }
});

// Handle /feed
bot.onText(/\/feed/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  const responses = [
    '🍎 你给宠物喂了一个苹果，它很开心！',
    '🥕 胡萝卜味道不错，宠物向你点了点头',
    '🍗 美味的鸡肉，宠物狼吞虎咽',
    '🥛 喝完牛奶，宠物打了个饱嗝',
    '🍪 小零食，宠物高兴地摇尾巴'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  await bot.sendMessage(chatId, randomResponse);
  
  // Get updated buddy
  try {
    const response = await axios.get(`${OPENCLAW_URL}/buddy?userId=${userId}`);
    const buddy = response.data;
    await bot.sendMessage(chatId, 
      `${getBuddyEmoji(buddy.species)} 心情: ${buddy.mood} → 🟢 开心\n互动次数: ${buddy.interactionCount + 1}`
    );
  } catch (e) {
    // Ignore
  }
});

// Handle /chat - simple chat
bot.onText(/\/chat (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const prompt = match[1];
  
  await bot.sendMessage(chatId, '🤔 思考中...');
  
  try {
    const response = await axios.post(`${OPENCLAW_URL}/chat`, { prompt });
    await bot.sendMessage(chatId, response.data.response);
  } catch (e) {
    await bot.sendMessage(chatId, `❌ 错误: ${e.message}`);
  }
});

// Handle /status
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${OPENCLAW_URL}/status`);
    const status = response.data;
    
    await bot.sendMessage(chatId,
      `📊 *OpenClaw 状态*\n\n` +
      `✅ 初始化: ${status.initialized}\n` +
      `🔧 工具数: ${status.tools.total}\n` +
      `💬 对话轮: ${status.turnCount}\n` +
      `🤖 模型: ${status.llm.model}`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    await bot.sendMessage(chatId, `❌ 错误: ${e.message}`);
  }
});

// Helper functions
function getBuddyEmoji(species) {
  const emojis = {
    duck: '🦆', dragon: '🐉', axolotl: '🦎', capybara: '🦫',
    mushroom: '🍄', ghost: '👻', fox: '🦊', cat: '🐱',
    dog: '🐕', owl: '🦉', rabbit: '🐰', bear: '🐻',
    penguin: '🐧', tiger: '🐯', panda: '🐼', koala: '🐨',
    sloth: '🦥', hedgehog: '🦔'
  };
  return emojis[species] || '❓';
}

function formatAttributes(attrs) {
  return Object.entries(attrs)
    .map(([key, val]) => `  ${key}: ${val}`)
    .join('\n');
}

console.log('🤖 Bot is ready! Commands: /start, /buddy, /species, /feed, /chat, /status');