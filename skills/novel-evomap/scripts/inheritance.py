#!/usr/bin/env python3
"""
EvoMap 继承器
新章节从胶囊库中继承经验
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

CAPSULES_DIR = Path(__file__).parent.parent / "capsules"
GENES_DIR = Path(__file__).parent.parent / "genes"

class InheritanceEngine:
    """继承引擎"""
    
    def __init__(self):
        self.capsules = {}
        self.genes = {}
        self.load_all()
    
    def load_all(self):
        """加载所有胶囊和基因"""
        # 加载胶囊
        if CAPSULES_DIR.exists():
            for date_dir in CAPSULES_DIR.iterdir():
                if date_dir.is_dir():
                    for capsule_file in date_dir.glob("*.json"):
                        with open(capsule_file, 'r', encoding='utf-8') as f:
                            capsule = json.load(f)
                            self.capsules[capsule["id"]] = capsule
        
        # 加载基因
        if GENES_DIR.exists():
            for gene_file in GENES_DIR.glob("*.json"):
                with open(gene_file, 'r', encoding='utf-8') as f:
                    genes = json.load(f)
                    for gene in genes:
                        self.genes[gene["id"]] = gene
    
    def search_related_capsules(self, chapter_type: str, tags: List[str] = None, 
                                 min_score: float = 7.0, limit: int = 5) -> List[Dict]:
        """
        搜索相关的胶囊
        
        Args:
            chapter_type: 章节类型（如"战斗"、"修炼"、"感情"）
            tags: 标签列表
            min_score: 最低评分
            limit: 返回数量限制
            
        Returns:
            相关胶囊列表
        """
        results = []
        
        for capsule in self.capsules.values():
            if capsule.get("score", 0) < min_score:
                continue
            
            # 标签匹配
            capsule_tags = capsule.get("tags", [])
            if tags and not any(t in capsule_tags for t in tags):
                continue
            
            # 类型匹配（基于标签）
            if chapter_type == "战斗" and not any(t in capsule_tags for t in ["战斗", "对战"]):
                continue
            elif chapter_type == "修炼" and not any(t in capsule_tags for t in ["修炼", "突破"]):
                continue
            elif chapter_type == "感情" and not any(t in capsule_tags for t in ["感情", "沈红菱"]):
                continue
            
            results.append(capsule)
        
        return results[:limit]
    
    def get_inherited_techniques(self, capsule_id: str) -> List[Dict]:
        """
        从胶囊中提取可继承的技法
        
        Args:
            capsule_id: 胶囊ID
            
        Returns:
            技法列表
        """
        capsule = self.capsules.get(capsule_id)
        if not capsule:
            return []
        
        techniques = capsule.get("content", {}).get("techniques_used", [])
        innovations = capsule.get("content", {}).get("innovations", [])
        
        result = []
        for tech in techniques:
            result.append({
                "name": tech,
                "source": capsule["chapter"],
                "score": capsule["score"]
            })
        
        for inn in innovations:
            result.append({
                "name": inn,
                "source": capsule["chapter"],
                "score": capsule["score"],
                "is_innovation": True
            })
        
        return result
    
    def get_writing_genes(self, chapter_type: str) -> List[Dict]:
        """
        获取适合当前章节类型的基因
        
        Args:
            chapter_type: 章节类型
            
        Returns:
            基因列表
        """
        type_mapping = {
            "战斗": "combat",
            "修炼": "combat",
            "感情": "psychology",
            "突破": "combat",
            "逃亡": "combat"
        }
        
        gene_type = type_mapping.get(chapter_type, "combat")
        results = []
        
        for gene in self.genes.values():
            if gene.get("type") == gene_type:
                # 按评分排序
                if gene.get("avg_score", 0) >= 7.5:
                    results.append(gene)
        
        # 按评分排序返回
        return sorted(results, key=lambda x: x.get("avg_score", 0), reverse=True)
    
    def generate_writing_prompt(self, chapter_type: str, context: str = "") -> str:
        """
        生成写作提示
        
        Args:
            chapter_type: 章节类型
            context: 当前剧情背景
            
        Returns:
            写作提示字符串
        """
        # 获取相关胶囊
        related = self.search_related_capsules(chapter_type, limit=3)
        
        # 获取基因
        genes = self.get_writing_genes(chapter_type)
        
        prompt = f"正在写作 {chapter_type} 类型章节...\n\n"
        
        if related:
            prompt += f"📚 参考胶囊 ({len(related)}个):\n"
            for c in related:
                prompt += f"  - {c['chapter']}: {c['score']}/10, 关键场景: {', '.join(c.get('content',{}).get('key_scenes',[])[:2])}\n"
            prompt += "\n"
        
        if genes:
            prompt += f"🧬 推荐基因 ({len(genes)}个):\n"
            for g in genes[:5]:
                prompt += f"  - {g['name']}: {g['description']}\n"
            prompt += "\n"
        
        prompt += f"📝 写作要点:\n"
        
        if chapter_type == "战斗":
            prompt += """  1. 开场用环境描写铺垫紧张气氛
  2. 战斗前盘点资源（工具箱叙事法）
  3. 战斗中要有来有往（发牌理论）
  4. 主角要有代价（以伤换伤）
  5. 结尾要么获胜留悬念，要么获胜有代价
