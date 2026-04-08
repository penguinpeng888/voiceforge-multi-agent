# TTS+调度+LLM情感分析 实际解决方案

> 2026-04-08

---

## 一、LLM 情感分析 - 怎么做到准确？

### 问题1：LLM 分析不准确怎么办？

**方案：多轮分析 + 上下文增强**

```python
def analyze_emotion(scene_context, dialogue, character_name):
    # First round: basic analysis
    basic_prompt = f"""
Scene: {scene_context}
Character: {character_name}
Dialogue: {dialogue}

Analyze emotion type (happy/sad/angry/fear/surprise/neutral/sarcastic/crying/nervous/laugh)
Output JSON: {{"emotion": "?", "intensity": 1-10}}
    """
    result1 = llm.call(basic_prompt)
    
    # Second round: verify and refine
    verify_prompt = f"""
First analysis: {result1}
Dialogue: {dialogue}

Is this correct? If not, correct it and add:
- Adjust intensity?
- Any special tone? (trembling/cold laugh/sobbing/hesitant...)
- Speed: slow/normal/fast?

Output complete JSON
    """
    result2 = llm.call(verify_prompt)
    
    return result2
```

### 问题2：上下文如何传入？

**方案：提取前后3句作为上下文**

```python
def get_scene_context(all_dialogues, current_index, window=3):
    start = max(0, current_index - window)
    end = min(len(all_dialogues), current_index + window + 1)
    context_lines = all_dialogues[start:end]
    
    context = ""
    for i, line in enumerate(context_lines):
        marker = ">>> " if i == window else ""
        context += f"{marker}{line['character']}: {line['text']}\n"
    
    return context.strip()
```

---

## 二、TTS情感参数 - 怎么映射？

### 问题：TTS不支持复杂情感参数怎么办？

**方案：构建情感参数映射表**

```python
EMOTION_PARAMS = {
    "happy": {
        "elevenlabs": {"emotion": "happy", "stability": 0.5, "style": 0.6},
        "minimax": {"speed": 1.15, "volume": 1.1, "pitch": 1.05}
    },
    "sad": {
        "elevenlabs": {"emotion": "sad", "stability": 0.7, "style": 0.3},
        "minimax": {"speed": 0.85, "volume": 0.9, "pitch": 0.95}
    },
    "angry": {
        "elevenlabs": {"emotion": "angry", "stability": 0.3, "style": 0.9},
        "minimax": {"speed": 1.25, "volume": 1.2, "pitch": 1.1}
    },
    "crying": {
        "elevenlabs": {"emotion": "sad", "stability": 0.8, "style": 0.2},
        "minimax": {"speed": 0.8, "volume": 1.0, "pitch": 0.9}
    },
    "neutral": {
        "elevenlabs": {"emotion": "neutral", "stability": 0.5, "style": 0.5},
        "minimax": {"speed": 1.0, "volume": 1.0, "pitch": 1.0}
    }
}

def get_tts_params(emotion, provider="elevenlabs"):
    base = EMOTION_PARAMS.get(emotion, EMOTION_PARAMS["neutral"])
    return base.get(provider, base["minimax"])
```

### 强度如何影响参数？

```python
def apply_intensity(base_params, intensity):
    factor = intensity / 5.0
    adjusted = base_params.copy()
    
    if "style" in adjusted:
        adjusted["style"] = min(1.0, adjusted["style"] * factor)
    if "speed" in adjusted:
        adjusted["speed"] = adjusted["speed"] * (0.8 + 0.4 * factor / 2)
    
    return adjusted
```

---

## 三、调度器 - 怎么分批？

```python
def smart_batch(dialogues, max_chars_per_batch=500, max_speakers=4):
    batches = []
    current_batch = []
    current_chars = set()
    current_chars_count = 0
    
    for i, line in enumerate(dialogues):
        char = line["character"]
        need_new_batch = False
        
        # Condition 1: speaker limit
        if char not in current_chars and current_chars_count >= max_speakers:
            need_new_batch = True
        
        # Condition 2: char limit
        current_text_len = sum(len(d["text"]) for d in current_batch)
        if current_text_len + len(line["text"]) > max_chars_per_batch:
            need_new_batch = True
        
        # Condition 3: scene change
        if current_batch and line.get("scene") != current_batch[-1].get("scene"):
            need_new_batch = True
        
        if need_new_batch:
            if current_batch:
                batches.append(current_batch)
            current_batch = [line]
            current_chars = {char}
            current_chars_count = 1
        else:
            current_batch.append(line)
            if char not in current_chars:
                current_chars.add(char)
                current_chars_count += 1
    
    if current_batch:
        batches.append(current_batch)
    
    return batches
```

---

## 四、音频合并 - 怎么自然？

### 过渡音方案

```python
def merge_with_transition(clips, output_path):
    # Use ffmpeg concat with crossfade
    inputs = " ".join(f"-i {c['file']}" for c in clips)
    cmd = f"""
ffmpeg -y {inputs} -filter_complex "concat=n={len(clips)}:v=0:a=1[out]" -map "[out]" {output_path}
    """
```

### 同时说话混音

```python
def mix_simultaneous_speech(clip_files, output_path):
    inputs = " ".join(f"-i {f}" for f in clip_files)
    cmd = f"""
ffmpeg -y {inputs} -filter_complex "[0:a]volume=0.7[a0];[1:a]volume=0.7[a1];[a0][a1]amix=inputs=2:duration=longest[out]" -map "[out]" {output_path}
    """
```

---

## 五、完整流程

```python
def generate_voice_dubbing(script):
    # 1. Emotion analysis
    analyzed = []
    for i, line in enumerate(script["dialogues"]):
        context = get_scene_context(script["dialogues"], i)
        emotion = analyze_emotion(context, line["text"], line["character"])
        analyzed.append({**line, **emotion})
    
    # 2. Smart batching
    batches = smart_batch(analyzed)
    
    # 3. TTS generation
    audio_files = []
    for batch in batches:
        for line in batch:
            params = get_tts_params(line["emotion"])
            params = apply_intensity(params, line["intensity"])
            
            audio = tts.speak(
                text=line["text"],
                voice=script["characters"][line["character"]]["voice_id"],
                **params
            )
            audio_files.append(audio)
    
    # 4. Merge
    final_audio = merge_with_transition(audio_files, "output.wav")
    
    return final_audio
```

---

## 六、关键技术难点

| 难点 | 解决方案 |
|------|----------|
| LLM分析不准 | 多轮分析+上下文 |
| 情感参数映射 | 映射表+强度系数 |
| 分批逻辑 | 智能分批算法 |
| 音频合并 | ffmpeg过渡+混音 |

---

Update: 2026-04-08
