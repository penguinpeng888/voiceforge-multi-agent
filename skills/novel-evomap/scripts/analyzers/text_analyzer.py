#!/usr/bin/env python3
"""
Novel EvoMap 文本分析器
自动提取文本风格特征，生成风格基因胶囊

功能：
- 词汇分析（复杂度、口语化、专业术语）
- 句法分析（句长、句式、从句）
- 修辞分析（比喻、对比、排比）
- 节奏分析（段落、留白、对话节奏）
- 结构分析（视角、时间处理）
- 情感分析（情感词、情感类型）
- 生成JSON格式的风格基因胶囊

用法:
    python text_analyzer.py <text_file_or_directory>
    python text_analyzer.py --author "金庸" --corpus /path/to/corpus
    python text_analyzer.py --demo
"""

import os
import re
import json
import math
import sys
from pathlib import Path
from collections import Counter, defaultdict
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple
import argparse


# ============================================================
# 核心数据结构
# ============================================================

@dataclass
class VocabularyMetrics:
    """词汇层面指标"""
    avg_word_complexity: float  # 词汇复杂度 (0-1)
    colloquial_ratio: float    # 口语化程度 (0-1)
    dialect_density: float     # 方言密度 (0-1)
    term_density: float        # 专业术语密度 (0-1)
    neologism_count: int       # 新造词数量
    word_frequency: Dict[str, int] = field(default_factory=dict)
    unique_word_ratio: float = 0.0  # 词汇多样性
    
    
@dataclass
class SyntaxMetrics:
    """句法层面指标"""
    avg_sentence_length: float     # 平均句长
    sentence_length_std: float     # 句长波动
    sentence_type_ratio: Dict[str, float]  # 陈述/疑问/感叹/祈使
    clause_complexity: float       # 从句复杂度
    inversion_ratio: float         # 倒装比例
    omission_ratio: float          # 省略比例
    passive_ratio: float           # 被动句比例


@dataclass
class RhetoricMetrics:
    """修辞层面指标"""
    metaphor_density: float        # 比喻密度 (每千字)
    simile_ratio: float           # 明喻比例
    metaphor_ratio: float         # 暗喻比例
    synecdoche_ratio: float       # 借代比例
    sensory_ratio: float          # 感官描写比例
    contrast_ratio: float         # 对比手法使用频率
    parallelism_ratio: float      # 排比/对偶频率
    hyperbole_level: float        # 夸张程度 (0-1)


@dataclass
class RhythmMetrics:
    """节奏层面指标"""
    avg_paragraph_length: float   # 平均段落长
    paragraph_length_std: float   # 段落长度波动
    long_short_ratio: float       # 长短段落比例
    rhythm_variation: float       # 节奏变化度
    dialogue_ratio: float         # 对话占比
    dialogue_style: str           # 短句交锋/长篇独白
    white_space_ratio: float      # 留白比例


@dataclass
class StructureMetrics:
    """结构层面指标"""
    narrative_perspective: str    # 叙事视角
    time_treatment: str          # 时间处理方式
    space_switch_freq: float     # 空间切换频率
    suspense_density: float      # 悬念密度
    foreshadowing_ratio: float   # 伏笔密度
    climax_distribution: List[int]  # 高潮分布位置


@dataclass
class EmotionMetrics:
    """情感层面指标"""
    emotion_intensity: float     # 情感强度
    emotion_type_distribution: Dict[str, float]  # 爱/恨/怒/哀/惧
    cold_hot_ratio: float        # 理性/感性比例
    humor_type: str              # 幽默类型 (讽刺/黑色/戏谑/无)
    comedy_tragedy_ratio: float  # 喜剧/悲剧元素比例
    sentiment_arc: List[float]   # 情感弧线


