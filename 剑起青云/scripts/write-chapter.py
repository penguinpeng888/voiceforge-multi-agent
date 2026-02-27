#!/usr/bin/env python3
"""
剑起青云 - 章节写作自动化脚本

功能：
1. 读取写作技法 skill（战斗、心理、环境描写）
2. 执行逻辑检查（战力体系、动机合理性、时间线）
3. 统计章节字数
4. 生成符合规范的章节

用法：
    python3 scripts/write-chapter.py --chapter 17 --words 4000
"""

import os
import sys
import json
import argparse
from pathlib import Path

# 路径配置
WORKSPACE = Path("/root/.openclaw/workspace")
NOVEL_DIR = WORKSPACE / "剑起青云"
SKILL_DIR = WORKSPACE / "skills" / "openclaw-writing-skills"

def load_writing_skill():
    """读取写作技法 skill"""
    skill_file = SKILL_DIR / "SKILL.md"
    if skill_file.exists():
        with open(skill_file, 'r', encoding='utf-8') as f:
            return f.read()
    return None

def check_logic(chapter_content, chapter_num):
    """
    执行逻辑检查
    返回: (通过, 问题列表)
    """
    issues = []

    # 检查1：战力体系（炼气三层 vs 高阶修士）
    if "炼气三层" in chapter_content or "炼气三层" in chapter_content:
        if any(f"筑基{i}" in chapter_content or f"炼气{i}" in chapter_content for i in ["四", "五", "六", "七", "八", "九"]):
            # 存在跨级战斗，需要有合理解释
            if not any(keyword in chapter_content for keyword in [
                "偷袭", "地形优势", "法宝", "符箓", "猪的妖力",
                "灵活", "闪避", "技巧", "经脉淬炼术"
            ]):
                issues.append(f"第{chapter_num}章：炼气三层对战高阶修士，需说明取胜方式（偷袭/地形/法宝/技巧等）")

    # 检查2：动机合理性
    # 主角正面迎敌必须有理由
    if any(phrase in chapter_content for phrase in ["正面交锋", "站在门口", "等着他们"]):
        if "赵管事" not in chapter_content and "商量" not in chapter_content and "准备" not in chapter_content:
            issues.append(f"第{chapter_num}章：主角正面迎敌需有准备过程（找赵管事商量/利用地形/设置陷阱）")

    # 检查3：修为感知能力
    # 炼气期无法准确判断筑基期的修为
    if "筑基" in chapter_content:
        # 检查是否有越级感知的情况
        if chapter_content.count("筑基") > chapter_content.count("筑基期") + chapter_content.count("筑基后期"):
            issues.append(f"第{chapter_num}章：炼气期修士无法准确判断筑基期修为，需模糊处理（如'很强'、'气息深不可测'）")

    # 检查4：战斗结果合理性
    if any(word in chapter_content for word in ["秒杀", "轻松取胜", "毫无压力"]):
        if "筑基" in chapter_content and "炼气三层" in chapter_content:
            issues.append(f"第{chapter_num}章：炼气三层秒杀筑基期不符合战力体系，需调整")

    # 检查5：猪的战斗力
    if "猪" in chapter_content and ("战斗" in chapter_content or "打" in chapter_content):
        if "妖王" not in chapter_content and "血脉" not in chapter_content and "妖力" not in chapter_content:
            issues.append(f"第{chapter_num}章：猪（玄冥）的战斗力需说明原因（妖王血脉/三百年前记忆）")

    # 检查6：时间逻辑
    # 深夜/早晨的时间点需要和环境描写匹配
    if "清晨" in chapter_content or "早晨" in chapter_content:
        if not any(word in chapter_content for word in ["天还没亮", "天色微亮", "东方发白", "晨曦", "露水"]):
            issues.append(f"第{chapter_num}章：'清晨'场景需有环境描写衬托")

    # 检查7：周家追踪逻辑
    if "周家" in chapter_content and ("找到" in chapter_content or "追来" in chapter_content):
        if not any(keyword in chapter_content for keyword in ["探子", "打听", "线索", "有人告密", "气息感应"]):
            issues.append(f"第{chapter_num}章：周家找到主角需有追踪过程（探子/打听/气息感应）")

    return len(issues) == 0, issues

