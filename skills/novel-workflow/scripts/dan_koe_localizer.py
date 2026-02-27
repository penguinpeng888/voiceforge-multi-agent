#!/usr/bin/env python3
"""
Dan Koe 内容翻译与中文改写工具
视频转录 → 直译 → 中文改写 → 发布文案

用法:
    python dan_koe_localizer.py <transcript.txt> [--style conversational|professional]
    python dan_koe_localizer.py --demo
"""

import os
import sys
from pathlib import Path

# 配置
INPUT_FILE = Path("/root/.openclaw/workspace/workspace/youtube-downloads/test.txt")
OUTPUT_DIR = Path("/root/.openclaw/workspace/dan-koe-output")


def translate_to_chinese(text: str) -> str:
    """直译成中文"""
    # 这里调用 LLM API 或简单的翻译逻辑
    return f"[中文直译]{text}"


def rewrite_for_chinese(text: str, style: str = "conversational") -> str:
    """改写成符合中国人阅读习惯的文案"""
    
    styles = {
        "conversational": """
# 口语化改写版

嘿，大家好！今天聊点不一样的东西...

这篇文章其实是这样的：
{text}

说白了就是...
        """,
        "professional": """
# 专业改写版

【导语】
在当今快节奏的时代，...

【核心观点】
{text}

【深度解读】
通过对原文的梳理，我们发现...

【实践建议】
针对中国读者，以下几点值得注意：
        """
    }
    
    return styles.get(style, styles["conversational"]).format(text=text)


def generate_post(text: str) -> str:
    """生成发布文案"""
    return f"""
# Dan Koe 观点 | 中文解读

📌 **核心观点**
{text[:200]}...

👉 **点击阅读完整内容**

#成长 #自我提升 #DanKoe
        """


def process_file(input_file: Path, style: str = "conversational"):
    """处理单个文件"""
    if not input_file.exists():
        print(f"❌ 文件不存在: {input_file}")
        return
    
    # 1. 读取原文
    original = input_file.read_text()
    print(f"📄 读取原文: {len(original)} 字")
    
    # 2. 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 3. 直译
    chinese_translation = translate_to_chinese(original)
    translation_file = OUTPUT_DIR / f"{input_file.stem}-直译.txt"
    translation_file.write_text(chinese_translation)
    print(f"✅ 直译完成: {translation_file.name}")
    
    # 4. 中文改写
    rewritten = rewrite_for_chinese(original, style)
    rewritten_file = OUTPUT_DIR / f"{input_file.stem}-改写文案.txt"
    rewritten_file.write_text(rewritten)
    print(f"✅ 改写完成: {rewritten_file.name}")
    
    # 5. 发布文案
    post = generate_post(original)
    post_file = OUTPUT_DIR / f"{input_file.stem}-发布词.txt"
    post_file.write_text(post)
    print(f"✅ 发布文案: {post_file.name}")
    
    print(f"\n📁 输出目录: {OUTPUT_DIR}")


def demo():
    """演示模式"""
    print("🎬 Dan Koe 内容本地化演示")
    print("="*50)
    
    sample_text = """
    The key to success is not about working harder, 
    it's about working smarter. You need to focus on 
    the 20% of actions that give you 80% of results.
    """
    
    print(f"原文:\n{sample_text}")
    print(f"\n直译:\n{translate_to_chinese(sample_text)}")
    print(f"\n改写:\n{rewrite_for_chinese(sample_text)}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Dan Koe 内容翻译与中文改写工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    %(prog)s                                    # 处理默认文件
    %(prog)s /path/to/transcript.txt            # 处理指定文件
    %(prog)s --style professional               # 使用专业风格
    %(prog)s --demo                             # 演示模式
        """
    )
    
    parser.add_argument("input_file", nargs="?", help="转录文本文件")
    parser.add_argument("--style", choices=["conversational", "professional"],
                       default="conversational", help="改写风格")
    parser.add_argument("--demo", action="store_true", help="演示模式")
    
    args = parser.parse_args()
    
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    if args.demo:
        demo()
    elif args.input_file:
        process_file(Path(args.input_file), args.style)
    else:
        process_file(INPUT_FILE, args.style)


if __name__ == "__main__":
    main()
