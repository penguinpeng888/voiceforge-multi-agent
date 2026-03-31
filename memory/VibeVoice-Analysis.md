# VibeVoice 微软开源语音系统分析报告

> 来源: https://github.com/microsoft/VibeVoice
> 下载时间: 2026-03-31
> 本地大小: 264MB

## 一、模型系列

| 模型 | 功能 | 参数 | 状态 |
|------|------|------|------|
| VibeVoice-ASR-7B | 60分钟长音频语音识别 | 7B | 可用 |
| VibeVoice-TTS-1.5B | 90分钟长文本转语音 | 1.5B | **禁用** |
| VibeVoice-Realtime-0.5B | 实时语音合成 | 0.5B | 可用 |

## 二、VibeVoice-TTS (已禁用)

### 核心能力
- **90分钟长文本合成**：单次通过生成90分钟音频
- **4个说话人**：支持多人对话，自然轮转
- **情感表达**：捕捉对话动态和情感细微差别
- **多语言**：支持英语、中文等

### 架构
```
LLM (Qwen2.5) → 连续语音Tokenizer (7.5Hz) → Diffusion Head → 音频
```

- **LLM**: 理解文本上下文和对话流程
- **Tokenizer**: 7.5Hz超低帧率，高效保真
- **Diffusion**: 生成高保真音频细节

### 技术亮点
- Next-token Diffusion框架
- 64K token上下文
- 连续语音tokenizer

### ⚠️ 状态
TTS代码已从仓库移除（因滥用），但文档和架构仍可参考。

## 三、VibeVoice-ASR (可用)

### 核心能力
- **60分钟单次处理**：单次通过处理60分钟音频，保留全局上下文
- **多说话人识别**：同时识别谁在什么时候说了什么
- **50+语言支持**：无需语言设置，原生支持多语言和代码切换
- **热词定制**：可添加自定义词汇提升识别准确率

### 输出格式
```json
{
  "speaker": "speaker_1",
  "timestamp": "00:01:23",
  "content": "识别到的文本"
}
```

### 安装
```bash
# 1. Docker环境
sudo docker run --privileged --net=host --gpus all --rm -it nvcr.io/nvidia/pytorch:25.12-py3

# 2. 安装
git clone https://github.com/microsoft/VibeVoice.git
cd VibeVoice
pip install -e .

# 3. 运行Demo
apt install ffmpeg -y
python demo/vibevoice_asr_gradio_demo.py --model_path microsoft/VibeVoice-ASR --share
```

### 性能指标
- DER (说话人分离误差): 4.28 (English)
- cpWER: 11.48
- tcpWER: 13.02
- WER: 7.99

## 四、VibeVoice-Realtime (可用)

### 核心能力
- **参数**: 0.5B (易于部署)
- **延迟**: ~300ms首字节
- **流式输入**: 支持流式文本输入
- **长形式**: ~10分钟长音频

### 使用
Colab: https://colab.research.google.com/github/microsoft/VibeVoice/blob/main/demo/vibevoice_realtime_colab.ipynb

## 五、与VoiceForge的结合点

### 1. ASR录音识别
- 用VibeVoice-ASR做语音识别输入
- 支持60分钟长音频，适合小说配音
- 多说话人识别适合角色对话

### 2. TTS替代方案
- VibeVoice-TTS禁用，但Realtime可用
- 可作为MiniMax TTS的替代
- 需要关注官方是否重新开放

### 3. 本地部署
- 需要GPU (推荐24GB+)
- Docker环境准备
- vLLM加速推理支持

## 六、部署前提

### 硬件要求
- GPU: NVIDIA 24GB+ (A100/Tesla V100)
- 内存: 32GB+
- 存储: 50GB+

### 软件环境
- CUDA 12.0+
- Docker
- Python 3.10+

## 七、后续行动

1. [ ] 准备Docker环境
2. [ ] 下载VibeVoice-ASR模型
3. [ ] 测试语音识别效果
4. [ ] 集成到VoiceForge系统

## 八、参考链接

- 官网: https://microsoft.github.io/VibeVoice
- ASR模型: https://huggingface.co/microsoft/VibeVoice-ASR
- Realtime模型: https://huggingface.co/microsoft/VibeVoice-Realtime-0.5B
- 技术报告: https://arxiv.org/pdf/2601.18184
- Demo Playground: https://aka.ms/vibevoice-asr