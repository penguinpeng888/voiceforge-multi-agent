#!/usr/bin/env python3
"""
小说审核代理自动化脚本
- 结构合理性检查
- 书写规范性检查
- 描写生动性检查
- 符合性检查
- 评分机制
"""

import os
import sys
import json
import argparse
from pathlib import Path

WORKSPACE = "/root/.openclaw/workspace"
NOVEL_DIR = os.path.join(WORKSPACE, "剑起青云")
MEMORY_FILE = os.path.join(WORKSPACE, "MEMORY.md")

def check_structure(content):
    """检查结构合理性"""
    print("=" * 50)
    print("📐 检查结构合理性...")
    print("=" * 50)

    issues = []
    scores = {"structure": 0, "writing": 0, "description": 0, "consistency": 0}

    # 1. 检查是否有章节开头
    if not content.startswith("# 第"):
        issues.append("❌ 缺少章节标题（应以 # 第X章 开头）")

    # 2. 检查是否有章节结尾
    if "（第" not in content or "章完）" not in content:
        issues.append("❌ 缺少章节结尾标记（应包含 （第X章完））")

    # 3. 检查是否有核心进展列表
    if "核心进展" not in content and "本章" not in content:
        issues.append("⚠️ 缺少本章核心进展总结")

    # 4. 检查是否有下章预告
    if "下章" not in content and "预告" not in content:
        issues.append("⚠️ 缺少下章预告")

    # 5. 检查段落长度
    paragraphs = content.split("\n\n")
    long_paragraphs = [p for p in paragraphs if len(p) > 500]
    if long_paragraphs:
        issues.append(f"⚠️ 有{len(long_paragraphs)}个段落超过500字，建议拆分")

    # 计算结构分
    base_score = 10
    for issue in issues:
        if issue.startswith("❌"):
            base_score -= 1
        elif issue.startswith("⚠️"):
            base_score -= 0.3
    scores["structure"] = max(0, base_score)

    print(f"结构得分: {scores['structure']:.1f}/10")
    for issue in issues:
        print(f"  {issue}")

    return scores, issues

def check_writing(content):
    """检查书写规范性"""
    print("\n" + "=" * 50)
    print("📝 检查书写规范性...")
    print("=" * 50)

    issues = []
    scores = {}

    # 1. 检查滥用副词
    adverb_count = content.count("非常") + content.count("极其") + content.count("非常") + content.count("十分")
    if adverb_count > 3:
        issues.append(f"⚠️ 副词使用过多（{adverb_count}次），建议用具体描写替代")

    # 2. 检查重复用词
    words = content.split()
    word_freq = {}
    for word in words:
        if len(word) >= 3:
            word_freq[word] = word_freq.get(word, 0) + 1

    repeated = [(w, c) for w, c in word_freq.items() if c > 5]
    if repeated:
        issues.append(f"⚠️ 重复用词: {repeated[:3]}")

    # 3. 检查对话格式
    if '""' in content:
        issues.append("❌ 使用了英文引号，应使用中文引号「」或""")

    # 4. 检查省略号
    if "..." in content:
        issues.append("❌ 使用了英文省略号，应使用中文省略号……")

    # 计算书写分
    base_score = 10
    for issue in issues:
        if issue.startswith("❌"):
            base_score -= 1
        elif issue.startswith("⚠️"):
            base_score -= 0.2
    scores["writing"] = max(0, base_score)

    print(f"书写得分: {scores['writing']:.1f}/10")
    for issue in issues:
        print(f"  {issue}")

    return scores, issues

def check_description(content):
    """检查描写生动性"""
    print("\n" + "=" * 50)
    print("🎨 检查描写生动性...")
    print("=" * 50)

    issues = []
    scores = {}

    # 1. 检查战斗描写
    battle_keywords = ["战斗", "交手", "出剑", "刺出", "躲闪", "横扫", "劈砍", "剑气"]
    has_battle = any(kw in content for kw in battle_keywords)

    if has_battle:
        # 检查是否有感官描写
        sensory_keywords = ["声音", "光线", "震荡", "血腥味", "汗水", "疼痛", "爆鸣"]
        has_sensory = any(kw in content for kw in sensory_keywords)
        if not has_sensory:
            issues.append("⚠️ 战斗场面缺少感官描写（声音、光线、震荡等）")

        # 检查是否有镜头切换
        has_shot_change = "远景" in content or "近景" in content or "特写" in content or "十丈" in content
        if not has_shot_change:
            issues.append("⚠️ 战斗场面缺少镜头切换描写（距离感、视角变化）")

    # 2. 检查环境描写
    env_keywords = ["阳光", "月光", "风", "树", "院子", "小院", "槐树"]
    has_env = any(kw in content for kw in env_keywords)

    if has_env:
        # 检查是否有功能性
        if "小院" in content and "门口" not in content and "大门" not in content:
            issues.append("⚠️ 环境描写缺乏功能性（没有交代地点特征）")

        # 检查是否有氛围感
        emotion_words = ["温暖", "阴冷", "明亮", "昏暗", "凄凉", "静谧"]
        has_emotion = any(kw in content for kw in emotion_words)
        if not has_emotion:
            issues.append("⚠️ 环境描写缺乏氛围感（没有情绪色彩）")

    # 3. 检查心理描写
    mind_keywords = ["心想", "想到", "感觉", "仿佛", "心里", "眼神"]
    has_mind = any(kw in content for kw in mind_keywords)

    if has_mind:
        # 检查是否有内心独白
        internal_monologue = "，" in content and ("陆沉" in content or "他" in content)
        if not internal_monologue:
            issues.append("⚠️ 心理描写缺乏内心独白（缺少内心活动）")

    # 计算描写分
    base_score = 10
    for issue in issues:
        if issue.startswith("❌"):
            base_score -= 1
        elif issue.startswith("⚠️"):
            base_score -= 0.5
    scores["description"] = max(0, base_score)

    print(f"描写得分: {scores['description']:.1f}/10")
    for issue in issues:
        print(f"  {issue}")

    return scores, issues

