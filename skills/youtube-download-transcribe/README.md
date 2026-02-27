# YouTube Download Transcribe Coze 工作流

## 📦 简介

这是一个用于 **Coze 工作流** 的 JSON 配置文件，可以导入到 Coze 平台实现：
- 批量下载 YouTube 视频
- 自动提取音频
- 生成中文字幕（SRT格式）
- 生成纯文字稿（TXT格式）

## 🚀 导入方法

### 方法一：直接导入 JSON

1. 打开 [Coze 工作流编辑器](https://www.coze.cn/workspace)
2. 点击 **"导入"** 按钮
3. 选择 `SKILL.json` 文件
4. 调整节点配置（如果需要）
5. 保存并发布

### 方法二：手动创建

1. 新建空白工作流
2. 按照 `SKILL.json` 中的 `workflow` 配置创建节点
3. 设置输入/输出变量
4. 连接节点关系

## 📋 输入参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `youtube_links` | string | ✅ | - | YouTube链接列表（每行一个） |
| `output_dir` | string | ❌ | `youtube-downloads` | 输出目录 |
| `model_size` | string | ❌ | `medium` | Whisper模型：tiny/base/small/medium/large |
| `language` | string | ❌ | `Chinese` | 识别语言 |
| `download_quality` | string | ❌ | `best[height<=1080]` | 下载画质 |

## 📤 输出参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | string | 处理状态 |
| `total_count` | integer | 总数量 |
| `success_count` | integer | 成功数量 |
| `fail_count` | integer | 失败数量 |
| `processed_videos` | array | 成功处理的视频列表 |
| `failed_videos` | array | 失败的视频列表 |

## 🔧 节点配置

### 1. parse_links（解析链接）
- **类型**: 代码节点
- **功能**: 解析输入的链接字符串，支持多种格式
- **输入**: `youtube_links`
- **输出**: `links`, `count`

### 2. validate_links（验证链接）
- **类型**: 条件节点
- **功能**: 检查是否有有效链接
- **条件**: `count > 0` → 处理视频；否则 → 错误处理

### 3. process_video（处理视频）
- **类型**: LLM节点
- **功能**: 下载视频、提取音频、语音转文字
- **输入**: links, output_dir, model_size, language, download_quality

### 4. aggregate_results（聚合结果）
- **类型**: 代码节点
- **功能**: 汇总所有视频的处理结果
- **输出**: status, success_count, fail_count, processed_videos, failed_videos

## ⚠️ 重要提醒

### Coze 云端限制

⚠️ **Coze 工作流运行在云端**，可能存在以下问题：

1. **网络限制** - 云端服务器可能无法访问 YouTube
2. **依赖缺失** - 可能没有安装 yt-dlp / ffmpeg / whisper
3. **资源限制** - Whisper 大模型需要较多内存

### 推荐的运行方式

#### 方案A：在本地服务器运行（推荐）

```bash
# 克隆工作流配置
git clone <this-repo>
cd scripts

# 创建链接文件
cat > links.txt << EOF
https://www.youtube.com/watch?v=Lsg_cV5lmcV
https://www.youtube.com/watch?v=xxxxxxx
EOF

# 运行
./youtube-batch.sh links.txt
```

#### 方案B：Coze 本地部署版

如果使用的是 Coze 本地部署版，且服务器可以访问 YouTube，则可以直接导入使用。

## 📁 文件结构

```
youtube-download-transcribe/
├── SKILL.json           # Coze工作流配置文件
├── README.md            # 本说明文件
├── youtube-batch.sh     # 本地运行的脚本
└── youtube-cookies.txt  # YouTube登录cookies（需要自己提供）
```

## 🛠️ 本地运行依赖

如果要在本地运行，需要安装：

```bash
# yt-dlp
pip install yt-dlp

# ffmpeg
# Ubuntu/Debian
sudo apt install ffmpeg
# macOS
brew install ffmpeg

# whisper + torch
pip install -U openai-whisper torch
```

## 📝 示例

### 输入示例

```json
{
  "youtube_links": "https://www.youtube.com/watch?v=Lsg_cV5lmcV\nhttps://youtu.be/xxxxxxx",
  "output_dir": "my-videos",
  "model_size": "medium",
  "language": "Chinese"
}
```

### 输出示例

```json
{
  "status": "completed",
  "total_count": 2,
  "success_count": 2,
  "fail_count": 0,
  "processed_videos": [
    {
      "video_id": "Lsg_cV5lmcV",
      "files": {
        "video": "my-videos/video_Lsg_cV5lmcV.mp4",
        "subtitle": "my-videos/video_Lsg_cV5lmcV.srt",
        "transcript": "my-videos/video_Lsg_cV5lmcV.txt"
      }
    }
  ],
  "failed_videos": []
}
```

## 🔍 常见问题

### Q: Coze上导入后运行失败？

A: 可能是以下原因：
1. Coze云端无法访问YouTube（最常见）
2. 缺少必要的依赖包
3. 输入格式不正确

**建议**：使用本地服务器运行脚本

### Q: 下载失败，提示 "Video unavailable"？

A: 尝试：
1. 导出有效的YouTube cookies
2. 检查视频是否有地区限制
3. 检查视频是否需要会员

### Q: 字幕识别不准确？

A: 尝试：
1. 使用更大的Whisper模型（medium/large）
2. 视频音频质量要好
3. 使用更清晰的语言（English准确度更高）

### Q: 内存不足？

A: 使用更小的Whisper模型：
- tiny: ~1GB内存
- base: ~1GB内存  
- small: ~2GB内存

## 📚 相关资源

- [yt-dlp 文档](https://github.com/yt-dlp/yt-dlp)
- [Whisper 文档](https://github.com/openai/whisper)
- [Coze 工作流文档](https://www.coze.cn/docs/workflow)

## 📄 许可证

MIT License

## 👤 作者

Peng Penguinpeng

---

**创建时间**: 2026-02-23
**版本**: 1.0.0