def count_words(chapter_content):
    """统计中文字数"""
    # 去掉标题、标注等非正文内容
    lines = chapter_content.split('\n')
    content_lines = []
    in_body = False

    for line in lines:
        if line.startswith('---') or line.startswith('字数：'):
            continue
        if line.startswith('##'):
            continue
        if line.startswith('###'):
            continue
        if line.startswith('**（第') and line.endswith('完）**'):
            continue
        if in_body:
            content_lines.append(line)
        if "---" in line:
            in_body = True

    body = '\n'.join(content_lines)
    # 估算：中文字符数 / 2 （因为中文2字节）
    char_count = len(body.encode('utf-8'))
    word_count = char_count // 3  # 约等于中文字数
    return word_count

def generate_chapter_prompt(chapter_num, target_words, skill_content):
    """生成章节写作 prompt"""
    prompt = f"""
请根据以下信息创作《剑起青云》第{chapter_num}章：

## 创作要求

**目标字数**：{target_words}字

**当前设定**：
- 主角陆沉：炼气三层修为，杂灵根，修炼噬灵诀+经脉淬炼术
- 玄冥（猪）：妖王，附身黑风猪，三百年前被血影殿所害
- 沈红菱：通宝商会大小姐，与陆沉双箭头
- 当前地点：青石镇通宝商会小院

**战力体系规则**：
- 炼气期每层差距约30%战力
- 筑基期压制炼气期约10倍
- 炼气三层不可能正面击败筑基期，需靠技巧/地形/法宝/偷袭

**写作技法**（请务必应用）：
{skill_content[:2000] if skill_content else '请使用战斗描写技法：工具箱叙事法、感官轰炸、镜头切换、发牌理论'}

## 本章需要避免的逻辑错误
1. 越级战斗需说明取胜方式
2. 正面迎敌需有准备过程
3. 不要让炼气期准确判断筑基期修为
4. 猪的战斗力需说明原因
5. 追踪过程需有合理铺垫

请创作完整的第{chapter_num}章，包含：
- 清晰的场景描写
- 合理的人物行为动机
- 符合战力体系的战斗
- 充足的心理描写
"""
    return prompt

def main():
    parser = argparse.ArgumentParser(description='剑起青云章节写作工具')
    parser.add_argument('--chapter', type=int, required=True, help='章节号')
    parser.add_argument('--words', type=int, default=4000, help='目标字数')
    parser.add_argument('--check', action='store_true', help='仅检查已有章节')
    parser.add_argument('--file', type=str, help='检查指定文件')
    args = parser.parse_args()

    print(f"\n{'='*50}")
    print(f"《剑起青云》- 第{args.chapter}章写作工具")
    print(f"{'='*50}\n")

    # 1. 读取写作技法
    print("📖 加载写作技法 skill...")
    skill_content = load_writing_skill()
    if skill_content:
        print(f"   ✅ 已加载 openclaw-writing-skills ({len(skill_content)}字)")
    else:
        print("   ⚠️ 未找到写作技法 skill")

    if args.check:
        # 仅检查模式
        if args.file:
            file_path = NOVEL_DIR / args.file
        else:
            file_path = NOVEL_DIR / f"第{args.chapter}章-正面交锋.md"

        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            word_count = count_words(content)
            print(f"\n📊 字数统计：约 {word_count} 字")

            passed, issues = check_logic(content, args.chapter)
            print(f"\n🔍 逻辑检查：{'✅ 通过' if passed else '❌ 发现问题'}")

            for issue in issues:
                print(f"   - {issue}")
        else:
            print(f"   ❌ 文件不存在：{file_path}")
        return

    # 生成写作 prompt
    print(f"\n📝 生成第{args.chapter}章写作提示...")
    prompt = generate_chapter_prompt(args.chapter, args.words, skill_content)
    print(f"\n{'='*50}")
    print("写作提示已生成（请复制到AI对话中使用）：")
    print(f"{'='*50}\n")
    print(prompt)

if __name__ == "__main__":
    main()
