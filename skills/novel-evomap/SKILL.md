# Novel EvoMap - 自我进化AI小说创作系统

> **版本**: 2.0
> **最后更新**: 2026-02-25
> **入口**: `python evomap_cli.py`

---

## 📖 概述

Novel EvoMap 是一个用于小说创作 AI 的自我进化系统，基于"基因-胶囊-进化事件"框架，让 AI 能够：
- 扫描分析优秀作品，自动提取写作技法
- 生成可复用的风格基因胶囊
- 通过反馈驱动持续优化

---

## 🎯 核心功能

### 1. 文本分析
分析任意文本，提取36项风格指标：
- **词汇层面**: 复杂度、口语化、方言、专业术语
- **句法层面**: 句长、从句、倒装、省略
- **修辞层面**: 比喻、对比、排比、感官描写
- **节奏层面**: 段落、对话、留白、变化度
- **结构层面**: 视角、时间、悬念、伏笔
- **情感层面**: 强度、类型、冷热、幽默

### 2. 语料库管理
批量管理多位作者的作品风格：
- **忘语**: 凡人流、谨慎主角、现实主义
- **辰东**: 气势磅礴、热血战斗、宏大世界观
- **我吃西红柿**: 升级体系清晰、节奏明快
- **耳根**: 虐心、情感深刻、道心考验
- **烽火戏诸侯**: 文青、装逼打脸、细节精致

### 3. 网页扫描
从公开网站获取文本并分析：
- Project Gutenberg（完全免费，无反爬虫）
- 任意文本网页 URL

### 4. 风格基因生成
自动生成 JSON 格式的风格基因胶囊，可直接用于 AI 写作。

---

## 🚀 快速开始

### 安装
```bash
# 无需安装，直接使用
cd /root/.openclaw/workspace/skills/novel-evomap
```

### 分析本地文本
```bash
# 分析单个文件
python evomap_cli.py analyze novel.txt --author 金庸

# 输出到文件
python evomap_cli.py analyze novel.txt -a 金庸 -o style-jinyong.json
```

### 扫描 Gutenberg 作品
```bash
# 列出可用作品
python evomap_cli.py scan gutenberg-list

# 扫描作品
python evomap_cli.py scan gutenberg 74    # Tom Sawyer
python evomap_cli.py scan gutenberg 27827 # The Old Man and the Sea
```

### 管理语料库
```bash
# 查看状态
python evomap_cli.py corpus status

# 扫描所有已配置作者
python evomap_cli.py corpus scan-all
```

### 扫描任意 URL
```bash
python evomap_cli.py scan url -u <url> -a <作者> -t <标题>
```

---

## 📊 输出示例

### 风格基因胶囊
```json
{
  "author": "辰东",
  "work": "遮天",
  "features": {
    "vocabulary": {
      "avg_word_complexity": 0.35,
      "colloquial_ratio": 0.12,
      "unique_word_ratio": 0.65
    },
    "syntax": {
      "avg_sentence_length": 25.3,
      "clause_complexity": 1.8
    },
    "rhythm": {
      "avg_paragraph_length": 150.0,
      "dialogue_ratio": 0.2
    }
  },
  "style_tags": ["气势磅礴", "热血战斗", "宏大世界观"]
}
```

---

## 📁 文件结构

```
novel-evomap/
├── evomap_cli.py              # 统一入口
├── SKILL.md                   # 本文档
├── CONFIG.md                  # 配置说明
├── NOVEL_EVOMAP_2.0.md        # 设计规范
├── IMPLEMENTATION_GUIDE.md    # 实现指南
│
├── scripts/
│   ├── analyzers/
│   │   └── text_analyzer.py   # 文本分析器
│   └── managers/
│       ├── corpus_manager.py  # 语料库管理
│       └── web_scanner.py     # 网页扫描
│
├── corpus/                    # 语料库目录
├── genes/                     # 风格基因库
├── capsules/                  # 经验胶囊库
├── atlas/                     # 剧情图谱
└── events/                    # 进化事件日志
```

---

## 🧬 基因库

### 战斗类（10个）
工具箱叙事法、道心境象流、发牌理论、感官轰炸、镜头切换、全景扩音、临阵磨枪、冰山博弈层、孤绝者独白、节奏把控

### 心理类（6个）
冰山博弈层、孤绝者独白、内冷外热反差、多线叙事、暗线伏笔、时间跳跃

### 环境类（6个）
三原色法则、环境描写金字塔、氛围渲染、空间转换、天气呼应、场景转换

### 对话类（6个）
性格化语言、潜台词、冲突张力、信息传递、情绪节奏、简洁有力

---

## 🔗 相关技能

| 技能 | 路径 | 用途 |
|------|------|------|
| openclaw-writing-skills | `skills/openclaw-writing-skills/` | 写作技法 |
| novel-logic-checker | `skills/novel-logic-checker/` | 逻辑检查 |
| novel-editor | `skills/novel-editor/` | 审核评分 |

---

*最后更新: 2026-02-25*