"""
        elif chapter_type == "修炼":
            prompt += """  1. 描写修炼的枯燥与坚持
  2. 突破时的身体/心理变化
  3. 力量提升的具象描写
  4. 展望未来（更强才能复仇）
"""
        elif chapter_type == "感情":
            prompt += """  1. 通过对话展露心意
  2. 动作细节传递情感
  3. 留白给读者想象空间
"""
        
        if context:
            prompt += f"\n🎯 当前剧情: {context}\n"
        
        return prompt
    
    def inherit_all(self, chapter_type: str, tags: List[str] = None) -> Dict:
        """
        获取所有可继承内容
        
        Args:
            chapter_type: 章节类型
            tags: 标签
            
        Returns:
            继承报告
        """
        related = self.search_related_capsules(chapter_type, tags)
        genes = self.get_writing_genes(chapter_type)
        
        return {
            "chapter_type": chapter_type,
            "capsules_found": len(related),
            "genes_found": len(genes),
            "related_capsules": [
                {
                    "id": c["id"],
                    "chapter": c["chapter"],
                    "score": c["score"],
                    "techniques": c.get("content", {}).get("techniques_used", [])
                }
                for c in related
            ],
            "recommended_genes": [
                {
                    "id": g["id"],
                    "name": g["name"],
                    "description": g["description"],
                    "example": g.get("example", "")
                }
                for g in genes[:5]
            ]
        }

def main():
    """主函数"""
    import sys
    
    engine = InheritanceEngine()
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == "search":
            chapter_type = sys.argv[2] if len(sys.argv) > 2 else "战斗"
            tags = sys.argv[3].split(",") if len(sys.argv) > 3 else None
            limit = int(sys.argv[4]) if len(sys.argv) > 4 else 5
            
            results = engine.search_related_capsules(chapter_type, tags, limit=limit)
            print(f"找到 {len(results)} 个相关胶囊:\n")
            for c in results:
                print(f"📦 {c['chapter']}")
                print(f"   评分: {c['score']}/10")
                print(f"   标签: {', '.join(c.get('tags', []))}")
                print(f"   技法: {', '.join(c.get('content',{}).get('techniques_used', []))}")
                print()
        
        elif action == "prompt":
            chapter_type = sys.argv[2] if len(sys.argv) > 2 else "战斗"
            context = sys.argv[3] if len(sys.argv) > 3 else ""
            
            print(engine.generate_writing_prompt(chapter_type, context))
        
        elif action == "inherit":
            chapter_type = sys.argv[2] if len(sys.argv) > 2 else "战斗"
            tags = sys.argv[3].split(",") if len(sys.argv) > 3 else None
            
            report = engine.inherit_all(chapter_type, tags)
            print(json.dumps(report, ensure_ascii=False, indent=2))
    
    else:
        # 交互模式
        print("EvoMap 继承器")
        print("=" * 40)
        print("命令:")
        print("  python inheritance.py search <类型> <标签> <数量>")
        print("  python inheritance.py prompt <类型> <剧情>")
        print("  python inheritance.py inherit <类型> <标签>")
        print("")
        chapter_type = input("章节类型(战斗/修炼/感情): ")
        if chapter_type:
            report = engine.inherit_all(chapter_type)
            print(f"\n📊 继承报告:")
            print(f"  找到 {report['capsules_found']} 个胶囊")
            print(f"  推荐 {len(report['recommended_genes'])} 个基因")
            print("\n🔧 推荐基因:")
            for g in report['recommended_genes'][:3]:
                print(f"  - {g['name']}: {g['description']}")

if __name__ == "__main__":
    main()
