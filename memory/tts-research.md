# TTS 技术调研报告

> 日期: 2026-04-10
> 目的: 为VoiceForge配音项目选择合适的TTS引擎

---

## 一、调研背景

项目需求：小说配音、有声书、视频旁白
核心需求：自然语音、情感表达、低成本

---

## 二、主流TTS模型对比

### 2.1 开源模型

| 模型 | 机构 | 参数 | 特点 | 适合场景 |
|------|------|------|------|----------|
| **CosyVoice 3** | 阿里FunAudioLLM | 0.5B | 零样本克隆、低延迟150ms、多语言 | 首选开源方案 |
| **Qwen3-TTS** | 阿里 | 0.6B/1.7B | 语音设计、克隆、自然度高 | 次选 |
| **F5-TTS** | 学术项目 | - | Flow Matching + DiT, RTF 0.15 | 研究用 |
| **Kokoro** | Hexgrad | 82M | TTS Arena 44%胜率 | 轻量部署 |
| **Orpheus** | Canopy Labs | 3B | 最强开源TTS之一 | 高品质需求 |
| **Dia** | Nari Labs | 1.6B | 2025年新秀 | 潜力股 |
| **Fish Speech** | - | - | 免费本地部署 | 机械音 ❌ |

### 2.2 商业方案

| 方案 | 特点 | 成本 | 备注 |
|------|------|------|------|
| **海螺AI** | 效果好、超自然 | 免费 | 需要解决token问题 |
| **ElevenLabs** | 最高品质 | 付费 | 付费储备 |
| **Edge-TTS** | 免费快速 | 免费 | 机械音 |

---

## 三、核心技术路线

### 3.1 Flow Matching (F5-TTS)
- 无需复杂duration model
- RTF 0.15（推理快）
- 零样本能力强

### 3.2 LLM-based (CosyVoice 3)
- 基于大语言模型
- 150ms超低延迟
- 支持指令控制（语速、情感、方言）

### 3.3 DiT (Diffusion Transformer)
- 新型架构
- 效果好但推理慢

---

## 四、推荐方案

### 4.1 短期（快速启动）
- 使用Edge-TTS先跑通VoiceForge
- 缺点：机械音，但能验证流程

### 4.2 中期（品质提升）
- 部署CosyVoice 3或Qwen3-TTS
- 免费开源，效果好

### 4.3 长期（终极目标）
- 搞定海螺AI token
- ElevenLabs作为付费储备

---

## 五、CosyVoice 3 详细特性

### 5.1 支持语言
- 9种语言：中文、英语、日语、韩语、德语、西班牙语、法语、意大利语、俄语
- 18+种中文方言：粤语、闽南语、四川话、东北话、山西话等

### 5.2 核心能力
- 零样本语音克隆
- 语音转换（Voice Conversion）
- 语速控制
- 情感控制
- 方言切换

### 5.3 性能指标
- 延迟：150ms
- 内容一致性：SOTA
- 说话人相似度：SOTA
- 韵律自然度：SOTA

---

## 六、相关资源

### 6.1 GitHub仓库
- CosyVoice: https://github.com/FunAudioLLM/CosyVoice
- Qwen3-TTS: https://github.com/QwenLM/Qwen3-TTS
- F5-TTS: https://github.com/SWivid/F5-TTS

### 6.2 论文
- CosyVoice 3: https://arxiv.org/pdf/2505.17589
- F5-TTS: https://arxiv.org/abs/2410.06885

### 6.3 在线Demo
- CosyVoice 3: https://funaudiollm.github.io/cosyvoice3/
- Qwen3-TTS: https://huggingface.co/spaces/Qwen/Qwen3-TTS
- F5-TTS: https://swivid.github.io/F5-TTS/

---

## 七、决策

| 优先级 | 方案 | 行动 |
|--------|------|------|
| P0 | Edge-TTS | 立即可用，先跑通流程 |
| P1 | 海螺AI网页版 | 等用户方便时一起研究token |
| P2 | CosyVoice 3 | 后续本地部署 |
| P3 | ElevenLabs | 付费储备 |

---

*持续更新中...*