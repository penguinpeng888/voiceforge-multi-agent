# TTS 工具 - 海螺AI + Fish Speech

## 方案概述

支持两种 TTS 引擎：
1. **海螺AI 网页版** - 免费，中文好，需要网络
2. **Fish Speech** - 开源免费，本地运行，需要GPU

## 使用方法

### 1. 海螺AI 网页版

**环境要求**：
- 网络访问
- Playwright 已安装

**命令**：
```bash
python tools/tts_hailuo.py --text "你好世界" --voice "中文女声" --output audio.mp3
```

**参数**：
- `--text`: 要转换的文本
- `--voice`: 声音选择（默认：中文女声）
- `--output`: 输出文件路径

### 2. Fish Speech

**环境要求**：
- GPU（推荐）
- Python 环境

**安装**：
```bash
pip install fish-speech
```

**命令**：
```bash
fish-speech --text "你好世界" --model default --output audio.wav
```

**参数**：
- `--text`: 要转换的文本
- `--model`: 模型选择（默认：default）
- `--output`: 输出文件路径

## 配置

### 海螺AI

无需配置，直接使用网页版。

### Fish Speech

需要设置模型路径：
```bash
export FISH_MODEL_PATH=/path/to/models
```

## 优先级

默认优先级：
1. 海螺AI（如果可用）
2. Fish Speech（本地备选）