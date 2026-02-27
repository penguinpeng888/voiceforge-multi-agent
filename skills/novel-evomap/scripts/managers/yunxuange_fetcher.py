#!/usr/bin/env python3
"""
云轩阁小说抓取器
专门用于从云轩阁获取小说内容

用法:
    python yunxuange_fetcher.py fetch --author 忘语 --book-id 768 --chapters 5
    python yunxuange_fetcher.py test --url <url>
"""

import os
import re
import json
import sys
import time
from pathlib import Path
from typing import List, Dict, Optional
from urllib.parse import urljoin

# 导入分析器
sys.path.insert(0, str(Path(__file__).parent.parent / "analyzers"))
from text_analyzer import TextAnalyzer


# ============================================================
# 配置
# ============================================================

BASE_URL = "https://m.yunxuange.org"
OUTPUT_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/corpus")
GENES_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/genes")


# ============================================================
# 抓取函数
# ============================================================

def fetch_chapter_content(url: str, chapter_num: int) -> Optional[str]:
    """抓取单章内容"""
    # 尝试多种URL格式
    urls_to_try = [
        f"{url}/{chapter_num}.html",
        f"{url}/index_{chapter_num}.html",
        f"{url}/chapter_{chapter_num}.html",
    ]
    
    for test_url in urls_to_try:
        print(f"  尝试: {test_url}")
        
        # 使用系统web_fetch
        import subprocess
        cmd = ["openclaw", "web", "fetch", "--url", test_url, "--extract-mode", "text", "--max-chars", "50000"]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0 and len(result.stdout) > 1000:
                content = result.stdout
                
                # 清理内容
                cleaned = clean_novel_content(content)
                if len(cleaned) > 500:
                    return cleaned
        except Exception as e:
            print(f"    失败: {e}")
            continue
    
    return None


def clean_novel_content(html: str) -> str:
    """清理HTML，提取纯文本小说内容"""
    if not html:
        return ""
    
    # 移除HTML标签
    text = re.sub(r'<[^>]+>', '\n', html)
    
    # 移除特殊字符
    text = re.sub(r'http[s]?://\S+', '', text)
    text = re.sub(r'&[a-zA-Z]+;', '', text)
    text = re.sub(r'\s+', ' ', text)
    
    # 移除广告和导航
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        line = line.strip()
        if len(line) > 20:
            # 排除常见非正文内容
            if not any(kw in line for kw in ['上一章', '下一章', '返回', '目录', '投票', '推荐', 'VIP', '会员', 'TXT下载']):
                clean_lines.append(line)
    
    return '\n'.join(clean_lines)


def parse_catalog(html: str) -> List[Dict]:
    """解析目录页，获取章节列表"""
    chapters = []
    
    # 匹配章节链接模式
    pattern = r'第(\d+)章[^\n<]+<'
    matches = re.findall(pattern, html)
    
    for i, match in enumerate(matches):
        chapters.append({
            "num": int(match),
            "title": f"第{match}章"
        })
    
    return chapters


def fetch_book(book_id: int, author: str, work: str, chapters: int = 5) -> List[Dict]:
    """抓取整本书的若干章节"""
    url = f"{BASE_URL}/yxg/{book_id}_{book_id}/"
    
    print(f"\n📚 开始抓取《{work}》 by {author}")
    print(f"   目标: 前 {chapters} 章")
    print(f"   URL: {url}")
    
    chapters_data = []
    
    for i in range(1, min(chapters + 1, 100)):
        print(f"\n  [{i}/{chapters}] 抓取第{i}章...")
        
        content = fetch_chapter_content(url, i)
        
        if content:
            print(f"    ✅ 获取成功: {len(content)} 字")
            
            # 分析
            analyzer = TextAnalyzer(content)
            
            chapter_data = {
                "chapter_num": i,
                "content_length": len(content),
                "text": content[:5000],  # 保存前5000字用于分析
                "analysis": {
                    "avg_sentence_length": len(content) / max(len(content.split('。')), 1),
                    "vocabulary_diversity": analyzer.analyze_vocabulary().unique_word_ratio if analyzer.words else 0
                }
            }
            
            chapters_data.append(chapter_data)
        else:
            print(f"    ❌ 获取失败")
        
        # 礼貌性延迟
        time.sleep(1)
    
    return chapters_data


