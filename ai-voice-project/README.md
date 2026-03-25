# AI配音项目 (AI Dubbing Project)

一个基于LLM的AI配音系统，能够：
1. 从文本中识别情感和场景
2. 根据情感选择合适的音色和语速
3. 生成自然流畅的配音

## 功能特性

- **情感分析**: 使用MiniMax LLM分析文本情感
- **语音合成**: 使用ElevenLabs进行高质量语音合成
- **多音色支持**: 内置6种预设音色
- **情感映射**: 根据情感自动调整语速和语调

## 快速开始

### 1. 安装依赖

```bash
cd ai-voice-project
pip install -r requirements.txt
```

### 2. 配置API密钥

```bash
# 设置环境变量
export MINIMAX_API_KEY="your_minimax_key"
export ELEVENLABS_API_KEY="your_elevenlabs_key"
```

### 3. 运行演示

```bash
python src/pipeline.py --demo
```

### 4. 命令行使用

```bash
# 直接合成文本
python src/pipeline.py --text "陆沉手持长剑，目光如刀。" --voice warrior

# 从文件合成
python src/pipeline.py --input novel.txt --chapter chapter1
```

## 项目结构

```
ai-voice-project/
├── config.py              # 配置文件
├── requirements.txt       # 依赖
├── src/
│   ├── emotion_analyzer.py   # 情感分析模块
│   ├── voice_synthesizer.py  # 语音合成模块
│   └── pipeline.py           # 主工作流
└── output/                # 输出目录
```

## 音色库

| 名称 | 描述 | 适用场景 |
|------|------|----------|
| narrator | 中性旁白 | 旁白叙述 |
| young_male | 年轻男性 | 主角对话 |
| young_female | 年轻女性 | 女性角色 |
| elder_male | 老年男性 | 长辈角色 |
| warrior | 战士/硬汉 | 战斗场景 |
| immortal | 仙人/飘逸 | 仙人角色 |

## 情感参数

系统会根据情感自动调整语音参数：

| 情感 | 语速 | 语调 |
|------|------|------|
| happy | 1.1 | 0 |
| sad | 0.9 | -1 |
| angry | 1.2 | 1 |
| fear | 1.15 | 0.5 |
| battle | 1.3 | 0.8 |
| romance | 0.95 | -0.5 |

## 使用示例

### Python API

```python
from src.pipeline import DubbingPipeline

pipeline = DubbingPipeline()

# 处理单段文本
result = pipeline.process_text(
    "陆沉手持长剑，目光如刀，直视对面的黑纹豹。",
    voice="warrior"
)

# 处理整章小说
results = pipeline.process_chapter(
    chapter_text="...",
    chapter_name="chapter1"
)
```

### 独立使用模块

```python
from src.emotion_analyzer import EmotionAnalyzer

analyzer = EmotionAnalyzer()
result = analyzer.analyze("她轻轻握住陆沉的手，柔声道：我会等你回来。")
print(result["emotion"])  # romance
```

```python
from src.voice_synthesizer import VoiceSynthesizer

synthesizer = VoiceSynthesizer()
audio = synthesizer.synthesize_with_voice_name(
    text="你好",
    voice_name="young_male",
    emotion="happy",
    output_path="hello.mp3"
)
```

## 后续规划

- [ ] 本地语音克隆（Coqui XTTS）
- [ ] 音效生成模块
- [ ] 背景音乐合成
- [ ] 批量处理支持
- [ ] Web界面

## 技术栈

- Python 3.8+
- MiniMax API (情感分析)
- ElevenLabs API (语音合成)
- requests (HTTP客户端)

---

*项目时间：2026-03-22*