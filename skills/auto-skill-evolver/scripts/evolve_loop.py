#!/usr/bin/env python3
"""
Auto Skill Evolver - 主循环
整合 TaskAgent + Evaluator + MetaAgent 的自我进化系统
基于 HyperAgents 架构
"""
import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

# 添加脚本目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from meta_agent import MetaAgent
from evaluator import Evaluator


class AutoSkillEvolver:
    """自动技能进化系统"""
    
    def __init__(self, workspace_root: str = "/root/.openclaw/workspace"):
        self.workspace_root = Path(workspace_root)
        self.meta_agent = MetaAgent(workspace_root)
        self.evaluator = Evaluator(workspace_root)
        
        # 配置
        self.config = {
            "auto_evolve": True,
            "eval_threshold": 0.7,  # 低于此分数触发改进
            "max_retries": 3,       # 最大重试次数
            "improvement_threshold": 0.85  # 改进后需要达到的分数
        }
        
    def run_task(self, skill_name: str, inputs: dict, expected=None) -> dict:
        """
        运行任务并评估
        
        流程: TaskAgent → Evaluator → [MetaAgent 改进如果需要]
        """
        print(f"\n{'='*50}")
        print(f"🎯 执行任务: {skill_name}")
        print(f"{'='*50}")
        
        # 1. 执行任务（这里简化处理，实际应该调用 TaskAgent）
        result = self._execute_task(skill_name, inputs)
        
        # 2. 评估结果
        eval_result = self.evaluator.evaluate(
            skill_name, 
            inputs, 
            expected,
            test_func=None
        )
        
        print(f"\n📊 评估结果:")
        print(f"   分数: {eval_result['score']:.2f}")
        print(f"   反馈: {eval_result['feedback']}")
        
        # 3. 检查是否需要触发 MetaAgent
        if eval_result['score'] < self.config["eval_threshold"]:
            print(f"\n⚠️ 分数低于阈值 ({self.config['eval_threshold']})")
            print("   触发 MetaAgent 自我改进...")
            
            # 4. MetaAgent 改进
            improve_result = self.meta_agent.forward(
                skill_name=skill_name,
                feedback=eval_result['feedback'],
                eval_data=eval_result
            )
            
            print(f"\n🔧 改进结果:")
            print(f"   问题数: {improve_result.get('problems_found', 0)}")
            print(f"   修改文件: {improve_result.get('files_changed', [])}")
            
            return {
                "task_result": result,
                "evaluation": eval_result,
                "improvement": improve_result,
                "auto_improved": True
            }
        else:
            print(f"\n✅ 评估通过，无需改进")
            return {
                "task_result": result,
                "evaluation": eval_result,
                "improvement": None,
                "auto_improved": False
            }
    
    def _execute_task(self, skill_name: str, inputs: dict) -> dict:
        """执行任务（TaskAgent 逻辑）"""
        skill_path = self.workspace_root / "skills" / skill_name
        
        if not skill_path.exists():
            return {"error": f"Skill不存在: {skill_name}"}
        
        # 检查 SKILL.md 获取工作流
        skill_md = skill_path / "SKILL.md"
        if skill_md.exists():
            content = skill_md.read_text()
            # 简单提取工作流
            return {
                "skill_name": skill_name,
                "status": "executed",
                "workflow": "从 SKILL.md 执行",
                "inputs": inputs
            }
        
        return {"error": "无可执行内容"}
    
    def create_skill(self, name: str, description: str, triggers: list, workflow: list) -> dict:
        """创建新 Skill"""
        skill_path = self.workspace_root / "skills" / name
        
        if skill_path.exists():
            return {"success": False, "error": f"Skill已存在: {name}"}
        
        # 创建目录
        skill_path.mkdir(parents=True, exist_ok=True)
        (skill_path / "scripts").mkdir(exist_ok=True)
        (skill_path / "prompts").mkdir(exist_ok=True)
        
        # 写入 SKILL.md
        content = f"""# {name}
{description}

## 触发关键词
{', '.join(triggers)}

## 工作流
{chr(10).join(f'{i+1}. {step}' for i, step in enumerate(workflow))}

## 评估标准
- 分数 >= 0.7: 通过
- 分数 < 0.7: 触发自动改进
"""
        
        (skill_path / "SKILL.md").write_text(content, encoding="utf-8")
        
        return {
            "success": True,
            "skill_name": name,
            "path": str(skill_path)
        }
    
    def list_skills(self) -> list:
        """列出所有 Skills"""
        skills_root = self.workspace_root / "skills"
        if not skills_root.exists():
            return []
        
        skills = []
        for d in skills_root.iterdir():
            if d.is_dir() and not d.name.startswith("."):
                skill_md = d / "SKILL.md"
                description = ""
                if skill_md.exists():
                    content = skill_md.read_text(encoding="utf-8")
                    # 提取第一段描述
                    lines = content.split("\n")
                    for line in lines[1:]:
                        if line.strip() and not line.startswith("#"):
                            description = line.strip()
                            break
                
                skills.append({
                    "name": d.name,
                    "description": description,
                    "path": str(d)
                })
        
        return skills
    
    def get_status(self, skill_name: str = None) -> dict:
        """获取状态"""
        skills = self.list_skills()
        
        status = {
            "total_skills": len(skills),
            "skills": skills,
            "config": self.config
        }
        
        if skill_name:
            # 获取特定 Skill 的评估历史
            history = self.evaluator.get_history(skill_name)
            status["evaluations"] = history
            status["should_evolve"] = self.evaluator.should_trigger_meta(skill_name)
        
        return status


def main():
    parser = argparse.ArgumentParser(description="Auto Skill Evolver")
    subparsers = parser.add_subparsers(dest="command", help="命令")
    
    # run 命令
    run_parser = subparsers.add_parser("run", help="运行任务")
    run_parser.add_argument("--skill", required=True, help="Skill名称")
    run_parser.add_argument("--inputs", required=True, help="输入JSON")
    run_parser.add_argument("--expected", help="期望输出")
    
    # create 命令
    create_parser = subparsers.add_parser("create", help="创建新Skill")
    create_parser.add_argument("--name", required=True, help="Skill名称")
    create_parser.add_argument("--description", required=True, help="描述")
    create_parser.add_argument("--triggers", required=True, help="触发词(逗号分隔)")
    create_parser.add_argument("--workflow", required=True, help="工作流步骤(逗号分隔)")
    
    # list 命令
    subparsers.add_parser("list", help="列出所有Skills")
    
    # status 命令
    status_parser = subparsers.add_parser("status", help="查看状态")
    status_parser.add_argument("--skill", help="特定Skill名称")
    
    args = parser.parse_args()
    
    evolver = AutoSkillEvolver()
    
    if args.command == "run":
        inputs = json.loads(args.inputs)
        result = evolver.run_task(args.skill, inputs, args.expected)
        print("\n" + "="*50)
        print("📋 最终结果:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    elif args.command == "create":
        triggers = args.triggers.split(",")
        workflow = args.workflow.split(",")
        result = evolver.create_skill(args.name, args.description, triggers, workflow)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    elif args.command == "list":
        skills = evolver.list_skills()
        print(f"\n📦 共 {len(skills)} 个 Skills:\n")
        for s in skills:
            print(f"  • {s['name']}: {s['description']}")
            
    elif args.command == "status":
        status = evolver.get_status(args.skill)
        print(json.dumps(status, indent=2, ensure_ascii=False))
        
    else:
        parser.print_help()


if __name__ == "__main__":
    main()