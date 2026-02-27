#!/usr/bin/env python3
"""
音乐基因扫描器 - 歌词与风格分析
扫描优秀歌曲，提取歌词写作技法、风格要素

使用方法:
    python music_scanner.py scan --artist "方文山" --songs "青花瓷,菊花台,东风破"
    python music_scanner.py analyze --lyrics "歌词内容"
"""

import os
import re
import json
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# 配置
WORKSPACE = "/root/.openclaw/workspace"
MUSIC_DIR = Path(WORKSPACE) / "music-genes"
LYRICS_DIR = MUSIC_DIR / "lyrics"
INDEX_FILE = MUSIC_DIR / "index.json"

# 常见歌手/作词人
ARTIST_URLS = {
    "方文山": "https://music.163.com/api/search/get?type=1&s=方文山",
    "林夕": "https://music.163.com/api/search/get?type=1&s=林夕",
    "周杰伦": "https://music.163.com/api/search/get?type=1&s=周杰伦",
    "李宗盛": "https://music.163.com/api/search/get?type=1&s=李宗盛",
    "五月天阿信": "https://music.163.com/api/search/get?type=1&s=阿信",
    "毛不易": "https://music.163.com/api/search/get?type=1&s=毛不易",
}

# 歌词分析模式
LYRIC_PATTERNS = {
    # 写作技法
    "意象丰富": r"[青花瓷|菊花台|东风破|烟花易冷|发如雪|千里之外|红尘客栈|兰亭序]",
    "历史典故": r"[青花|汝窑|官窑|锦瑟|商隐|李白|苏轼|岳飞|霸王]",
    "时空交错": r"[今|昔|古|今|当年|此时|那年|曾经]",
    "对比手法": r"[但是|然而|不过|还是|只是]",
    "押韵技巧": r"[韵脚匹配]",
    
    # 情感表达
    "思乡之情": r"[故乡|家乡|归乡|乡愁]",
    "爱情思念": r"[思念|想|念|等|盼]",
    "人生感悟": r"[人生|岁月|时光|青春|成长]",
    "古风意境": r"[烟雨|江南|雨落|风吹]",
}

# 风格标签
STYLE_TAGS = {
    "中国风": ["青花瓷", "东风破", "烟花易冷", "发如雪", "兰亭序", "菊花台"],
    "都市情歌": ["安静", "晴天", "稻香", "告白气球"],
    "摇滚风格": ["倔强", "顽固", "干杯", "人生海海"],
    "治愈系": ["平凡之路", "像我这样的人", "消愁"],
    "R&B": ["可爱女人", "简单爱", "园游会"],
}

def load_index() -> Dict:
    """加载索引"""
    if INDEX_FILE.exists():
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"artists": {}, "songs": []}

def save_index(index: Dict):
    """保存索引"""
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

def clean_lyrics(text: str) -> str:
    """清理歌词"""
    # 移除时间戳 [00:00.00]
    text = re.sub(r'\[\d{2}:\d{2}\.\d{2}\]', '', text)
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    # 移除广告
    text = re.sub(r'作曲|作词|编曲|制作.*', '', text)
    return text.strip()

def analyze_lyrics(text: str) -> Dict:
    """分析歌词"""
    analysis = {
        "length": len(text),
        "lines": text.count('\n') + 1 if '\n' in text else 1,
        "techniques": [],
        "emotions": [],
        "keywords": [],
        "structure": detect_structure(text)
    }
    
    # 检测写作技法
    for name, pattern in LYRIC_PATTERNS.items():
        if re.search(pattern, text):
            analysis["techniques"].append(name)
    
    # 检测关键词
    keywords = [
        ("古典意象", r"[青花|瓷器|烟雨|江南|雨落|长安|洛阳|西湖|断桥]"),
        ("时间词汇", r"[岁月|时光|流年|当年|曾经|如今]"),
        ("空间词汇", r"[千里|万里|天涯|海角|远方]"),
        ("情感词汇", r"[思念|孤独|寂寞|悲伤|欢喜]"),
    ]
    
    for name, pattern in keywords:
        if re.search(pattern, text):
            matches = re.findall(pattern, text)
            analysis["keywords"].append({"type": name, "count": len(matches)})
    
    return analysis

