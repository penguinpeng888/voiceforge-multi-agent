#!/usr/bin/env python3
"""
忘语作品批量扫描器 - 快速模式
先粗扫一遍小说，后续空闲时深度分析

用法:
    python quick_scan.py --chapters 5    # 快速扫描5章
    python quick_scan.py --all           # 扫描所有目标章节
    python quick_scan.py --status        # 查看扫描进度
"""

import os
import re
import json
import sys
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# 配置
BASE_URL = "https://m.yunxuange.org"
OUTPUT_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/genes")
WORK_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/.scan_progress")
CHAPTER_LINK_FILE = WORK_DIR / "chapter_links.json"
PROGRESS_FILE = WORK_DIR / "scan_progress.json"


# ============================================================
# 章节链接映射（已知的）
# ============================================================

CHAPTER_LINKS = {
    # 境界抽样
    1: "1024556",      # 凡人 - 山边小村
    20: "1024575",     # 炼气期 - 约第20章附近
    100: "1024655",    # 筑基期 - 约第100章附近
    300: "1024855",    # 结丹期 - 约第300章附近
    700: "1025255",    # 元婴期 - 约第700章附近
    1200: "1025755",   # 化神期 - 约第1200章附近
    2400: "1027000+",  # 仙界篇 - 约第2400章
    2500: "1027100+",  # 金仙期 - 约第2500章
    2560: "1027160+",  # 大罗道祖 - 约第2560章
}


# ============================================================
# 从目录页抓取所有章节链接
# ============================================================

def fetch_chapter_links():
    """获取所有章节的真实链接"""
    if CHAPTER_LINK_FILE.exists():
        with open(CHAPTER_LINK_FILE, 'r') as f:
            return json.load(f)
    
    print("📚 获取章节列表...")
    links = {}
    
    # 章节列表页 URL
    url = f"{BASE_URL}/yxg/768_768317/"
    
    import subprocess
    cmd = ["openclaw", "web", "fetch", "--url", url, "--extract-mode", "markdown", "--max-chars", "50000"]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            content = result.stdout
            
            # 解析章节链接
            pattern = r'\[第(\d+)章[^\]]+\]\(/yxg/768_768317/(\d+)\.html\)'
            matches = re.findall(pattern, content)
            
            for num, link_id in matches:
                links[int(num)] = link_id
            
            # 保存
            WORK_DIR.mkdir(parents=True, exist_ok=True)
            with open(CHAPTER_LINK_FILE, 'w') as f:
                json.dump(links, f, ensure_ascii=False)
            
            print(f"✅ 获取到 {len(links)} 个章节链接")
    except Exception as e:
        print(f"❌ 获取失败: {e}")
    
    return links


# ============================================================
# 抓取单章内容
# ============================================================

def fetch_chapter(chapter_num: int, link_id: str = None) -> Optional[str]:
    """抓取单章内容"""
    # 构建 URL
    if link_id:
        url = f"{BASE_URL}/yxg/768_768317/{link_id}.html"
    else:
        # 尝试根据数字推算
        base_id = 1024556
        url = f"{BASE_URL}/yxg/768_768317/{base_id + chapter_num - 1}.html"
    
    import subprocess
    cmd = ["openclaw", "web", "fetch", "--url", url, "--extract-mode", "markdown", "--max-chars", "50000"]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and len(result.stdout) > 500:
            content = result.stdout
            # 清理内容
            cleaned = clean_content(content)
            if len(cleaned) > 200:
                return cleaned
    except Exception as e:
        pass
    
    return None


def clean_content(html: str) -> str:
    """清理HTML提取的文本"""
    if not html:
        return ""
    
    # 移除广告和非正文
    lines = html.split('\n')
    clean_lines = []
    
    for line in lines:
        line = line.strip()
        # 过滤
        if len(line) > 30:
            if not any(kw in line for kw in ['尊贵特权', '会员书架', 'TXT下载', '下一页', '上一章']):
                clean_lines.append(line)
    
    return '\n'.join(clean_lines[:50])  # 取前50行


# ============================================================
# 快速扫描
# ============================================================

