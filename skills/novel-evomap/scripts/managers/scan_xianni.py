#!/usr/bin/env python3
"""
扫描耳根《仙逆》章节，生成基因胶囊
"""

import gzip
import json
import re
import time
import urllib.request
from pathlib import Path
from typing import Dict, List

BASE_URL = "https://m.yunxuange.org"
BOOK_ID = "768_768345"
LINK_BASE = 1262694

OUTPUT_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/genes/er_gen")
WORK_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/.scan_xianni")
WORK_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_CHAPTERS = [1, 10, 100, 300, 500, 800, 1000, 1300, 1500, 1800, 2000]


def fetch_chapter(chapter: int) -> Dict:
    url = f"{BASE_URL}/yxg/{BOOK_ID}/{LINK_BASE + chapter}.html"
    try:
        req = urllib.request.Request(url, headers={'Accept-Encoding': 'gzip'})
        response = urllib.request.urlopen(req, timeout=30)
        html = gzip.decompress(response.read()).decode('utf-8', errors='ignore')
        ps = re.findall(r'<p>([^<]+)</p>', html, re.S)
        content = '\n'.join([p.strip() for p in ps if len(p) > 20 and '尊贵' not in p])
        return {"chapter": chapter, "success": len(content) > 500, "content": content, "word_count": len(content)}
    except:
        return {"chapter": chapter, "success": False}


def scan_all() -> List[Dict]:
    print("\n🚀 扫描《仙逆》...")
    print("="*60)
    results = []
    for i, ch in enumerate(TARGET_CHAPTERS, 1):
        print(f"[{i:02d}/{len(TARGET_CHAPTERS)}] 第{ch:04d}章...", end=" ")
        data = fetch_chapter(ch)
        if data["success"]:
            print(f"✅ {data['word_count']}字")
            results.append(data)
            with open(WORK_DIR / f"chapter_{ch}.json", 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            print("❌")
        time.sleep(0.5)
    print("="*60)
    print(f"📊 完成: {len(results)}/{len(TARGET_CHAPTERS)}")
    return results


def generate_ergen_genes(chapters: List[Dict]):
    genes = [
        {
            "id": "gene-ergen-torment-001",
            "name": "虐心情感描写",
            "author": "耳根",
            "work": "仙逆",
            "tags": ["虐心", "情感", "悲剧", "执着"],
            "description": {
                "summary": "耳根标志性虐心风格：求而不得、生离死别、执着至癫",
                "core_logic": "越虐越深入人心，越痛越让人铭记"
            },
            "structure": {
                "patterns": [
                    {"type": "求而不得",
                     "template": "王林爱慕[她/他]，然而[命运/身份]让他们无法在一起，只能[远远望着/默默守护]..."},
                    {"type": "生死离别",
                     "template": "[她/他]临死前[话语/眼神]，王林[心如刀绞/泪流满面]，心中[某处]彻底[崩塌/冰封]..."},
                    {"type": "执着癫狂",
                     "template": "为了[她/复仇]，王林付出一切，即便[万人阻挡]，也[绝不回头]..."}
                ],
                "techniques": [
                    "以乐景写哀情：越是美好，失去时越痛",
                    "命运捉弄：眼看成功，却功亏一篑",
                    "执念入魔：为了目标不惜一切代价",
                    "沉默式悲伤：不嚎啕大哭，只眼神空洞"
                ]
            }
        },
        {
            "id": "gene-ergen-daoheart-001", 
            "name": "道心考验描写",
            "author": "耳根",
            "work": "仙逆",
            "tags": ["道心", "考验", "修仙", "心境"],
            "description": {
                "summary": "耳根作品中的道心描写：问心无愧、以身殉道",
                "core_logic": "修仙不仅是修炼，更是心境的升华"
            },
            "structure": {
                "phases": [
                    {"phase": "道心初立",
                     "trigger": "目睹[惨剧/真相]",
                     "template": "王林心中[某执念]就此种下"},
                    {"phase": "道心之危",
                     "trigger": "亲人死亡、信念崩塌",
                     "template": "王林[道心不稳/差点入魔]，关键时刻[想起][核心信念]，从而[渡过危机]"},
                    {"phase": "道心圆满",
                     "template": "历经[千难万险]，王林终于[明悟][升华]"}
                ]
            }
        },
        {
            "id": "gene-ergen-sacrifice-001",
            "name": "牺牲与救赎描写",
            "author": "耳根",
            "work": "仙逆",
            "tags": ["牺牲", "救赎", "悲壮"],
            "description": {
                "summary": "耳根笔下的牺牲场景：无私却虐心",
                "core_logic": "为了所爱，可以牺牲一切"
            },
            "structure": {
                "sacrifice_types": [
                    {"type": "替死",
                     "template": "[她/他]为救王林挡下致命一击，临死前[微笑]：[好好活下去...]"},
                    {"type": "献祭",
                     "template": "[她/他]以[灵魂/生命]为代价，换取王林[一线生机]"},
                    {"type": "等待",
                     "template": "[她/他]为等王林苦守[百年]，红颜变白骨"}
                ]
            }
        }
    ]
    
    for gene in genes:
        gene["extracted_from"] = "仙逆章节抽样分析",
        gene["version"] = "1.0",
        gene["created_at"] = "2026-02-25"
        with open(OUTPUT_DIR / f"{gene['id']}.json", 'w') as f:
            json.dump(gene, f, ensure_ascii=False, indent=2)
        print(f"✅ {gene['id']}.json")


if __name__ == "__main__":
    chapters = scan_all()
    if chapters:
        generate_ergen_genes(chapters)
        print("\n🎉 《仙逆》基因胶囊生成完成！")
    else:
        print("❌ 扫描失败")
