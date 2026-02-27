# Novel EvoMap 2.0 配置文件

## 📁 目录结构

```
novel-evomap/
├── evomap_cli.py              # 统一入口
├── SKILL.md                   # 技能说明文档
├── NOVEL_EVOMAP_2.0.md        # 设计规范
├── IMPLEMENTATION_GUIDE.md    # 实现指南
│
├── scripts/                   # 核心脚本
│   ├── analyzers/
│   │   └── text_analyzer.py   # 文本分析器
│   └── managers/
│       ├── corpus_manager.py  # 语料库管理器
│       └── web_scanner.py     # 网页扫描器
│
├── corpus/                    # 语料库
│   ├── 忘语/
│   ├── 辰东/
│   ├── 我吃西红柿/
│   ├── 耳根/
│   └── 烽火戏诸侯/
│
├── genes/                     # 风格基因库
│   ├── combat.json
│   ├── dialogue.json
│   ├── environment.json
│   └── psychology.json
│
├── capsules/                  # 经验胶囊库
│   └── 2026-02-24/
│
├── atlas/                     # 剧情图谱
│   ├── PLOT_ATLAS.md
│   └── scripts/
│       └── atlas_manager.py
│
└── events/                    # 进化事件日志
    └── event-20260224.log
```

## ⚙️ 配置参数

```json
{
  "analyzers": {
    "text_analyzer": {
      "min_text_length": 500,
      "max_text_length": 100000,
      "supported_formats": [".txt", ".md"]
    }
  },
  
  "corpus": {
    "supported_authors": [
      "忘语",
      "辰东",
      "我吃西红柿",
      "耳根",
      "烽火戏诸侯"
    ],
    "cache_dir": ".cache",
    "output_dir": "genes"
  },
  
  "web_scanner": {
    "gutenberg_base": "https://www.gutenberg.org",
    "max_fetch_chars": 50000,
    "timeout_seconds": 30
  },
  
  "output": {
    "format": "json",
    "encoding": "utf-8",
    "indent": 2
  }
}
```

## 🚀 快速使用

### 1. 分析本地文本

```bash
python evomap_cli.py analyze novel.txt --author 金庸
```

### 2. 扫描 Gutenberg 作品

```bash
python evomap_cli.py scan gutenberg-list       # 列出可用作品
python evomap_cli.py scan gutenberg 74         # 扫描 Tom Sawyer
```

### 3. 管理语料库

```bash
python evomap_cli.py corpus status             # 查看状态
python evomap_cli.py corpus scan-all           # 扫描所有作者
```

### 4. 扫描任意 URL

```bash
python evomap_cli.py scan url -u <url> -a <作者>
```

## 📊 输出文件位置

| 类型 | 位置 |
|------|------|
| 风格基因 | `genes/style-{author}.json` |
| 胶囊 | `capsules/{date}/` |
| 缓存 | `.cache/` |
| 进化日志 | `events/` |

## 🔧 依赖

- Python 3.8+
- 标准库: `os`, `re`, `json`, `pathlib`, `dataclasses`
- 可选: `openclaw` CLI (用于网页抓取)

## 📝 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 2.0 | 2026-02-25 | 新增网页扫描、语料库管理 |
| 1.0 | 2026-02-24 | 基础文本分析器 |
