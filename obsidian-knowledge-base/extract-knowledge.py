#!/usr/bin/env python3
"""
知识提取器：从网页/文档中提取有价值的内容
"""
import sys
import re
import json
from pathlib import Path

def extract_knowledge(content: str, url: str = "", title: str = "") -> dict:
    """从内容中提取知识"""
    
    # 1. 提取关键概念
    concepts = extract_concepts(content)
    
    # 2. 提取操作步骤
    steps = extract_steps(content)
    
    # 3. 提取配置/参数
    configs = extract_configs(content)
    
    # 4. 提取适用场景
    scenarios = extract_scenarios(content)
    
    # 5. 判断是否可转化为 Skill
    can_skill = len(steps) >= 3 and len(configs) > 0
    
    return {
        "title": title,
        "url": url,
        "concepts": concepts,
        "steps": steps,
        "configs": configs,
        "scenarios": scenarios,
        "can_skill": can_skill,
        "raw_length": len(content)
    }

def extract_concepts(text: str) -> list:
    """提取概念（关键词、技术术语）"""
    # 常见技术术语模式
    patterns = [
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:是|is|指|means)\s+',
        r'([A-Z]{2,})\s+[:：]',  # 缩写如 RAG, API
        r'使用\s+([^。，,\n]+?)\s+实现',
        r'通过\s+([^。，,\n]+?)\s+实现',
    ]
    
    concepts = []
    for p in patterns:
        matches = re.findall(p, text)
        concepts.extend(matches)
    
    # 去重
    return list(set(concepts))[:10]

def extract_steps(text: str) -> list:
    """提取操作步骤"""
    steps = []
    
    # 匹配步骤格式：1. 2. 或 第一步 第二步
    patterns = [
        r'(\d+)[.、]\s*([^。\n]+)',
        r'第([一二三四五六七八九十]+)步[：:]\s*([^。\n]+)',
        r'(首先|然后|接着|最后|下一步)[：:]\s*([^。\n]+)',
    ]
    
    for p in patterns:
        matches = re.findall(p, text)
        for m in matches:
            if isinstance(m, tuple):
                steps.append(' '.join(m).strip())
            else:
                steps.append(m.strip())
    
    return steps[:20]

def extract_configs(text: str) -> dict:
    """提取配置/参数"""
    configs = {}
    
    # 匹配配置格式：- key: value 或 key = value
    patterns = [
        r'[-•]\s*([^\s:：]+)[:：]\s*([^\n]+)',
        r'([^\s:：]+)\s*=\s*([^\n]+)',
        r'配置\s+([^\s:：]+)[:：]\s*([^\n]+)',
    ]
    
    for p in patterns:
        matches = re.findall(p, text)
        for k, v in matches:
            k = k.strip()
            v = v.strip()[:100]  # 限制长度
            if k and v and len(k) < 30:
                configs[k] = v
    
    return configs

def extract_scenarios(text: str) -> list:
    """提取适用场景"""
    scenarios = []
    
    patterns = [
        r'适用于\s+([^。，\n]+)',
        r'适合\s+([^。，\n]+)',
        r'场景[：:]\s*([^\n]+)',
        r'用于\s+([^。，\n]+)',
    ]
    
    for p in patterns:
        matches = re.findall(p, text)
        scenarios.extend([m.strip() for m in matches])
    
    return list(set(scenarios))[:5]

def generate_skill(knowledge: dict) -> str:
    """从知识生成 Skill"""
    if not knowledge['can_skill']:
        return ""
    
    skill = f"""# {knowledge['title'] or '自动生成的 Skill'}

## 描述
{_generate_description(knowledge)}

## 触发条件
{_generate_triggers(knowledge)}

## 工作流
"""
    
    for i, step in enumerate(knowledge['steps'][:10], 1):
        skill += f"{i}. {step}\n"
    
    if knowledge['configs']:
        skill += "\n## 配置参数\n"
        for k, v in knowledge['configs'].items():
            skill += f"- {k}: {v}\n"
    
    if knowledge['scenarios']:
        skill += "\n## 适用场景\n"
        for s in knowledge['scenarios']:
            skill += f"- {s}\n"
    
    skill += "\n## 注意事项\n"
    skill += "- 基于提取的知识生成，可能需要人工验证\n"
    skill += "- 如有问题，请调整原始内容\n"
    
    return skill

def _generate_description(k: dict) -> str:
    """生成描述"""
    concepts = k.get('concepts', [])
    if concepts:
        return f"使用 {', '.join(concepts[:3])} 实现特定功能"
    return "从外部知识提取的技能"

def _generate_triggers(k: dict) -> str:
    """生成触发条件"""
    scenarios = k.get('scenarios', [])
    if scenarios:
        return f"当 {scenarios[0]} 时使用"
    return "需要使用该知识时"

if __name__ == "__main__":
    # 测试
    test_content = """
    Obsidian 知识库搭建指南
    
    1. 安装 Obsidian 应用
    2. 创建新 vault
    3. 安装必要插件：Dataview, Templater
    4. 配置 frontmatter 格式
    5. 设置每日笔记模板
    
    适用场景：个人知识管理、AI 辅助研究
    
    配置：
    - vault_path: 知识库路径
    - template: 笔记模板
    - embedding_model: 本地嵌入模型
    """
    
    result = extract_knowledge(test_content, title="Obsidian AI 知识库")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if result['can_skill']:
        print("\n=== 生成的 Skill ===")
        print(generate_skill(result))