def detect_structure(text: str) -> Dict:
    """检测歌词结构"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    structure = {
        "total_lines": len(lines),
        "avg_line_length": sum(len(l) for l in lines) / max(len(lines), 1),
        "has_chorus": False,
        "chorus_lines": []
    }
    
    # 检测副歌（重复最多的段落）
    line_counts = {}
    for line in lines:
        if len(line) > 5:
            line_counts[line] = line_counts.get(line, 0) + 1
    
    repeats = {k: v for k, v in line_counts.items() if v > 1}
    if repeats:
        structure["has_chorus"] = True
        structure["chorus_lines"] = len(repeats)
    
    return structure

def analyze_style(text: str, artist: str = "", song: str = "") -> Dict:
    """综合分析风格"""
    analysis = analyze_lyrics(text)
    
    # 匹配风格标签
    matched_tags = []
    for tag, keywords in STYLE_TAGS.items():
        for kw in keywords:
            if kw in text or kw in song:
                matched_tags.append(tag)
                break
    
    # 生成写作胶囊
    capsule = {
        "name": f"{artist}-{song}" if artist and song else "音乐分析",
        "artist": artist,
        "song": song,
        "analyzed_at": datetime.now().isoformat(),
        "lyrics_length": analysis["length"],
        "structure": analysis["structure"],
        "writing_techniques": {
            "detected": analysis["techniques"],
            "keywords": analysis["keywords"],
            "description": generate_technique_description(analysis)
        },
        "style_tags": list(set(matched_tags)),
        "sample_lines": extract_sample_lines(text),
        "writing_tips": generate_writing_tips(analysis)
    }
    
    return capsule

def generate_technique_description(analysis: Dict) -> str:
    """生成技法描述"""
    desc = []
    
    if "意象丰富" in analysis["techniques"]:
        desc.append("善用意象堆叠营造画面感")
    if "历史典故" in analysis["techniques"]:
        desc.append("融入历史典故增加文化厚度")
    if "时空交错" in analysis["techniques"]:
        desc.append("古今对照，时间感强")
    if "对比手法" in analysis["techniques"]:
        desc.append("善于运用对比增强张力")
    
    return "；".join(desc) if desc else "需要进一步分析"

def extract_sample_lines(text: str, count: int = 3) -> List[str]:
    """提取示例句子"""
    lines = [l.strip() for l in text.split('\n') if l.strip() and len(l) > 5]
    # 选择有代表性的句子
    samples = []
    for line in lines[:20]:
        if any(kw in line for kw in ["月", "雨", "风", "花", "时间", "思念"]):
            samples.append(line)
        if len(samples) >= count:
            break
    return samples[:count] or lines[:3]

def generate_writing_tips(analysis: Dict) -> List[str]:
    """生成写作技巧"""
    tips = []
    
    if "意象丰富" in analysis["techniques"]:
        tips.append("用具体意象代替抽象情感，如用'青花瓷'代表爱情永恒")
    if "历史典故" in analysis["techniques"]:
        tips.append("适当引用历史典故，增加歌词的文化深度")
    if analysis["structure"].get("has_chorus"):
        tips.append("副歌要朗朗上口，适当的重复能增强记忆点")
    
    if not tips:
        tips = [
            "注重歌词的画面感，让听众能'看见'歌词",
            "长短句交替，形成节奏感",
            "尾字押韵，让歌词更易唱",
            "情感层层递进，不宜平铺直叙"
        ]
    
    return tips

def save_lyrics(artist: str, song: str, text: str):
    """保存歌词"""
    artist_dir = LYRICS_DIR / artist
    artist_dir.mkdir(parents=True, exist_ok=True)
    
    file = artist_dir / f"{song}.txt"
    with open(file, 'w', encoding='utf-8') as f:
        f.write(text)

def save_capsule(capsule: Dict):
    """保存胶囊"""
    capsule_file = MUSIC_DIR / "capsules" / f"{capsule.get('artist', 'unknown')}-{capsule.get('song', 'unknown')}.json"
    capsule_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(capsule_file, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 胶囊已保存: {capsule_file.name}")
    return capsule_file.name

# 方文山经典歌词样本（手动输入一些经典歌词进行分析）
SAMPLE_LYRICS = {
    "青花瓷": """