@dataclass
class StyleProfile:
    """完整风格画像"""
    author: str = ""
    work: str = ""
    
    vocabulary: Optional[VocabularyMetrics] = None
    syntax: Optional[SyntaxMetrics] = None
    rhetoric: Optional[RhetoricMetrics] = None
    rhythm: Optional[RhythmMetrics] = None
    structure: Optional[StructureMetrics] = None
    emotion: Optional[EmotionMetrics] = None
    
    total_chars: int = 0
    total_words: int = 0
    total_sentences: int = 0
    total_paragraphs: int = 0
    
    def to_dict(self) -> Dict:
        return {
            "author": self.author,
            "work": self.work,
            "statistics": {
                "total_chars": self.total_chars,
                "total_words": self.total_words,
                "total_sentences": self.total_sentences,
                "total_paragraphs": self.total_paragraphs
            },
            "vocabulary": asdict(self.vocabulary) if self.vocabulary else {},
            "syntax": asdict(self.syntax) if self.syntax else {},
            "rhetoric": asdict(self.rhetoric) if self.rhetoric else {},
            "rhythm": asdict(self.rhythm) if self.rhythm else {},
            "structure": asdict(self.structure) if self.structure else {},
            "emotion": asdict(self.emotion) if self.emotion else {}
        }


# ============================================================
# 停用词和词典
# ============================================================

# 口语词词典
COLLOQUIAL_WORDS = {
    "的", "了", "着", "啊", "呀", "呢", "吧", "吗", "哦", "哈", "诶",
    "哎呀", "哎呦", "嗨", "嘿", "哟", "嗯", "啥", "怎么", "干嘛",
    "挺好的", "没关系", "没事", "行吧", "那可不", "可不是嘛"
}

# 方言词典（示例）
DIALECT_WORDS = {
    "京味": ["咱", "您", "忒", "颠儿", "倍儿", "弄", "招呼"],
    "东北": ["嘎哈", "咋的", "埋汰", "整", "可劲", "唠嗑"],
    "四川": ["啥子", "安逸", "巴适", "瓜娃子", "耙耳朵"]
}

# 情感词典（简化版）
EMOTION_WORDS = {
    "爱": ["爱", "喜欢", "爱慕", "心动", "喜欢", "疼爱", "宠爱"],
    "恨": ["恨", "讨厌", "厌恶", "憎恨", "仇视", "痛恨"],
    "怒": ["怒", "生气", "愤怒", "恼火", "发怒", "愤慨"],
    "哀": ["悲伤", "难过", "伤心", "哀伤", "悲痛", "沮丧"],
    "惧": ["害怕", "恐惧", "畏惧", "惊恐", "担忧", "忧虑"]
}

# 修辞标记
RHETORIC_MARKERS = {
    "simile": ["像", "似", "如", "好像", "仿佛", "如同", "犹如"],
    "metaphor": ["是", "变成", "成为", "化作"],
    "personification": ["它说", "它笑", "它哭", "它想"],
    "contrast": ["但是", "然而", "不过", "而", "却"],
    "parallelism": ["或", "或者", "并且", "同时"],
    "hyperbole": ["千", "万", "亿", "无穷", "无限", "永恒"]
}

# 常见词汇（用于计算词汇复杂度）
COMPLEX_WORDS = set([
    "然而", "因此", "虽然", "但是", "因为", "所以", "若是", "倘若",
    "既然", "即便", "即使", "只要", "只有", "除非", "无论", "不管",
    "于是", "然后", "接着", "最后", "终于", "终究", "毕竟", "竟然"
])


# ============================================================
# 核心分析类
# ============================================================

