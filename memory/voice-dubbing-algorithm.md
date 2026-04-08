# TTS + 调度 + LLM情感分析 算法设计

> 研究日期：2026-04-08
> 基于：GLM-TTS、EmoVoice 论文研究

---

## 一、核心问题

如何在不使用大模型的情况下，让 TTS 生成有情感的多角色配音？

答案：LLM 做情感分析 -> TTS 做语音合成 -> 调度器做批量处理

---

## 二、系统架构

1. LLM 情感分析引擎 - 对每句台词分析情感类型/强度/语速
2. 音色匹配器 - 为每个角色分配音色
3. TTS 生成器 - 带情感参数的 TTS 调用
4. 调度器 - 分批处理 + 音频合并

---

## 三、LLM 情感分析算法

### 3.1 情感类型定义

```python
EMOTIONS = {
    # 基础情感
    "happy": "高兴、愉快",
    "sad": "悲伤、沮丧", 
    "angry": "愤怒、生气",
    "fear": "恐惧、害怕",
    "surprise": "惊讶、意外",
    "neutral": "平静、普通",
    
    # 复合情感
    "sarcastic": "讽刺、冷笑",
    "nervous": "紧张、担忧",
    "excited": "兴奋、激动",
    "disgusted": "厌恶、反感",
    "confused": "困惑、迷茫",
    "determined": "坚定、果断",
    "teasing": "调侃、戏谑",
    "crying": "哭泣、呜咽",
}
```

### 3.2 LLM 分析 Prompt

```
你是一个情感分析专家。根据以下剧本台词，分析说话者的情感。

## 剧本上下文
{scene_description}

## 当前台词
{character_name}: "{dialogue}"

请分析并输出JSON格式：
{
    "emotion": "情感类型",
    "intensity": 1-10,
    "speed": "slow/normal/fast",
    "volume": "quiet/normal/loud",
    "notes": "特殊语气说明"
}
```

### 3.3 示例分析

输入：
场景：主角看到师父被杀，悲痛欲绝
台词：师父！！！你不要死...不要...

LLM 输出：
```json
{
    "emotion": "crying",
    "intensity": 9,
    "speed": "slow",
    "volume": "loud",
    "notes": "悲痛欲绝，声音颤抖，带哭腔"
}
```

---

## 四、TTS 情感参数映射

### 4.1 ElevenLabs 情感映射

| 情感 | emotion | stability | style |
|------|---------|-----------|-------|
| happy | happy | 0.5 | 0.5 |
| sad | sad | 0.7 | 0.3 |
| angry | angry | 0.3 | 0.9 |
| neutral | neutral | 0.5 | 0.5 |

### 4.2 MiniMax 情感参数

| 情感 | temperature | speed |
|------|-------------|-------|
| happy | 1.0 | 1.1 |
| sad | 0.7 | 0.85 |
| angry | 1.1 | 1.2 |
| neutral | 0.8 | 1.0 |

---

## 五、调度器算法

### 5.1 分批逻辑

```python
def batch_scripts(scripts, max_per_batch=4):
    # 提取所有角色
    all_characters = set(line["character"] for line in scripts)
    
    # 分批（每批最多4个角色）
    batches = []
    current_batch = []
    current_chars = set()
    
    for line in scripts:
        char = line["character"]
        if char in current_chars and len(current_chars) >= max_per_batch:
            batches.append(current_batch)
            current_batch = [line]
            current_chars = {char}
        else:
            current_batch.append(line)
            current_chars.add(char)
    
    if current_batch:
        batches.append(current_batch)
    
    return batches
```

### 5.2 音频合并

使用 ffmpeg 按时间轴拼接：
```bash
ffmpeg -i "concat:file1.wav|file2.wav|file3.wav" -c copy output.wav
```

---

## 六、完整流程示例

输入：
- 角色：陆沉(年轻男性)、师父(老年男性)、反派(邪恶男性)
- 台词：
  1. 师父：陆沉，今天是你的成人礼...
  2. 反派：哈哈，老东西受死吧！
  3. 陆沉：师父！！！

处理流程：
1. LLM 情感分析
   - 师父：neutral + 温和 + 慢
   - 反派：angry + 8分 + 快
   - 陆沉：crying + 9分 + 颤抖

2. TTS 生成
   - 每个角色分别生成带情感的音频

3. 调度分批
   - 批1: 师父 + 反派
   - 批2: 陆沉

4. 合并输出 -> 完整音频

---

## 七、技术选型

| 模块 | 推荐方案 |
|------|----------|
| LLM 情感分析 | MiniMax / DeepSeek |
| TTS | ElevenLabs / MiniMax |
| 调度 | 自研 Python |
| 音频合并 | ffmpeg |

---

## 八、待验证问题

1. TTS 能否准确表达指定的情感？
2. 多角色同时说话如何处理？
3. 情感强度如何精确映射？
4. 复杂情感（苦笑）如何处理？

---

更新：2026-04-08
