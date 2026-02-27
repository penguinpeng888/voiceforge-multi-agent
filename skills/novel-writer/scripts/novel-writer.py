#!/usr/bin/env python3
"""
小说创作自动化脚本
- 自动加载写作技法
- 逻辑检查
- 字数统计
"""

import os
import sys
import json
import argparse
from pathlib import Path

# 路径配置
WORKSPACE = "/root/.openclaw/workspace"
SKILLS_DIR = os.path.join(WORKSPACE, "skills")
NOVEL_DIR = os.path.join(WORKSPACE, "剑起青云")
WRITING_SKILL = os.path.join(SKILLS_DIR, "openclaw-writing-skills/SKILL.md")

def load_writing_skills():
    """加载写作技法 skill"""
    print("=" * 50)
    print("📖 加载写作技法库...")
    print("=" * 50)

    if not os.path.exists(WRITING_SKILL):
        print(f"❌ 错误：找不到写作技法文件 {WRITING_SKILL}")
        return None

    with open(WRITING_SKILL, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"✅ 已加载 openclaw-writing-skills ({len(content)} chars)")
    return content

def check_logic(chapter_content, chapter_num):
    """检查章节逻辑"""
    print("=" * 50)
    print(f"🔍 检查第{chapter_num}章逻辑...")
    print("=" * 50)

    issues = []
    warnings = []

    # 1. 检查战力设定
    # 提取修为相关关键词
    cultivation_levels = ['炼气', '筑基', '金丹', '元婴', '化神', '大乘', '炼体']
    found_levels = []

    for level in cultivation_levels:
        if level in chapter_content:
            # 计算出现次数
            count = chapter_content.count(level)
            found_levels.append((level, count))

    # 2. 检查时间线索
    time_keywords = ['天', '月', '年', '日', '时辰', '清晨', '傍晚', '夜晚', '早上']
    time_found = [kw for kw in time_keywords if kw in chapter_content]

    # 3. 检查因果逻辑
    # 敌人来犯的原因
    cause_keywords = ['找到', '追踪', '追来', '发现', '找到这里']
    has_cause = any(kw in chapter_content for kw in cause_keywords)

    # 主角应战的原因
    action_keywords = ['迎战', '应战', '准备', '等待', '发现敌人']
    has_action = any(kw in chapter_content for kw in action_keywords)

    # 输出检查结果
    print("\n📊 战力设定分析：")
    for level, count in found_levels:
        print(f"   - {level}: {count}次")

    print(f"\n⏰ 时间线索: {time_found if time_found else '❌ 未找到明确时间线索'}")

    print(f"\n🔗 因果逻辑:")
    print(f"   - 敌人来犯原因: {'✅' if has_cause else '❌'}")
    print(f"   - 主角应战原因: {'✅' if has_action else '❌'}")

    # 生成逻辑检查报告
    print("\n" + "=" * 50)
    print("📋 逻辑检查报告")
    print("=" * 50)

    # 常见问题提示
    print("""
⚠️  常见逻辑问题（请自查）：

1. 敌人是如何找到主角的？
   - 需要明确的追踪手段或线索
   - 如果是"找上门"，需要解释为什么能找到地址

2. 主角凭什么能"等待"敌人？
   - 炼气三层如何感知筑基期敌人？
   - 主角有什么情报优势？

3. 越级战斗是否合理？
   - 炼气三层 vs 筑基中期，差距2层
   - 需要弥补因素（法宝、计谋、环境优势、猪的妖力）

4. 战斗结果是否过于轻松？
   - 如果是"惨胜"，需要描写受伤、苦战
   - 如果是"秒杀"，需要解释为什么

5. 伤口愈合时间是否合理？
   - 猪的伤口在本章战斗中愈合了吗？
   - 如果没有，下一章提到时要注意时间线
""")

    return len(issues) == 0

