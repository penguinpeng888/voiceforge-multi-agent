# Telegram 传输机制说明

## 当前支持的传输方式

### 1. 直接发送（Telegram 内置）
- **图片** (jpg/png): ≤10MB ✅
- **音频** (mp3): ≤50MB ✅
- **视频** (mp4): ≤50MB ✅
- **文档** (txt/md): ≤2MB ✅

### 2. 定时任务发送
- 音乐任务：每天凌晨 3:00 自动生成，完成后通知
- 漫画任务：每天凌晨 3:00 自动生成，完成后通知

## 文件保存位置

```
workspace/
├── music-daily/           # 音乐文件
│   └── YYYY-MM-DD-歌词.txt
│   └── YYYY-MM-DD-提示词.txt
│   └── YYYY-MM-DD-封面.png
│   └── YYYY-MM-DD-MV.mp4
│   └── YYYY-MM-DD-发布词.txt
├── 剑起青云-漫画/         # 漫画图片
│   └── YYYY-MM-DD-漫画-01.png
│   └── YYYY-MM-DD-漫画-02.png
├── 剑起青云/              # 小说章节
│   └── 第01章.txt
│   └── ...
└── scripts/               # 辅助脚本
    ├── send-to-telegram.sh
    └── daily-send-summary.sh
```

## 定时任务清单

| 任务 | 时间 | 功能 |
|------|------|------|
| 每日音乐 | 每天 03:00 | 生成歌词、提示词、封面、MV、发布词 |
| 每日漫画 | 每天 03:00 | 根据小说生成漫画 |

## 发送脚本用法

```bash
# 发送文件到 Telegram
./scripts/send-to-telegram.sh <文件路径> [说明文字]

# 检查当日待发送文件
./scripts/daily-send-summary.sh
```

## 待恢复的功能

- **upload.penguinpeng.fun**: Cloudflare 传输服务（暂时不可用）
  - 计划用于大文件传输
  - 主人修复后可以对接

## 后续可扩展

- [ ] 大文件传输（>50MB）
- [ ] 多平台同步发布
- [ ] 自动压缩优化
