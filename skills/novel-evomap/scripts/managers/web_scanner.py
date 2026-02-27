#!/usr/bin/env python3
"""
Novel EvoMap 网页小说扫描器
从公开可访问的网站获取文本内容进行分析

支持：
- Project Gutenberg（完全免费，无反爬虫）
- 公有领域文学作品
- 部分开放的文档网站

用法:
    python web_scanner.py scan --url <url> --author <author>
    python web_scanner.py scan-gutenberg --work <work_name>
    python web_scanner.py list-gutenberg
"""

import os
import re
import json
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin, quote

# 导入我们的分析器
from text_analyzer import TextAnalyzer


# ============================================================
# 配置
# ============================================================

OUTPUT_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/genes")
CACHE_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/.cache")

# Gutenberg API 和热门作品
GUTENBERG_BASE = "https://www.gutenberg.org"
GUTENBERG_API = f"{GUTENBERG_BASE}/ebooks/search/"
GUTENBERG_READER = f"{GUTENBERG_BASE}/ebooks/"

# 经典中文作品（公有领域）
CLASSIC_WORKS = [
    {"author": "金庸", "title": "射雕英雄传", "url": "", "note": "版权保护中，需手动获取"},
    {"author": "古龙", "title": "多情剑客无情剑", "url": "", "note": "版权保护中，需手动获取"},
    {"author": "鲁迅", "title": "狂人日记", "url": f"{GUTENBERG_BASE}/ebooks/173", "type": "gutenberg"},
    {"author": "老舍", "title": "骆驼祥子", "url": "", "note": "需找中文源"},
    {"author": "沈从文", "title": "边城", "url": "", "note": "需找中文源"},
]

# 可直接获取的英文经典（测试用）
GUTENBERG_WORKS = [
    {"id": 1342, "author": "Emily Brontë", "title": "Wuthering Heights", "style_tags": ["哥特式", "情感深刻", "虐心"]},
    {"id": 74, "author": "Mark Twain", "title": "The Adventures of Tom Sawyer", "style_tags": ["冒险", "幽默", "成长"]},
    {"id": 1080, "author": "Arthur Conan Doyle", "title": "The Adventures of Sherlock Holmes", "style_tags": ["推理", "侦探", "逻辑"]},
    {"id": 1661, "author": "Leo Tolstoy", "title": "Anna Karenina", "style_tags": ["爱情", "社会批判", "深刻"]},
    {"id": 27827, "author": "Hemingway", "title": "The Old Man and the Sea", "style_tags": ["简洁", "硬汉", "冰山理论"]},
    {"id": 64317, "author": "George Orwell", "title": "1984", "style_tags": ["反乌托邦", "政治", "科幻"]},
    {"id": 5200, "author": "Franz Kafka", "title": "The Metamorphosis", "style_tags": ["荒诞", "存在主义", "意识流"]},
    {"id": 1232, "author": "Charles Dickens", "title": "A Tale of Two Cities", "style_tags": ["历史", "革命", "牺牲"]},
]


# ============================================================
# 网页抓取函数
# ============================================================