def quick_scan(chapters: List[int], limit: int = None) -> Dict:
    """快速扫描指定章节"""
    if limit:
        chapters = chapters[:limit]
    
    print(f"\n🚀 开始快速扫描 {len(chapters)} 章")
    print("="*60)
    
    # 获取章节链接
    all_links = fetch_chapter_links()
    
    results = {
        "scan_time": datetime.now().isoformat(),
        "chapters_scanned": [],
        "summary": {
            "total_chapters": len(chapters),
            "success": 0,
            "failed": 0
        }
    }
    
    for i, ch in enumerate(chapters, 1):
        print(f"\n[{i}/{len(chapters)}] 扫描第 {ch} 章...", end=" ")
        
        link_id = all_links.get(ch)
        content = fetch_chapter(ch, link_id)
        
        if content:
            word_count = len(content)
            print(f"✅ {word_count}字")
            
            results["chapters_scanned"].append({
                "chapter": ch,
                "word_count": word_count,
                "success": True
            })
            results["summary"]["success"] += 1
        else:
            print("❌")
            results["chapters_scanned"].append({
                "chapter": ch,
                "success": False
            })
            results["summary"]["failed"] += 1
        
        # 礼貌性延迟
        time.sleep(0.5)
    
    # 保存进度
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print(f"📊 扫描完成: {results['summary']['success']}成功, {results['summary']['failed']}失败")
    
    return results


# ============================================================
# 深度分析（后续空闲时执行）
# ============================================================

def deep_analysis(chapter_num: int, content: str) -> Dict:
    """深度分析单章内容"""
    # 导入分析器
    sys.path.insert(0, str(Path(__file__).parent.parent / "analyzers"))
    from text_analyzer import TextAnalyzer
    
    analyzer = TextAnalyzer(content)
    
    return {
        "chapter": chapter_num,
        "features": analyzer.analyze().to_dict()
    }


# ============================================================
# 主程序
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="忘语作品批量扫描器 - 快速模式",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s --chapters 5           # 快速扫描5章
    %(prog)s --chapters 10          # 扫描10章
    %(prog)s --all                  # 扫描所有目标章节
    %(prog)s --status               # 查看扫描进度
    %(prog)s --deep 1               # 深度分析第1章
        """
    )
    
    parser.add_argument("--chapters", "-c", type=int, help="扫描章节数")
    parser.add_argument("--all", action="store_true", help="扫描所有目标章节")
    parser.add_argument("--status", action="store_true", help="查看进度")
    parser.add_argument("--deep", type=int, help="深度分析指定章节")
    
    args = parser.parse_args()
    
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    
    # 目标章节列表
    TARGET_CHAPTERS = [
        # 境界抽样（9章）
        1, 20, 100, 300, 700, 1200, 2400, 2500, 2560,
        # 场景类型（6章）
        50, 150, 250, 400, 600, 800,
        # 法宝专项（4章）
        100, 300, 700, 1200  # 重叠可复用
    ]
    TARGET_CHAPTERS = sorted(list(set(TARGET_CHAPTERS)))  # 去重
    
    if args.status:
        print("\n📊 扫描进度")
        print("="*60)
        print(f"目标章节数: {len(TARGET_CHAPTERS)}")
        print(f"目标章节: {TARGET_CHAPTERS[:10]}..." if len(TARGET_CHAPTERS) > 10 else f"目标章节: {TARGET_CHAPTERS}")
        
        if PROGRESS_FILE.exists():
            with open(PROGRESS_FILE, 'r') as f:
                progress = json.load(f)
            print(f"\n已完成: {progress['summary']['success']} 章")
        else:
            print("\n尚未开始扫描")
    
    elif args.chapters:
        quick_scan(TARGET_CHAPTERS, limit=args.chapters)
    
    elif args.all:
        quick_scan(TARGET_CHAPTERS)
    
    elif args.deep:
        # 深度分析
        all_links = fetch_chapter_links()
        link_id = all_links.get(args.deep)
        content = fetch_chapter(args.deep, link_id)
        
        if content:
            analysis = deep_analysis(args.deep, content)
            print(json.dumps(analysis, ensure_ascii=False, indent=2))
        else:
            print(f"❌ 无法获取第{args.deep}章内容")
    
    else:
        # 默认：快速扫描3章演示
        print("\n🚀 快速演示模式（扫描3章）")
        print("="*60)
        quick_scan(TARGET_CHAPTERS, limit=3)


if __name__ == "__main__":
    main()
