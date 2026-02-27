#!/usr/bin/env python3
"""
斗破苍穹慢速扫描器
一晚上扫描几章，不触发反爬

使用方法:
    python doupo_slow_scan.py chapter 10    # 扫描第10章
    python doupo_slow_scan.py batch 10 50   # 扫描10-50章
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
CORPUS_DIR = Path(WORKSPACE) / "skills/novel-evomap/corpus/doupo"
SCAN_LOG = Path(WORKSPACE) / "skills/novel-evomap/doupo_scan_log.json"

# API配置
API_URL = "https://816f5f6b759e7.bqg567.xyz/api/chapter"
BOOK_ID = "717"

# 斗破特有描写模式
STYLE_PATTERNS = {
    "异火描写": r"异火[^\n，。？！]{5,20}",
    "斗气爆发": r"斗气[^\n，。？！]{5,20}",
    "灵魂技法": r"灵魂[^\n，。？！]{5,20}",
    "焚诀修炼": r"焚诀[^\n，。？！]{5,20}",
    "佛怒火莲": r"佛怒火莲[^\n，。？！]{5,20}",
    "越级挑战": r"[五星|六星|七星|八星|九星][斗者|斗师|大斗师|斗灵|斗王|斗皇][^\n]{5,20}",
    "丹药炼制": r"炼制[^\n，。？！]{5,20}",
    "炼药师": r"炼药师[^\n，。？！]{5,20}",
    "药老指点": r"药老[^\n，。？！]{5,20}",
    "萧炎性格": r"[三十年河东|莫欺少年穷|势在必得][^\n]{5,20}",
}

EMOTION_PATTERNS = {
    "薰儿互动": r"薰儿[^\n]{0,30}",
    "药老师徒": r"[药老|老师][^\n]{0,30}",
    "美杜莎感情": r"美杜莎[^\n]{0,30}",
    "云韵互动": r"云韵[^\n]{0,30}",
    "小医仙": r"小医仙[^\n]{0,30}",
    "纳兰嫣然": r"纳兰嫣然[^\n]{0,30}",
    "萧战父子": r"[萧炎|萧战][^\n]{0,30}",
}

def load_scan_log() -> Dict:
    """加载扫描日志"""
    if SCAN_LOG.exists():
        with open(SCAN_LOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"scanned": {}, "last_scan": None}

def save_scan_log(log: Dict):
    """保存扫描日志"""
    SCAN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(SCAN_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

def is_chapter_scanned(chapter_num: int, text: str) -> bool:
    """检查章节是否已扫描（通过MD5判断）"""
    log = load_scan_log()
    if str(chapter_num) in log.get("scanned", {}):
        return log["scanned"][str(chapter_num)].get("md5") == hashlib.md5(text.encode()).hexdigest()
    return False

def clean_text(text: str) -> str:
    """清理文本"""
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    # 移除网址
    text = re.sub(r'https?://\S+', '', text)
    return text.strip()

def extract_style_features(text: str) -> Dict:
    """提取风格特征"""
    features = {
        "techniques": [],
        "emotions": [],
        "keywords": []
    }
    
    text_lower = text.lower()
    
    # 检测技法描写
    for name, pattern in STYLE_PATTERNS.items():
        if re.search(pattern, text):
            features["techniques"].append(name)
            # 提取示例
            match = re.search(pattern, text)
            if match:
                features["keywords"].append({
                    "type": name,
                    "example": match.group(0)[:50]
                })
    
    # 检测情感互动
    for name, pattern in EMOTION_PATTERNS.items():
        if re.search(pattern, text):
            features["emotions"].append(name)
    
    return features

def fetch_chapter(chapter_num: int) -> Optional[Dict]:
    """获取单章内容"""
    url = f"{API_URL}?id={BOOK_ID}&chapterid={chapter_num}"
    print(f"  📖 获取第{chapter_num}章...")
    
    time.sleep(3)  # 延迟3秒
    
    try:
        import urllib.request
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if data.get("txt") and len(data.get("txt", "")) > 100:
            text = clean_text(data["txt"])
            features = extract_style_features(text)
            
            result = {
                "chapter": chapter_num,
                "chaptername": data.get("chaptername", f"第{chapter_num}章"),
                "text": text,
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
    
    # 统计
    all_techniques = []
    all_emotions = []
    all_examples = []
    
    for d in scanned_data:
        all_techniques.extend(d.get("features", {}).get("techniques", []))
        all_emotions.extend(d.get("features", {}).get("emotions", []))
        all_examples.extend(d.get("features", {}).get("keywords", []))
    
    # 统计出现频率
    from collections import Counter
    tech_counter = Counter(all_techniques)
    emotion_counter = Counter(all_emotions)
    
    capsule = {
        "name": "斗破苍穹-天蚕土豆风格",
        "author": "天蚕土豆",
        "work": "斗破苍穹",
        "source": "bq567_api",
        "version": datetime.now().strftime("%Y%m%d"),
        "scan_stats": {
            "total_chapters": len(scanned_data),
            "total_chars": sum(d.get("length", 0) for d in scanned_data),
            "scan_date": datetime.now().isoformat()
        },
        "features": {
            "techniques": {
                "found": list(set(all_techniques)),
                "frequency": dict(tech_counter),
                "description": "斗破特有的异火、斗气、灵魂技法描写模式"
            },
            "emotions": {
                "found": list(set(all_emotions)),
                "frequency": dict(emotion_counter),
                "description": "萧炎与诸女的感情线互动模式"
            },
            "keywords": all_examples[:20],  # 保存前20个关键词示例
            "style_tags": [
                "爽文", "退婚流", "异火流", "升级碾压",
                "热血", "快节奏", "美女如云", "扮猪吃虎",
                "莫欺少年穷", "三十年河东"
            ],
            "narrative_style": {
                "pace": "快节奏爽文",
                "tone": "热血激昂",
                "focus": "战斗爽点 + 装逼打脸",
                "dialogue_style": "简洁有力，常有经典台词"
            }
        },
        "sample_chapters": [d.get("chapter") for d in scanned_data],
        "world_building": {
            "realm_system": ["斗者,斗师,大斗师,斗灵,斗王,斗皇,斗宗,斗尊,斗圣,斗帝"],
            "unique_elements": ["异火榜", "炼药师体系", "焚诀", "佛怒火莲"]
        },
        "writing_tips": [
            "异火出场要有气势描写（颜色、温度、威压）",
            "战斗要有来有回，先抑后扬",
            "装逼打脸要自然，不能太刻意",
            "主角要有血性，有仇必报",
            "美人要有各自性格，不能脸谱化"
        ]
    }
    
    return capsule

def save_results(capsule: Dict, chapters: List[Dict]):
    """保存结果"""
    today = datetime.now().strftime("%Y%m%d")
    
    # 保存胶囊
    capsule_file = GENES_DIR / f"style-doupo-{today}.json"
    i = 1
    while capsule_file.exists():
        capsule_file = GENES_DIR / f"style-doupo-{today}_v{i}.json"
        i += 1
    
    with open(capsule_file, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 胶囊已保存: {capsule_file.name}")
    
    # 保存章节数据
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    chapters_file = CORPUS_DIR / f"chapters_{today}.json"
    with open(chapters_file, 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)
    print(f"✅ 章节数据已保存: {chapters_file.name}")
    
    # 更新索引
    update_index(capsule)
    
    return capsule_file.name

def update_index(capsule: Dict):
    """更新基因库索引"""
    index_file = GENES_DIR / "GENES_INDEX.md"
    
    entry = f"""