def generate_style_gene(chapters_data: List[Dict], author: str, work: str) -> Dict:
    """根据抓取的内容生成风格基因"""
    
    if not chapters_data:
        return {}
    
    # 合并所有文本
    all_text = "\n".join([c.get("text", "") for c in chapters_data])
    
    if not all_text:
        return {}
    
    # 分析
    analyzer = TextAnalyzer(all_text)
    
    capsule = analyzer.to_gene_capsule(
        author=author,
        work=work,
        source_url=f"{BASE_URL}/yxg/"
    )
    
    capsule["source"] = "yunxuange"
    capsule["chapters_scanned"] = len(chapters_data)
    capsule["total_chars_analyzed"] = sum(c.get("content_length", 0) for c in chapters_data)
    
    # 添加网文特有标签
    capsule["style_tags"] = [
        "凡人流", "谨慎主角", "现实主义修仙", 
        "慢热", "升级体系", "理性主角"
    ]
    
    return capsule


def save_results(capsule: Dict, chapters_data: List[Dict]):
    """保存结果"""
    # 保存胶囊
    author = capsule.get('author', 'unknown').lower().replace(' ', '-')
    work = capsule.get('work', 'unknown').replace(' ', '-')[:15]
    
    capsule_file = GENES_DIR / f"style-{author}-{work}.json"
    with open(capsule_file, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 风格基因已保存: {capsule_file}")
    
    # 保存章节数据
    chapters_file = OUTPUT_DIR / author / f"{work}-chapters.json"
    chapters_file.parent.mkdir(parents=True, exist_ok=True)
    with open(chapters_file, 'w', encoding='utf-8') as f:
        json.dump(chapters_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 章节数据已保存: {chapters_file}")


# ============================================================
# 主程序
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="云轩阁小说抓取器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s fetch --book-id 768 --author 忘语 --chapters 5
    %(prog)s test --url https://m.yunxuange.org/yxg/768_768317/
    %(prog)s status
        """
    )
    
    parser.add_argument("command", choices=["fetch", "test", "status"], help="命令")
    parser.add_argument("--book-id", "-b", type=int, help="书籍ID")
    parser.add_argument("--author", "-a", help="作者名")
    parser.add_argument("--work", "-w", help="作品名")
    parser.add_argument("--chapters", "-c", type=int, default=5, help="抓取章节数")
    parser.add_argument("--url", "-u", help="测试URL")
    
    args = parser.parse_args()
    
    if args.command == "status":
        print("\n📚 云轩阁抓取器状态")
        print("="*50)
        print(f"输出目录: {OUTPUT_DIR}")
        print(f"基因目录: {GENES_DIR}")
        print(f"作者目录: {[d.name for d in OUTPUT_DIR.iterdir() if d.is_dir()]}")
    
    elif args.command == "test":
        if not args.url:
            print("❌ 请指定URL: --url <url>")
            return
        
        print(f"\n🧪 测试抓取: {args.url}")
        content = fetch_chapter_content(args.url, 1)
        
        if content:
            print(f"✅ 成功获取: {len(content)} 字")
            print(f"\n前500字预览:")
            print("="*50)
            print(content[:500])
        else:
            print("❌ 未能获取内容")
    
    elif args.command == "fetch":
        if not args.book_id:
            print("❌ 请指定书籍ID: --book-id <id>")
            return
        if not args.author:
            print("❌ 请指定作者: --author <name>")
            return
        
        work = args.work or f"作品{args.book_id}"
        
        # 抓取
        chapters_data = fetch_book(
            book_id=args.book_id,
            author=args.author,
            work=work,
            chapters=args.chapters
        )
        
        if chapters_data:
            # 生成风格基因
            capsule = generate_style_gene(chapters_data, args.author, work)
            
            if capsule:
                # 保存
                save_results(capsule, chapters_data)
                
                print("\n" + "="*50)
                print("📊 分析结果摘要:")
                print(f"   扫描章节: {len(chapters_data)}")
                print(f"   总字数: {capsule.get('total_chars_analyzed', 0)}")
                print(f"   词汇多样性: {capsule.get('features', {}).get('vocabulary', {}).get('unique_word_ratio', 0):.2%}")
        else:
            print("\n❌ 未能获取任何章节内容")


if __name__ == "__main__":
    main()
