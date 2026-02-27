#!/usr/bin/env python3
"""
斗破苍穹扫描器 - 慢速扫描版
一晚上一章，慢慢扫描不触发反爬

用法:
    python doupo_scanner.py scan --source yunxuange --chapters 1
    python doupo_scanner.py batch --start 1 --end 100  # 扫描1-100章
"""

import os
import re
import json
import time
import gzip
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# 配置
WORKSPACE = "/root/.openclaw/workspace"
GENES_DIR = Path(WORKSPACE) / "skills/novel-evomap/genes"
CORPUS_DIR = Path(WORKSPACE) / "skills/novel-evomap/corpus/doupo"
LOG_FILE = Path(WORKSPACE) / "skills/novel-evomap/scan_log.json"

# 来源配置
SOURCES = {
    "69shuba": {
        "base_url": "https://www.69shuba.com",
        "book_id": 17635,
        "chapter_url": "https://www.69shuba.com/book/{}/{}.htm",
    },
    "biquge": {
        "base_url": "https://www.biquge.com.cn",
        "book_id": "doupo",
        "chapter_url": "https://www.biquge.com.cn/{}/{}.html",
    },
    "biqugell": {
        "base_url": "https://www.biqugell.com",
        "book_id": "doupo",
        "chapter_url": "https://www.biqugell.com/{}/index_{}.html",
    },
    "bq567": {
        "base_url": "https://816f5f6b759e7.bqg567.xyz",
        "book_id": 717,
        "chapter_url": "https://816f5f6b759e7.bqg567.xyz/book/{}/{}.html",
    }
}

# 扫描日志
def load_scan_log() -> Dict:
    if LOG_FILE.exists():
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "doupo": {
            "scanned_chapters": [],
            "last_scan": None,
            "total_scanned": 0
        }
    }

def save_scan_log(log: Dict):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

# 清理内容
def clean_content(html: str) -> str:
    if not html:
        return ""
    
    # 移除HTML标签
    text = re.sub(r'<[^>]+>', '\n', html)
    
    # 移除特殊字符
    text = re.sub(r'http[s]?://\S+', '', text)
    text = re.sub(r'&[a-zA-Z]+;', '', text)
    text = re.sub(r'\s+', ' ', text)
    
    # 移除广告
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        line = line.strip()
        if len(line) > 20:
            if not any(kw in line for kw in ['上一章', '下一章', '返回', '目录', '投票', '推荐', 'VIP', '会员', 'TXT下载', '书库', '顶点', '笔趣阁']):
                clean_lines.append(line)
    
    return '\n'.join(clean_lines)

# 提取关键技法
def extract_techniques(text: str) -> List[str]:
    """从文本中提取战斗/修炼技法描写"""
    techniques = []
    
    # 斗破特有描写模式
    patterns = [
        (r'异火[\S]+', '异火描写'),
        (r'斗气[\S]+', '斗气运用'),
        (r'灵魂力量', '灵魂技法'),
        (r'药老', '药老指点'),
        (r'焚诀', '焚诀修炼'),
        (r'佛怒火莲', '火莲爆发'),
        (r'势在必得', '萧炎性格'),
        (r'三十年河东', '经典台词'),
    ]
    
    for pattern, name in patterns:
        if re.search(pattern, text):
            techniques.append(name)
    
    return techniques

# 提取情感互动
def extract_emotions(text: str) -> List[str]:
    """提取情感互动描写"""
    emotions = []
    
    patterns = [
        (r'薰儿', '薰儿互动'),
        (r'药老', '师徒情'),
        (r'美杜莎', '感情线'),
        (r'云韵', '云韵互动'),
        (r'小医仙', '小医仙'),
        (r'纳兰', '纳兰嫣然'),
    ]
    
    for pattern, name in patterns:
        if re.search(pattern, text):
            emotions.append(name)
    
    return emotions

