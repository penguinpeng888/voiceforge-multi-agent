#!/usr/bin/env python3
"""
小说创作快捷命令实现
提供：!check、!review、!workflow、!send 命令
"""

import os
import sys
import json
from pathlib import Path

WORKSPACE = "/root/.openclaw/workspace"
NOVEL_DIR = os.path.join(WORKSPACE, "剑起青云")

def get_chapter_file(chapter_num):
    """获取章节文件路径"""
    import glob
    pattern = os.path.join(NOVEL_DIR, f"第{chapter_num}章-*.md")
    files = sorted(glob.glob(pattern))
    if not files:
        return None
    return files[-1]

def cmd_check(chapter_num):
    """运行逻辑检查脚本"""
    chapter_file = get_chapter_file(chapter_num)
    if not chapter_file:
        return f"❌ 未找到第{chapter_num}章文件"
    
    cmd = f"python3 {WORKSPACE}/skills/novel-logic-checker/scripts/logic-checker.py --file '{chapter_file}'"
    os.system(cmd)
    return f"✅ 第{chapter_num}章逻辑检查完成"

def cmd_review(chapter_num, agent="agent:novel-editor:main"):
    """发送审核请求（返回可复制的命令）"""
    chapter_file = get_chapter_file(chapter_num)
    if not chapter_file:
        return f"❌ 未找到第{chapter_num}章文件"
    
    message = f"""请检查第{chapter_num}章的逻辑合理性。

文件路径：{chapter_file}

请按照五大维度检查：
1. 内部逻辑（20%）：规则一致性、设定限制、社会合理性
2. 外部逻辑（20%）：科学法则、人物心理、历史常识
3. 情节人物（25%）：动机、因果链、信息对称性
4. 叙事结构（15%）：时间线、视角、伏笔
5. 修真特有（20%）：境界/功法/战斗/势力

输出要求：
- 五大维度分别评分
- 总分及等级（9分以上可定稿）
- 详细问题列表
- 具体整改建议"""

    cmd = f'''sessions_send(
    sessionKey="{agent}",
    message="""{message}""",
    timeoutSeconds=120
)'''
    return cmd

def cmd_send(chapter_num):
    """发送章节文件（返回可复制的命令）"""
    chapter_file = get_chapter_file(chapter_num)
    if not chapter_file:
        return f"❌ 未找到第{chapter_num}章文件"
    
    cmd = f'''message(
    action="send",
    path="{chapter_file}",
    target="telegram:5826931720"
)'''
    return cmd

def cmd_workflow(chapter_num):
    """工作流命令"""
    lines = [
        f"=== 第{chapter_num}章创作工作流 ===",
        "",
        "1. 先运行逻辑检查：",
        f"   !check {chapter_num}",
        "",
        "2. 再发送审核：",
        f"   !review {chapter_num}",
        "",
        "3. 查看评分，修改章节",
        "",
        "4. 循环直到9分以上",
        "",
        "5. 定稿发送：",
        f"   !send {chapter_num}",
    ]
    return "\n".join(lines)

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return
    
    cmd = sys.argv[1]
    chapter = sys.argv[2]
    
    if cmd == "!check":
        print(cmd_check(chapter))
    elif cmd == "!review":
        print(cmd_review(chapter))
    elif cmd == "!send":
        print(cmd_send(chapter))
    elif cmd == "!workflow":
        print(cmd_workflow(chapter))
    else:
        print(f"❌ 未知命令: {cmd}")

if __name__ == "__main__":
    main()