def count_words(file_path):
    """统计字数"""
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 中文字数估算：字符数/2（中文标点也计算）
    chinese_chars = len(content)
    estimated_words = chinese_chars // 2

    print(f"\n📊 字数统计：")
    print(f"   - 文件路径: {file_path}")
    print(f"   - 总字符数: {chinese_chars}")
    print(f"   - 估算中文字数: {estimated_words}")

    return estimated_words

def generate_chapter(chapter_num, title, target_words=4000):
    """生成新章节（模板）"""
    print("=" * 50)
    print(f"📝 生成第{chapter_num}章模板: {title}")
    print("=" * 50)

    # 加载写作技法
    skills = load_writing_skills()
    if not skills:
        print("❌ 无法加载写作技法，跳过生成")
        return

    # 创建章节文件
    chapter_file = os.path.join(NOVEL_DIR, f"第{chapter_num}章-{title}.md")

    # 生成模板
    template = f"""# 第{chapter_num}章：{title}

字数：约{target_words}字

---

## 本章创作检查清单

### 逻辑前置确认
- [ ] 敌人来犯原因：___________
- [ ] 主角应战理由：___________
- [ ] 战力差距弥补因素：___________
- [ ] 时间线：___________

### 写作技法应用
- [ ] 战斗描写：工具箱叙事法/道心境象流/感官轰炸/镜头切换
- [ ] 心理描写：冰山博弈层/孤绝者独白
- [ ] 环境描写：功能性/氛围感/参与度

---

## 正文

（开始写作...）

---

**（第{chapter_num}章完）**

### 本章核心进展：

### 下章预告：
"""

    with open(chapter_file, 'w', encoding='utf-8') as f:
        f.write(template)

    print(f"✅ 已生成章节模板: {chapter_file}")

def main():
    parser = argparse.ArgumentParser(description="小说创作自动化工具")
    parser.add_argument('--chapter', type=int, help='章节号')
    parser.add_argument('--title', type=str, help='章节标题')
    parser.add_argument('--target-words', type=int, default=4000, help='目标字数')
    parser.add_argument('--check', type=str, help='检查已有章节')
    parser.add_argument('--count', type=str, help='统计字数')
    parser.add_argument('--load-skills', action='store_true', help='仅加载写作技法')
    parser.add_argument('--send', type=str, help='发送章节文件给用户（自动以文件形式）')

    args = parser.parse_args()

    if args.load_skills:
        load_writing_skills()
        return

    if args.check:
        check_logic(open(args.check).read(), 0)
        return

    if args.count:
        count_words(args.count)
        return

    if args.send:
        # 自动以文件形式发送章节
        file_path = args.send
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"✅ 已准备好文件: {file_path} ({file_size} bytes)")
            print("请使用 message 工具的 path 参数发送给用户")
        else:
            print(f"❌ 文件不存在: {file_path}")
        return

    if args.chapter and args.title:
        # 先生成章节模板
        generate_chapter(args.chapter, args.title, args.target_words)

        # 然后检查
        chapter_file = os.path.join(NOVEL_DIR, f"第{args.chapter章}-{args.title}.md")
        if os.path.exists(chapter_file):
            # 先引导用户填写逻辑
            print("\n" + "=" * 50)
            print("📝 请先填写逻辑检查清单，然后开始写作")
            print("=" * 50)

            # 加载写作技法供写作时参考
            skills = load_writing_skills()
            if skills:
                print("\n✅ 写作技法已加载，可供写作时参考")
    else:
        print("""
用法示例：

# 加载写作技法
python3 scripts/novel-writer.py --load-skills

# 生成新章节模板
python3 scripts/novel-writer.py --chapter 17 --title "新的战斗" --target-words 4000

# 检查已有章节逻辑
python3 scripts/novel-writer.py --check /path/to/chapter.md

# 统计字数
python3 scripts/novel-writer.py --count /path/to/chapter.md
""")

if __name__ == "__main__":
    main()
