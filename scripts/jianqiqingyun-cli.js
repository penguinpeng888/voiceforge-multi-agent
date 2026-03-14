#!/usr/bin/env node

/**
 * 剑起青云 CLI - 小说创作管理系统
 * 基于 InkOS 思想，为《剑起青云》定制
 */

const fs = require('fs');
const path = require('path');

const NOVEL_DIR = path.join(__dirname, '../novel/JianQiQingYun');
const MEMORY_FILE = path.join(__dirname, '../MEMORY.md');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 获取当前章节
function getCurrentChapter() {
  const files = fs.readdirSync(NOVEL_DIR)
    .filter(f => f.endsWith('.md') && /^\d+\.md$/.test(f))
    .map(f => parseInt(f.replace('.md', '')))
    .sort((a, b) => b - a);

  return files[0] || 0;
}

// 获取章节内容
function getChapter(num) {
  const file = path.join(NOVEL_DIR, `${num}.md`);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf-8');
  }
  return null;
}

// 获取大纲
function getOutline() {
  const file = path.join(NOVEL_DIR, '小说完整规划.md');
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf-8');
  }
  return null;
}

// 列出所有章节
function listChapters() {
  const files = fs.readdirSync(NOVEL_DIR)
    .filter(f => f.endsWith('.md') && /^\d+\.md$/.test(f) && !f.includes('_修改版') && !f.includes('_review') && !f.includes('.gz'))
    .map(f => {
      const num = parseInt(f.replace('.md', ''));
      const content = fs.readFileSync(path.join(NOVEL_DIR, f), 'utf-8');
      const titleMatch = content.match(/^# 第.+章：(.+)$/m);
      const title = titleMatch ? titleMatch[1] : '无标题';
      const words = content.length;
      return { num, title, words };
    })
    .sort((a, b) => a.num - b.num);

  return files;
}

// 更新MEMORY.md
function updateMemory() {
  const chapters = listChapters();
  const current = chapters[chapters.length - 1];

  log(`当前进度：第${current.num}章 - ${current.title}`, 'cyan');
  log(`字数：约 ${Math.floor(current.words / 2)} 字`, 'green');

  return { current, total: chapters.length };
}

// 显示状态
function status() {
  log('\n=== 剑起青云 创作状态 ===\n', 'blue');

  const chapters = listChapters();
  const current = chapters[chapters.length - 1];

  log(`📚 已完成章节：${chapters.length} 章`, 'green');
  log(`📖 最新章节：第${current.num}章 - ${current.title}`, 'cyan');
  log(`📝 最新字数：约 ${Math.floor(current.words / 2)} 字`, 'yellow');

  // 检查待完成的大纲
  const outline = getOutline();
  if (outline) {
    const plannedMatch = outline.match(/(\d+)章/);
    if (plannedMatch) {
      const planned = parseInt(plannedMatch[1]);
      const remaining = planned - chapters.length;
      log(`📋 剩余大纲：${remaining} 章`, remaining > 0 ? 'yellow' : 'green');
    }
  }

  log('');
}

// 查看指定章节
function showChapter(num) {
  const content = getChapter(num);
  if (content) {
    console.log(content);
  } else {
    log(`第${num}章不存在`, 'red');
  }
}

// 生成章节摘要
function summarize(num) {
  const content = getChapter(num);
  if (!content) {
    log(`第${num}章不存在`, 'red');
    return;
  }

  // 提取标题
  const titleMatch = content.match(/^# 第.+章：(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '无标题';

  // 提取章节数量
  const sections = content.match(/^## (.+)$/gm) || [];

  // 统计字数
  const words = Math.floor(content.length / 2);

  // 提取关键物品/人物
  const items = [];
  const itemPatterns = [
    /短剑/g, /琉璃瓶/g, /储物袋/g, /冰心莲/g,
    /小黑/g, /陆沉/g, /苏婉儿/g, /噬灵诀/g, /流云十三式/g
  ];

  itemPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      items.push(pattern.toString().replace('/', ''));
    }
  });

  // 去重
  const uniqueItems = [...new Set(items)];

  log(`\n=== 第${num}章摘要 ===`, 'blue');
  log(`标题：${title}`, 'cyan');
  log(`字数：约 ${words} 字`, 'yellow');
  log(`章节结构：${sections.length} 节`, 'green');
  log(`关键元素：${uniqueItems.join(', ') || '无'}`, 'yellow');
  log('');

  // 输出结构化数据（JSON）
  return {
    chapter: num,
    title,
    words,
    sections: sections.length,
    items: uniqueItems
  };
}

