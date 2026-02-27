#!/usr/bin/env python3
"""
Novel EvoMap 语料库管理器
批量扫描多位作者的作品，生成风格基因胶囊库

目标作者列表:
- 忘语（凡人流、谨慎主角、现实主义修仙）
- 辰东（气势磅礴、热血战斗、世界观宏大）
- 我吃西红柿（升级体系清晰、节奏明快、爽点密集）
- 耳根（虐心、情感深刻、道心考验）
- 烽火戏诸侯（文青、装逼打脸、细节精致）

用法:
    python corpus_manager.py scan <author_name>
    python corpus_manager.py scan-all
    python corpus_manager.py generate-capsules
    python corpus_manager.py list
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# 导入文本分析器
from text_analyzer import TextAnalyzer, StyleProfile


# ============================================================
# 语料库配置
# ============================================================

CORPUS_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/corpus")
OUTPUT_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/genes")
CACHE_DIR = Path("/root/.openclaw/workspace/skills/novel-evomap/.cache")

# 目标作者及其风格特征预定义（用于辅助分析）
AUTHORS = {
    "忘语": {
        "style_tags": ["凡人流", "谨慎主角", "现实主义", "修仙", "慢热"],
        "famous_works": ["凡人修仙传", "仙界篇", "魔天记"],
        "characteristics": {
            "节奏": "慢节奏铺垫",
            "主角": "谨慎理智型",
            "爽点": "延迟满足",
            "战斗": "写实风格",
            "情感": "内敛克制"
        }
    },
    "辰东": {
        "style_tags": ["气势磅礴", "热血战斗", "世界观宏大", "玄幻"],
        "famous_works": ["遮天", "完美世界", "神墓", "深空彼岸"],
        "characteristics": {
            "节奏": "快节奏爆发",
            "主角": "热血成长型",
            "爽点": "密集高潮",
            "战斗": "宏大场面",
            "情感": "热血激昂"
        }
    },
    "我吃西红柿": {
        "style_tags": ["升级体系清晰", "节奏明快", "爽点密集", "玄幻"],
        "famous_works": ["盘龙", "星辰变", "吞噬星空", "雪鹰领主"],
        "characteristics": {
            "节奏": "中等稳定",
            "主角": "坚韧修炼型",
            "爽点": "规则清晰",
            "战斗": "招式详解",
            "情感": "后宫/专情"
        }
    },
    "耳根": {
        "style_tags": ["虐心", "情感深刻", "道心考验", "仙侠"],
        "famous_works": ["仙逆", "求魔", "一念永恒", "光阴之外"],
        "characteristics": {
            "节奏": "虐心铺垫",
            "主角": "压抑爆发型",
            "爽点": "情感高潮",
            "战斗": "意志对抗",
            "情感": "深刻动人"
        }
    },
    "烽火戏诸侯": {
        "style_tags": ["文青", "装逼打脸", "细节精致", "都市"],
        "famous_works": ["极品公子", "陈二狗的妖孽人生", "雪中悍刀行", "剑来"],
        "characteristics": {
            "节奏": "张弛有度",
            "主角": "扮猪吃虎型",
            "爽点": "装逼打脸",
            "战斗": "意境描写",
            "情感": "兄弟情义"
        }
    }
}


# ============================================================
# 核心功能
# ============================================================

def ensure_directories():
    """确保目录存在"""
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✅ 目录已就绪:\n  语料库: {CORPUS_DIR}\n  输出: {OUTPUT_DIR}")


def list_authors() -> List[str]:
    """列出已配置作者"""
    return list(AUTHORS.keys())


def list_available_works(author: str) -> List[Path]:
    """列出可用的作品文件"""
    author_dir = CORPUS_DIR / author
    if not author_dir.exists():
        return []
    
    works = []
    for f in author_dir.glob("*.txt"):
        works.append(f)
    for f in author_dir.glob("*.md"):
        works.append(f)
    
    return works


def scan_author(author: str, verbose: bool = True) -> List[Dict]:
    """扫描单个作者的所有作品"""
    if author not in AUTHORS:
        print(f"❌ 作者 '{author}' 未配置")
        return []
    
    works = list_available_works(author)
    if not works:
        if verbose:
            print(f"⚠️  '{author}' 目录下无文本文件")
            print(f"   请将作品文本放入: {CORPUS_DIR}/{author}/")
        return []
    
    if verbose:
        print(f"\n📚 开始扫描 '{author}' 的作品...")
        print(f"   找到 {len(works)} 个文件")
    
    capsules = []
    for work_file in works:
        if verbose:
            print(f"\n  📄 处理中: {work_file.name}")
        
        try:
            text = work_file.read_text(encoding='utf-8')
            analyzer = TextAnalyzer(text)
            
            # 生成风格基因胶囊
            capsule = analyzer.to_gene_capsule(
                author=author,
                work=work_file.stem,
                source_dir=str(work_file.parent)
            )
            
            # 添加作者配置信息
            capsule["style_tags"] = AUTHORS[author]["style_tags"]
            capsule["characteristics"] = AUTHORS[author]["characteristics"]
            
            capsules.append(capsule)
            
            if verbose:
                print(f"     ✅ 完成: {len(text)} 字")
                
        except Exception as e:
            if verbose:
                print(f"     ❌ 失败: {e}")
    
    if verbose and capsules:
        print(f"\n✅ '{author}' 扫描完成: {len(capsules)} 个胶囊")
    
    return capsules


def scan_all_authors() -> Dict[str, List[Dict]]:
    """扫描所有配置作者的作品"""
    print("="*60)
    print("🚀 开始批量扫描所有作者作品")
    print("="*60)
    
    results = {}
    for author in AUTHORS.keys():
        capsules = scan_author(author, verbose=True)
        if capsules:
            results[author] = capsules
    
    # 保存结果
    save_all_capsules(results)
    
    return results


def generate_capsules_from_profiles(profiles: List[StyleProfile], author: str) -> List[Dict]:
    """从风格画像生成标准胶囊格式"""
    capsules = []
    
    for i, profile in enumerate(profiles):
        capsule = {
            "id": f"style-{author.lower()}-{i+1:03d}",
            "author": author,
            "work": profile.work or f"作品{i+1}",
            "features": profile.to_dict(),
            "tags": AUTHORS.get(author, {}).get("style_tags", []),
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        capsules.append(capsule)
    
    return capsules


def save_all_capsules(results: Dict[str, List[Dict]]):
    """保存所有胶囊到文件"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 合并所有胶囊
    all_capsules = []
    for author, capsules in results.items():
        for capsule in capsules:
            all_capsules.append(capsule)
    
    # 保存合并结果
    merged_file = OUTPUT_DIR / f"all-styles-{timestamp}.json"
    with open(merged_file, 'w', encoding='utf-8') as f:
        json.dump(all_capsules, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 已保存合并胶囊: {merged_file}")
    
    # 保存按作者分类的结果
    for author, capsules in results.items():
        author_file = OUTPUT_DIR / f"style-{author.lower()}.json"
        with open(author_file, 'w', encoding='utf-8') as f:
            json.dump(capsules, f, ensure_ascii=False, indent=2)
        print(f"💾 已保存 {author}: {author_file}")
    
    # 保存最新版本链接
    latest_file = OUTPUT_DIR / "latest.json"
    with open(latest_file, 'w', encoding='utf-8') as f:
        json.dump({
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "authors_scanned": list(results.keys()),
            "total_capsules": len(all_capsules)
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 统计: {len(all_capsules)} 个风格胶囊已生成")


def create_sample_capsule(author: str) -> Dict:
    """为指定作者创建示例胶囊（当没有实际文本时）"""
    
    if author not in AUTHORS:
        return {}
    
    config = AUTHORS[author]
    
    # 基于预定义特征创建示例胶囊
    sample = {
        "id": f"style-{author.lower()}-sample",
        "author": author,
        "work": f"{config['famous_works'][0]}" if config.get('famous_works') else author,
        "features": {
            "vocabulary": {
                "avg_word_complexity": 0.3 if "辰东" in author else 0.2,
                "colloquial_ratio": 0.15,
                "dialect_density": 0.01,
                "term_density": config.get('characteristics', {}).get('爽点', '') and 0.05 or 0.02,
                "unique_word_ratio": 0.6
            },
            "syntax": {
                "avg_sentence_length": 25.0,
                "clause_complexity": 1.5,
                "omission_ratio": 0.1
            },
            "rhythm": {
                "avg_paragraph_length": 150.0,
                "dialogue_ratio": 0.2,
                "rhythm_variation": 0.8
            },
            "emotion": {
                "emotion_intensity": 0.8 if "辰东" in author or "耳根" in author else 0.5,
                "cold_hot_ratio": 0.3
            }
        },
        "style_tags": config["style_tags"],
        "characteristics": config["characteristics"],
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "is_sample": True,
        "note": "此为示例胶囊，实际效果需扫描真实文本后生成"
    }
    
    return sample


def status() -> Dict:
    """查看当前语料库状态"""
    status = {
        "corpus_dir": str(CORPUS_DIR),
        "authors": [],
        "total_works": 0,
        "total_capsules": 0
    }
    
    for author in AUTHORS.keys():
        works = list_available_works(author)
        author_status = {
            "name": author,
            "works_count": len(works),
            "has_text": len(works) > 0,
            "works": [w.name for w in works]
        }
        status["authors"].append(author_status)
        status["total_works"] += len(works)
    
    # 检查已生成的胶囊
    capsule_files = list(OUTPUT_DIR.glob("style-*.json"))
    status["total_capsules"] = len(capsule_files)
    
    return status


# ============================================================
# 主程序
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Novel EvoMap 语料库管理器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s status                      # 查看状态
    %(prog)s list                        # 列出已配置作者
    %(prog)s scan 忘语                   # 扫描忘语作品
    %(prog)s scan-all                    # 扫描所有作者
    %(prog)s generate-capsules           # 生成胶囊
    %(prog)s sample 辰东                 # 创建示例胶囊
        """
    )
    
    parser.add_argument("command", choices=[
        "status", "list", "scan", "scan-all", 
        "generate-capsules", "sample", "demo"
    ], help="命令")
    parser.add_argument("target", nargs="?", help="目标作者（用于scan/sample）")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    ensure_directories()
    
    if args.command == "status":
        s = status()
        print("\n📚 语料库状态")
        print("="*50)
        print(f"语料库目录: {s['corpus_dir']}")
        print(f"总作品数: {s['total_works']}")
        print(f"已生成胶囊: {s['total_capsules']}")
        print("\n作者状态:")
        for a in s['authors']:
            status_icon = "✅" if a['has_text'] else "❌"
            print(f"  {status_icon} {a['name']}: {a['works_count']} 个作品")
    
    elif args.command == "list":
        print("\n📚 已配置作者")
        print("="*50)
        for author, config in AUTHORS.items():
            print(f"\n  🎭 {author}")
            print(f"     代表作: {', '.join(config.get('famous_works', [])[:3])}")
            print(f"     风格: {', '.join(config['style_tags'][:5])}")
    
    elif args.command == "scan":
        if not args.target:
            print("❌ 请指定作者: python corpus_manager.py scan 忘语")
            return
        scan_author(args.target, verbose=args.verbose)
    
    elif args.command == "scan-all":
        scan_all_authors()
    
    elif args.command == "generate-capsules":
        # 扫描所有有文本的作者并生成胶囊
        results = {}
        for author in AUTHORS.keys():
            capsules = scan_author(author, verbose=False)
            if capsules:
                results[author] = capsules
        save_all_capsules(results)
    
    elif args.command == "sample":
        if not args.target:
            print("❌ 请指定作者: python corpus_manager.py sample 辰东")
            return
        capsule = create_sample_capsule(args.target)
        if capsule:
            print(json.dumps(capsule, ensure_ascii=False, indent=2))
            
            # 保存示例胶囊
            sample_file = OUTPUT_DIR / f"style-{args.target.lower()}-sample.json"
            with open(sample_file, 'w', encoding='utf-8') as f:
                json.dump(capsule, f, ensure_ascii=False, indent=2)
            print(f"\n✅ 示例胶囊已保存: {sample_file}")
    
    elif args.command == "demo":
        print("\n📚 语料库管理演示")
        print("="*50)
        print("\n1. 当前已配置作者:")
        for author in list_authors():
            print(f"   - {author}")
        print("\n2. 扫描状态:")
        for author in list_authors():
            works = list_available_works(author)
            icon = "✅" if works else "❌"
            print(f"   {icon} {author}: {len(works)} 个作品")
        print("\n3. 要开始扫描，请:")
        print("   - 将作品文本放入: corpus/{作者名}/")
        print("   - 运行: python corpus_manager.py scan-all")


if __name__ == "__main__":
    main()
