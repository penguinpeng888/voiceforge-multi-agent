# ComfyUI VibeVoice 研究 - 2026-04-08

## 概述
微软的 VibeVoice 多说话人 TTS 引擎，可集成到 ComfyUI 中。

## 核心功能
- **多说话人**：最多 4 个角色同时对话
- **声音克隆**：从音频样本克隆声音
- **LoRA 支持**：微调声音特征
- **语速控制**：0.8-1.2 倍速

## 对话格式
```
[1]: 第一句台词
[2]: 第二句台词
[1]: 回复
[3]: 第三个人加入
```

## 模型版本
| 模型 | 大小 | 显存 | 用途 |
|------|------|------|------|
| VibeVoice-1.5B | 5.4GB | ~6GB | 快速单speaker |
| VibeVoice-Large | 18.7GB | ~20GB | 最高质量 |
| VibeVoice-Large-Q8 | 11.6GB | ~12GB | 平衡质量/显存 |
| VibeVoice-Large-Q4 | 6.6GB | ~8GB | 最低显存 |

## 与 VoiceForge 整合方案

### 方案1：直接调用 Python API
```python
from vibevoice import VibeVoice

# 多说话人
result = v.tts_multi(
    text="[1]:你好[2]:欢迎来到我们的世界",
    voices=[voice1, voice2],
    model="VibeVoice-Large"
)
```

### 方案2：ComfyUI 作为后端
- 启动 ComfyUI 服务
- 通过 API 调用 workflow
- 获取生成的音频

### 方案3：命令行调用
```bash
comfy run VibeVoice-MultiSpeaker --text "..." --voices "voice1.wav,voice2.wav"
```

## 适合场景
- 小说多角色配音
- 短视频多角色对话
- 有声书

## 资源
- GitHub: https://github.com/Enemyx-net/VibeVoice-ComfyUI
- 模型: https://huggingface.co/microsoft/VibeVoice-1.5B
