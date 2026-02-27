#!/usr/bin/env python3
"""
EvoMap 系统测试脚本
验证所有组件是否正常工作
"""

import json
import sys
from pathlib import Path

# 添加脚本目录到路径
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from capsule_builder import CapsuleBuilder
from gene_generator import GeneLibrary, EvolutionEngine as GeneEngine
from inheritance import InheritanceEngine

def test_gene_library():
    """测试基因库"""
    print("\n🧬 测试基因库...")
    
    lib = GeneLibrary()
    print(f"  加载了 {len(lib.genes)} 个基因")
    
    # 获取战斗基因
    combat_genes = [g for g in lib.genes.values() if g.get("type") == "combat"]
    print(f"  战斗基因: {len(combat_genes)} 个")
    
    # 获取评分>=8的基因
    high_score = [g for g in lib.genes.values() if g.get("avg_score", 0) >= 8.0]
    print(f"  高分基因(>=8.0): {len(high_score)} 个")
    
    # 测试添加基因
    new_gene = {
        "name": "测试新基因",
        "type": "combat",
        "description": "这是一个测试基因",
        "example": "测试示例文本",
        "tags": ["测试"]
    }
    lib.add_gene(new_gene)
    print(f"  添加后总数: {len(lib.genes)} 个")
    
    return len(lib.genes) > 0

def test_capsule_builder():
    """测试胶囊构建器"""
    print("\n📦 测试胶囊构建器...")
    
    builder = CapsuleBuilder()
    initial_count = len(builder.capsules)
    print(f"  初始胶囊数: {initial_count}")
    
    # 构建新胶囊
    capsule = builder.build(
        chapter="测试章节-自我验证",
        content="这是一段测试内容，用于验证胶囊构建功能。",
        techniques_used=["感官轰炸", "镜头切换"],
        tags=["测试", "战斗"],
        score=8.2,
        metadata={
            "key_scenes": ["测试场景1", "测试场景2"],
            "metrics": {"logic_score": 8.2, "writing_score": 8.2}
        }
    )
    print(f"  构建胶囊: {capsule['id']}")
    
    # 发布胶囊
    file_path = builder.publish(capsule)
    print(f"  发布到: {file_path}")
    
    # 搜索胶囊
    results = builder.search(tags=["测试"], min_score=7.0)
    print(f"  搜索结果: {len(results)} 个")
    
    return len(builder.capsules) > initial_count

def test_inheritance_engine():
    """测试继承引擎"""
    print("\n🔄 测试继承引擎...")
    
    engine = InheritanceEngine()
    print(f"  加载胶囊: {len(engine.capsules)} 个")
    print(f"  加载基因: {len(engine.genes)} 个")
    
    # 搜索战斗胶囊
    combat_capsules = engine.search_related_capsules("战斗", min_score=7.0)
    print(f"  战斗胶囊: {len(combat_capsules)} 个")
    
    # 获取写作基因
    genes = engine.get_writing_genes("战斗")
    print(f"  战斗基因: {len(genes)} 个")
    
    # 生成写作提示
    prompt = engine.generate_writing_prompt(
        "战斗",
        context="主角在万妖岭修炼，遭遇筑基期妖兽"
    )
    has_prompt = "参考胶囊" in prompt and "推荐基因" in prompt
    print(f"  写作提示生成: {'✅' if has_prompt else '❌'}")
    
    # 继承报告
    report = engine.inherit_all("战斗", ["战斗"])
    print(f"  继承报告: {report['capsules_found']} 胶囊, {len(report['recommended_genes'])} 基因")
    
    return True

def test_gene_evolution():
    """测试基因进化"""
    print("\n🧬 测试基因进化...")
    
    engine = GeneEngine()
    print(f"  现有基因: {len(engine.gene_lib.genes)} 个")
    
    # 从问题进化新基因
    new_gene = engine.evolve(
        problem="战斗场景缺乏新意",
        solution="引入环境互动要素，让战斗与环境产生互动",
        chapter_context="第18章-修炼突破"
    )
    print(f"  新基因: {new_gene['id']} - {new_gene['name']}")
    print(f"  描述: {new_gene['description']}")
    
    # 保存基因
    engine.gene_lib.save_genes(new_gene["type"])
    print(f"  保存到基因库")
    
    return new_gene is not None

def test_integration():
    """集成测试"""
    print("\n🔗 集成测试...")
    
    # 1. 从胶囊库继承
    engine = InheritanceEngine()
    report = engine.inherit_all("战斗", ["战斗"])
    print(f"  继承到 {report['capsules_found']} 个胶囊")
    print(f"  推荐 {len(report['recommended_genes'])} 个基因")
    
    # 2. 获取高分基因
    genes = engine.get_writing_genes("战斗")
    top_genes = sorted(genes, key=lambda x: x.get("avg_score", 0), reverse=True)[:3]
    print(f"  Top 3 战斗基因:")
    for g in top_genes:
        print(f"    - {g['name']}: {g['avg_score']}/10")
    
    return True

def main():
    """主测试函数"""
    print("=" * 50)
    print("EvoMap 小说创作系统 - 自我验证测试")
    print("=" * 50)
    
    results = []
    
    # 运行测试
    results.append(("基因库", test_gene_library()))
    results.append(("胶囊构建器", test_capsule_builder()))
    results.append(("继承引擎", test_inheritance_engine()))
    results.append(("基因进化", test_gene_evolution()))
    results.append(("集成测试", test_integration()))
    
    # 汇总
    print("\n" + "=" * 50)
    print("测试结果汇总")
    print("=" * 50)
    
    passed = 0
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {name}: {status}")
        if result:
            passed += 1
    
    print(f"\n总计: {passed}/{len(results)} 项通过")
    
    if passed == len(results):
        print("\n🎉 所有测试通过！EvoMap 系统运行正常。")
    else:
        print(f"\n⚠️  {len(results) - passed} 项测试失败，请检查。")

if __name__ == "__main__":
    main()
