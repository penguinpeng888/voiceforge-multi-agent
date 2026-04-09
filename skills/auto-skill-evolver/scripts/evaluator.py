#!/usr/bin/env python3
"""
Evaluator - 任务评估器
功能：执行任务 → 评估结果 → 记录反馈 → 触发 MetaAgent
"""
import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

class Evaluator:
    """任务评估器"""
    
    def __init__(self, workspace_root: str = "/root/.openclaw/workspace"):
        self.workspace_root = Path(workspace_root)
        self.evals_dir = self.workspace_root / "memory" / "evaluations"
        self.evals_dir.mkdir(parents=True, exist_ok=True)
        
    def evaluate(self, skill_name: str, inputs: Dict, expected: Any = None, 
                 test_func: str = None) -> Dict:
        """
        评估任务执行结果
        
        Args:
            skill_name: Skill 名称
            inputs: 输入数据
            expected: 期望输出（可选）
            test_func: 测试函数名（可选）
            
        Returns:
            评估结果
        """
        # 1. 执行 Skill
        result = self._execute_skill(skill_name, inputs)
        
        # 2. 计算分数
        score = self._calculate_score(result, expected, test_func)
        
        # 3. 生成反馈
        feedback = self._generate_feedback(result, score, expected)
        
        # 4. 记录评估
        eval_record = {
            "id": f"eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "skill_name": skill_name,
            "timestamp": datetime.now().isoformat(),
            "inputs": inputs,
            "output": result.get("output"),
            "score": score,
            "feedback": feedback,
            "success": score >= 0.7
        }
        
        self._save_evaluation(eval_record)
        
        return eval_record
    
    def _execute_skill(self, skill_name: str, inputs: Dict) -> Dict:
        """执行 Skill"""
        skill_path = self.workspace_root / "skills" / skill_name
        
        if not skill_path.exists():
            return {"error": f"Skill不存在: {skill_name}", "output": None}
        
        # 检查是否有执行脚本
        scripts_dir = skill_path / "scripts"
        main_script = None
        
        if scripts_dir.exists():
            for f in scripts_dir.glob("*.py"):
                if f.stem in ["main", "run", skill_name.replace("-", "_")]:
                    main_script = f
                    break
        
        if not main_script:
            # 尝试 SKILL.md 中的工作流
            skill_md = skill_path / "SKILL.md"
            if skill_md.exists():
                content = skill_md.read_text()
                # 提取工作流步骤
                return {"output": f"SKILL.md 工作流模式: {skill_name}", "steps": []}
            
            return {"error": "无可执行脚本", "output": None}
        
        try:
            # 执行脚本
            result = subprocess.run(
                ["python3", str(main_script), json.dumps(inputs)],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return {
                "output": result.stdout,
                "error": result.stderr if result.returncode != 0 else None,
                "returncode": result.returncode
            }
        except Exception as e:
            return {"error": str(e), "output": None}
    
    def _calculate_score(self, result: Dict, expected: Any, test_func: str) -> float:
        """计算评估分数"""
        # 基础分数：执行成功
        if result.get("error"):
            return 0.0
        
        if result.get("returncode", 0) != 0:
            return 0.0
        
        score = 0.8  # 基础分数
        
        # 如果有期望输出，进行匹配
        if expected is not None:
            output = result.get("output", "")
            if isinstance(expected, str):
                if expected in output:
                    score = 1.0
                elif any(word in output for word in expected.split()):
                    score = 0.7
            elif isinstance(expected, dict):
                # 检查关键字段
                match_count = sum(1 for k, v in expected.items() if str(v) in str(output))
                score = match_count / len(expected) if expected else 0.8
        
        return min(score, 1.0)
    
    def _generate_feedback(self, result: Dict, score: float, expected: Any) -> str:
        """生成反馈"""
        if score >= 0.9:
            return "执行成功，结果优秀"
        elif score >= 0.7:
            return "执行成功，结果可接受"
        elif score >= 0.5:
            return "执行完成，但结果不理想"
        else:
            error = result.get("error", "未知错误")
            return f"执行失败: {error}"
    
    def _save_evaluation(self, eval_record: Dict):
        """保存评估记录"""
        skill_name = eval_record["skill_name"]
        eval_file = self.evals_dir / f"{skill_name}_evaluations.json"
        
        # 读取现有记录
        evaluations = []
        if eval_file.exists():
            with open(eval_file) as f:
                evaluations = json.load(f)
        
        # 添加新记录
        evaluations.append(eval_record)
        
        # 保持最近 100 条
        evaluations = evaluations[-100:]
        
        # 保存
        with open(eval_file, "w") as f:
            json.dump(evaluations, f, indent=2, ensure_ascii=False)
    
    def get_history(self, skill_name: str = None) -> List[Dict]:
        """获取评估历史"""
        if skill_name:
            eval_file = self.evals_dir / f"{skill_name}_evaluations.json"
            if eval_file.exists():
                with open(eval_file) as f:
                    return json.load(f)
            return []
        else:
            # 返回所有评估
            all_evals = []
            for f in self.evals_dir.glob("*_evaluations.json"):
                with open(f) as fp:
                    all_evals.extend(json.load(fp))
            return sorted(all_evals, key=lambda x: x["timestamp"], reverse=True)
    
    def should_trigger_meta(self, skill_name: str, threshold: float = 0.5) -> bool:
        """检查是否需要触发 MetaAgent"""
        history = self.get_history(skill_name)
        
        if not history:
            return False
        
        # 检查最近 N 次评估
        recent = history[:5]
        low_scores = sum(1 for e in recent if e["score"] < threshold)
        
        # 连续 2 次低分或 5 次中有 3 次低分
        return low_scores >= 2


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluator 任务评估")
    parser.add_argument("--skill", required=True, help="Skill名称")
    parser.add_argument("--inputs", required=True, help="输入JSON")
    parser.add_argument("--expected", help="期望输出")
    
    args = parser.parse_args()
    
    inputs = json.loads(args.inputs)
    
    evaluator = Evaluator()
    result = evaluator.evaluate(args.skill, inputs, args.expected)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # 检查是否需要触发 MetaAgent
    if evaluator.should_trigger_meta(args.skill):
        print(f"\n⚠️ 建议触发 MetaAgent 改进 {args.skill}")


if __name__ == "__main__":
    main()