class TextAnalyzer:
    """文本风格分析器"""
    
    def __init__(self, text: str = ""):
        self.original_text = text
        self.cleaned_text = ""
        self.sentences = []
        self.paragraphs = []
        self.words = []
        
        self._preprocess()
        
    def _preprocess(self):
        """文本预处理"""
        if not self.original_text:
            return
            
        # 清理空白字符
        self.cleaned_text = re.sub(r'\s+', ' ', self.original_text).strip()
        
        # 分句
        self.sentences = self._split_sentences(self.cleaned_text)
        
        # 分段
        self.paragraphs = [p.strip() for p in self.original_text.split('\n\n') if p.strip()]
        
        # 分词
        self.words = self._split_words(self.cleaned_text)
        
    def _split_sentences(self, text: str) -> List[str]:
        """分句"""
        # 简单分句：按句号、问号、感叹号、省略号
        pattern = r'[。！？…]+'
        sentences = re.split(pattern, text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _split_words(self, text: str) -> List[str]:
        """简单分词（按字符）"""
        # 对于中文，直接按字符
        if self._is_chinese(text[:100]):
            return list(text)
        # 英文按空格
        return text.lower().split()
    
    def _is_chinese(self, text: str) -> bool:
        """判断是否中文文本"""
        chinese_count = len(re.findall(r'[\u4e00-\u9fa5]', text))
        return chinese_count / max(len(text), 1) > 0.5
    
    # -------------------------------------------------------
    # 词汇分析
    # -------------------------------------------------------
    
    def analyze_vocabulary(self) -> VocabularyMetrics:
        """分析词汇特征"""
        if not self.words:
            return VocabularyMetrics(0, 0, 0, 0, 0)
        
        total = len(self.words)
        
        # 词汇复杂度
        complex_count = sum(1 for w in self.words if w in COMPLEX_WORDS)
        avg_complexity = complex_count / max(total, 1)
        
        # 口语化程度
        colloquial_count = sum(1 for w in self.words if w in COLLOQUIAL_WORDS)
        colloquial_ratio = colloquial_count / max(total, 1)
        
        # 方言密度
        dialect_count = 0
        for dialect, words in DIALECT_WORDS.items():
            dialect_count += sum(1 for w in self.words if w in words)
        dialect_density = dialect_count / max(total, 1)
        
        # 专业术语密度
        term_count = 0
        # 简化：检测4字以上词汇
        term_count = sum(1 for w in self.words if len(w) >= 4)
        term_density = term_count / max(total, 1)
        
        # 新造词（简化：检测包含英文或数字的词）
        neologism_count = len(re.findall(r'[a-zA-Z0-9]+', self.original_text))
        
        # 词汇多样性
        unique_words = set(self.words)
        unique_ratio = len(unique_words) / max(total, 1)
        
        return VocabularyMetrics(
            avg_word_complexity=avg_complexity,
            colloquial_ratio=colloquial_ratio,
            dialect_density=dialect_density,
            term_density=term_density,
            neologism_count=neologism_count,
            word_frequency=dict(Counter(self.words).most_common(100)),
            unique_word_ratio=unique_ratio
        )
    
    # -------------------------------------------------------
    # 句法分析
    # -------------------------------------------------------
    
    def analyze_syntax(self) -> SyntaxMetrics:
        """分析句法特征"""
        if not self.sentences:
            return SyntaxMetrics(0, 0, {}, 0, 0, 0, 0)
        
        # 计算句长
        sentence_lengths = [len(s) for s in self.sentences]
        avg_length = sum(sentence_lengths) / len(sentence_lengths)
        std_length = math.sqrt(sum((l - avg_length)**2 for l in sentence_lengths) / len(sentence_lengths))
        
        # 句式类型
        statement_count = sum(1 for s in self.sentences if '？' not in s and '！' not in s)
        question_count = sum(1 for s in self.sentences if '？' in s)
        exclamation_count = sum(1 for s in self.sentences if '！' in s)
        total = len(self.sentences)
        
        sentence_type_ratio = {
            "statement": statement_count / max(total, 1),
            "question": question_count / max(total, 1),
            "exclamation": exclamation_count / max(total, 1)
        }
        
        # 从句复杂度（简化：检测逗号数量）
        clause_count = sum(s.count('，') for s in self.sentences)
        clause_complexity = clause_count / max(total, 1)
        
        # 倒装比例（简化：检测句末的介词/副词）
        inversion_patterns = ['的吗', '的么', '了吗', '了呢', '啊', '呀', '吧', '嘛']
        inversion_count = sum(1 for s in self.sentences if any(p in s for p in inversion_patterns))
        inversion_ratio = inversion_count / max(total, 1)
        
        # 省略比例（简化：检测短句）
        short_sentences = sum(1 for s in self.sentences if len(s) < 10)
        omission_ratio = short_sentences / max(total, 1)
        
        # 被动句
        passive_count = sum(1 for s in self.sentences if '被' in s or '让' in s)
        passive_ratio = passive_count / max(total, 1)
        
        return SyntaxMetrics(
            avg_sentence_length=avg_length,
            sentence_length_std=std_length,
            sentence_type_ratio=sentence_type_ratio,
            clause_complexity=clause_complexity,
            inversion_ratio=inversion_ratio,
            omission_ratio=omission_ratio,
            passive_ratio=passive_ratio
        )
    
    # -------------------------------------------------------
    # 修辞分析
    # -------------------------------------------------------
    
    def analyze_rhetoric(self) -> RhetoricMetrics:
        """分析修辞特征"""
        if not self.cleaned_text:
            return RhetoricMetrics(0, 0, 0, 0, 0, 0, 0, 0)
        
        text_len = len(self.cleaned_text)
        
        # 比喻密度
        simile_count = sum(self.cleaned_text.count(m) for m in RHETORIC_MARKERS["simile"])
        metaphor_count = sum(self.cleaned_text.count(m) for m in RHETORIC_MARKERS["metaphor"])
        total_simile = simile_count + metaphor_count
        metaphor_density = total_simile / (text_len / 1000)  # 每千字
        
        simile_ratio = simile_count / max(total_simile, 1)
        metaphor_ratio = metaphor_count / max(total_simile, 1)
        
        # 借代比例
        synecdoche_count = 0  # 简化版未实现
        synecdoche_ratio = 0
        
        # 感官描写
        sensory_words = ["看", "听", "闻", "摸", "尝", "感"]
        sensory_count = sum(self.cleaned_text.count(w) for w in sensory_words)
        sensory_ratio = sensory_count / (text_len / 1000)
        
        # 对比手法
        contrast_count = sum(self.cleaned_text.count(m) for m in RHETORIC_MARKERS["contrast"])
        contrast_ratio = contrast_count / (text_len / 1000)
        
        # 排比
        parallel_count = sum(self.cleaned_text.count(m) for m in RHETORIC_MARKERS["parallelism"])
        parallelism_ratio = parallel_count / (text_len / 1000)
        
        # 夸张
        hyperbole_count = sum(self.cleaned_text.count(m) for m in RHETORIC_MARKERS["hyperbole"])
        hyperbole_level = min(hyperbole_count / 10, 1.0)  # 归一化
        
        return RhetoricMetrics(
            metaphor_density=metaphor_density,
            simile_ratio=simile_ratio,
            metaphor_ratio=metaphor_ratio,
            synecdoche_ratio=synecdoche_ratio,
            sensory_ratio=sensory_ratio,
            contrast_ratio=contrast_ratio,
            parallelism_ratio=parallelism_ratio,
            hyperbole_level=hyperbole_level
        )
    
    # -------------------------------------------------------
    # 节奏分析
    # -------------------------------------------------------
    
    def analyze_rhythm(self) -> RhythmMetrics:
        """分析节奏特征"""
        if not self.paragraphs:
            return RhythmMetrics(0, 0, 0, 0, 0, "unknown", 0)
        
        paragraph_lengths = [len(p) for p in self.paragraphs]
        avg_para_length = sum(paragraph_lengths) / len(paragraph_lengths)
        std_para_length = math.sqrt(sum((l - avg_para_length)**2 for l in paragraph_lengths) / len(paragraph_lengths))
        
        # 长短段落比例
        long_count = sum(1 for l in paragraph_lengths if l > 200)
        short_count = sum(1 for l in paragraph_lengths if l < 50)
        long_short_ratio = long_count / max(short_count, 1)
        
        # 节奏变化度
        rhythm_variation = std_para_length / max(avg_para_length, 1)
        
        # 对话占比
        dialogue_chars = sum(p.count('"') + p.count('"') + p.count('「') + p.count('」') 
                           for p in self.paragraphs)
        total_chars = sum(len(p) for p in self.paragraphs)
        dialogue_ratio = dialogue_chars / max(total_chars, 1) / 4  # 估算
        
        # 对话风格
        short_dialogues = sum(1 for p in self.paragraphs if p.count('。') < 3 and ('“' in p or '"' in p))
        if dialogue_ratio > 0.1:
            if short_dialogues > 0:
                dialogue_style = "短句交锋"
            else:
                dialogue_style = "长篇独白"
        else:
            dialogue_style = "叙述为主"
        
        # 留白比例
        white_space = sum(p.count('\n') + p.count('    ') for p in self.paragraphs)
        white_space_ratio = white_space / max(len(self.paragraphs), 1)
        
        return RhythmMetrics(
            avg_paragraph_length=avg_para_length,
            paragraph_length_std=std_para_length,
            long_short_ratio=long_short_ratio,
            rhythm_variation=rhythm_variation,
            dialogue_ratio=dialogue_ratio,
            dialogue_style=dialogue_style,
            white_space_ratio=white_space_ratio
        )
    
    # -------------------------------------------------------
    # 结构分析
    # -------------------------------------------------------
    
    def analyze_structure(self) -> StructureMetrics:
        """分析结构特征"""
        # 叙事视角
        first_person = any("我" in p and "说" not in p for p in self.paragraphs[:5])
        if first_person:
            narrative_perspective = "第一人称"
        elif any("他" in p for p in self.paragraphs[:10]):
            narrative_perspective = "第三人称有限"
        else:
            narrative_perspective = "第三人称全知"
        
        # 时间处理
        flashback_count = sum(1 for p in self.paragraphs if "曾经" in p or "以前" in p or "回想" in p)
        if flashback_count > 3:
            time_treatment = "频繁插叙"
        elif flashback_count > 0:
            time_treatment = "偶有插叙"
        else:
            time_treatment = "线性叙事"
        
        # 空间切换
        space_switches = sum(1 for p in self.paragraphs if "于是" in p or "然后" in p)
        space_switch_freq = space_switches / max(len(self.paragraphs), 1)
        
        # 悬念
        suspense_markers = ["然而", "但是", "不过", "就在这时", "突然", "谁知"]
        suspense_count = sum(1 for p in self.paragraphs if any(m in p for m in suspense_markers))
        suspense_density = suspense_count / max(len(self.paragraphs), 1)
        
        # 伏笔
        foreshadow_markers = ["预示", "预感到", "隐隐", "似乎"]
        foreshadow_count = sum(1 for p in self.paragraphs if any(m in p for m in foreshadow_markers))
        foreshadowing_ratio = foreshadow_count / max(len(self.paragraphs), 1)
        
        # 高潮分布（简化：检测情感词密集区）
        climax_distribution = []
        
        return StructureMetrics(
            narrative_perspective=narrative_perspective,
            time_treatment=time_treatment,
            space_switch_freq=space_switch_freq,
            suspense_density=suspense_density,
            foreshadowing_ratio=foreshadowing_ratio,
            climax_distribution=climax_distribution
        )
    
    # -------------------------------------------------------
    # 情感分析
    # -------------------------------------------------------
    
    def analyze_emotion(self) -> EmotionMetrics:
        """分析情感特征"""
        if not self.cleaned_text:
            return EmotionMetrics(0, {}, 0, "none", 0, [])
        
        text_lower = self.cleaned_text.lower() if self._is_chinese(self.cleaned_text) else self.cleaned_text.lower()
        
        # 情感强度
        emotion_word_count = 0
        for words in EMOTION_WORDS.values():
            emotion_word_count += sum(text_lower.count(w) for w in words)
        emotion_intensity = emotion_word_count / (len(self.cleaned_text) / 1000)
        
        # 情感类型分布
        emotion_type_dist = {}
        for emotion, words in EMOTION_WORDS.items():
            count = sum(text_lower.count(w) for w in words)
            emotion_type_dist[emotion] = count / max(emotion_word_count, 1)
        
        # 冷热比例
        hot_words = ["热血", "激情", "激动", "愤怒", "战斗"]
        cold_words = ["冷静", "平淡", "思考", "分析", "推理"]
        hot_count = sum(text_lower.count(w) for w in hot_words)
        cold_count = sum(text_lower.count(w) for w in cold_words)
        cold_hot_ratio = cold_count / max(hot_count, 1)
        
        # 幽默类型
        if "讽刺" in self.cleaned_text or "嘲笑" in self.cleaned_text:
            humor_type = "讽刺"
        elif "黑色幽默" in self.cleaned_text:
            humor_type = "黑色幽默"
        elif "戏谑" in self.cleaned_text or "调侃" in self.cleaned_text:
            humor_type = "戏谑"
        else:
            humor_type = "none"
        
        # 喜剧/悲剧比例
        happy_words = ["开心", "高兴", "幸福", "快乐", "甜蜜"]
        sad_words = ["悲伤", "难过", "痛苦", "绝望", "悲剧"]
        happy_count = sum(text_lower.count(w) for w in happy_words)
        sad_count = sum(text_lower.count(w) for w in sad_words)
        comedy_tragedy_ratio = happy_count / max(sad_count, 1)
        
        # 情感弧线（简化：按段落情感得分）
        sentiment_arc = []
        
        return EmotionMetrics(
            emotion_intensity=emotion_intensity,
            emotion_type_distribution=emotion_type_dist,
            cold_hot_ratio=cold_hot_ratio,
            humor_type=humor_type,
            comedy_tragedy_ratio=comedy_tragedy_ratio,
            sentiment_arc=sentiment_arc
        )
    
    # -------------------------------------------------------
    # 主分析函数
    # -------------------------------------------------------
    
    def analyze(self, author: str = "", work: str = "") -> StyleProfile:
        """完整分析，返回风格画像"""
        profile = StyleProfile(
            author=author,
            work=work,
            total_chars=len(self.cleaned_text),
            total_words=len(self.words),
            total_sentences=len(self.sentences),
            total_paragraphs=len(self.paragraphs)
        )
        
        profile.vocabulary = self.analyze_vocabulary()
        profile.syntax = self.analyze_syntax()
        profile.rhetoric = self.analyze_rhetoric()
        profile.rhythm = self.analyze_rhythm()
        profile.structure = self.analyze_structure()
        profile.emotion = self.analyze_emotion()
        
        return profile
    
    def to_gene_capsule(self, author: str, work: str, source_dir: str = "") -> Dict:
        """生成风格基因胶囊格式"""
        profile = self.analyze(author, work)
        data = profile.to_dict()
        
        data["source_dir"] = source_dir
        data["generated_at"] = self._timestamp()
        
        return data
    
    def _timestamp(self) -> str:
        """时间戳"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def summary(self) -> str:
        """生成简洁摘要"""
        if not self.cleaned_text:
            return "无文本内容"
        
        v = self.analyze_vocabulary()
        s = self.analyze_syntax()
        r = self.analyze_rhythm()
        
        return f"""
📊 文本分析摘要
━━━━━━━━━━━━━━━━━━━━
📏 总字数: {len(self.cleaned_text)}
📝 总句数: {len(self.sentences)}
📄 总段数: {len(self.paragraphs)}

📚 词汇
  复杂度: {v.avg_word_complexity:.2f}
  口语化: {v.colloquial_ratio:.2f}
  多样性: {v.unique_word_ratio:.2f}

📖 句法
  平均句长: {s.avg_sentence_length:.1f}字
  陈述句: {s.sentence_type_ratio.get('statement', 0):.1%}
  疑问句: {s.sentence_type_ratio.get('question', 0):.1%}

🎵 节奏
  平均段长: {r.avg_paragraph_length:.1f}字
  对话占比: {r.dialogue_ratio:.1%}
  节奏变化: {r.rhythm_variation:.2f}
        """


# ============================================================
# 批量处理
# ============================================================

def analyze_directory(directory: str, author: str = "") -> List[StyleProfile]:
    """批量分析目录下所有文本文件"""
    profiles = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.txt', '.md', '.text')):
                filepath = os.path.join(root, file)
                try:
                    text = Path(filepath).read_text(encoding='utf-8')
                    analyzer = TextAnalyzer(text)
                    work_name = Path(file).stem
                    profile = analyzer.analyze(author or work_name, work_name)
                    profiles.append(profile)
                    print(f"✅ 分析完成: {file}")
                except Exception as e:
                    print(f"❌ 分析失败: {file} - {e}")
    
    return profiles


def compare_profiles(profiles: List[StyleProfile]) -> str:
    """比较多个风格画像"""
    if len(profiles) < 2:
        return "需要至少2个样本才能比较"
    
    comparison = "📊 风格对比分析\n━━━━━━━━━━━━━━━━━━━━\n"
    
    keys = ["avg_word_complexity", "avg_sentence_length", "metaphor_density", 
            "dialogue_ratio", "emotion_intensity"]
    key_names = {
        "avg_word_complexity": "词汇复杂度",
        "avg_sentence_length": "平均句长",
        "metaphor_density": "比喻密度",
        "dialogue_ratio": "对话占比",
        "emotion_intensity": "情感强度"
    }
    
    for key in keys:
        comparison += f"\n{key_names[key]}:\n"
        for p in profiles:
            val = getattr(p.vocabulary, key, None) or getattr(p.syntax, key, None) or \
                  getattr(p.rhetoric, key, None) or getattr(p.rhythm, key, None) or \
                  getattr(p.emotion, key, None)
            if val is not None:
                comparison += f"  {p.work or p.author}: {val:.3f}\n"
    
    return comparison


# ============================================================
# 主程序
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Novel EvoMap 文本分析器 - 自动提取风格特征",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s text.txt
    %(prog)s /path/to/corpus --author "金庸"
    %(prog)s --demo
    %(prog)s --compare file1.txt file2.txt
        """
    )
    
    parser.add_argument("target", nargs="?", help="文本文件或目录")
    parser.add_argument("--author", "-a", help="作者名")
    parser.add_argument("--work", "-w", help="作品名")
    parser.add_argument("--corpus", "-c", help="语料库目录")
    parser.add_argument("--demo", action="store_true", help="演示模式")
    parser.add_argument("--compare", nargs="+", help="比较多个文件")
    parser.add_argument("--output", "-o", help="输出JSON文件")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    if args.demo:
        # 演示模式
        sample_text = """
        他站在山巅，望着远方的云海，心中涌起一股说不清的情绪。
        "十年了，"他喃喃自语，"终于回来了。"
        风吹动他的衣袂猎猎作响。
        眼前是一片废墟，曾经辉煌的宫殿如今只剩下断壁残垣。
        但他知道，真正的战斗才刚刚开始。
        """
        analyzer = TextAnalyzer(sample_text)
        print(analyzer.summary())
        print("\n" + "="*50)
        print("📦 风格基因胶囊:")
        print(json.dumps(analyzer.to_gene_capsule("演示", "demo"), ensure_ascii=False, indent=2))
        
    elif args.compare:
        # 比较模式
        profiles = []
        for f in args.compare:
            if Path(f).exists():
                text = Path(f).read_text(encoding='utf-8')
                analyzer = TextAnalyzer(text)
                profiles.append(analyzer.analyze(Path(f).stem, Path(f).stem))
        print(compare_profiles(profiles))
        
    elif args.target:
        target = Path(args.target)
        
        if target.is_file():
            # 分析单个文件
            text = target.read_text(encoding='utf-8')
            analyzer = TextAnalyzer(text)
            author = args.author or target.stem
            work = args.work or target.stem
            
            if args.verbose:
                print(analyzer.summary())
            
            capsule = analyzer.to_gene_capsule(author, work, str(target.parent))
            
            if args.output:
                Path(args.output).write_text(
                    json.dumps(capsule, ensure_ascii=False, indent=2),
                    encoding='utf-8'
                )
                print(f"✅ 已保存: {args.output}")
            else:
                print(json.dumps(capsule, ensure_ascii=False, indent=2))
                
        elif target.is_dir():
            # 分析目录
            profiles = analyze_directory(str(target), args.author or "")
            
            # 保存结果
            output_file = args.output or f"{target.name}-analysis.json"
            from datetime import datetime
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            result = {
                "author": args.author or target.name,
                "analyzed_at": now,
                "works": [p.to_dict() for p in profiles]
            }
            
            Path(output_file).write_text(
                json.dumps(result, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            print(f"✅ 已保存: {output_file} ({len(profiles)}个作品)")
            
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
