#!/usr/bin/env python3
"""
MetaAgent - 基于 HyperAgents 的自我改进 Agent
功能：读取代码 → 分析问题 → 生成改进 → 写回文件
"""
import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class MetaAgent:
    """自我改进 Agent"""
    
    def __init__(self, workspace_root: str = "/root/.openclaw/workspace"):
        self.workspace_root = Path(workspace_root)
        self.skills_root = self.workspace_root / "skills"
        
    def forward(self, skill_name: str, feedback: str, eval_data: Dict = None) -> Dict:
        """
        执行自我改进
        
        Args:
            skill_name: Skill 名称
            feedback: 反馈/问题描述
            eval_data: 评估数据（可选）
            
        Returns:
            改进结果 {"success": bool, "files_changed": [...], "message": str}
        """
        skill_path = self.skills_root / skill_name
        
        if not skill_path.exists():
            return {"success": False, "error": f"Skill不存在: {skill_name}"}
        
        # 1. 读取当前代码
        current_files = self._read_skill_files(skill_path)
        
        # 2. 分析问题
        problems = self._analyze_problems(current_files, feedback, eval_data)
        
        # 3. 生成改进方案
        improvements = self._generate_improvements(current_files, problems, feedback)
        
        # 4. 写回文件
        files_changed = self._apply_improvements(skill_path, improvements)
        
        return {
            "success": True,
            "skill_name": skill_name,
            "problems_found": len(problems),
            "files_changed": files_changed,
            "improvements": improvements
        }
    
    def _read_skill_files(self, skill_path: Path) -> Dict[str, str]:
        """读取 Skill 所有文件"""
        files = {}
        
        for ext in ["*.md", "*.py", "*.json", "*.yaml", "*.yml"]:
            for f in skill_path.rglob(ext):
                if f.name.startswith("."):
                    continue
                rel_path = f.relative_to(skill_path)
                try:
                    files[str(rel_path)] = f.read_text(encoding="utf-8")
                except Exception as e:
                    print(f"读取失败 {rel_path}: {e")
                    
        return files
    
    def _analyze_problems(self, files: Dict[str, str], feedback: str, eval_data: Dict) -> List[Dict]:
        """分析问题"""
        problems = []
        
        # 从反馈中提取问题
        feedback_lower = feedback.lower()
        
        # 常见问题模式
        problem_patterns = [
            ("格式错误", r"(格式|format|样式|style)"),
            ("逻辑错误", r"(逻辑|logic|错误|bug|error)"),
            ("缺失功能", r"(缺少|缺失|没有|no).*(功能|feature)"),
            ("性能问题", r"(慢|slow|性能|performance)"),
            ("兼容性", r"(兼容|compat|支持|support)"),
        ]
        
        for problem_type, pattern in problem_patterns:
            if re.search(pattern, feedback_lower):
                problems.append({
                    "type": problem_type,
                    "description": feedback,
                    "severity": "high" if "error" in feedback_lower else "medium"
                })
        
        # 从评估数据中提取问题
        if eval_data:
            if eval_data.get("score", 1.0) < 0.5:
                problems.append({
                    "type": "评估分数低",
                    "description": f"得分: {eval_data.get('score')}",
                    "severity": "high"
                })
                
        return problems
    
    def _generate_improvements(self, files: Dict[str, str], problems: List[Dict], feedback: str) -> Dict[str, str]:
        """生成改进方案"""
        improvements = {}
        
        for problem in problems:
            problem_type = problem["type"]
            
            if problem_type == "格式错误":
                # 检查并修复 Markdown 格式
                for path, content in files.items():
                    if path.endswith(".md"):
                        # 确保有正确的标题格式
                        if not content.startswith("#"):
                            improvements[path] = f"# Skill\n\n{content}"
                            
            elif problem_type == "逻辑错误":
                # 检查 Python 语法
                for path, content in files.items():
                    if path.endswith(".py"):
                        # 简单检查：是否有语法问题标记
                        if "TODO" in content or "FIXME" in content:
                            # 保持原样，反馈给用户
                            pass
                            
            elif problem_type == "评估分数低":
                # 如果是 SKILL.md，添加更详细的说明
                for path, content in files.items():
                    if path == "SKILL.md" or path.endswith("/SKILL.md"):
                        # 添加改进建议
                        improved = content + f"\n\n## 改进日志\n- {problem['description']}\n"
                        improvements[path] = improved
        
        # 如果没有匹配的问题，记录反馈到日志
        if not improvements:
            log_entry = f"\n## 反馈 {len(files) + 1}\n- 问题: {feedback}\n- 时间: {self._get_timestamp()}\n"
            improvements["FEEDBACK_LOG.md"] = log_entry
            
        return improvements
    
    def _apply_improvements(self, skill_path: Path, improvements: Dict[str, str]) -> List[str]:
        """应用改进"""
        changed = []
        
        for rel_path, new_content in improvements.items():
            if rel_path == "FEEDBACK_LOG.md":
                # 特殊处理：追加到反馈日志
                log_file = skill_path / "FEEDBACK_LOG.md"
                if log_file.exists():
                    existing = log_file.read_text(encoding="utf-8")
                    new_content = existing + new_content
            else:
                file_path = skill_path / rel_path
                file_path.parent.mkdir(parents=True, exist_ok=True)
                
            try:
                file_path.write_text(new_content, encoding="utf-8")
                changed.append(str(rel_path))
            except Exception as e:
                print(f"写入失败 {rel_path}: {e}")
                
        return changed
    
    def _get_timestamp(self) -> str:
        """获取当前时间戳"""
        from datetime import datetime
        return datetime.now().isoformat()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="MetaAgent 自我改进")
    parser.add_argument("--skill", required=True, help="Skill名称")
    parser.add_argument("--feedback", required=True, help="反馈/问题描述")
    parser.add_argument("--eval-file", help="评估数据JSON文件")
    
    args = parser.parse_args()
    
    # 加载评估数据
    eval_data = None
    if args.eval_file and os.path.exists(args.eval_file):
        with open(args.eval_file) as f:
            eval_data = json.load(f)
    
    # 执行改进
    agent = MetaAgent()
    result = agent.forward(args.skill, args.feedback, eval_data)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()