### 天蚕土豆 - 斗破苍穹（{capsule.get('version', 'v1')}）
```
{capsule.get('name', 'style-doupo')}.json
```
- **扫描章节**: {capsule.get('scan_stats', {}).get('total_chapters', 0)} 章
- **总字数**: {capsule.get('scan_stats', {}).get('total_chars', 0):,} 字
- **技法标签**: {', '.join(capsule.get('features', {}).get('style_tags', [])[:5])}
- **特点**: {capsule.get('features', {}).get('techniques', {}).get('description', '')}

| 技法 | 出现次数 |
|------|----------|
"""
    
    for tech, count in capsule.get('features', {}).get('techniques', {}).get('frequency', {}).items():
        entry += f"| {tech} | {count} |\n"
    
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        content = "# 基因库索引\n"
    
    # 检查是否已存在斗破条目
    if "斗破苍穹" not in content:
        content += entry
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 索引已更新")
    else:
        print(f"ℹ️ 索引已存在斗破条目，跳过更新")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="斗破苍穹慢速扫描器")
    parser.add_argument("command", choices=["scan", "batch", "status"], help="命令")
    parser.add_argument("--chapter", "-c", type=int, help="单章编号")
    parser.add_argument("--start", type=int, help="起始章节")
    parser.add_argument("--end", type=int, help="结束章节")
    
    args = parser.parse_args()
    
    if args.command == "status":
        log = load_scan_log()
        scanned = list(log.get("scanned", {}).keys())
        print(f"\n📚 斗破苍穹扫描状态")
        print(f"   已扫描: {len(scanned)} 章")
        print(f"   章节列表: {scanned[:20]}{'...' if len(scanned) > 20 else ''}")
        print(f"   最近扫描: {log.get('last_scan', '从未')}")
    
    elif args.command == "scan":
        if not args.chapter:
            print("❌ 请指定章节: --chapter <num>")
            return
        
        # 获取章节
        chapter_data = fetch_chapter(args.chapter)
        
        if chapter_data:
            # 更新日志
            log = load_scan_log()
            log["scanned"][str(args.chapter)] = {
                "md5": chapter_data["md5"],
                "length": chapter_data["length"],
                "scanned_at": chapter_data["scanned_at"]
            }
            log["last_scan"] = datetime.now().isoformat()
            save_scan_log(log)
            
            # 生成并保存胶囊
            capsule = generate_capsule([chapter_data])
            if capsule:
                save_results(capsule, [chapter_data])
    
    elif args.command == "batch":
        if not args.start or not args.end:
            print("❌ 请指定范围: --start 1 --end 50")
            return
        
        print(f"\n🚀 开始批量扫描: 第{args.start}-{args.end}章")
        print(f"   速度: 每章间隔3秒")
        
        scanned = []
        for i in range(args.start, args.end + 1):
            # 检查是否已扫描
            chapter = fetch_chapter(i)
            if chapter:
                scanned.append(chapter)
                
                # 更新日志
                log = load_scan_log()
                log["scanned"][str(i)] = {
                    "md5": chapter["md5"],
                    "length": chapter["length"],
                    "scanned_at": chapter["scanned_at"]
                }
                save_scan_log(log)
            
            # 每10章打印进度
            if i % 10 == 0:
                print(f"\n📊 进度: {i}/{args.end} ({i*100/args.end:.1f}%)")
        
        if scanned:
            # 生成胶囊
            capsule = generate_capsule(scanned)
            
            # 保存
            save_results(capsule, scanned)
            
            print(f"\n🎉 扫描完成！")
            print(f"   扫描章节: {len(scanned)} 章")
            print(f"   生成胶囊: 1 个")
        else:
            print(f"\n❌ 未能扫描到任何章节")

if __name__ == "__main__":
    main()
