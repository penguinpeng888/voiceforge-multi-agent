#!/usr/bin/env python3
"""
忘语作品批量扫描器 - 简化版
链接公式: 1024555 + 章节号

用法:
    python simple_scan.py 1 50 100       # 扫描3章
    python simple_scan.py --list 1-20    # 扫描1-20章
    python simple_scan.py --progress     # 查看进度
"""

import os
import re
import json
import sys
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict

BASE_URL = "https://m.yunxuange.org"
WORK_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/.scan_progress")
PROGRESS_FILE = WORK_DIR / "scan_progress.json"


def get_link_id(chapter: int) -> int:
    """计算章节链接ID"""
    return 1024555 + chapter


def fetch_chapter(chapter: int, retries: int = 2) -> Dict:
    """抓取单章内容"""
    link_id = get_link_id(chapter)
    url = f"{BASE_URL}/yxg/768_768317/{link_id}.html"
    
    for attempt in range(retries):
        import subprocess
        cmd = ["openclaw", "web", "fetch", "--url", url, "--extract-mode", "markdown", "--max-chars", "50000"]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0 and len(result.stdout) > 300:
                content = result.stdout
                cleaned = clean_content(content)
                if cleaned:
                    return {
                        "chapter": chapter,
                        "link_id": link_id,
                        "success": True,
                        "word_count": len(cleaned),
                        "content_preview": cleaned[:2000]
                    }
        except Exception:
            time.sleep(1)
    
    return {"chapter": chapter, "success": False}


def clean_content(text: str) -> str:
    """清理文本"""
    if not text:
        return ""
    
    lines = text.split('\n')
    clean_lines = []
    
    for line in lines:
        line = line.strip()
        if len(line) > 20:
            skip = False
            for kw in ['尊贵', '会员', '书架', 'TXT下载', '下一页', '上一章', '尊贵特权']:
                if kw in line:
                    skip = True
                    break
            if not skip:
                clean_lines.append(line)
    
    return '\n'.join(clean_lines[:30])  # 取前30行


def scan_chapters(chapters: List[int], delay: float = 0.5) -> Dict:
    """批量扫描章节"""
    print(f"\n🚀 开始扫描 {len(chapters)} 章")
    print("="*60)
    
    results = {
        "scan_time": datetime.now().isoformat(),
        "chapters": [],
        "success_count": 0,
        "fail_count": 0
    }
    
    for i, ch in enumerate(chapters, 1):
        print(f"[{i}/{len(chapters)}] 第{ch}章...", end=" ")
        
        result = fetch_chapter(ch)
        
        if result["success"]:
            print(f"✅ {result['word_count']}字")
            results["success_count"] += 1
        else:
            print("❌")
            results["fail_count"] += 1
        
        results["chapters"].append(result)
        
        if i < len(chapters):
            time.sleep(delay)
    
    print("="*60)
    print(f"📊 完成: {results['success_count']}成功, {results['fail_count']}失败")
    
    # 保存进度
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    return results


def show_status():
    """显示状态"""
    print("\n📊 扫描状态")
    print("="*60)
    
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
        print(f"扫描时间: {data['scan_time']}")
        print(f"成功: {data['success_count']} 章")
        print(f"失败: {data['fail_count']} 章")
    else:
        print("尚未开始扫描")


def quick_demo():
    """快速演示（扫描3章）"""
    print("\n🚀 快速演示模式")
    print("="*60)
    
    # 扫描第1章（凡人开头）
    print("\n📖 第1章 - 凡人阶段开头")
    result1 = fetch_chapter(1)
    
    if result1["success"]:
        print("✅ 成功获取!")
        print(f"\n内容预览（前800字）:")
        print("-"*50)
        print(result1["content_preview"][:800])
    
    # 保存到文件
    OUTPUT_FILE = WORK_DIR / "fanren_chapter1_demo.json"
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(result1, f, ensure_ascii=False, indent=2)
    print(f"\n💾 已保存: {OUTPUT_FILE}")
    
    return result1


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="忘语作品扫描器 - 简化版",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("chapters", nargs="*", type=int, help="章节号")
    parser.add_argument("--list", "-l", help="章节范围，如 1-20")
    parser.add_argument("--progress", "-p", action="store_true", help="查看进度")
    parser.add_argument("--demo", "-d", action="store_true", help="演示模式")
    parser.add_argument("--delay", type=float, default=0.5, help="请求间隔")
    
    args = parser.parse_args()
    
    if args.progress:
        show_status()
    
    elif args.demo or not args.chapters:
        quick_demo()
    
    elif args.list:
        # 解析范围 1-20
        if '-' in args.list:
            start, end = map(int, args.list.split('-'))
            chapters = list(range(start, end + 1))
            scan_chapters(chapters, args.delay)
    
    else:
        chapters = args.chapters
        if len(chapters) == 1:
            # 单章详细输出
            result = fetch_chapter(chapters[0])
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            scan_chapters(chapters, args.delay)


if __name__ == "__main__":
    main()
