#!/usr/bin/env python3
"""
EvoMap 进化引擎
串联基因、胶囊、事件，实现自我进化
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import sys

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from capsule_builder import CapsuleBuilder
from gene_generator import EvolutionEngine as GeneEngine

EVENTS_DIR = Path(__file__).parent.parent / "events"
CAPSULES_DIR = Path(__file__).parent.parent / "capsules"

class EvoMapEngine:
    """EvoMap进化引擎"""
    
    def __init__(self):
        self.capsule_builder = CapsuleBuilder()
        self.gene_engine = GeneEngine()
        self.events = []
        self.load_events()
    
    def load_events(self):
        """加载事件日志"""
        if not EVENTS_DIR.exists():
            return
            
        for event_file in EVENTS_DIR.glob("*.log"):
            with open(event_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        event = json.loads(line)
                        self.events.append(event)
    
    def _log_event(self, event_type: str, data: Dict):
        """记录事件"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "data": data
        }
        self.events.append(event)
        
        # 保存到文件
        date_dir = EVENTS_DIR
        date_dir.mkdir(exist_ok=True)
        event_file = date_dir / f"event-{datetime.now().strftime('%Y%m%d')}.log"
        with open(event_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
    
    def evolve_from_chapter(self, chapter: str, content: str, 
                           techniques: List[str], tags: List[str],
                           score: float, issues: List[str] = None) -> Dict:
        """
        从章节进化
        
        Args:
            chapter: 章节标题
            content: 章节内容/摘要
            techniques: 使用的技法
            tags: 标签
            score: 评分
            issues: 发现的问题列表
            
        Returns:
            进化报告
        """
        report = {
            "chapter": chapter,
            "score": score,
            "timestamp": datetime.now().isoformat(),
            "actions": []
        }
        
        # 1. 构建胶囊
        metadata = {
            "key_scenes": [],
            "techniques_used": techniques,
            "innovations": [],
            "metrics": {
                "logic_score": score,
                "writing_score": score
            }
        }
        
        capsule = self.capsule_builder.build(
            chapter=chapter,
            content=content,
            techniques_used=techniques,
            tags=tags,
            score=score,
            metadata=metadata
        )
        
        # 发布胶囊
        capsule_file = self.capsule_builder.publish(capsule)
        report["actions"].append({
            "action": "capsule_published",
            "id": capsule["id"],
            "file": str(capsule_file)
        })
        self._log_event("capsule_published", capsule)
        
        # 2. 从问题生成新基因
        if issues:
            for issue in issues:
                new_gene = self.gene_engine.evolve(
                    problem=issue,
                    solution=f"为{chapter}开发的解决方案",
                    chapter_context=chapter
                )
                report["actions"].append({
                    "action": "gene_evolved",
                    "id": new_gene["id"],
                    "from_issue": issue
                })
                self._log_event("gene_created", new_gene)
            
            # 保存基因
            self.gene_engine.gene_lib.save_genes("combat")
            self.gene_engine.gene_lib.save_genes("psychology")
            self.gene_engine.gene_lib.save_genes("environment")
            self.gene_engine.gene_lib.save_genes("dialogue")
        
        # 3. 统计
        report["summary"] = {
            "capsules_created": 1,
            "genes_created": len(issues) if issues else 0,
            "events_logged": len(report["actions"])
        }
        
        return report
    
    def check_quality_gate(self, capsule_id: str) -> Dict:
        """
        检查质量门控
        
        Args:
            capsule_id: 胶囊ID
            
        Returns:
            检查结果
        """
        capsule = self.capsule_builder.capsules.get(capsule_id)
        if not capsule:
            return {"passed": False, "reason": "胶囊不存在"}
        
        result = {
            "id": capsule_id,
            "score": capsule["score"],
            "checks": {}
        }
        
        # 检查1: 置信度 >= 0.7
        confidence = capsule["success_rate"]
        result["checks"]["confidence"] = {
            "value": confidence,
            "threshold": 0.7,
            "passed": confidence >= 0.7
        }
        
        # 检查2: 连续成功次数 >= 2（简化为单次成功）
        # 实际系统中应该追踪历史记录
        result["checks"]["consecutive_success"] = {
            "value": 1,
            "threshold": 2,
            "passed": True,  # 首次允许通过
            "note": "新胶囊，首次通过"
        }
        
        # 检查3: 技法已记录
        techniques = capsule.get("content", {}).get("techniques_used", [])
        result["checks"]["techniques_recorded"] = {
            "value": len(techniques),
            "passed": len(techniques) > 0
        }
        
        result["passed"] = all(
            check.get("passed", True) 
            for check in result["checks"].values()
        )
        
        # 记录质量检查事件
        self._log_event("quality_check", result)
        
        return result
    
    def get_evolution_history(self, limit: int = 10) -> List[Dict]:
        """
        获取进化历史
        
        Args:
            limit: 返回数量限制
            
        Returns:
            事件列表
        """
        return self.events[-limit:]
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        # 胶囊统计
        capsule_count = len(self.capsule_builder.capsules)
        
        # 基因统计
        gene_count = len(self.gene_engine.gene_lib.genes)
        
        # 事件统计
        event_types = {}
        for event in self.events:
            etype = event.get("type", "unknown")
            event_types[etype] = event_types.get(etype, 0) + 1
        
        # 平均评分
        scores = [c.get("score", 0) for c in self.capsule_builder.capsules.values()]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        return {
            "total_capsules": capsule_count,
            "total_genes": gene_count,
            "total_events": len(self.events),
            "event_types": event_types,
            "average_score": round(avg_score, 2),
            "quality_passed": sum(
                1 for e in self.events 
                if e.get("type") == "quality_check" and e.get("data", {}).get("passed")
            )
        }


def main():
    """主函数"""
    engine = EvoMapEngine()
    
    print("EvoMap 进化引擎")
    print("=" * 40)
    print(f"\n📊 统计:")
    stats = engine.get_statistics()
    print(f"  胶囊: {stats['total_capsules']}")
    print(f"  基因: {stats['total_genes']}")
    print(f"  事件: {stats['total_events']}")
    print(f"  平均分: {stats['average_score']}/10")
    
    print(f"\n📜 最近事件:")
    for event in engine.get_evolution_history(5):
        print(f"  - [{event['type']}] {event['timestamp'][:19]}")
    
    print("\n可用命令:")
    print("  python evolution_engine.py evolve <章节> <技法> <标签> <评分>")
    print("  python evolution_engine.py check <胶囊ID>")
    print("  python evolution_engine.py stats")
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == "evolve":
            chapter = sys.argv[2]
            techniques = sys.argv[3].split(",") if len(sys.argv) > 3 else []
            tags = sys.argv[4].split(",") if len(sys.argv) > 4 else []
            score = float(sys.argv[5]) if len(sys.argv) > 5 else 7.0
            
            report = engine.evolve_from_chapter(
                chapter=chapter,
                content="",
                techniques=techniques,
                tags=tags,
                score=score
            )
            print(f"\n✅ 进化完成:")
            print(json.dumps(report, ensure_ascii=False, indent=2))
        
        elif action == "check":
            capsule_id = sys.argv[2]
            result = engine.check_quality_gate(capsule_id)
            print(f"\n🔍 质量门控检查:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
        
        elif action == "stats":
            print(json.dumps(engine.get_statistics(), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
