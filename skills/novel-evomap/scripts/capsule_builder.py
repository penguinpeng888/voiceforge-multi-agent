#!/usr/bin/env python3
"""
EvoMap 胶囊构建器
从完成章节生成经验胶囊
"""

import json
import os
from datetime import datetime
from pathlib import Path

CAPSULES_DIR = Path(__file__).parent.parent / "capsules"
EVENTS_DIR = Path(__file__).parent.parent / "events"

class CapsuleBuilder:
    """胶囊构建器"""
    
    def __init__(self):
        self.capsules = {}
        self.load_capsules()
    
    def load_capsules(self):
        """加载所有胶囊"""
        if not CAPSULES_DIR.exists():
            return
            
        for date_dir in CAPSULES_DIR.iterdir():
            if date_dir.is_dir():
                for capsule_file in date_dir.glob("*.json"):
                    with open(capsule_file, 'r', encoding='utf-8') as f:
                        capsule = json.load(f)
                        self.capsules[capsule["id"]] = capsule
    
    def build(self, chapter, content, techniques_used, tags, score, metadata=None):
        """
        构建新胶囊
        
        Args:
            chapter: 章节标题
            content: 章节内容/摘要
            techniques_used: 使用的技法列表
            tags: 标签列表
            score: 评分
            metadata: 其他元数据
            
        Returns:
            胶囊字典
        """
        capsule_id = f"capsule-{datetime.now().strftime('%Y-%m-%d')}-{len(self.capsules)+1:03d}"
        
        capsule = {
            "id": capsule_id,
            "chapter": chapter,
            "created_at": datetime.now().isoformat(),
            "tags": tags,
            "score": score,
            "success_rate": score / 10.0,
            "environment": metadata.get("environment", {}) if metadata else {},
            "content": {
                "key_scenes": metadata.get("key_scenes", []) if metadata else [],
                "techniques_used": techniques_used,
                "innovations": metadata.get("innovations", []) if metadata else [],
                "word_count": len(content) if isinstance(content, str) else 0,
                "summary": content[:500] if isinstance(content, str) else str(content)[:500]
            },
            "metrics": metadata.get("metrics", {}) if metadata else {},
            "genes_extracted": [],
            "evolved_at": datetime.now().isoformat()
        }
        
        self.capsules[capsule_id] = capsule
        return capsule
    
    def publish(self, capsule):
        """发布胶囊"""
        # 保存到文件
        date = datetime.now().strftime('%Y-%m-%d')
        date_dir = CAPSULES_DIR / date
        date_dir.mkdir(exist_ok=True)
        
        capsule_file = date_dir / f"{capsule['id']}.json"
        with open(capsule_file, 'w', encoding='utf-8') as f:
            json.dump(capsule, f, ensure_ascii=False, indent=2)
        
        # 记录事件
        self._log_event("capsule_published", capsule)
        
        return capsule_file
    
    def _log_event(self, event_type, data):
        """记录进化事件"""
        date_dir = EVENTS_DIR
        date_dir.mkdir(exist_ok=True)
        
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "data": {
                "id": data.get("id"),
                "chapter": data.get("chapter"),
                "score": data.get("score")
            }
        }
        
        event_file = date_dir / f"event-{datetime.now().strftime('%Y%m%d')}.log"
        with open(event_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
    
    def search(self, tags=None, min_score=7.0, limit=5):
        """搜索胶囊"""
        results = []
        for capsule in self.capsules.values():
            if capsule.get("score", 0) >= min_score:
                if tags is None or any(t in capsule.get("tags", []) for t in tags):
                    results.append(capsule)
        return results[:limit]

class CapsuleLibrary:
    """胶囊库"""
    
    def __init__(self):
        self.builder = CapsuleBuilder()
    
    def search(self, tags=None, min_score=7.0, limit=5):
        """搜索相关胶囊"""
        return self.builder.search(tags, min_score, limit)
    
    def inherit(self, capsule_id):
        """继承胶囊"""
        return self.builder.capsules.get(capsule_id)

def main():
    """主函数"""
    import sys
    
    if len(sys.argv) > 1:
        # 命令行模式
        action = sys.argv[1]
        
        if action == "search":
            tags = sys.argv[2].split(",") if len(sys.argv) > 2 else None
            min_score = float(sys.argv[3]) if len(sys.argv) > 3 else 7.0
            builder = CapsuleBuilder()
            results = builder.search(tags, min_score)
            print(f"找到 {len(results)} 个胶囊:")
            for c in results:
                print(f"  - {c['chapter']}: {c['score']}/10")
        elif action == "build":
            chapter = sys.argv[2]
            techniques = sys.argv[3].split(",") if len(sys.argv) > 3 else []
            tags = sys.argv[4].split(",") if len(sys.argv) > 4 else []
            score = float(sys.argv[5]) if len(sys.argv) > 5 else 7.0
            
            builder = CapsuleBuilder()
            capsule = builder.build(
                chapter=chapter,
                content="",
                techniques_used=techniques,
                tags=tags,
                score=score
            )
            file_path = builder.publish(capsule)
            print(f"✅ 胶囊已创建: {file_path}")
    else:
        # 交互模式
        print("EvoMap 胶囊构建器")
        print("=" * 40)
        print("命令:")
        print("  python capsule_builder.py build <章节> <技法1,技法2> <标签1,标签2> <评分>")
        print("  python capsule_builder.py search <标签1,标签2> <最小评分>")
        print("  python capsule_builder.py list")
        print("")
        print("或交互模式:")
        chapter = input("章节标题: ")
        if chapter:
            techniques = input("使用的技法(逗号分隔): ").split(",")
            tags = input("标签(逗号分隔): ").split(",")
            score = float(input("评分(0-10): ") or "7.0")
            
            builder = CapsuleBuilder()
            capsule = builder.build(
                chapter=chapter,
                content="",
                techniques_used=techniques,
                tags=tags,
                score=score
            )
            file_path = builder.publish(capsule)
            print(f"\n✅ 胶囊已创建: {file_path}")

if __name__ == "__main__":
    main()
