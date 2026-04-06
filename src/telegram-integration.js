/**
 * OpenClaw Telegram Integration - 直接集成到主系统
 */

const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8224727514:AAGOTULkZd3MGN53eyaixsKgPWftIFk2r8A';

class TelegramIntegration {
  constructor(openclaw) {
    this.oc = openclaw;
    this.bot = null;
    this.enabled = false;
  }

  async start() {
    try {
      this.bot = new TelegramBot(TOKEN, { polling: true });
      this.enabled = true;
      console.log('📱 Telegram integration started!');
      this._setupHandlers();
      return true;
    } catch (e) {
      console.error('Telegram start failed:', e.message);
      return false;
    }
  }

  _setupHandlers() {
    const bot = this.bot;

    // /start - Welcome and show buddy
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();
      
      try {
        const buddy = this.oc.buddy.getOrCreateBuddy(userId);
        const emoji = this._getEmoji(buddy.species);
        
        await bot.sendMessage(chatId, 
          `🦄 *欢迎来到 OpenClaw！*\n\n` +
          `你的宠物: ${emoji} *${buddy.species}*\n` +
          `稀有度: ${buddy.rarity}\n\n` +
          `_使用 /buddy 查看宠物 /chat 和AI对话_`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        await bot.sendMessage(chatId, `❌ ${e.message}`);
      }
    });

    // /buddy - Show buddy info
    bot.onText(/\/buddy/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();
      
      try {
        const buddy = this.oc.buddy.getOrCreateBuddy(userId);
        const emoji = this._getEmoji(buddy.species);
        
        const attrs = Object.entries(buddy.attributes)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join('\n');
        
        await bot.sendMessage(chatId,
          `${emoji} *${buddy.species.toUpperCase()}*\n\n` +
          `⭐ 稀有度: ${buddy.rarity}\n` +
          `💬 心情: ${buddy.mood}\n` +
          `📊 互动: ${buddy.interactionCount}次\n\n` +
          `📈 属性:\n${attrs}`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        await bot.sendMessage(chatId, `❌ ${e.message}`);
      }
    });

    // /species - Show all species
    bot.onText(/\/species/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const species = this.oc.buddy.getSpeciesList();
        let text = '🦁 *18种宠物*\n\n';
        species.forEach((s, i) => {
          text += `${i+1}. ${s.emoji} ${s.name}\n`;
        });
        await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (e) {
        await bot.sendMessage(chatId, `❌ ${e.message}`);
      }
    });

    // /status - Show OpenClaw status
    bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const status = this.oc.getStatus();
        await bot.sendMessage(chatId,
          `📊 *OpenClaw 状态*\n\n` +
          `✅ 初始化: ${status.initialized}\n` +
          `🔧 工具: ${status.tools.total}\n` +
          `💬 轮次: ${status.turnCount}\n` +
          `🤖 模型: ${status.llm.model}`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        await bot.sendMessage(chatId, `❌ ${e.message}`);
      }
    });

    // Default: use /chat for AI conversation
    bot.onText(/\/chat (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const prompt = match[1];
      
      await bot.sendMessage(chatId, '🤔...');
      
      try {
        const result = await this.oc.query(prompt);
        let response = result.response?.content || '无响应';
        if (response.length > 4000) {
          response = response.substring(0, 4000) + '\n\n[内容已截断...]';
        }
        await bot.sendMessage(chatId, response);
      } catch (e) {
        console.error('Telegram /chat error:', e.message);
        await bot.sendMessage(chatId, `❌ 抱歉，出错了: ${e.message}`);
      }
    });

    // Handle any other message as chat
    bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        try {
          const result = await this.oc.query(msg.text);
          let response = result.response?.content || '无响应';
          // Limit response length to avoid Telegram issues
          if (response.length > 4000) {
            response = response.substring(0, 4000) + '\n\n[内容已截断...]';
          }
          await bot.sendMessage(chatId, response);
        } catch (e) {
          console.error('Telegram chat error:', e.message);
          await bot.sendMessage(chatId, `❌ 抱歉，出错了: ${e.message}`);
        }
      }
    });
  }

  _getEmoji(species) {
    const emojis = {
      duck: '🦆', dragon: '🐉', axolotl: '🦎', capybara: '🦫',
      mushroom: '🍄', ghost: '👻', fox: '🦊', cat: '🐱',
      dog: '🐕', owl: '🦉', rabbit: '🐰', bear: '🐻',
      penguin: '🐧', tiger: '🐯', panda: '🐼', koala: '🐨',
      sloth: '🦥', hedgehog: '🦔'
    };
    return emojis[species] || '❓';
  }
}

module.exports = { TelegramIntegration };