def check_consistency(content):
    """检查符合性（与大纲一致）"""
    print("\n" + "=" * 50)
    print("✅ 检查符合性...")
    print("=" * 50)

    issues = []
    scores = {}

    # 1. 读取大纲
    try:
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            memory_content = f.read()
    except FileNotFoundError:
        issues.append("❌ 找不到 MEMORY.md，无法检查符合性")
        scores["consistency"] = 0
        return scores, issues

    # 2. 提取主角境界
    import re

    # 检查本章提到的境界
    current_levels = []
    if "炼气" in content and "一层" in content:
        current_levels.append("炼气一层")
    if "炼气" in content and "二层" in content:
        current_levels.append("炼气二层")
    if "炼气" in content and "三层" in content:
        current_levels.append("炼气三层")
    if "筑基" in content and "一层" in content:
        current_levels.append("筑基一层")

    # 检查MEMORY中记录的境界
    memory_levels = []
    if "炼气三层" in memory_content:
        memory_levels.append("炼气三层")
    if "筑基一层" in memory_content:
        memory_levels.append("筑基一层")

    print(f"本章境界: {current_levels}")
    print(f"大纲境界: {memory_levels}")

    # 3. 检查境界是否矛盾
    # 如果MEMORY说主角是炼气三层，本章不能出现筑基
    if "筑基一层" in memory_levels and ("筑基" in content and "一层" not in content):
        issues.append("⚠️ 境界与大纲可能不符（大纲记录筑基一层，本章未明确）")

    # 4. 检查人物是否一致
    main_chars = ["陆沉", "猪", "玄冥", "沈红菱", "赵管事", "周师兄"]
    for char in main_chars:
        if char in memory_content and char not in content:
            issues.append(f"⚠️ 重要人物 {char} 在大纲中出现但本章未提及")

    # 5. 检查时间线
    time_markers = ["清晨", "傍晚", "夜晚", "当天", "第二天"]
    has_time = any(m in content for m in time_markers)
    if not has_time:
        issues.append("⚠️ 缺少时间标记（清晨/傍晚/夜晚等）")

    # 计算符合性分
    base_score = 10
    for issue in issues:
        if issue.startswith("❌"):
            base_score -= 2
        elif issue.startswith("⚠️"):
            base_score -= 0.3
    scores["consistency"] = max(0, base_score)

    print(f"符合性得分: {scores['consistency']:.1f}/10")
    for issue in issues:
        print(f"  {issue}")

    return scores, issues

def calculate_total_score(scores):
    """计算总分"""
    weights = {
        "structure": 0.25,
        "writing": 0.20,
        "description": 0.30,
        "consistency": 0.25
    }

    total = 0
    for key, weight in weights.items():
        if key in scores:
            total += scores[key] * weight

    return total

def main():
    parser = argparse.ArgumentParser(description="小说审核工具")
    parser.add_argument('--file', type=str, required=True, help='章节文件路径')
    parser.add_argument('--chapter', type=int, help='章节号（用于显示）')

    args = parser.parse_args()

    # 读取章节内容
    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        return

    with open(args.file, 'r', encoding='utf-8') as f:
        content = f.read()

    print("\n" + "=" * 60)
    print(f"📖 开始审核第{args.chapter if args.chapter else ''}章")
    print("=" * 60)

    # 执行各项检查
    all_scores = {}
    all_issues = []

    scores, issues = check_structure(content)
    all_scores.update(scores)
    all_issues.extend([f"[结构] {i}" for i in issues])

    scores, issues = check_writing(content)
    all_scores.update(scores)
    all_issues.extend([f"[书写] {i}" for i in issues])

    scores, issues = check_description(content)
    all_scores.update(scores)
    all_issues.extend([f"[描写] {i}" for i in issues])

    scores, issues = check_consistency(content)
    all_scores.update(scores)
    all_issues.extend([f"[符合] {i}" for i in issues])

    # 计算总分
    total_score = calculate_total_score(all_scores)

    # 输出最终报告
    print("\n" + "=" * 60)
    print("📊 最终评分报告")
    print("=" * 60)

    print(f"\n结构合理性: {all_scores.get('structure', 0):.1f}/10")
    print(f"书写规范性: {all_scores.get('writing', 0):.1f}/10")
    print(f"描写生动性: {all_scores.get('description', 0):.1f}/10")
    print(f"符合性检查: {all_scores.get('consistency', 0):.1f}/10")

    print(f"\n{'=' * 40}")
    print(f"🎯 总分: {total_score:.1f}/10")
    print(f"{'=' * 40}")

    # 评分等级
    if total_score >= 9.0:
        print("✅ 优秀，可定稿")
    elif total_score >= 8.0:
        print("🟡 良好，稍作修改即可")
    elif total_score >= 7.0:
        print("🟠 一般，需要修改")
    elif total_score >= 6.0:
        print("🔴 及格，需要大改")
    else:
        print("❌ 不及格，需重写")

    print("\n" + "=" * 60)
    print("📋 详细问题列表")
    print("=" * 60)
    for i, issue in enumerate(all_issues, 1):
        print(f"{i}. {issue}")

    print("\n" + "=" * 60)
    print("💡 整改建议")
    print("=" * 60)
    print("""
1. 先解决标记为 ❌ 的问题（扣分最多）
2. 再解决标记为 ⚠️ 的问题（扣分较少）
3. 确保总分达到9.0以上才能定稿
4. 修改后重新运行审核
""")

if __name__ == "__main__":
    main()
