#!/usr/bin/env python3
"""
一键自动审核脚本
功能：
1. 运行逻辑检查脚本
2. 调用审核代理
3. 解析评分结果
4. 生成审核报告
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from datetime import datetime

# 路径配置
WORKSPACE = "/root/.openclaw/workspace"
SKILLS_DIR = os.path.join(WORKSPACE, "skills")
NOVEL_DIR = os.path.join(WORKSPACE, "剑起青云")
LOG_FILE = os.path.join(WORKSPACE, "logs", f"review-{datetime.now().strftime('%Y%m%d')}.log")

# 确保日志目录存在
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def log(msg):
    """日志输出"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    prefix = msg.split()[0] if msg else ""
    emoji = {
        "✅": "🟢", "❌": "🔴", "⚠️": "🟡", 
        "📄": "📄", "🔍": "🔍", "📊": "📊",
        "⏳": "⏳", "🚀": "🚀"
    }.get(prefix, "  ")
    log_msg = f"[{timestamp}] {msg}"
    print(f"{emoji} {log_msg}")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_msg + "\n")

def run_logic_checker(chapter_file):
    """运行本地逻辑检查"""
    log(f"🔍 运行逻辑检查脚本: {os.path.basename(chapter_file)}")
    
    checker_script = os.path.join(SKILLS_DIR, "novel-logic-checker/scripts/logic-checker.py")
    if not os.path.exists(checker_script):
        log(f"❌ 找不到检查脚本: {checker_script}")
        return None
    
    # 运行检查
    result = subprocess.run(
        ["python3", checker_script, "--file", chapter_file],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        log("✅ 逻辑检查完成")
        return result.stdout
    else:
        log("❌ 逻辑检查失败")
        log(f"错误: {result.stderr}")
        return None

def get_editor_command(chapter_file, chapter_num):
    """生成审核代理命令"""
    with open(chapter_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    message = f"""请检查第{chapter_num}章的逻辑合理性。

文件路径：{chapter_file}

请按照五大维度检查并评分：
1. 内部逻辑（20%）：规则一致性、设定限制、社会合理性
2. 外部逻辑（20%）：科学法则、人物心理、历史常识
3. 情节人物（25%）：动机、因果链、信息对称性
4. 叙事结构（15%）：时间线、视角、伏笔
5. 修真特有（20%）：境界/功法/战斗/势力

输出格式：
- 五大维度分别评分（小数点后1位）
- **总分：X.X/10**
- **等级：X**
- 主要问题列表（按优先级）
- 整改建议

章节内容概要：
{content[:500]}..."""
    
    command = {
        "sessionKey": "agent:novel-editor:main",
        "message": message,
        "timeoutSeconds": 180
    }
    
    return json.dumps(command, ensure_ascii=False, indent=4)

def parse_score(response_text):
    """从响应文本中解析评分"""
    try:
        lines = response_text.split('\n')
        for line in lines:
            if '总分' in line and '/' in line:
                # 提取数字
                import re
                match = re.search(r'(\d+\.?\d*)/10', line)
                if match:
                    return float(match.group(1))
        return None
    except Exception as e:
        log(f"⚠️ 解析评分失败: {e}")
        return None

def generate_report(chapter_file, logic_result, editor_score, issues):
    """生成审核报告"""
    chapter = os.path.basename(chapter_file).replace('.md', '')
    
    report = f"""
{'='*60}
📊 {chapter} 审核报告
{'='*60}

📄 文件: {chapter_file}

🔍 逻辑检查: {'✅ 通过' if logic_result else '❌ 有问题'}

📊 审核评分: {editor_score}/10 {'✅' if editor_score >= 9 else '⚠️' if editor_score >= 7 else '❌'}

问题列表:
"""
    
    for i, issue in enumerate(issues, 1):
        report += f"{i}. {issue}\n"
    
    report += f"""
{'='*60}
结论: {'✅ 可定稿' if editor_score >= 9 else '⚠️ 需修改' if editor_score >= 7 else '❌ 需大改'}
{'='*60}
"""
    
    return report

def main(chapter_num):
    """主函数"""
    log(f"🚀 开始审核第{chapter_num}章")
    
    # 1. 查找章节文件
    import glob
    pattern = os.path.join(NOVEL_DIR, f"第{chapter_num}章-*.md")
    files = sorted(glob.glob(pattern))
    if not files:
        log(f"❌ 未找到第{chapter_num}章文件: {pattern}")
        return
    
    chapter_file = files[-1]
    log(f"📄 章节文件: {chapter_file}")
    
    # 2. 运行逻辑检查
    logic_result = run_logic_checker(chapter_file)
    
    # 3. 生成审核代理命令
    editor_cmd = get_editor_command(chapter_file, chapter_num)
    
    log("⏳ 审核代理命令已生成")
    log("=" * 60)
    print("\n📤 请复制以下命令到对话中执行：\n")
    print(editor_cmd)
    print("\n" + "=" * 60)
    
    # 4. 提示用户运行
    log("⚠️ 下一步：在对话中粘贴并执行上面的命令")
    log("然后将审核结果粘贴回这里进行分析")

if __name__ == "__main__":
    chapter = sys.argv[1] if len(sys.argv) > 1 else "16"
    main(chapter)
