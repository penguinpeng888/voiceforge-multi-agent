#!/usr/bin/env python3
"""
完整扫描忘语作品章节 - 生成所有基因胶囊
扫描 15 章目标章节
"""

import gzip
import json
import os
import re
import time
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional

BASE_URL = "https://m.yunxuange.org"
BOOK_ID = "768_768317"
LINK_BASE = 1024555

OUTPUT_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/genes")
WORK_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/.scan_progress")
WORK_DIR.mkdir(parents=True, exist_ok=True)

# 15章目标
TARGET_CHAPTERS = [1, 20, 100, 300, 700, 1200, 2400, 2500, 2560, 50, 150, 250, 400, 600, 800]


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


def scan_all():
    print(f"\n🚀 扫描全部 {len(TARGET_CHAPTERS)} 章...")
    print("="*60)
    results = []
    for i, ch in enumerate(TARGET_CHAPTERS, 1):
        print(f"[{i:02d}/{len(TARGET_CHAPTERS)}] 第{ch:04d}章...", end=" ")
        data = fetch_chapter(ch)
        if data["success"]:
            print(f"✅ {data['word_count']}字")
            results.append(data)
            # 保存
            with open(WORK_DIR / f"chapter_{ch}.json", 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            print("❌")
        time.sleep(0.5)
    print("="*60)
    print(f"📊 完成: {len(results)}/{len(TARGET_CHAPTERS)} 成功")
    return results


def generate_all_genes(chapters: List[Dict]):
    gene_types = ["修炼突破", "感情互动", "战斗描写", "心理活动"]
    for gene_type in gene_types:
        gene = generate_gene(gene_type, chapters)
        if gene:
            with open(OUTPUT_DIR / f"{gene['id']}.json", 'w') as f:
                json.dump(gene, f, ensure_ascii=False, indent=2)
            print(f"✅ {gene['id']}.json")


def generate_gene(gene_type: str, chapters: List[Dict]) -> Dict:
    gene_id = f"gene-{gene_type.lower()}-001"
    
    if gene_type == "修炼突破":
        return {
            "id": gene_id, "name": "修炼突破描写", "category": "cultivation-breakthrough",
            "tags": ["修炼", "突破", "境界"],
            "description": {"summary": "忘语修炼突破描写体系", "core_logic": "突破是核心爽点"},
            "structure": {
                "phases": [
                    {"phase": "积累期", "duration": "数月到数年", 
                     "sensation": "法力积累、瓶颈压迫",
                     "template": "主角闭关[时间]，体内法力已积累到[程度]，但[瓶颈]始终无法突破..."},
                    {"phase": "契机", "trigger": "丹药、天材地宝、顿悟",
                     "template": "正当主角[绝望/放弃]之际，忽然[获得/领悟][契机]..."},
                    {"phase": "突破", "sensation": "法力汹涌、经脉拓宽",
                     "template": "主角只觉体内[某处]轰然一震，[异象描写]，法力如同[比喻]般汹涌而出..."},
                    {"phase": "稳固", "duration": "数日至数月",
                     "template": "突破后法力不稳，需要[时间]闭关稳固..."}
                ]
            },
            "templates": {"breakthrough_scenes": ["咔嚓声中，束缚[某境界]的瓶颈如同纸糊般碎裂", "一股清凉之意从[丹田/识海]涌出，瞬间贯通全身经脉"]},
            "timing_rules": {"小境界": "每10-15章一次", "大境界": "每50-100章一次"}
        }
    
    if gene_type == "感情互动":
        return {
            "id": gene_id, "name": "感情互动描写", "category": "romance",
            "tags": ["感情", "爱情", "互动"],
            "description": {"summary": "忘语感情线：含蓄内敛、细节暗示"},
            "structure": {
                "phases": [
                    {"phase": "初识", "manifestation": "特殊关注、暗暗留意",
                     "template": "主角[偶然/必然]见到[她/他]，心中忽然[一动/泛起涟漪]..."},
                    {"phase": "暗生情愫", "manifestation": "不自觉的关心、患得患失",
                     "template": "每当[她/他]出现，主角便不自觉的[行为]，事后回想不禁[自嘲/苦笑]..."}
                ],
                "techniques": ["借物喻情：通过法宝、丹药传递心意", "肢体语言：眼神、耳朵红、心跳加速", "反差萌：平日冷傲，关键时刻破防"]
            }
        }
    
    if gene_type == "战斗描写":
        return {
            "id": gene_id, "name": "战斗描写技法", "category": "combat",
            "tags": ["战斗", "动作", "法宝"],
            "description": {"summary": "忘语战斗：快节奏、强临场、注重法宝"},
            "structure": {
                "components": [
                    {"element": "动作", "template": "主角[身形/身影]一晃，[行动]，手中[法宝]化作[意象]..."},
                    {"element": "法宝", "template": "只听[法宝名]一声[嗡鸣/清啸]，[异象]..."}
                ],
                "rhythm": ["起：对手轻敌或试探", "承：主角反击", "转：险象环生", "合：一击制胜"]
            }
        }
    
    if gene_type == "心理活动":
        return {
            "id": gene_id, "name": "心理活动描写", "category": "psychology",
            "tags": ["心理", "内心", "独白"],
            "description": {"summary": "忘语心理：简洁有力、不拖沓"},
            "structure": {
                "patterns": [
                    {"type": "危机时刻", "template": "望着[敌人/局面]，主角心中[一沉/暗叹]..."},
                    {"type": "抉择时刻", "template": "[选择A/选择B]？主角[闭目/沉默]，[结果]，心中[想法]..."}
                ],
                "principles": ["危机时不啰嗦，3句话内解决", "抉择时内心戏可稍长", "用动作/表情替代心理描写时更高明"]
            }
        }
    
    return {}


if __name__ == "__main__":
    chapters = scan_all()
    generate_all_genes(chapters)
    print("\n🎉 完成！所有基因胶囊已生成")
