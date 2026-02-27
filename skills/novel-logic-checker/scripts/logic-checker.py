#!/usr/bin/env python3
"""
小说逻辑检查器 - 四大维度全面审核
基于内部逻辑、外部逻辑、情节人物逻辑、叙事结构逻辑
"""

import os
import sys
import argparse
from pathlib import Path

WORKSPACE = "/root/.openclaw/workspace"
MEMORY_FILE = os.path.join(WORKSPACE, "MEMORY.md")

class NovelLogicChecker:
    """小说逻辑检查器"""

    def __init__(self, content, chapter_num=0):
        self.content = content
        self.chapter_num = chapter_num
        self.issues = []
        self.scores = {
            "internal": 0,    # 内部逻辑
            "external": 0,    # 外部逻辑
            "plot": 0,        # 情节人物逻辑
            "narrative": 0,   # 叙事结构逻辑
            "xianxia": 0,     # 修真特有
        }

    def check_internal_logic(self):
        """一、内部逻辑：故事世界的自洽性"""
        print("\n" + "=" * 60)
        print("🏗️ 检查内部逻辑：故事世界的自洽性")
        print("=" * 60)

        issues = []

        # 1.1 规则的一致性
        # 检查功法消耗是否统一
        if "噬灵诀" in self.content:
            # 噬灵诀走经脉不走丹田
            if "丹田" in self.content and "经脉" not in self.content:
                issues.append("⚠️ 提到噬灵诀但未强调'走经脉'特点")

            # 杂灵根设定
            if "杂灵根" in self.content:
                if "丹田" in self.content and "破" not in self.content and "损" not in self.content:
                    issues.append("⚠️ 杂灵根设定未提及丹田破损")

        # 1.2 设定的限制
        # 越级战斗代价
        cultivation_levels = [
            ("炼气", 1), ("炼气", 2), ("炼气", 3),
            ("筑基", 1), ("筑基", 2), ("筑基", 3),
            ("金丹", 1), ("金丹", 2), ("金丹", 3),
        ]

        has_cross_level = False
        for level, _ in cultivation_levels:
            count = self.content.count(level)
            if count >= 2:
                has_cross_level = True

        if has_cross_level:
            if "代价" not in self.content and "消耗" not in self.content and "受伤" not in self.content:
                issues.append("⚠️ 存在越级战斗/对比，但未提及其代价")

        # 1.3 社会与文化的合理性
        # 修真势力
        factions = ["血影殿", "御剑宗", "通宝商会", "周家", "太上长老"]
        for faction in factions:
            if faction in self.content:
                # 检查是否有相应的层级描写
                if faction == "御剑宗" and "杂役" not in self.content and "外门" not in self.content and "内门" not in self.content:
                    issues.append(f"⚠️ 提到{faction}但未体现宗门层级体系")

        # 计算得分
        base_score = 10
        for issue in issues:
            if issue.startswith("❌"):
                base_score -= 2
            elif issue.startswith("⚠️"):
                base_score -= 0.5
        self.scores["internal"] = max(0, base_score)

        print(f"得分: {self.scores['internal']:.1f}/10")
        for issue in issues:
            print(f"  {issue}")

        return issues

    def check_external_logic(self):
        """二、外部逻辑：与现实世界的关联"""
        print("\n" + "=" * 60)
        print("🌍 检查外部逻辑：与现实世界的关联")
        print("=" * 60)

        issues = []

        # 2.1 自然科学法则（修真世界可架空，但伤口恢复需合理）
        # 检查伤口描写
        if "受伤" in self.content or "伤口" in self.content or "流血" in self.content:
            # 检查恢复时间
            if "立刻" in self.content or "瞬间" in self.content or "马上" in self.content:
                issues.append("⚠️ 受伤后恢复过快，不符合常理")

            # 检查是否有疗伤描写
            if "金疮药" not in self.content and "疗伤" not in self.content and "丹药" not in self.content:
                issues.append("⚠️ 有受伤描写但无疗伤手段")

        # 2.2 人类行为与心理
        # 情感转变铺垫
        emotional_words = ["愤怒", "悲伤", "恐惧", "欢喜", "仇恨"]
        emotional_changes = [w for w in emotional_words if w in self.content]

        if len(emotional_changes) >= 2:
            # 检查是否有铺垫
            if "因为" not in self.content and "所以" not in self.content and "于是" not in self.content:
                issues.append("⚠️ 存在情感变化，但转变缺少因果铺垫")

        # 2.3 历史与社会常识
        # 货币体系
        if "银子" in self.content or "银两" in self.content or "灵石" in self.content:
            # 检查物价合理性
            if "百两" in self.content or "千金" in self.content:
                if "贵" in self.content or "便宜" in self.content:
                    pass  # 有价格对比，合理
                else:
                    issues.append("⚠️ 提到大额银两但无价格参照，可能不合理")

        # 计算得分
        base_score = 10
        for issue in issues:
            if issue.startswith("❌"):
                base_score -= 2
            elif issue.startswith("⚠️"):
                base_score -= 0.5
        self.scores["external"] = max(0, base_score)

        print(f"得分: {self.scores['external']:.1f}/10")
        for issue in issues:
            print(f"  {issue}")

        return issues

    def check_plot_logic(self):
        """三、情节与人物逻辑：故事推进的动力"""
        print("\n" + "=" * 60)
        print("🎭 检查情节与人物逻辑")
        print("=" * 60)

        issues = []

        # 3.1 人物的动机与成长
        # 检查角色行为动机
        motivation_words = ["为了", "因为", "所以", "必须", "不得不"]
        has_motivation = any(w in self.content for w in motivation_words)

        if not has_motivation:
            issues.append("❌ 角色行为缺少动机描写（缺少'为了'/'因为'等词）")

        # 角色名字
        characters = ["陆沉", "猪", "玄冥", "沈红菱", "赵管事", "周师兄"]
        for char in characters:
            if char in self.content:
                # 检查是否有行为描写
                if char + "说" not in self.content and char + "想" not in self.content and char + "做" not in self.content:
                    issues.append(f"⚠️ 角色{char}出现但缺少行为描写")

        # 3.2 情节的因果链
        # 检查因果关系
        cause_effect = ["于是", "因此", "所以", "导致", "结果"]
        has_cause_effect = any(w in self.content for w in cause_effect)

        # 巧合检查
        coincidence = ["碰巧", "正好", "刚好", "恰好"]
        has_coincidence = any(w in self.content for w in coincidence)

        if has_coincidence:
            issues.append("⚠️ 存在巧合情节，需确保有铺垫或合理解释")

        # 3.3 信息的对称性
        # 角色决策是否基于已知信息
        if "突然" in self.content:
            issues.append("⚠️ '突然'事件较多，需确保逻辑通顺")

        # 计算得分
        base_score = 10
        for issue in issues:
            if issue.startswith("❌"):
                base_score -= 2
            elif issue.startswith("⚠️"):
                base_score -= 0.5
        self.scores["plot"] = max(0, base_score)

        print(f"得分: {self.scores['plot']:.1f}/10")
        for issue in issues:
            print(f"  {issue}")

        return issues

    def check_narrative_logic(self):
        """四、叙事与结构逻辑"""
        print("\n" + "=" * 60)
        print("📖 检查叙事与结构逻辑")
        print("=" * 60)

        issues = []

        # 4.1 时间线的连贯
        time_markers = ["清晨", "上午", "中午", "下午", "傍晚", "夜晚", "当天", "第二天", "三天后"]
        has_time = sum(1 for m in time_markers if m in self.content)

        if has_time == 0:
            issues.append("⚠️ 缺少时间标记，时间线不清晰")

        # 检查时间矛盾
        if "第二天" in self.content and "当天" in self.content:
            # 可能是同一天的不同表述，允许
            pass

        # 4.2 视角的一致性
        # 检查视角跳跃
        if "陆沉" in self.content and "他" in self.content:
            # 允许视角切换，但检查是否混乱
            if self.content.count("陆沉") + self.content.count("他") > 10:
                pass  # 正常密度

        # 4.3 伏笔与呼应
        # 检查开篇与结尾呼应
        if "（第" in self.content and "章完）" in self.content:
            pass  # 有结尾标记

        # 检查是否有遗留伏笔
        if "神秘" in self.content or "秘密" in self.content or "真相" in self.content:
            if "揭示" not in self.content and "发现" not in self.content and "揭晓" not in self.content:
                issues.append("⚠️ 存在悬念/伏笔但本章未揭示，可能需后续回收")

        # 计算得分
        base_score = 10
        for issue in issues:
            if issue.startswith("❌"):
                base_score -= 2
            elif issue.startswith("⚠️"):
                base_score -= 0.5
        self.scores["narrative"] = max(0, base_score)

        print(f"得分: {self.scores['narrative']:.1f}/10")
        for issue in issues:
            print(f"  {issue}")

        return issues

    def check_xianxia_specific(self):
        """修真小说特有检查"""
        print("\n" + "=" * 60)
        print("⚔️ 检查修真小说特有逻辑")
        print("=" * 60)

        issues = []

        # 境界体系
        levels = ["炼气", "筑基", "金丹", "元婴", "化神", "大乘", "渡劫"]
        present_levels = [l for l in levels if l in self.content]

        # 境界实力差距
        if len(present_levels) >= 2:
            # 检查是否有实力差距描写
            if "一层" in self.content or "二层" in self.content or "中期" in self.content:
                pass  # 有具体境界描写

        # 功法体系
        if "噬灵诀" in self.content:
            if "吞噬" not in self.content and "灵气" not in self.content:
                issues.append("⚠️ 提到噬灵诀但未强调其吞噬灵气的特点")

        # 战斗逻辑
        battle_keywords = ["剑气", "灵气", "法术", "法宝", "符箓"]
        has_battle = any(k in self.content for k in battle_keywords)

        if has_battle:
            # 检查消耗
            if "消耗" not in self.content and "耗尽" not in self.content and "灵气不足" not in self.content:
                issues.append("⚠️ 有战斗描写但未提灵气消耗，可能过于轻松")

        # 势力逻辑
        factions = ["血影殿", "御剑宗", "通宝商会", "周家"]
        for faction in factions:
            if faction in self.content:
                if faction == "血影殿":
                    if "暗杀" not in self.content and "阵法" not in self.content and "境外" not in self.content:
                        issues.append("⚠️ 提到血影殿但未体现其特点（暗杀/阵法/境外）")

        # 计算得分
        base_score = 10
        for issue in issues:
            if issue.startswith("❌"):
                base_score -= 2
            elif issue.startswith("⚠️"):
                base_score -= 0.5
        self.scores["xianxia"] = max(0, base_score)

        print(f"得分: {self.scores['xianxia']:.1f}/10")
        for issue in issues:
            print(f"  {issue}")

        return issues

    def calculate_total_score(self):
        """计算总分"""
        weights = {
            "internal": 0.20,
            "external": 0.15,
            "plot": 0.30,
            "narrative": 0.20,
            "xianxia": 0.15,
        }

        total = sum(self.scores[k] * w for k, w in weights.items())
        return total

    def full_check(self, detail=False):
        """全面检查"""
        print("\n" + "=" * 60)
        print(f"📖 开始逻辑检查 - 第{self.chapter_num}章")
        print("=" * 60)

        all_issues = []

        all_issues.extend(self.check_internal_logic())
        all_issues.extend(self.check_external_logic())
        all_issues.extend(self.check_plot_logic())
        all_issues.extend(self.check_narrative_logic())
        all_issues.extend(self.check_xianxia_specific())

        # 计算总分
        total_score = self.calculate_total_score()

        # 输出报告
        print("\n" + "=" * 60)
        print("📊 逻辑检查评分报告")
        print("=" * 60)

        print(f"\n内部逻辑（规则/设定/社会）: {self.scores['internal']:.1f}/10")
        print(f"外部逻辑（科学/心理/常识）: {self.scores['external']:.1f}/10")
        print(f"情节人物逻辑（动机/因果/信息）: {self.scores['plot']:.1f}/10")
        print(f"叙事结构逻辑（时间/视角/伏笔）: {self.scores['narrative']:.1f}/10")
        print(f"修真特有逻辑（境界/功法/战斗）: {self.scores['xianxia']:.1f}/10")

        print(f"\n{'=' * 50}")
        print(f"🎯 总分: {total_score:.1f}/10")
        print(f"{'=' * 50}")

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

        if detail:
            print("\n" + "=" * 60)
            print("📋 详细问题列表")
            print("=" * 60)
            for i, issue in enumerate(all_issues, 1):
                print(f"{i}. {issue}")

        return total_score, all_issues


def main():
    parser = argparse.ArgumentParser(description="小说逻辑检查工具")
    parser.add_argument('--file', type=str, required=True, help='章节文件路径')
    parser.add_argument('--chapter', type=int, default=0, help='章节号')
    parser.add_argument('--detail', action='store_true', help='显示详细问题')
    parser.add_argument('--xianxia-only', action='store_true', help='仅检查修真特有逻辑')

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        return

    with open(args.file, 'r', encoding='utf-8') as f:
        content = f.read()

    checker = NovelLogicChecker(content, args.chapter)

    if args.xianxia_only:
        issues = checker.check_xianxia_specific()
        print(f"\n修真特有逻辑得分: {checker.scores['xianxia']:.1f}/10")
    else:
        checker.full_check(detail=args.detail)


if __name__ == "__main__":
    main()