# 章节分析
def analyze_chapter(chapter_num: int, content: str) -> Dict:
    """分析单章内容"""
    text = clean_content(content)
    
    return {
        "chapter": chapter_num,
        "length": len(text),
        "first_500": text[:500],
        "techniques": extract_techniques(text),
        "emotions": extract_emotions(text),
        "scanned_at": datetime.now().isoformat()
    }

# 扫描单章
def scan_chapter(source: str, chapter_num: int) -> Optional[Dict]:
    """扫描单章内容"""
    config = SOURCES.get(source)
    if not config:
        print(f"❌ 未知来源: {source}")
        return None
    
    url = config["chapter_url"].format(config["book_id"], chapter_num)
    print(f"  📖 扫描第{chapter_num}章: {url}")
    
    # 延迟（防止反爬）
    time.sleep(2)
    
    try:
        # 使用web_fetch
        from tools import web_fetch
        result = web_fetch(url=url, extractMode="text", maxChars=50000)
        
        if result and len(result.get('text', '')) > 500:
            text = result['text']
            analysis = analyze_chapter(chapter_num, text)
            print(f"    ✅ 完成: {analysis['length']}字, {len(analysis['techniques'])}个技法")
            return analysis
        else:
            print(f"    ❌ 内容太短或获取失败")
            return None
            
    except Exception as e:
        print(f"    ❌ 错误: {e}")
        return None

# 生成基因胶囊
def generate_capsule(scanned_data: List[Dict]) -> Dict:
    """根据扫描数据生成写作胶囊"""
    
    if not scanned_data:
        return {}
    
    # 合并所有文本
    all_text = "\n".join([d.get('first_500', '') for d in scanned_data])
    
    # 统计
    all_techniques = []
    all_emotions = []
    for d in scanned_data:
        all_techniques.extend(d.get('techniques', []))
        all_emotions.extend(d.get('emotions', []))
    
    techniques_count = {}
    for t in all_techniques:
        techniques_count[t] = techniques_count.get(t, 0) + 1
    
    emotions_count = {}
    for e in all_emotions:
        emotions_count[e] = emotions_count.get(e, 0) + 1
    
    capsule = {
        "name": "斗破苍穹-天蚕土豆",
        "author": "天蚕土豆",
        "work": "斗破苍穹",
        "source": "doupo",
        "total_chapters_scanned": len(scanned_data),
        "total_chars_analyzed": sum(d.get('length', 0) for d in scanned_data),
        "scan_date": datetime.now().isoformat(),
        "features": {
            "techniques": {
                "types": techniques_count,
                "description": "斗破特有的异火、斗气、灵魂技法描写"
            },
            "emotions": {
                "types": emotions_count,
                "description": "萧炎与诸女的感情线描写"
            },
            "style_tags": [
                "爽文", "退婚流", "异火流", "升级碾压",
                "热血", "快节奏", "美女如云", "扮猪吃虎"
            ],
            "narrative_style": {
                "pace": "快节奏",
                "tone": "热血激昂",
                "focus": "战斗爽点"
            }
        },
        "sampled_chapters": [d.get('chapter') for d in scanned_data],
        "analysis_notes": {
            "highlight_moments": ["异火融合", "佛怒火莲", "越级挑战"],
            "typical_dialogues": ["三十年河东", "莫欺少年穷"],
            "world_building": ["斗气大陆", "炼药师体系", "异火榜"]
        }
    }
    
    return capsule

