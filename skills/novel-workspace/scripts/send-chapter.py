#!/usr/bin/env python3
"""
发送章节文件给用户
- 自动以文件形式发送，不是对话内容
"""

import argparse
import os

WORKSPACE = "/root/.openclaw/workspace"

def main():
    parser = argparse.ArgumentParser(description="发送章节文件给用户")
    parser.add_argument('--file', type=str, required=True, help='章节文件路径')
    parser.add_argument('--chapter', type=int, help='章节号')
    parser.add_argument('--title', type=str, help='章节标题')

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        return

    file_size = os.path.getsize(args.file)
    print(f"\n✅ 已准备好文件")
    print(f"   文件路径: {args.file}")
    print(f"   文件大小: {file_size} bytes")
    print(f"   章节号: {args.chapter if args.chapter else '未指定'}")
    print(f"   标题: {args.title if args.title else '未指定'}")

    # 读取文件内容用于预览
    with open(args.file, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')
        print(f"\n📄 文件预览（前10行）：")
        for line in lines[:10]:
            print(f"   {line[:50]}..." if len(line) > 50 else f"   {line}")

    print(f"\n📤 使用 message 工具发送：")
    print(f"   path=\"{args.file}\"")

if __name__ == "__main__":
    main()
