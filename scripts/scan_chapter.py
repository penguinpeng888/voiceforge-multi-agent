#!/usr/bin/env python3
"""直接用API对话形式扫描小说章节"""
import os, sys, json, re
from openai import OpenAI

API_KEY = os.environ.get("CHATGPT_API_KEY", "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")
BASE_URL = os.environ.get("OPENAI_API_BASE", "https://integrate.api.nvidia.com/v1")
MODEL = "nvidia/minimaxai/minimax-m2.5"
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

def scan_chapter(text, n):
    p = f"""分析《凡人修仙传》第{n}章，输出JSON：
{{
    "narrative_style": "叙事风格",
    "character_building": "人物塑造方式", 
    "combat_style": "战斗描写特点",
    "cultivation_system": {{"境界":[], "丹药":[], "法宝":[]}},
    "classic_quotes": ["经典语句"],
    "writing_techniques": ["写作技巧"],
    "summary": "50字摘要"
}}
文本：{text[:8000]}"""
    r = client.chat.completions.create(model=MODEL, messages=[{"role":"user","content":p}], temperature=0.7, max_tokens=2000)
    return r.choices[0].message.content

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    with open("/root/.openclaw/workspace/novel/凡人修仙传_md.md", encoding='utf-8') as f:
        content = f.read()
    chapters = re.split(r'^\s*#+\s*第[一二三四五六七八九十百千0-9]+章', content, flags=re.MULTILINE)
    if n >= len(chapters): print(f"只有{len(chapters)-1}章"); sys.exit(1)
    chapter_text = chapters[n].strip()
    print(f"扫描第{n}章 ({len(chapter_text)}字符)...")
    result = scan_chapter(chapter_text, n)
    print(result)
    with open(f"/root/.openclaw/workspace/skills/novel-evomap/genes/style-fanren-ch{n}.json", 'w') as f: f.write(result)
    print("已保存")