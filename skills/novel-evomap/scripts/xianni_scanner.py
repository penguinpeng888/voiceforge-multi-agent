#!/usr/bin/env python3
"""
仙逆扫描器 - 炼气期章节
扫描仙逆炼气期，提取写作技法

使用方法:
    python xianni_scanner.py chapter 1
    python xianni_scanner.py batch 1 100
"""

import os
import re
import json
import time
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# 配置
WORKSPACE = "/root/.openclaw/workspace"
GENES_DIR = Path(WORKSPACE) / "skills/novel-evomap/genes"
CORPUS_DIR = Path(WORKSPACE) / "skills/novel-evomap/corpus/xianni"
SCAN_LOG = Path(WORKSPACE) / "skills/novel-evomap/xianni_scan_log.json"

# 云轩阁仙逆配置
BASE_URL = "https://m.yunxuangexsw.com"
BOOK_PATH = "/yxg/768_768345"

# 仙逆风格模式（耳根特色）
ERGEN_PATTERNS = {
    # 道心描写
    "道心考验": r"[道心|问道|悟道][^\n]{5,20}",
    "逆天改命": r"[逆天|改命|宿命][^\n]{5,20}",
    "执念": r"[执念|执著][^\n]{5,20}",
    
    # 情感描写
    "虐心情感": r"[心痛|心碎|悲伤][^\n]{5,20}",
    "生死离别": r"[离别|永别|死亡][^\n]{5,20}",
    "救赎": r"[救赎|牺牲|挽救][^\n]{5,20}",
    
    # 修炼描写
    "意境": r"[意境|感悟][^\n]{5,20}",
    "心魔": r"[心魔|心劫][^\n]{5,20}",
    
    # 战斗描写
    "以命换命": r"[以命换命|拼命][^\n]{5,20}",
    "绝境反击": r"[绝境|反击][^\n]{5,20}",
}

# 仙逆特色标签
ERGEN_TAGS = [
    "仙逆", "耳根", "道心流", "虐心",
    "逆天改命", "生死离别", "救赎",
    "意境修炼", "执念", "宿命"
]

def load_scan_log() -> Dict:
    if SCAN_LOG.exists():
        with open(SCAN_LOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"scanned": {}, "last_scan": None}