素胚勾勒出青花笔锋浓转淡
瓶身描绘的牡丹一如你初妆
冉冉檀香透过窗心事我了然
宣纸上走笔至此搁一半

釉色渲染仕女图韵味被私藏
而你嫣然的一笑如含苞待放
你的美一缕飘散去到我去不了的地方

天青色等烟雨而我在等你
炊烟袅袅升起隔江千万里
在瓶底书汉隶仿前朝的飘逸
就当我为遇见你伏笔

天青色等烟雨而我在等你
月色被打捞起晕开了结局
如传世的青花瓷自顾自美丽
你眼带笑意
""",
    "东风破": """
一壶漂泊浪迹天涯难入喉
你走之后酒暖回忆思念瘦
水向东流时间怎么偷
花开就一次成熟我却错过

谁在用琵琶弹奏一曲东风破
岁月在墙上剥落看见小时候
犹记得那年我们都还很年幼
而如今琴声悠悠我的等候你没听过

篱笆外的古道我牵着你走过
荒烟蔓草的年头就连分手都很沉默
""",
    "菊花台": """
你的泪光柔弱中带伤
惨白的月弯弯勾住过往
夜太漫长凝结成了霜
是谁在阁楼上冰冷地绝望

雨轻轻弹朱红色的窗
我一身旧梦在风中摇晃
柔弱的恨与恨在指尖流淌
你的回眸抹杀了我的信仰

菊花残满地霜你的笑容已泛黄
花落人断肠我心事静静躺
北风乱夜未央你的影子剪不断
徒留我孤单在湖面成双
""",
}

def main():
    import argparse
    parser = argparse.ArgumentParser(description="音乐基因扫描器")
    parser.add_argument("command", choices=["scan", "analyze", "demo"], help="命令")
    parser.add_argument("--artist", "-a", help="歌手/作词人")
    parser.add_argument("--song", "-s", help="歌曲名")
    parser.add_argument("--lyrics", "-l", help="歌词内容")
    
    args = parser.parse_args()
    
    if args.command == "demo":
        print("\n🎵 音乐基因扫描演示 - 方文山中国风")
        print("="*50)
        
        for song, lyrics in SAMPLE_LYRICS.items():
            print(f"\n📝 分析歌曲: {song}")
            capsule = analyze_style(lyrics, "方文山", song)
            save_capsule(capsule)
            save_lyrics("方文山", song, lyrics)
            
            print(f"\n  技法: {', '.join(capsule['writing_techniques']['detected'])}")
            print(f"  风格: {', '.join(capsule['style_tags'])}")
            print(f"  示例: {capsule['sample_lines'][0][:30]}...")
        
        # 更新索引
        index = load_index()
        index["artists"]["方文山"] = {
            "songs": list(SAMPLE_LYRICS.keys()),
            "style": "中国风",
            "analyzed_at": datetime.now().isoformat()
        }
        save_index(index)
        
        print(f"\n✅ 演示完成！生成 {len(SAMPLE_LYRICS)} 个胶囊")
    
    elif args.command == "analyze":
        if not args.lyrics:
            print("❌ 请提供歌词: --lyrics <内容>")
            return
        
        capsule = analyze_style(args.lyrics, args.artist or "", args.song or "")
        print(f"\n📊 分析结果:")
        print(f"  技法: {', '.join(capsule['writing_techniques']['detected'])}")
        print(f"  风格: {', '.join(capsule['style_tags'])}")
        print(f"  结构: {capsule['structure']['total_lines']}行")
        
        save_capsule(capsule)
    
    elif args.command == "scan":
        if not args.artist:
            print("❌ 请指定歌手: --artist <name>")
            return
        
        print(f"\n🎵 开始扫描: {args.artist}")
        # 这里可以扩展网络搜索功能
        print("ℹ️ 请提供歌词进行分析")

if __name__ == "__main__":
    main()
