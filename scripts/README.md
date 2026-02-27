# YouTube 批量下载转录工具使用说明

## 📦 功能

- 批量下载 YouTube 视频（最高 1080p）
- 自动提取音频为 MP3
- 使用 OpenAI Whisper 生成中文字幕（SRT格式）
- 生成纯文字稿（TXT格式）

## 🚀 快速开始

### 1. 准备链接文件

创建一个文本文件，每行一个 YouTube 链接：

```bash
# links.txt
https://www.youtube.com/watch?v=Lsg_cV5lmcV
https://www.youtube.com/watch?v=xxxxxxx
https://youtu.be/yyyyyyy
```

### 2. 运行脚本

```bash
# 基本用法
./scripts/youtube-batch.sh links.txt

# 指定输出目录
./scripts/youtube-batch.sh links.txt ./my-videos
```

### 3. 查看结果

下载完成后，在输出目录中可以看到：

```
workspace/youtube-downloads/
├── video_Lsg_cV5lmcV.mp4      # 视频文件
├── video_Lsg_cV5lmcV.srt      # 字幕文件
└── video_Lsg_cV5lmcV.txt      # 纯文字稿
```

## 📋 文件格式说明

### 字幕文件 (.srt)
```
1
00:00:01,000 --> 00:00:05,000
AI 大佬洞察系统，探索科技前沿，解读 AI 资讯！
```

### 纯文字稿 (.txt)
```
AI 大佬洞察系统，探索科技前沿，解读 AI 资讯！
[开场白...]
[核心观点...]
...
```

## ⚙️ 配置选项

在脚本开头的配置区域可以修改：

| 配置 | 默认值 | 说明 |
|------|--------|------|
| COOKIES_FILE | youtube-cookies.txt | YouTube 登录 cookies 文件 |
| OUTPUT_DIR | workspace/youtube-downloads | 输出目录 |
| MODEL_SIZE | medium | Whisper 模型大小 |

### Whisper 模型选择

| 模型 | 显存需求 | 速度 | 准确度 |
|------|----------|------|--------|
| tiny | ~1GB | 最快 | 较低 |
| base | ~1GB | 很快 | 中等 |
| small | ~2GB | 快 | 较好 |
| medium | ~5GB | 中等 | 很好 |
| large | ~10GB | 慢 | 最好 |

## 🔧 依赖安装

### yt-dlp
```bash
pip install yt-dlp
```

### FFmpeg
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
# 下载 https://ffmpeg.org/download.html
```

### Whisper
```bash
# 方法1: pip 安装
pip install -U openai-whisper

# 方法2: conda 安装
conda install -c conda-forge whisper

# 需要安装 PyTorch:
pip install torch
```

## 📝 Coze 工作流配置（可选）

如果你想在 Coze 上使用，可以导入以下配置：

```json
{
  "name": "YouTube下载转录",
  "description": "批量下载YouTube视频并生成字幕",
  "inputs": [
    {"name": "youtube_links", "type": "string", "required": true}
  ],
  "outputs": [
    {"name": "video_files", "type": "string"},
    {"name": "transcripts", "type": "string"}
  ],
  "nodes": [
    {
      "name": "下载视频",
      "type": "LLM",
      "prompt": "使用yt-dlp下载以下YouTube视频：{{youtube_links}}"
    },
    {
      "name": "生成字幕",
      "type": "LLM", 
      "prompt": "使用whisper将下载的视频生成中文字幕"
    }
  ]
}
```

**注意**: Coze 运行在云端，可能无法直接访问 YouTube。建议在本地服务器（腾讯云）运行。

## ❓ 常见问题

### Q: 下载失败，提示 "Video unavailable"
A: 尝试导出新的 YouTube cookies，或检查视频是否需要会员权限。

### Q: Whisper 识别不准
A: 尝试使用更大的模型（medium/large），或先降噪音频。

### Q: 内存不足
A: 使用更小的 Whisper 模型（tiny/base）。

### Q: 部分视频下载失败
A: 可能视频有地区限制，或链接格式不正确。

## 📚 相关文件

- `scripts/youtube-batch.sh` - 主脚本
- `youtube-cookies.txt` - YouTube 登录 cookies（需要自己提供）
- `workspace/youtube-downloads/` - 默认输出目录
