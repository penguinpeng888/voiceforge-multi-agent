#!/usr/bin/env python3
"""
剧情图谱管理器
管理：剧情线、人物关系、伏笔追踪、时间线
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# 图谱根目录
ATLAS_DIR = Path(__file__).parent.parent / "atlas"
ATLAS_FILE = ATLAS_DIR / "PLOT_ATLAS.md"


class AtlasManager:
    """图谱管理器"""
    
    def __init__(self):
        self.data = self._load_atlas()
    
    def _load_atlas(self) -> Dict:
        """加载图谱数据"""
        # 从PLOT_ATLAS.md读取，或使用默认数据
        default_data = self._get_default_data()
        
        if ATLAS_FILE.exists():
            # 尝试从文件读取JSON部分
            try:
                with open(ATLAS_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # 提取JSON部分（如果有）
                    if "```json" in content:
                        start = content.find("```json") + 7
                        end = content.find("```", start)
                        json_str = content[start:end].strip()
                        return json.loads(json_str)
            except:
                pass
        
        return default_data
    
    def _get_default_data(self) -> Dict:
        """获取默认图谱数据"""
        return {
            "剧情线": {
                "主线": {
                    "id": "main-001",
                    "title": "陆沉复仇记",
                    "description": "杂灵根少年陆沉为父报仇，踏上修仙之路",
                    "status": "进行中",
                    "current_phase": "逃亡期",
                    "chapters": ["第1章-第18章"],
                    "next_goals": ["突破筑基期", "找到《噬灵》原书"],
                    "milestones": [
                        {"chapter": "第4章", "event": "发现父亲死因", "status": "completed"},
                        {"chapter": "第9章", "event": "知道祖父还活着", "status": "completed"},
                        {"chapter": "第18章", "event": "反杀筑基期追兵", "status": "completed"}
                    ]
                },
                "支线": [
                    {
                        "id": "subplot-001",
                        "title": "猪的身份之谜",
                        "description": "猪的真实身份是三百年前的妖王玄冥",
                        "status": "进行中",
                        "chapters": ["第4章-第18章"],
                        "current_phase": "记忆部分恢复",
                        "pending_revelations": ["完整记忆", "妖王往事", "与血影殿的恩怨"]
                    },
                    {
                        "id": "subplot-002",
                        "title": "沈红菱感情线",
                        "description": "陆沉与沈红菱的感情发展",
                        "status": "进行中",
                        "chapters": ["第2章-第17章"],
                        "current_phase": "告白准备",
                        "milestones": [
                            {"chapter": "第2章", "event": "初见", "status": "completed"},
                            {"chapter": "第7章", "event": "合作查案", "status": "completed"},
                            {"chapter": "第17章", "event": "沈红菱来访", "status": "completed"}
                        ]
                    },
                    {
                        "id": "subplot-003",
                        "title": "祖父下落",
                        "description": "陆景行重伤远遁，寻找突破元婴的机缘",
                        "status": "伏笔",
                        "chapters": ["第17章"],
                        "current_knowledge": "金丹巅峰，重伤遁走",
                        "pending_revelations": ["祖父的位置", "能否突破元婴", "与陆沉重逢"]
                    },
                    {
                        "id": "subplot-004",
                        "title": "《噬灵》原书",
                        "description": "陆家祖传功法的完整版",
                        "status": "伏笔",
                        "chapters": ["第3章-第17章"],
                        "current_knowledge": "老苟说在陆家",
                        "pending_revelations": ["是否真的在陆家", "能否找到", "与简化版有何不同"]
                    }
                ]
            },
            "人物关系": {
                "陆沉": {
                    "修为": "炼气五层",
                    "关系": {
                        "猪": {"关系": "伙伴", "状态": "深厚"},
                        "沈红菱": {"关系": "双箭头", "状态": "未告白"},
                        "老苟": {"关系": "恩人", "状态": "在御剑宗"},
                        "周师兄": {"关系": "敌人", "状态": "追杀中"},
                        "血影殿": {"关系": "灭族仇人", "状态": "必杀"}
                    }
                },
                "猪": {
                    "身份": "妖王玄冥",
                    "记忆状态": "部分恢复",
                    "关系": {
                        "陆沉": {"关系": "伙伴", "状态": "誓死追随"},
                        "周家": {"关系": "仇人", "状态": "三百年前追杀"}
                    }
                },
                "沈红菱": {
                    "身份": "通宝商会会长之女",
                    "修为": "炼气五层",
                    "关系": {
                        "陆沉": {"关系": "心上人", "状态": "单方面告白准备"}
                    }
                },
                "周师兄": {
                    "身份": "周家嫡子",
                    "修为": "筑基后期",
                    "关系": {
                        "陆沉": {"关系": "追杀目标", "状态": "必杀"}
                    }
                }
            },
            "伏笔列表": [
                {
                    "id": "foresight-001",
                    "伏笔": "陆家戒指",
                    "首次出现": "第3章",
                    "描述": "陆家祖传戒指，内有小型阵法",
                    "当前状态": "已取回",
                    "回收计划": "指引找到《噬灵》原书"
                },
                {
                    "id": "foresight-002",
                    "伏笔": "祖父陆景行",
                    "首次出现": "第8章",
                    "描述": "金丹巅峰，被血影殿所伤，远遁他乡",
                    "当前状态": "存活",
                    "回收计划": "第X章与祖父重逢"
                },
                {
                    "id": "foresight-003",
                    "伏笔": "《噬灵》原书",
                    "首次出现": "第10章",
                    "描述": "陆家老族长所写，原版下落不明",
                    "当前状态": "待寻找",
                    "回收计划": "第X章找到并修炼"
                },
                {
                    "id": "foresight-004",
                    "伏笔": "猪的完整记忆",
                    "首次出现": "第4章",
                    "描述": "猪的真实身份是三百年前妖王玄冥",
                    "当前状态": "部分恢复",
                    "回收计划": "第X章完全恢复记忆"
                },
                {
                    "id": "foresight-005",
                    "伏笔": "月白裳女人",
                    "首次出现": "第5章",
                    "描述": "改变陆沉命运的神秘人物",
                    "当前状态": "未揭示",
                    "回收计划": "第X章揭示身份"
                }
            ],
            "时间线": [
                {
                    "时间点": "十七年前",
                    "事件": "陆家被灭门",
                    "参与者": "陆天行、雅儿、血影殿、周家"
                },
                {
                    "时间点": "十二年前",
                    "事件": "猪被周家追杀",
                    "参与者": "猪(玄冥)、周家"
                },
                {
                    "时间点": "三个月前",
                    "事件": "陆沉被老苟救下",
                    "参与者": "陆沉、老苟"
                },
                {
                    "时间点": "约一个月前",
                    "事件": "陆沉离开御剑宗",
                    "参与者": "陆沉、猪、老苟"
                },
                {
                    "时间点": "半个月前",
                    "事件": "抵达清溪镇",
                    "参与者": "陆沉、猪、赵管事"
                },
                {
                    "时间点": "十五天前",
                    "事件": "周家追兵第一次来袭",
                    "参与者": "陆沉、猪、五个炼气追兵"
                },
                {
                    "时间点": "现在",
                    "事件": "万妖岭修炼，反杀筑基期追兵",
                    "参与者": "陆沉、猪"
                }
            ]
        }
    
    # ==================== 剧情线 ====================
    
    def get_plot(self) -> Dict:
        """获取剧情线"""
        return self.data.get("剧情线", {})
    
    def get_main_plot(self) -> Dict:
        """获取主线"""
        return self.data.get("剧情线", {}).get("主线", {})
    
    def get_subplots(self) -> List[Dict]:
        """获取支线"""
        return self.data.get("剧情线", {}).get("支线", [])
    
    def update_main_milestone(self, chapter: str, event: str, status: str = "completed"):
        """更新主线里程碑"""
        main = self.data["剧情线"]["主线"]
        for m in main.get("milestones", []):
            if m.get("chapter") == chapter:
                m["event"] = event
                m["status"] = status
                return True
        return False
    
    # ==================== 人物关系 ====================
    
    def get_characters(self) -> Dict:
        """获取人物关系"""
        return self.data.get("人物关系", {})
    
    def get_character(self, name: str) -> Optional[Dict]:
        """获取特定人物"""
        return self.data.get("人物关系", {}).get(name)
    
    def get_relationships(self, character: str) -> Dict:
        """获取某人物的所有关系"""
        char = self.get_character(character)
        return char.get("关系", {}) if char else {}
    
    # ==================== 伏笔追踪 ====================
    
    def get_foresights(self) -> List[Dict]:
        """获取伏笔列表"""
        return self.data.get("伏笔列表", [])
    
    def get_foresight(self, foresight_id: str) -> Optional[Dict]:
        """获取特定伏笔"""
        for f in self.data.get("伏笔列表", []):
            if f.get("id") == foresight_id:
                return f
        return None
    
    def get_foresights_by_status(self, status: str) -> List[Dict]:
        """按状态获取伏笔"""
        return [f for f in self.data.get("伏笔列表", []) 
                if f.get("当前状态") == status]
    
    def add_foresight(self, title: str, chapter: str, description: str):
        """添加伏笔"""
        new_id = f"foresight-{len(self.data.get('伏笔列表', [])) + 1:03d}"
        new_foresight = {
            "id": new_id,
            "伏笔": title,
            "首次出现": chapter,
            "描述": description,
            "当前状态": "待揭示",
            "回收计划": ""
        }
        self.data.setdefault("伏笔列表", []).append(new_foresight)
        return new_foresight
    
    def update_foresight_status(self, foresight_id: str, status: str):
        """更新伏笔状态"""
        for f in self.data.get("伏笔列表", []):
            if f.get("id") == foresight_id:
                f["当前状态"] = status
                return True
        return False
    
    # ==================== 时间线 ====================
    
    def get_timeline(self) -> List[Dict]:
        """获取时间线"""
        return self.data.get("时间线", [])
    
    def add_timeline_event(self, time_point: str, event: str, participants: List[str]):
        """添加时间线事件"""
        new_event = {
            "时间点": time_point,
            "事件": event,
            "参与者": ", ".join(participants)
        }
        self.data.setdefault("时间线", []).append(new_event)
        return new_event
    
    # ==================== 导出和保存 ====================
    
    def save(self):
        """保存图谱"""
        with open(ATLAS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def export_markdown(self) -> str:
        """导出为Markdown格式"""
        md = "# 剑起青云 - 剧情图谱\n\n"
        md += f"最后更新: {datetime.now().strftime('%Y-%m-%d')}\n\n"
        
        # 剧情线
        md += "## 剧情线\n\n"
        main = self.get_main_plot()
        md += f"### 主线：{main.get('title', '')}\n"
        md += f"- 当前阶段：{main.get('current_phase', '')}\n"
        md += f"- 章节：{', '.join(main.get('chapters', []))}\n\n"
        
        md += "#### 里程碑：\n"
        for m in main.get("milestones", []):
            status_emoji = "✅" if m.get("status") == "completed" else "⏳"
            md += f"- {status_emoji} {m.get('chapter', '')}: {m.get('event', '')}\n"
        
        md += "\n#### 支线：\n"
        for sub in self.get_subplots():
            md += f"- **{sub.get('title', '')}**：{sub.get('description', '')}\n"
            md += f"  - 当前阶段：{sub.get('current_phase', '')}\n"
        
        # 人物关系
        md += "\n## 人物关系\n\n"
        for name, char in self.get_characters().items():
            md += f"### {name}\n"
            if char.get("身份"):
                md += f"- 身份：{char.get('身份')}\n"
            if char.get("修为"):
                md += f"- 修为：{char.get('修为')}\n"
            md += "关系：\n"
            for rel_name, rel_info in char.get("关系", {}).items():
                md += f"- {rel_name}：{rel_info.get('关系', '')}（{rel_info.get('状态', '')}）\n"
            md += "\n"
        
        # 伏笔
        md += "\n## 伏笔追踪\n\n"
        for f in self.get_foresights():
            status_emoji = {
                "已回收": "✅",
                "进行中": "🔄",
                "待揭示": "⏳",
                "已取回": "✅"
            }.get(f.get("当前状态", ""), "❓")
            md += f"- {status_emoji} **{f.get('伏笔', '')}**（{f.get('首次出现', '')}）\n"
            md += f"  - {f.get('描述', '')}\n"
            md += f"  - 状态：{f.get('当前状态', '')}\n"
        
        return md
    
    # ==================== 查询 ====================
    
    def get_context_for_chapter(self, chapter_type: str) -> Dict:
        """获取写新章节的剧情背景"""
        return {
            "main_plot": self.get_main_plot(),
            "subplots": [s for s in self.get_subplots() 
                        if s.get("status") == "进行中"],
            "main_characters": list(self.get_characters().keys()),
            "open_foresights": self.get_foresights_by_status("进行中") + 
                              self.get_foresights_by_status("待揭示")
        }


def main():
    """主函数"""
    import sys
    
    atlas = AtlasManager()
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == "plot":
            print(json.dumps(atlas.get_plot(), ensure_ascii=False, indent=2))
        
        elif action == "main":
            print(json.dumps(atlas.get_main_plot(), ensure_ascii=False, indent=2))
        
        elif action == "subplots":
            print(json.dumps(atlas.get_subplots(), ensure_ascii=False, indent=2))
        
        elif action == "characters":
            print(json.dumps(atlas.get_characters(), ensure_ascii=False, indent=2))
        
        elif action == "foresights":
            for f in atlas.get_foresights():
                status_emoji = {
                    "已回收": "✅",
                    "进行中": "🔄",
                    "待揭示": "⏳"
                }.get(f.get("当前状态", ""), "❓")
                print(f"{status_emoji} {f.get('伏笔', '')} ({f.get('首次出现', '')}) - {f.get('当前状态', '')}")
        
        elif action == "timeline":
            for t in atlas.get_timeline():
                print(f"{t.get('时间点', '')}: {t.get('事件', '')}")
        
        elif action == "all":
            print(json.dumps(atlas.data, ensure_ascii=False, indent=2))
        
        elif action == "export":
            print(atlas.export_markdown())
        
        elif action == "add-foresight":
            title = sys.argv[2] if len(sys.argv) > 2 else "新伏笔"
            chapter = sys.argv[3] if len(sys.argv) > 3 else "待定"
            desc = sys.argv[4] if len(sys.argv) > 4 else ""
            result = atlas.add_foresight(title, chapter, desc)
            atlas.save()
            print(f"✅ 伏笔已添加: {result['id']}")
        
        elif action == "update-foresight":
            fid = sys.argv[2] if len(sys.argv) > 2 else ""
            status = sys.argv[3] if len(sys.argv) > 3 else ""
            if atlas.update_foresight_status(fid, status):
                atlas.save()
                print(f"✅ 伏笔状态已更新")
            else:
                print(f"❌ 未找到伏笔: {fid}")
        
        elif action == "context":
            chapter_type = sys.argv[2] if len(sys.argv) > 2 else "战斗"
            ctx = atlas.get_context_for_chapter(chapter_type)
            print(json.dumps(ctx, ensure_ascii=False, indent=2))
    
    else:
        # 交互模式
        print("=" * 50)
        print("剧情图谱管理器")
        print("=" * 50)
        print("\n命令:")
        print("  python atlas_manager.py plot       - 查看剧情线")
        print("  python atlas_manager.py main       - 查看主线")
        print("  python atlas_manager.py subplots   - 查看支线")
        print("  python atlas_manager.py characters - 查看人物关系")
        print("  python atlas_manager.py foresights - 查看伏笔")
        print("  python atlas_manager.py timeline   - 查看时间线")
        print("  python atlas_manager.py all        - 查看完整图谱")
        print("  python atlas_manager.py export     - 导出Markdown")
        print("  python atlas_manager.py add-foresight <名称> <章节> <描述>")
        print("  python atlas_manager.py update-foresight <ID> <状态>")
        print("  python atlas_manager.py context    - 获取写作背景")
        
        print("\n" + "=" * 50)
        print("剧情概览")
        print("=" * 50)
        main = atlas.get_main_plot()
        print(f"\n📖 主线：{main.get('title', '')}")
        print(f"   当前阶段：{main.get('current_phase', '')}")
        
        print(f"\n🔄 支线：")
        for sub in atlas.get_subplots():
            print(f"   - {sub.get('title', '')}：{sub.get('current_phase', '')}")
        
        print(f"\n🎭 人物：{len(atlas.get_characters())} 人")
        
        print(f"\n🔮 伏笔：{len(atlas.get_foresights())} 个")
        for f in atlas.get_foresights():
            status_emoji = {
                "已回收": "✅",
                "进行中": "🔄",
                "待揭示": "⏳",
                "已取回": "✅"
            }.get(f.get("当前状态", ""), "❓")
            print(f"   {status_emoji} {f.get('伏笔', '')}")
        
        print(f"\n📅 时间线：{len(atlas.get_timeline())} 个事件")


if __name__ == "__main__":
    main()
