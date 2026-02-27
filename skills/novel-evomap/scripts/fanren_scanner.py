#!/usr/bin/env python3
"""
凡人修仙传扫描器 - 炼气期章节
扫描凡人修仙传炼气期，提取写作技法

使用方法:
    python fanren_scanner.py chapter 1
    python fanren_scanner.py batch 1 100  # 扫描炼气期前100章
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
CORPUS_DIR = Path(WORKSPACE) / "skills/novel-evomap/corpus/fanren"
SCAN_LOG = Path(WORKSPACE) / "skills/novel-evomap/fanren_scan_log.json"

# 云轩阁API配置
BASE_URL = "https://www.yunxuange.org"
BOOK_PATH = "/yxg/768_768317"

# 凡人流风格模式
FANREN_PATTERNS = {
    # 技法描写
    "法器运用": r"[法器|飞剑|符宝|盾牌|小刀|珠子][^\n]{5,20}",
    "符箓战术": r"[符箓|符纸|灵符][^\n]{5,20}",
    "丹药辅助": r"[丹药|药丸|灵药][^\n]{5,20}",
    "阵法知识": r"[阵法|阵眼|困阵|杀阵][^\n]{5,20}",
    "灵石使用": r"[灵石][^\n]{5,20}",
    
    # 修炼描写
    "灵气运转": r"[灵气|灵力][^\n]{5,20}",
    "瓶颈突破": r"[瓶颈|突破][^\n]{5,20}",
    "境界提升": r"[境界|修为][^\n]{5,20}",
    
    # 战斗描写
    "以弱胜强": r"[以弱胜强|越级][^\n]{5,20}",
    "战术策略": r"[战术|策略][^\n]{5,20}",
    "资源碾压": r"[符箓|丹药][^\n]{5,20}",
}

# 情感/心理描写
EMOTION_PATTERNS = {
    "谨慎心理": r"[谨慎|小心|注意][^\n]{5,20}",
    "冷静分析": r"[分析|观察][^\n]{5,20}",
    "危机应对": r"[危机|危险][^\n]{5,20}",
    "师徒情": r"[师傅|师父|徒弟][^\n]{5,20}",
    "亲情": r"[父母|兄妹|家人][^\n]{5,20}",
    "利益交换": r"[交换|交易][^\n]{5,20}",
}

# 凡人流特色标签
FANREN_TAGS = [
    "凡人流", "谨慎流", "现实主义修仙",
    "资源型战斗", "法器符箓战术", "以弱胜强",
    "利益驱动", "师徒情淡", "亲情羁绊"
]

def load_scan_log() -> Dict:
    """加载扫描日志"""
    if SCAN_LOG.exists():
        with open(SCAN_LOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"scanned": {}, "last_scan": None, "qi_stage": []}

def save_scan_log(log: Dict):
    """保存扫描日志"""
    SCAN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(SCAN_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

def clean_text(text: str) -> str:
    """清理文本"""
    # 移除广告
    text = re.sub(r'本小章还未完.*下一页', '', text)
    text = re.sub(r'请点击.*继续阅读', '', text)
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_features(text: str) -> Dict:
    """提取特色"""
    features = {"techniques": [], "emotions": [], "keywords": []}
    
    # 检测技法
    for name, pattern in FANREN_PATTERNS.items():
        if re.search(pattern, text):
            features["techniques"].append(name)
            match = re.search(pattern, text)
            if match:
                features["keywords"].append({"type": name, "example": match.group(0)[:30]})
    
    # 检测情感
    for name, pattern in EMOTION_PATTERNS.items():
        if re.search(pattern, text):
            features["emotions"].append(name)
    
    return features

def fetch_chapter(chapter_num: int) -> Optional[Dict]:
    """获取单章内容"""
    url = f"{BASE_URL}{BOOK_PATH}/{1024555 + chapter_num}.html"
    print(f"  📖 获取第{chapter_num}章...")
    
    time.sleep(2)  # 延迟
    
    try:
        import urllib.request
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')
        
        # 提取文本（简化处理）
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
    """生成写作胶囊"""
    if not scanned_data:
        return {}
    
    all_tech = []
    all_emot = []
    all_keywords = []
    
    for d in scanned_data:
        all_tech.extend(d.get("features", {}).get("techniques", []))
        all_emot.extend(d.get("features", {}).get("emotions", []))
        all_keywords.extend(d.get("features", {}).get("keywords", []))
    
    from collections import Counter
    tech_count = Counter(all_tech)
    emot_count = Counter(all_emot)
    
    capsule = {
        "name": "凡人修仙传-忘语风格",
        "author": "忘语",
        "work": "凡人修仙传",
        "stage": "炼气期",
        "source": "yunxuange",
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
                "description": "凡人流战斗核心：法器+符箓+丹药+阵法的资源整合战术"
            },
            "emotions": {
                "found": list(set(all_emot)),
                "frequency": dict(emot_count),
                "description": "忘语特色的冷静理性情感线"
            },
            "keywords": all_keywords[:20],
            "style_tags": FANREN_TAGS,
            "narrative_style": {
                "pace": "沉稳内敛",
                "tone": "冷静理性",
                "focus": "资源积累 + 以弱胜强",
                "dialogue_style": "言简意赅，利益导向"
            }
        },
        "world_building": {
            "realm_system": ["炼气期 → 筑基期 → 结丹期 → 元婴期 → 化神期"],
            "unique_elements": ["法器系统", "符箓战术", "丹药辅助", "阵法知识", "灵石交易"]
        },
        "writing_tips": [
            "战斗拼的是资源（法器、符箓、丹药），不是硬实力",
            "主角要冷静理性，不做无谓冒险",
            "以弱胜强的关键是信息差和资源差",
            "师徒情淡，重在利益交换",
            "修炼体系要严谨，每境界有明确划分"
        ],
        "sample_chapters": [d.get("chapter") for d in scanned_data]
    }
    
    return capsule

def save_results(capsule: Dict, chapters: List[Dict]):
    """保存结果"""
    today = datetime.now().strftime("%Y%m%d")
    
    # 保存胶囊
    capsule_file = GENES_DIR / f"style-fanren-qi-{today}.json"
    i = 1
    while capsule_file.exists():
        capsule_file = GENES_DIR / f"style-fanren-qi-{today}_v{i}.json"
        i += 1
    
    with open(capsule_file, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 胶囊已保存: {capsule_file.name}")
    
    # 保存章节数据
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    chapters_file = CORPUS_DIR / f"qi_chapters_{today}.json"
    with open(chapters_file, 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)
    print(f"✅ 章节数据已保存: {chapters_file.name}")
    
    return capsule_file.name

def main():
    import argparse
    parser = argparse.ArgumentParser(description="凡人修仙传扫描器")
    parser.add_argument("command", choices=["scan", "batch", "status"], help="命令")
    parser.add_argument("--chapter", "-c", type=int, help="单章编号")
    parser.add_argument("--start", type=int, help="起始章节")
    parser.add_argument("--end", type=int, help="结束章节")
    
    args = parser.parse_args()
    
    if args.command == "status":
        log = load_scan_log()
        scanned = list(log.get("scanned", {}).keys())
        print(f"\n📚 凡人修仙传炼气期扫描状态")
        print(f"   已扫描: {len(scanned)} 章")
        print(f"   最近扫描: {log.get('last_scan', '从未')}")
    
    elif args.command == "scan":
        if not args.chapter:
            print("❌ 请指定章节: --chapter <num>")
            return
        
        chapter = fetch_chapter(args.chapter)
        if chapter:
            log = load_scan_log()
            log["scanned"][str(args.chapter)] = {
                "md5": chapter["md5"],
                "length": chapter["length"],
                "scanned_at": chapter["scanned_at"]
            }
            log["last_scan"] = datetime.now().isoformat()
            save_scan_log(log)
            
            capsule = generate_capsule([chapter])
            if capsule:
                save_results(capsule, [chapter])
    
    elif args.command == "batch":
        if not args.start or not args.end:
            print("❌ 请指定范围: --start 1 --end 100")
            return
        
        print(f"\n🚀 开始批量扫描: 第{args.start}-{args.end}章（炼气期）")
        print(f"   速度: 每章间隔2秒")
        
        scanned = []
        for i in range(args.start, args.end + 1):
            chapter = fetch_chapter(i)
            if chapter:
                scanned.append(chapter)
                
                log = load_scan_log()
                log["scanned"][str(i)] = {
                    "md5": chapter["md5"],
                    "length": chapter["length"],
                    "scanned_at": chapter["scanned_at"]
                }
                save_scan_log(log)
            
            if i % 20 == 0:
                print(f"\n📊 进度: {i}/{args.end} ({i*100/args.end:.1f}%)")
        
        if scanned:
            capsule = generate_capsule(scanned)
            save_results(capsule, scanned)
            print(f"\n🎉 扫描完成！扫描章节: {len(scanned)} 章")
        else:
            print(f"\n❌ 未能扫描到任何章节")

if __name__ == "__main__":
    main()