def fetch_page(url: str, max_chars: int = 50000) -> Optional[str]:
    """使用 web_fetch 获取页面内容"""
    import subprocess
    cmd = [
        "openclaw", "web", "fetch",
        "--url", url,
        "--extract-mode", "text",
        "--max-chars", str(max_chars)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout
    except Exception as e:
        print(f"❌ 获取失败: {e}")
    
    return None


def clean_html_content(text: str) -> str:
    """清理HTML提取的文本"""
    if not text:
        return ""
    
    # 移除脚注标记 [1], [2] 等
    text = re.sub(r'\[\d+\]', '', text)
    
    # 移除章节编号
    text = re.sub(r'^Chapter\s+\d+.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^第.*章.*$', '', text, flags=re.MULTILINE)
    
    # 移除空行
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # 限制长度
    max_len = 50000
    if len(text) > max_len:
        text = text[:max_len] + "\n\n[...]"
    
    return text.strip()


def get_gutenberg_content(book_id: int) -> Optional[str]:
    """从 Project Gutenberg 获取书籍内容"""
    # 获取纯文本版本
    url = f"{GUTENBERG_READER}{book_id}.txt.utf-8"
    
    import subprocess
    cmd = ["openclaw", "web", "fetch", "--url", url]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            content = result.stdout
            if content and len(content) > 1000:
                return content
    except Exception as e:
        print(f"  ❌ 获取失败: {e}")
    
    return None


def extract_text_from_gutenberg_html(html_content: str) -> str:
    """从 Gutenberg HTML 提取文本"""
    # 使用正则提取主要文本内容
    patterns = [
        r'<div class="viewer">(.*?)</div>',
        r'<section class="pg-">(.*?)</section>',
        r'<body>(.*?)</body>',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, html_content, re.DOTALL | re.IGNORECASE)
        if match:
            text = match.group(1)
            # 移除HTML标签
            text = re.sub(r'<[^>]+>', '', text)
            return clean_html_content(text)
    
    return clean_html_content(html_content)


# ============================================================
# 扫描功能
# ============================================================

def scan_url(url: str, author: str, title: str = "", style_tags: List[str] = None) -> Dict:
    """扫描指定URL并生成风格基因胶囊"""
    print(f"\n🌐 获取内容: {url}")
    
    content = fetch_page(url)
    if not content:
        print("  ❌ 无法获取内容")
        return {}
    
    cleaned = clean_html_content(content)
    if len(cleaned) < 500:
        print(f"  ❌ 内容太短: {len(cleaned)} 字")
        return {}
    
    print(f"  ✅ 获取到 {len(cleaned)} 字")
    
    # 分析
    analyzer = TextAnalyzer(cleaned)
    
    capsule = analyzer.to_gene_capsule(
        author=author,
        work=title or "unknown",
        source_dir=url
    )
    
    if style_tags:
        capsule["style_tags"] = style_tags
    
    return capsule


def scan_gutenberg_work(book_id: int) -> Dict:
    """扫描 Project Gutenberg 作品"""
    # 查找作品信息
    work_info = next((w for w in GUTENBERG_WORKS if w["id"] == book_id), None)
    if not work_info:
        return {}
    
    print(f"\n📚 扫描 Gutenberg 作品: {work_info['title']}")
    print(f"   作者: {work_info['author']}")
    print(f"   ID: {book_id}")
    
    # 获取纯文本
    text_url = f"{GUTENBERG_READER}{book_id}.txt.utf-8"
    content = fetch_page(text_url, max_chars=100000)
    
    if not content:
        print("  ❌ 无法获取文本，尝试HTML...")
        # 尝试HTML
        html_url = f"{GUTENBERG_READER}{book_id}"
        content = fetch_page(html_url, max_chars=100000)
        if content:
            content = extract_text_from_gutenberg_html(content)
    
    if not content or len(content) < 1000:
        print("  ❌ 获取失败或内容太短")
        return {}
    
    print(f"  ✅ 获取到 {len(content)} 字")
    
    # 分析
    analyzer = TextAnalyzer(content)
    
    capsule = analyzer.to_gene_capsule(
        author=work_info['author'],
        work=work_info['title'],
        source_dir=text_url
    )
    capsule["style_tags"] = work_info.get('style_tags', [])
    
    return capsule


def list_gutenberg_works() -> List[Dict]:
    """列出可扫描的 Gutenberg 作品"""
    print("\n📚 可扫描的 Project Gutenberg 作品:")
    print("="*60)
    
    for work in GUTENBERG_WORKS:
        print(f"\n  📖 {work['title']}")
        print(f"     作者: {work['author']}")
        print(f"     ID: {work['id']}")
        print(f"     标签: {', '.join(work['style_tags'])}")
    
    return GUTENBERG_WORKS


def save_capsule(capsule: Dict):
    """保存胶囊到文件"""
    if not capsule:
        return
    
    author = capsule.get('author', 'unknown').lower().replace(' ', '-')
    work = capsule.get('work', 'unknown').replace(' ', '-')[:20]
    timestamp = capsule.get('generated_at', '').replace(' ', '-')[:10]
    
    filename = f"style-{author}-{work}-{timestamp}.json"
    filepath = OUTPUT_DIR / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    
    print(f"  💾 已保存: {filename}")
    
    # 更新 latest.json
    latest_file = OUTPUT_DIR / "latest.json"
    latest_data = {}
    if latest_file.exists():
        with open(latest_file, 'r') as f:
            latest_data = json.load(f)
    
    latest_data["updated_at"] = capsule.get('generated_at', '')
    if "capsules" not in latest_data:
        latest_data["capsules"] = []
    latest_data["capsules"].append({
        "author": capsule.get('author'),
        "work": capsule.get('work'),
        "file": filename
    })
    
    with open(latest_file, 'w', encoding='utf-8') as f:
        json.dump(latest_data, f, ensure_ascii=False, indent=2)


# ============================================================
# 主程序
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Novel EvoMap 网页小说扫描器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s gutenberg-list                # 列出可扫描的Gutenberg作品
    %(prog)s gutenberg 74                  # 扫描 Tom Sawyer
    %(prog)s url --url <url> --author <name>  # 扫描任意URL
    %(prog)s demo                          # 演示模式
        """
    )
    
    parser.add_argument("command", choices=[
        "gutenberg", "gutenberg-list", "url", "demo", "list"
    ], help="命令")
    parser.add_argument("target", nargs="?", help="目标ID或参数")
    parser.add_argument("--url", "-u", help="URL地址")
    parser.add_argument("--author", "-a", help="作者名")
    parser.add_argument("--title", "-t", help="作品名")
    parser.add_argument("--tags", help="风格标签（逗号分隔）")
    parser.add_argument("--max-chars", "-m", default="50000", help="最大字符数")
    
    args = parser.parse_args()
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    if args.command == "list" or args.command == "gutenberg-list":
        list_gutenberg_works()
        
    elif args.command == "gutenberg":
        if not args.target:
            print("❌ 请指定作品ID: python web_scanner.py gutenberg 74")
            return
        try:
            book_id = int(args.target)
            capsule = scan_gutenberg_work(book_id)
            if capsule:
                print("\n✅ 扫描完成!")
                print(json.dumps(capsule, ensure_ascii=False, indent=2)[:1000])
                save_capsule(capsule)
        except ValueError:
            print("❌ 无效的ID")
    
    elif args.command == "url":
        if not args.url:
            print("❌ 请指定URL: python web_scanner.py url --url <url>")
            return
        if not args.author:
            print("❌ 请指定作者: python web_scanner.py url --url <url> --author <name>")
            return
        
        tags = args.tags.split(',') if args.tags else []
        capsule = scan_url(args.url, args.author, args.title or "", tags)
        
        if capsule:
            print("\n✅ 扫描完成!")
            print(json.dumps(capsule, ensure_ascii=False, indent=2)[:1000])
            save_capsule(capsule)
    
    elif args.command == "demo":
        print("\n🌐 网页小说扫描器演示")
        print("="*60)
        print("\n1. Project Gutenberg 作品（完全免费，无反爬虫）:")
        for work in GUTENBERG_WORKS[:5]:
            print(f"   📖 {work['title']} (ID: {work['id']})")
        
        print("\n2. 使用方法:")
        print("   # 扫描Gutenberg作品")
        print("   python web_scanner.py gutenberg 74")
        print("")
        print("   # 扫描任意URL")
        print("   python web_scanner.py url -u <url> -a <作者>")
        print("")
        print("   # 列出所有Gutenberg作品")
        print("   python web_scanner.py gutenberg-list")


if __name__ == "__main__":
    main()
