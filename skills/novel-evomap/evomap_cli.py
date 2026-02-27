#!/usr/bin/env python3
"""
Novel EvoMap CLI - 一站式工具入口

功能:
- 文本分析
- 语料库管理
- 网页扫描
- 风格基因生成

用法:
    python evomap_cli.py analyze <file>
    python evomap_cli.py corpus list
    python evomap_cli.py scan <url>
    python evomap_cli.py gutenberg <book_id>
"""

import sys
from pathlib import Path

# 添加scripts目录到路径
SCRIPT_DIR = Path(__file__).parent / "scripts"
sys.path.insert(0, str(SCRIPT_DIR / "analyzers"))
sys.path.insert(0, str(SCRIPT_DIR / "managers"))

from text_analyzer import TextAnalyzer
from corpus_manager import scan_author, scan_all_authors, list_authors, status, save_all_capsules
from web_scanner import scan_gutenberg_work, list_gutenberg_works

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Novel EvoMap CLI - 小说创作AI进化系统",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    # 分析文本
    python evomap_cli.py analyze novel.txt --author 金庸
    
    # 语料库管理
    python evomap_cli.py corpus list
    python evomap_cli.py corpus status
    python evomap_cli.py corpus scan-all
    
    # 网页扫描
    python evomap_cli.py scan url --url <url> --author <name>
    python evomap_cli.py scan gutenberg-list
    python evomap_cli.py scan gutenberg 74
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="命令类别")
    
    # analyze 命令
    parser_analyze = subparsers.add_parser("analyze", help="文本分析")
    parser_analyze.add_argument("file", help="文本文件")
    parser_analyze.add_argument("--author", "-a", help="作者名")
    parser_analyze.add_argument("--work", "-w", help="作品名")
    parser_analyze.add_argument("--output", "-o", help="输出JSON文件")
    
    # corpus 命令
    parser_corpus = subparsers.add_parser("corpus", help="语料库管理")
    parser_corpus.add_argument("action", choices=["list", "status", "scan", "scan-all"], help="操作")
    parser_corpus.add_argument("--author", help="指定作者")
    
    # scan 命令
    parser_scan = subparsers.add_parser("scan", help="网页扫描")
    parser_scan.add_argument("action", choices=["url", "gutenberg", "gutenberg-list"], help="扫描类型")
    parser_scan.add_argument("--url", "-u", help="URL地址")
    parser_scan.add_argument("--author", "-a", help="作者名")
    parser_scan.add_argument("--title", "-t", help="作品名")
    parser_scan.add_argument("--book-id", help="Gutenberg书籍ID")
    
    args = parser.parse_args()
    
    if args.command == "analyze":
        if not Path(args.file).exists():
            print(f"❌ 文件不存在: {args.file}")
            return
        text = Path(args.file).read_text(encoding='utf-8')
        analyzer = TextAnalyzer(text)
        capsule = analyzer.to_gene_capsule(
            author=args.author or "unknown",
            work=args.work or Path(args.file).stem,
            source_dir=str(Path(args.file).parent)
        )
        if args.output:
            Path(args.output).write_text(
                __import__('json').dumps(capsule, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            print(f"✅ 已保存: {args.output}")
        else:
            print(__import__('json').dumps(capsule, ensure_ascii=False, indent=2))
    
    elif args.command == "corpus":
        if args.action == "list":
            for a in list_authors():
                print(f"  - {a}")
        elif args.action == "status":
            s = status()
            print(f"\n语料库: {s['corpus_dir']}")
            print(f"已配置作者: {len(s['authors'])}")
            print(f"已生成胶囊: {s['total_capsules']}")
        elif args.action == "scan":
            if args.author:
                scan_author(args.author)
        elif args.action == "scan-all":
            scan_all_authors()
    
    elif args.command == "scan":
        if args.action == "gutenberg-list":
            list_gutenberg_works()
        elif args.action == "gutenberg":
            if args.book_id:
                capsule = scan_gutenberg_work(int(args.book_id))
                if capsule:
                    print("✅ 扫描完成!")
        elif args.action == "url":
            if args.url and args.author:
                from web_scanner import scan_url
                capsule = scan_url(args.url, args.author, args.title or "")
                if capsule:
                    print("✅ 扫描完成!")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