def save_scan_log(log: Dict):
    SCAN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(SCAN_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

def clean_text(text: str) -> str:
    text = re.sub(r'本小章还未完.*下一页', '', text)
    text = re.sub(r'请点击.*继续阅读', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_features(text: str) -> Dict:
    features = {"techniques": [], "emotions": [], "keywords": []}
    
    for name, pattern in ERGEN_PATTERNS.items():
        if re.search(pattern, text):
            features["techniques"].append(name)
            match = re.search(pattern, text)
            if match:
                features["keywords"].append({"type": name, "example": match.group(0)[:30]})
    
    return features

def fetch_chapter(chapter_num: int) -> Optional[Dict]:
    url = f"{BASE_URL}{BOOK_PATH}/{1262694 + chapter_num}.html"
    print(f"  📖 获取第{chapter_num}章...")
    
    time.sleep(2)
    
    try:
        import urllib.request
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        text = clean_text(html)
        
        if len(text) > 500:
            features = extract_features(text)
            result = {
                "chapter": chapter_num,
                "text": text[:5000],
                "length": len(text),
                "features": features,
                "md5": hashlib.md5(text.encode()).hexdigest(),
                "scanned_at": datetime.now().isoformat()
            }
            print(f"    ✅ {len(text)}字, {len(features['techniques'])}个技法")
            return result
        
        print(f"    ❌ 内容太短")
        return None
        
    except Exception as e:
        print(f"    ❌ 错误: {e}")
        return None

def generate_capsule(scanned_data: List[Dict]) -> Dict:
    if not scanned_data:
        return {}
    
    all_tech = []
    all_kw = []
    
    for d in scanned_data:
        all_tech.extend(d.get("features", {}).get("techniques", []))
        all_kw.extend(d.get("features", {}).get("keywords", []))
    
    from collections import Counter
    tech_count = Counter(all_tech)
    
    capsule = {
        "name": "仙逆-耳根风格",
        "author": "耳根",
        "work": "仙逆",
        "stage": "炼气期",
        "source": "yunxuangexsw",
        "version": datetime.now().strftime("%Y%m%d"),
        "scan_stats": {
            "total_chapters": len(scanned_data),
            "total_chars": sum(d.get("length", 0) for d in scanned_data),
            "scan_date": datetime.now().isoformat()
        },
        "features": {
            "techniques": {
                "found": list(set(all_tech)),
                "frequency": dict(tech_count),
                "description": "耳根仙逆核心：道心考验+虐心情感+以命换命"
            },
            "keywords": all_kw[:20],
            "style_tags": ERGEN_TAGS,
            "narrative_style": {
                "pace": "沉重内敛",
                "tone": "虐心深沉",
                "focus": "道心成长 + 情感虐恋",
                "dialogue_style": "简短有力，情感压抑"
            }
        },
        "world_building": {
            "realm_system": ["炼气期 → 筑基期 → 结丹期 → 元婴期 → 化神期"],
            "unique_elements": ["意境", "道心", "心魔", "逆天改命"]
        },
        "writing_tips": [
            "道心描写要深刻，不是简单的升级",
            "情感要虐心，但要有升华",
            "生死离别要有宿命感",
            "主角要有执念，并为之付出代价",
            "救赎与牺牲是永恒主题"
        ],
        "sample_chapters": [d.get("chapter") for d in scanned_data]
    }
    
    return capsule

def save_results(capsule: Dict, chapters: List[Dict]):
    today = datetime.now().strftime("%Y%m%d")
    
    capsule_file = GENES_DIR / f"style-xianni-qi-{today}.json"
    i = 1
    while capsule_file.exists():
        capsule_file = GENES_DIR / f"style-xianni-qi-{today}_v{i}.json"
        i += 1
    
    with open(capsule_file, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 胶囊已保存: {capsule_file.name}")
    
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    chapters_file = CORPUS_DIR / f"qi_chapters_{today}.json"
    with open(chapters_file, 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)
    print(f"✅ 章节数据已保存: {chapters_file.name}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="仙逆扫描器")
    parser.add_argument("command", choices=["scan", "batch", "status"], help="命令")
    parser.add_argument("--chapter", "-c", type=int, help="单章编号")
    parser.add_argument("--start", type=int, help="起始章节")
    parser.add_argument("--end", type=int, help="结束章节")
    
    args = parser.parse_args()
    
    if args.command == "status":
        log = load_scan_log()
        scanned = list(log.get("scanned", {}).keys())
        print(f"\n📚 仙逆扫描状态")
        print(f"   已扫描: {len(scanned)} 章")
    
    elif args.command == "scan":
        if not args.chapter:
            print("❌ 请指定章节: --chapter <num>")
            return
        
        chapter = fetch_chapter(args.chapter)
        if chapter:
            log = load_scan_log()
            log["scanned"][str(args.chapter)] = chapter["md5"]
            log["last_scan"] = datetime.now().isoformat()
            save_scan_log(log)
            
            capsule = generate_capsule([chapter])
            if capsule:
                save_results(capsule, [chapter])
    
    elif args.command == "batch":
        if not args.start or not args.end:
            print("❌ 请指定范围: --start 1 --end 100")
            return
        
        print(f"\n🚀 开始批量扫描: 第{args.start}-{args.end}章")
        
        scanned = []
        for i in range(args.start, args.end + 1):
            chapter = fetch_chapter(i)
            if chapter:
                scanned.append(chapter)
                log = load_scan_log()
                log["scanned"][str(i)] = chapter["md5"]
                save_scan_log(log)
            
            if i % 20 == 0:
                print(f"\n📊 进度: {i}/{args.end}")
        
        if scanned:
            capsule = generate_capsule(scanned)
            save_results(capsule, scanned)
            print(f"\n🎉 扫描完成！扫描章节: {len(scanned)} 章")

if __name__ == "__main__":
    main()
