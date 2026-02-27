# AI MV 生成器

根据歌词自动生成 AI 视频 MV。

## 工作流程

```
歌词 → 场景分析 → AI 视频生成 → FFmpeg 合成 → 最终 MV
```

## 使用方法

### 1. 准备歌词
确保歌词文件存在：
```
/root/.openclaw/workspace/music-daily/[日期]-歌词.txt
```

### 2. 运行生成器
```bash
cd /root/.openclaw/workspace/mv-generator
python3 generator.py
```

### 3. 生成 AI 视频
复制输出的 Pika Labs 命令，在 Discord 中运行：
```
/create "场景提示词" --aspect 16:9 --length 3s
```

### 4. 下载视频并合成
```bash
# 重命名下载的视频
mv downloaded_video.mp4 video_01.mp4

# 运行合成脚本
bash 合成脚本.sh
```

## 场景示例

| 歌词关键词 | 视频提示词 |
|------------|------------|
| 巷口的风 | Chinese old alleyway at night, warm yellow lanterns, misty, cinematic 4k |
| 月亮 | Full moon, soft moonlight through window, silhouette with guitar, warm tone |
| 便利店 | Convenience store at night, fluorescent lights, lonely worker, melancholic |
| 吉他 | Man playing guitar in dim room, warm lamp light, emotional, cinematic |

## 文件说明

| 文件 | 说明 |
|------|------|
| `generator.py` | 主程序，分析歌词生成场景 |
| `scenes.json` | 场景数据（JSON 格式） |
| `合成脚本.sh` | FFmpeg 合成脚本 |
| `README.md` | 本说明文件 |

## 依赖

- Python 3.8+
- FFmpeg（用于合成视频）

```bash
# 安装 FFmpeg (Ubuntu/Debian)
sudo apt install ffmpeg

# 安装 FFmpeg (Mac)
brew install ffmpeg
```

## 提示词优化技巧

1. **风格统一**：所有场景使用相同的光线、色调风格
2. **关键元素**：包含歌词中的核心意象（灯笼、月亮、街道等）
3. **动态描述**：添加 "gentle camera movement", "smooth motion" 等
4. **质量词**：加上 "cinematic", "4k", "high quality"

## 常见问题

**Q: 视频长度不够？**
A: 可在 Pika 中用 `--length` 参数指定时长（最长 4 秒免费版）

**Q: 画面不连贯？**
A: 这是 AI 视频的正常限制，建议选择相似色调的场景相邻排列

**Q: 没有 Pika Discord？**
A: 可用 Runway ML 替代，生成后手动下载合成