// 生成真相文件
function generateTruthFiles() {
  const truthDir = path.join(NOVEL_DIR, 'truth');
  if (!fs.existsSync(truthDir)) {
    fs.mkdirSync(truthDir, { recursive: true });
  }

  const chapters = listChapters();

  // 1. chapter_summaries.md - 各章摘要
  let summaries = '# 章节摘要\n\n';
  chapters.forEach(ch => {
    const content = getChapter(ch.num);
    const titleMatch = content.match(/^# 第.+章：(.+)$/m);
    const title = titleMatch ? titleMatch[1] : '无标题';
    summaries += `## 第${ch.num}章：${title}\n`;
    summaries += `- 字数：约 ${Math.floor(ch.words / 2)} 字\n`;
    summaries += `- 状态：已完成\n\n`;
  });
  fs.writeFileSync(path.join(truthDir, 'chapter_summaries.md'), summaries);

  // 2. character_matrix.md - 角色交互矩阵
  let matrix = '# 角色交互矩阵\n\n';
  const characters = {};

  chapters.forEach(ch => {
    const content = getChapter(ch.num);
    const charMatches = content.match(/【(.+?)】/g) || [];
    charMatches.forEach(m => {
      const name = m.replace(/【|】/g, '');
      if (!characters[name]) {
        characters[name] = [];
      }
      characters[name].push(ch.num);
    });
  });

  Object.keys(characters).forEach(name => {
    matrix += `### ${name}\n`;
    matrix += `出现章节：${characters[name].join(', ')}\n\n`;
  });
  fs.writeFileSync(path.join(truthDir, 'character_matrix.md'), matrix);

  log('真相文件已生成：', 'green');
  log(`  - ${truthDir}/chapter_summaries.md`, 'cyan');
  log(`  - ${truthDir}/character_matrix.md`, 'cyan');
  log('');
}

// 主命令处理
const command = process.argv[2];

switch (command) {
  case 'status':
    status();
    break;

  case 'list':
  case 'ls':
    listChapters().forEach(ch => {
      console.log(`第${ch.num}章: ${ch.title} (${Math.floor(ch.words/2)}字)`);
    });
    break;

  case 'show':
  case 'cat':
    const showNum = parseInt(process.argv[3]);
    showChapter(showNum);
    break;

  case 'current':
  case 'now':
    const current = getCurrentChapter();
    log(`当前章节：第${current}章`, 'cyan');
    break;

  case 'next':
    const next = getCurrentChapter() + 1;
    log(`下一章：第${next}章`, 'green');
    break;

  case 'summary':
  case 'sum':
    const sumNum = parseInt(process.argv[3]) || getCurrentChapter();
    summarize(sumNum);
    break;

  case 'truth':
  case 'generate':
    generateTruthFiles();
    break;

  case 'help':
  default:
    console.log(`
剑起青云 CLI - 小说创作管理系统

用法: jianqiqingyun-cli.js <命令> [参数]

命令:
  status, st        显示创作状态
  list, ls          列出所有章节
  show, cat <n>     查看第n章内容
  current, now      当前章节
  next              下一章编号
  summary, sum [n]  第n章摘要（默认最新）
  truth, generate   生成真相文件
  help              显示帮助

示例:
  node jianqiqingyun-cli.js status
  node jianqiqingyun-cli.js list
  node jianqiqingyun-cli.js show 39
  node jianqiqingyun-cli.js summary
    `);
}

module.exports = { getCurrentChapter, getChapter, listChapters, summarize };