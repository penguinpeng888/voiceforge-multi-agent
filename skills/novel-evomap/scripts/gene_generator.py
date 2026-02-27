#!/usr/bin/env python3
"""
EvoMap 基因生成器
从成功章节中提取创作基因，存入基因库
"""

import json
import os
from datetime import datetime
from pathlib import Path

GENES_DIR = Path(__file__).parent.parent / "genes"
CAPSULES_DIR = Path(__file__).parent.parent / "capsules"

class GeneLibrary:
    def __init__(self):
        self.genes = {}
        self.load_genes()
    
    def load_genes(self):
        """加载所有基因文件"""
        if not GENES_DIR.exists():
            return
            
        for gene_file in GENES_DIR.glob("*.json"):
            with open(gene_file, 'r', encoding='utf-8') as f:
                genes = json.load(f)
                for gene in genes:
                    self.genes[gene["id"]] = gene
    
    def save_genes(self, gene_type="combat"):
        """保存基因到文件"""
        genes_list = [g for g in self.genes.values() if g.get("type") == gene_type]
        gene_file = GENES_DIR / f"{gene_type}.json"
        with open(gene_file, 'w', encoding='utf-8') as f:
            json.dump(genes_list, f, ensure_ascii=False, indent=2)
    
    def get_techniques(self, context="", score_threshold=7.0):
        """获取符合条件的基因"""
        results = []
        for gene in self.genes.values():
            if gene.get("avg_score", 0) >= score_threshold:
                results.append(gene)
        return results
    
    def add_gene(self, gene_data):
        """添加新基因"""
        if "id" not in gene_data:
            gene_data["id"] = f"gene-{datetime.now().strftime('%Y%m%d')}-{len(self.genes)+1:03d}"
        gene_data["success_count"] = gene_data.get("success_count", 0)
        gene_data["avg_score"] = gene_data.get("avg_score", 7.0)
        self.genes[gene_data["id"]] = gene_data
        return gene_data

class EvolutionEngine:
    """进化引擎 - 从问题生成新基因"""
    
    def __init__(self):
        self.gene_lib = GeneLibrary()
    
    def evolve(self, problem, solution, chapter_context=""):
        """
        从问题/解决方案生成新基因
        
        Args:
            problem: 描述问题
            solution: 解决方案/新技法
            chapter_context: 章节背景
            
        Returns:
            新基因字典
        """
        # 分析问题类型
        gene_type = self._detect_type(problem)
        
        # 生成基因
        new_gene = {
            "id": f"gene-{datetime.now().strftime('%Y%m%d')}-{len(self.gene_lib.genes)+1:03d}",
            "name": self._extract_name(solution),
            "type": gene_type,
            "description": solution,
            "example": self._generate_example(solution, chapter_context),
            "success_count": 0,  # 新基因，尚未验证
            "avg_score": 7.0,
            "tags": self._generate_tags(problem, solution),
            "evolved_from": {
                "problem": problem,
                "chapter": chapter_context,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # 保存基因
        self.gene_lib.genes[new_gene["id"]] = new_gene
        
        return new_gene
    
    def _detect_type(self, problem):
        """检测问题/基因类型"""
        problem = problem.lower()
        if any(k in problem for k in ["战斗", "打架", "剑法", "功法"]):
            return "combat"
        elif any(k in problem for k in ["心理", "内心", "感情", "情绪"]):
            return "psychology"
        elif any(k in problem for k in ["环境", "场景", "描写"]):
            return "environment"
        elif any(k in problem for k in ["对话", "说话", "台词"]):
            return "dialogue"
        else:
            return "combat"  # 默认
    
    def _extract_name(self, solution):
        """提取基因名称"""
        if len(solution) < 20:
            return solution
        # 取前15个字作为名称
        return solution[:15]
    
    def _generate_example(self, solution, context):
        """生成示例"""
        # 从基因类型选择合适的示例模板
        examples = {
            "combat": f"战斗中使用{solution}，效果显著。",
            "psychology": f"通过{solution}展现人物内心复杂情感。",
            "environment": f"用{solution}快速交代背景。",
            "dialogue": f"设计{solution}的对白场景。"
        }
        return examples.get(self._detect_type(solution), solution)
    
    def _generate_tags(self, problem, solution):
        """生成标签"""
        tags = [self._detect_type(problem)]
        if "首次" in solution or "新" in solution:
            tags.append("创新")
        return tags

def main():
    """主函数 - 从标准输入读取问题，生成基因"""
    import sys
    
    if len(sys.argv) > 1:
        # 命令行参数：python gene_generator.py "问题描述" "解决方案"
        problem = sys.argv[1]
        solution = sys.argv[2] if len(sys.argv) > 2 else ""
        chapter = sys.argv[3] if len(sys.argv) > 3 else ""
        
        engine = EvolutionEngine()
        new_gene = engine.evolve(problem, solution, chapter)
        
        print(f"✅ 新基因已生成:")
        print(json.dumps(new_gene, ensure_ascii=False, indent=2))
        
        # 保存到文件
        engine.gene_lib.save_genes(new_gene["type"])
        print(f"\n📁 已保存到基因库")
    else:
        # 交互模式
        print("EvoMap 基因生成器")
        print("=" * 40)
        problem = input("问题描述: ")
        solution = input("解决方案/新技法: ")
        chapter = input("章节背景(可选): ")
        
        if problem:
            engine = EvolutionEngine()
            new_gene = engine.evolve(problem, solution, chapter)
            
            print(f"\n✅ 新基因已生成:")
            print(json.dumps(new_gene, ensure_ascii=False, indent=2))
            
            # 保存
            engine.gene_lib.save_genes(new_gene["type"])
            print(f"\n📁 已保存到基因库")

if __name__ == "__main__":
    main()
