#!/usr/bin/env python3
"""
小说创作自动工作流
整合：写作 → 审核 → 进化 → 遗传
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# 添加路径
SKILLS_DIR = Path(__file__).parent.parent
WORKSPACE_DIR = SKILLS_DIR.parent.parent

# 导入EvoMap模块
EVO_MAP_DIR = WORKSPACE_DIR / "skills" / "novel-evomap" / "scripts"
sys.path.insert(0, str(EVO_MAP_DIR))

from capsule_builder import CapsuleBuilder
from inheritance import InheritanceEngine

NOVEL_DIR = WORKSPACE_DIR / "剑起青云"
MEMORY_FILE = WORKSPACE_DIR / "memory" / "2026-02-24.md"


class NovelWorkflow:
    """小说创作工作流"""
    
    def __init__(self):
        self.capsule_builder = CapsuleBuilder()
        self.inheritance = InheritanceEngine()
        self.current_chapter = None
        self.chapter_content = None
    
    # ==================== 写作阶段 ====================
    
    def write_chapter(self, chapter_title: str, outline: str, 
                      inherit: bool = False, techniques: List[str] = None) -> Dict:
        """
        写作阶段
        
        Args:
            chapter_title: 章节标题
            outline: 大纲/要点
            inherit: 是否继承上一章经验
            techniques: 指定使用的技法
            
        Returns:
            写作报告
        """
        self.current_chapter = chapter_title
        
        report = {
            "action": "write",
            "chapter": chapter_title,
            "timestamp": datetime.now().isoformat(),
            "inherit": inherit,
            "result": None
        }
        
        # 继承经验
        if inherit:
            inherit_report = self.inheritance.inherit_all("战斗", ["战斗"])
            print(f"\n📚 继承经验:")
            print(f"   胶囊: {inherit_report['capsules_found']} 个")
            print(f"   基因: {len(inherit_report['recommended_genes'])} 个")
            
            print(f"\n🧬 推荐基因:")
            for g in inherit_report['recommended_genes'][:3]:
                print(f"   - {g['name']}: {g['description']}")
        
        # 生成写作提示
        prompt = self.inheritance.generate_writing_prompt(
            "战斗",
            context=outline
        )
        print(f"\n📝 写作提示:\n{prompt}")
        
        # 提示用户开始写作
        print(f"\n" + "=" * 50)
        print(f"✍️  准备写作: {chapter_title}")
        print(f"📋 要点: {outline}")
        print(f"=" * 50)
        
        report["inherit_report"] = inherit_report if inherit else None
        report["prompt"] = prompt
        
        return report
    
    def save_chapter(self, content: str) -> Path:
        """
        保存章节内容
        
        Args:
            content: 章节内容
            
        Returns:
            文件路径
        """
        if not self.current_chapter:
            raise ValueError("未指定章节标题")
        
        # 生成文件名
        safe_title = self.current_chapter.replace(" ", "-")
        file_path = NOVEL_DIR / f"{safe_title}.md"
        
        # 保存
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        self.chapter_content = content
        print(f"\n✅ 章节已保存: {file_path}")
        
        return file_path
    
    # ==================== 审核阶段 ====================
    
    def review_chapter(self, file_path: str) -> Dict:
        """
        审核章节（调用审核代理）
        
        Args:
            file_path: 章节文件路径
            
        Returns:
            审核报告
        """
        print(f"\n" + "=" * 50)
        print(f"🔍 开始审核: {file_path}")
        print(f"=" * 50)
        
        # 读取内容
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 调用审核代理
        report = self._call_editor_agent(file_path, content)
        
        print(f"\n📊 审核结果: {report.get('total_score', 'N/A')}/10")
        print(f"   等级: {report.get('grade', 'N/A')}")
        
        if "issues" in report:
            print(f"\n⚠️  问题列表:")
            for issue in report["issues"][:5]:
                print(f"   - [{issue['priority']}] {issue['description']}")
        
        return report
    
    def _call_editor_agent(self, file_path: str, content: str) -> Dict:
        """
        调用审核代理（通过sessions_send）
        """
        # 读取审核代理提示词
        agent_config = SKILLS_DIR / "novel-editor" / "agent-prompt.md"
        
        if agent_config.exists():
            with open(agent_config, 'r', encoding='utf-8') as f:
                agent_prompt = f.read()
        else:
            agent_prompt = "请审核以下小说章节，从五大维度评分。"
        
        # 这里简化处理，返回模拟结果
        # 实际应通过 sessions_send 调用 novel-editor 代理
        return self._simulate_review(content)
    
    def _simulate_review(self, content: str) -> Dict:
        """模拟审核（实际应调用代理）"""
        word_count = len(content)
        
        # 基于内容长度和结构估算评分
        base_score = 7.5
        
        # 检查基本规则
        has_short_paragraphs = content.count('\n\n') < 5
        has_dialogues = '"' in content
        
        score = base_score
        if has_short_paragraphs:
            score -= 0.3
        if has_dialogues:
            score += 0.2
        
        return {
            "file": self.current_chapter,
            "total_score": round(score, 1),
            "grade": self._score_to_grade(score),
            "dimensions": {
                "内部逻辑": round(score, 1),
                "外部逻辑": round(score - 0.1, 1),
                "情节人物": round(score + 0.1, 1),
                "叙事结构": round(score - 0.2, 1),
                "修真特有": round(score, 1)
            },
            "issues": [
                {"priority": "中", "description": "建议增加更多感官描写", "suggestion": "使用感官轰炸技法"}
            ] if score < 8.0 else [],
            "passed": score >= 7.0,
            "word_count": word_count
        }
    
    def _score_to_grade(self, score: float) -> str:
        """分数转等级"""
        if score >= 9.0:
            return "A+"
        elif score >= 8.0:
            return "A"
        elif score >= 7.0:
            return "B+"
        elif score >= 6.0:
            return "B"
        else:
            return "C"
    
    # ==================== 进化阶段 ====================
    
    def evolve_chapter(self, chapter: str, score: float, 
                       issues: List[str] = None) -> Dict:
        """
        进化阶段 - 从章节生成胶囊和基因
        
        Args:
            chapter: 章节标题
            score: 评分
            issues: 问题列表
            
        Returns:
            进化报告
        """
        print(f"\n" + "=" * 50)
        print(f"🧬 开始进化: {chapter}")
        print(f"=" * 50)
        
        # 构建胶囊
        capsule = self.capsule_builder.build(
            chapter=chapter,
            content=self.chapter_content or "",
            techniques_used=["感官轰炸", "镜头切换", "内心独白"],
            tags=["战斗", chapter],
            score=score,
            metadata={
                "key_scenes": ["核心场景1", "核心场景2"],
                "metrics": {"logic_score": score}
            }
        )
        
        # 发布胶囊
        capsule_file = self.capsule_builder.publish(capsule)
        print(f"📦 胶囊已发布: {capsule['id']}")
        
        # 从问题生成基因
        genes_created = 0
        if issues:
            from gene_generator import EvolutionEngine as GeneEngine
            gene_engine = GeneEngine()
            
            for issue in issues:
                new_gene = gene_engine.evolve(
                    problem=issue,
                    solution=f"为{chapter}开发的解决方案",
                    chapter_context=chapter
                )
                genes_created += 1
                print(f"🧬 基因已生成: {new_gene['id']}")
            
            # 保存基因
            gene_engine.gene_lib.save_genes("combat")
        
        report = {
            "chapter": chapter,
            "score": score,
            "capsule_id": capsule["id"],
            "genes_created": genes_created,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n✅ 进化完成:")
        print(f"   胶囊: 1 个")
        print(f"   基因: {genes_created} 个")
        
        return report
    
    # ==================== 遗传阶段 ====================
    
    def inherit_update(self) -> Dict:
        """
        遗传阶段 - 更新经验库
        """
        print(f"\n" + "=" * 50)
        print(f"🔄 遗传更新")
        print(f"=" * 50)
        
        stats = {
            "total_capsules": len(self.capsule_builder.capsules),
            "total_genes": len(self.inheritance.genes),
            "timestamp": datetime.now().isoformat()
        }
        
        # 统计高分胶囊
        high_score = [c for c in self.capsule_builder.capsules.values() 
                     if c.get("score", 0) >= 8.0]
        stats["high_score_capsules"] = len(high_score)
        
        # 统计高分基因
        high_score_genes = [g for g in self.inheritance.genes.values()
                           if g.get("avg_score", 0) >= 8.0]
        stats["high_score_genes"] = len(high_score_genes)
        
        print(f"\n📊 经验库统计:")
        print(f"   总胶囊: {stats['total_capsules']}")
        print(f"   总基因: {stats['total_genes']}")
        print(f"   高分胶囊(>=8): {stats['high_score_capsules']}")
        print(f"   高分基因(>=8): {stats['high_score_genes']}")
        
        return stats
    
    # ==================== 完整工作流 ====================
    
    def run_full(self, chapter: str, outline: str, 
                 chapter_type: str = "战斗") -> Dict:
        """
        完整工作流：写→审→进化
        
        Args:
            chapter: 章节标题
            outline: 大纲
            chapter_type: 章节类型
            
        Returns:
            完整报告
        """
        report = {
            "chapter": chapter,
            "start_time": datetime.now().isoformat(),
            "steps": []
        }
        
        # 1. 继承
        print(f"\n📚 继承上一章经验...")
        inherit_report = self.inheritance.inherit_all(chapter_type, [chapter_type])
        report["steps"].append({
            "step": "inherit",
            "capsules_found": inherit_report["capsules_found"],
            "genes_found": len(inherit_report["recommended_genes"])
        })
        
        # 2. 生成写作提示
        prompt = self.inheritance.generate_writing_prompt(chapter_type, outline)
        print(f"\n📝 写作提示已生成")
        
        # 3. 提示用户写作
        print(f"\n" + "=" * 50)
        print(f"✍️  请开始写作: {chapter}")
        print(f"📋 要点: {outline}")
        print(f"=" * 50)
        print(f"\n💡 提示: 输入内容后调用 save_chapter() 保存")
        
        report["steps"].append({
            "step": "write",
            "status": "pending_user_input",
            "prompt": prompt[:200] + "..."
        })
        
        return report
    
    def status(self) -> Dict:
        """查看系统状态"""
        stats = self.inheritance.get_statistics()
        return stats


def main():
    """主函数"""
    workflow = NovelWorkflow()
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == "write":
            # 写作阶段
            chapter = sys.argv[2] if len(sys.argv) > 2 else "第18章-新标题"
            outline = sys.argv[3] if len(sys.argv) > 3 else "按大纲写"
            inherit = "--inherit" in sys.argv
            techniques = [t for t in sys.argv if t.startswith("--technique=")]
            techniques = [t.replace("--technique=", "") for t in techniques]
            
            report = workflow.write_chapter(chapter, outline, inherit, techniques)
            print(json.dumps(report, ensure_ascii=False, indent=2))
        
        elif action == "save":
            # 保存章节
            content = sys.argv[2] if len(sys.argv) > 2 else ""
            if content == "":
                print("请提供内容: python workflow.py save <内容>")
            else:
                workflow.save_chapter(content)
        
        elif action == "review":
            # 审核阶段
            file_path = sys.argv[2] if len(sys.argv) > 2 else ""
            if file_path:
                report = workflow.review_chapter(file_path)
                print(json.dumps(report, ensure_ascii=False, indent=2))
            else:
                print("请提供文件路径: python workflow.py review <文件>")
        
        elif action == "evolve":
            # 进化阶段
            chapter = sys.argv[2] if len(sys.argv) > 2 else "第18章"
            score = float(sys.argv[3]) if len(sys.argv) > 3 else 7.5
            issues = sys.argv[4].split(",") if len(sys.argv) > 4 else None
            
            report = workflow.evolve_chapter(chapter, score, issues)
            print(json.dumps(report, ensure_ascii=False, indent=2))
        
        elif action == "inherit":
            # 遗传阶段
            report = workflow.inherit_update()
            print(json.dumps(report, ensure_ascii=False, indent=2))
        
        elif action == "run":
            # 完整工作流
            file_path = sys.argv[2] if len(sys.argv) > 2 else ""
            if file_path:
                # 先审核
                review = workflow.review_chapter(file_path)
                if review["passed"]:
                    # 审核通过，进化
                    chapter = Path(file_path).stem
                    workflow.evolve_chapter(chapter, review["total_score"])
                    workflow.inherit_update()
            else:
                print("请提供文件路径: python workflow.py run <文件>")
        
        elif action == "status":
            # 查看状态
            stats = workflow.status()
            print(json.dumps(stats, ensure_ascii=False, indent=2))
        
        else:
            print(f"未知命令: {action}")
    
    else:
        # 交互模式
        print("=" * 50)
        print("小说创作自动工作流")
        print("=" * 50)
        print("\n命令:")
        print("  python novel-workflow.py write <章节> <大纲> [--inherit]")
        print("  python novel-workflow.py save <内容>")
        print("  python novel-workflow.py review <文件>")
        print("  python novel-workflow.py evolve <章节> <评分> <问题>")
        print("  python novel-workflow.py inherit")
        print("  python novel-workflow.py run <文件>")
        print("  python novel-workflow.py status")
        print("\n示例:")
        print("  python novel-workflow.py write '第18章' '修炼突破' --inherit")
        print("  python novel-workflow.py review 第18章-修炼突破.md")
        print("  python novel-workflow.py inherit")


if __name__ == "__main__":
    main()
