#!/usr/bin/env python3
"""
知识库管理器 - 从对话/网页中收集知识并转化为 Skill
"""
import json
import os
from pathlib import Path
from datetime import datetime

# 知识库根目录
KNOWLEDGE_BASE = Path("/root/.openclaw/workspace/obsidian-knowledge-base")
VAULT_DIR = KNOWLEDGE_BASE / "vault"
SKILLS_OUTPUT = Path("/root/.openclaw/skills")

class KnowledgeManager:
    def __init__(self):
        VAULT_DIR.mkdir(parents=True, exist_ok=True)
        self.index_file = KNOWLEDGE_BASE / "index.json"
        self.load_index()
    
    def load_index(self):
        """加载索引"""
        if self.index_file.exists():
            with open(self.index_file, 'r') as f:
                self.index = json.load(f)
        else:
            self.index = {"notes": [], "skills": []}
    
    def save_index(self):
        """保存索引"""
        with open(self.index_file, 'w') as f:
            json.dump(self.index, f, ensure_ascii=False, indent=2)
    
    def add_note(self, title: str, content: str, source_url: str = "", tags: list = None):
        """添加笔记到知识库"""
        # 生成文件名
        filename = self._sanitize_filename(title)
        filepath = VAULT_DIR / f"{filename}.md"
        
        # 添加 frontmatter
        note_content = f"""---
title: {title}
date: {datetime.now().isoformat()}
source: {source_url}
tags: {json.dumps(tags or [])}
---

# {title}

{content}

---

*来源: {source_url}*
*收录时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        
        # 写入文件
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(note_content)
        
        # 更新索引
        note_entry = {
            "title": title,
            "filename": f"{filename}.md",
            "source": source_url,
            "tags": tags or [],
            "date": datetime.now().isoformat()
        }
        self.index["notes"].append(note_entry)
        self.save_index()
        
        return filepath
    
    def convert_to_skill(self, note_title: str, skill_name: str = None) -> Path:
        """将笔记转化为 Skill"""
        # 查找笔记
        note = None
        for n in self.index["notes"]:
            if n["title"] == note_title:
                note = n
                break
        
        if not note:
            raise ValueError(f"笔记不存在: {note_title}")
        
        # 生成 skill 名称
        if not skill_name:
            skill_name = self._sanitize_filename(note_title)
        
        # 创建 skill 目录
        skill_dir = SKILLS_OUTPUT / skill_name
        skill_dir.mkdir(parents=True, exist_ok=True)
        
        # 读取笔记内容
        note_path = VAULT_DIR / note["filename"]
        with open(note_path, 'r', encoding='utf-8') as f:
            note_content = f.read()
        
        # 提取正文（去除 frontmatter）
        lines = note_content.split('\n')
        content_start = 0
        for i, line in enumerate(lines):
            if line.strip() == '---' and i > 0:
                content_start = i + 1
                break
        
        body = '\n'.join(lines[content_start:])
        
        # 生成 SKILL.md
        skill_content = f"""# {note_title}

## 描述
从知识库自动生成

## 触发条件
当需要 {note_title} 相关知识时使用

## 工作流
{body}

## 元数据
- 来源: {note.get('source', 'unknown')}
- 标签: {', '.join(note.get('tags', []))}
- 生成时间: {datetime.now().isoformat()}
"""
        
        skill_path = skill_dir / "SKILL.md"
        with open(skill_path, 'w', encoding='utf-8') as f:
            f.write(skill_content)
        
        # 更新索引
        self.index["skills"].append({
            "name": skill_name,
            "source_note": note_title,
            "date": datetime.now().isoformat()
        })
        self.save_index()
        
        return skill_path
    
    def search_notes(self, query: str) -> list:
        """搜索笔记"""
        results = []
        query = query.lower()
        
        for note in self.index["notes"]:
            # 搜索标题和标签
            if query in note["title"].lower():
                results.append(note)
            elif any(query in tag.lower() for tag in note.get("tags", [])):
                results.append(note)
        
        return results
    
    def list_notes(self) -> list:
        """列出所有笔记"""
        return self.index.get("notes", [])
    
    def list_skills(self) -> list:
        """列出所有转化的 Skills"""
        return self.index.get("skills", [])
    
    def _sanitize_filename(self, title: str) -> str:
        """清理文件名"""
        # 替换非法字符
        filename = title.replace('/', '-').replace('\\', '-')
        filename = ''.join(c if c.isalnum() or c in '- _' else '_' for c in filename)
        return filename[:50]

if __name__ == "__main__":
    km = KnowledgeManager()
    
    # 测试：添加一条笔记
    test_note = """
    ## 核心概念
    - RAG: 检索增强生成
    - BM25: 关键词搜索算法
    - 向量搜索: 语义搜索
    
    ## 搭建步骤
    1. 安装 Obsidian
    2. 配置本地嵌入模型
    3. 设置 BM25 搜索
    4. 集成 MCP Server
    
    ## 配置
    - embedding: model2vec
    - search: fts5 + sqlite-vec
    """
    
    path = km.add_note(
        title="Obsidian AI 知识库搭建",
        content=test_note,
        source_url="https://blakecrosley.com/guides/obsidian",
        tags=["obsidian", "ai", "knowledge-base"]
    )
    print(f"笔记已添加: {path}")
    
    # 列出所有笔记
    print("\n=== 知识库笔记 ===")
    for note in km.list_notes():
        print(f"- {note['title']}")