# 保存结果
def save_results(capsule: Dict, chapter_data: List[Dict]):
    """保存扫描结果"""
    # 保存胶囊
    capsule_file = GENES_DIR / f"style-doupo-{datetime.now().strftime('%Y%m%d')}.json"
    
    # 如果已存在同名文件，追加版本号
    if capsule_file.exists():
        version = 1
        while (GENES_DIR / f"style-doupo-{datetime.now().strftime('%Y%m%d')}_v{version}.json").exists():
            version += 1
        capsule_file = GENES_DIR / f"style-doupo-{datetime.now().strftime('%Y%m%d')}_v{version}.json"
    
    with open(capsule_file, 'w', encoding='utf-8') as f:
        json.dump(capsule, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 胶囊已保存: {capsule_file}")
    
    # 保存章节数据
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    chapters_file = CORPUS_DIR / f"chapters_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(chapters_file, 'w', encoding='utf-8') as f:
        json.dump(chapter_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 章节数据已保存: {chapters_file}")

# 扫描并更新索引
def update_genes_index(new_capsule: Dict):
    """更新基因库索引"""
    index_file = GENES_DIR / "GENES_INDEX.md"
    
    new_entry = f"""
### 天蚕土豆 - 斗破苍穹（新增）
```
style-doupo-{datetime.now().strftime('%Y%m%d')}.json
```
- 扫描章节: {new_capsule.get('total_chapters_scanned', 0)} 章
- 特点: 异火描写、斗气技法、爽文节奏
- 标签: 退婚流、异火流、升级碾压"""
    
    # 追加到索引文件
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        content += new_entry
    else:
        content = f"# 基因库索引\n{new_entry}"
    
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 索引已更新: {index_file}")

# 主程序
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="斗破苍穹扫描器")
    parser.add_argument("command", choices=["scan", "batch", "status"], help="命令")
    parser.add_argument("--source", "-s", default="69shuba", help="来源")
    parser.add_argument("--chapter", "-c", type=int, help="单章编号")
    parser.add_argument("--start", type=int, help="起始章节")
    parser.add_argument("--end", type=int, help="结束章节")
    
    args = parser.parse_args()
    
    if args.command == "status":
        log = load_scan_log()
        doupo = log.get("doupo", {})
        print(f"\n📚 斗破苍穹扫描状态")
        print(f"   已扫描章节: {doupo.get('total_scanned', 0)} 章")
        print(f"   最近扫描: {doupo.get('last_scan', '从未')}")
        print(f"   章节列表: {doupo.get('scanned_chapters', [])}")
    
    elif args.command == "scan":
        if not args.chapter:
            print("❌ 请指定章节: --chapter <num>")
            return
        
        # 扫描单章
        result = scan_chapter(args.source, args.chapter)
        
        if result:
            # 更新日志
            log = load_scan_log()
            if "doupo" not in log:
                log["doupo"] = {"scanned_chapters": [], "last_scan": None, "total_scanned": 0}
            
            log["doupo"]["scanned_chapters"].append(args.chapter)
            log["doupo"]["last_scan"] = datetime.now().isoformat()
            log["doupo"]["total_scanned"] = len(log["doupo"]["scanned_chapters"])
            save_scan_log(log)
            
            print(f"\n✅ 第{args.chapter}章扫描完成")
    
    elif args.command == "batch":
        if not args.start or not args.end:
            print("❌ 请指定范围: --start 1 --end 100")
            return
        
        print(f"\n🚀 开始批量扫描: 第{args.start}-{args.end}章")
        print(f"   来源: {args.source}")
        print(f"   速度: 每章间隔2秒")
        
        scanned = []
        for i in range(args.start, args.end + 1):
            result = scan_chapter(args.source, i)
            if result:
                scanned.append(result)
            
            # 每5章打印进度
            if i % 5 == 0:
                print(f"\n📊 进度: {i}/{args.end} ({i*100/args.end:.1f}%)")
        
        if scanned:
            # 生成胶囊
            capsule = generate_capsule(scanned)
            
            # 保存
            save_results(capsule, scanned)
            
            # 更新索引
            update_genes_index(capsule)
            
            print(f"\n🎉 扫描完成！")
            print(f"   扫描章节: {len(scanned)} 章")
            print(f"   生成胶囊: 1 个")
        else:
            print(f"\n❌ 未能扫描到任何章节")

if __name__ == "__main__":
    main()
