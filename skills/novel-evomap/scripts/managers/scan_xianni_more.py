#!/usr/bin/env python3
"""
补充扫描《仙逆》更多章节
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

# 尝试更多章节号
TEST_CHAPTERS = [50, 80, 150, 200, 250, 400, 600, 700, 900, 1100, 1200, 1400, 1600, 1700, 1900, 1950]


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


def main():
    print("\n🚀 补充扫描《仙逆》章节...")
    print("="*60)
    
    # 加载已扫描的
    scanned = list(WORK_DIR.glob("chapter_*.json"))
    scanned_chapters = [int(f.stem.split("_")[1]) for f in scanned]
    print(f"已扫描: {scanned_chapters}")
    
    new_chapters = []
    for ch in TEST_CHAPTERS:
        if ch not in scanned_chapters:
            new_chapters.append(ch)
    
    print(f"待扫描: {new_chapters}")
    print("="*60)
    
    results = []
    for i, ch in enumerate(new_chapters, 1):
        print(f"[{i:02d}/{len(new_chapters)}] 第{ch:04d}章...", end=" ")
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
    print(f"📊 本轮完成: {len(results)}/{len(new_chapters)}")
    
    # 统计总共
    all_chapters = list(WORK_DIR.glob("chapter_*.json"))
    print(f"📈 总计扫描: {len(all_chapters)} 章")
    
    if results:
        print("\n🎉 补充扫描完成！")


if __name__ == "__main__":
    main()
